"""
RAGService — End-to-end orchestration service for CodeSpecAI RAG.
Connects HybridRetriever (Phase 6) -> ContextBuilder (Phase 8) -> BaseLLMProvider (Phase 7) -> RAGResponse.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from app.core.rag.generation.base import BaseLLMProvider
from app.core.rag.generation.context_builder import ContextBuilder
from app.core.rag.generation.factory import get_llm_provider
from app.core.rag.retrieval.hybrid_retriever import HybridRetriever
from app.models.generation_models import RAGMetadata, RAGResponse
from app.models.retrieval_models import HybridRetrievalConfig, RetrievalResult

logger = logging.getLogger(__name__)


class RAGService:
    """
    Complete end-to-end RAG orchestration service:
      query
        ↓
      HybridRetriever (Phase 6: vector search + Neo4j graph expansion)
        ↓
      ContextBuilder (Phase 8: deduplication, provenance preservation, budgeting)
        ↓
      BaseLLMProvider (Phase 7: provider-agnostic generation)
        ↓
      RAGResponse (grounded answer + full source provenance)
    """

    def __init__(
        self,
        hybrid_retriever: Optional[HybridRetriever] = None,
        context_builder: Optional[ContextBuilder] = None,
        llm_service: Optional[BaseLLMProvider] = None,
        strict: bool = False,
    ) -> None:
        """
        Initialize RAGService with dependency injection.

        Args:
            hybrid_retriever: HybridRetriever instance (Phase 6).
            context_builder: ContextBuilder instance (Phase 8).
            llm_service: BaseLLMProvider instance (Phase 7).
            strict: If True, failures raise exceptions; if False (default), returns failed RAGResponse.
        """
        self.hybrid_retriever = hybrid_retriever or HybridRetriever()
        self.context_builder = context_builder or ContextBuilder()
        self.llm_service = llm_service or get_llm_provider()
        self.strict = strict

    def answer_query(
        self,
        query: str,
        repository_id: str,
        retrieval_config: Optional[HybridRetrievalConfig] = None,
        custom_instructions: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> RAGResponse:
        """
        Execute the complete end-to-end RAG pipeline from query to grounded answer.

        Args:
            query: User's question or search query.
            repository_id: Repository ID ensuring strict isolation.
            retrieval_config: Optional retrieval configuration overrides.
            custom_instructions: Optional extra system instructions.
            max_tokens: Optional LLM max output tokens.
            temperature: Optional LLM temperature.

        Returns:
            RAGResponse containing grounded answer, source items with provenance, and telemetry.
        """
        start_time = time.time()
        clean_query = (query or "").strip()
        clean_repo_id = (repository_id or "").strip()

        # Step 1: Hybrid Retrieval
        retrieval_result: RetrievalResult
        try:
            retrieval_result = self.hybrid_retriever.query(
                query=clean_query,
                repository_id=clean_repo_id,
                config=retrieval_config,
            )
        except Exception as exc:
            logger.error("Retrieval failed during RAG query: %s", exc, exc_info=True)
            if self.strict:
                raise
            retrieval_result = RetrievalResult(
                query=clean_query,
                repository_id=clean_repo_id,
                items=[],
            )

        # Step 2: Context Building & Provenance Assembly
        built_context = self.context_builder.build(
            query=clean_query,
            retrieval_result=retrieval_result,
            custom_instructions=custom_instructions,
        )

        # Step 3: LLM Generation
        try:
            llm_response = self.llm_service.generate(
                prompt=built_context.user_prompt,
                system_prompt=built_context.system_prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            elapsed = round(time.time() - start_time, 3)

            # Detect if context was insufficient
            upper_answer = llm_response.content.upper()
            is_insufficient = (
                len(built_context.sources) == 0
                or "INSUFFICIENT CONTEXT" in upper_answer
                or "NO RELEVANT" in upper_answer
            )

            metadata = RAGMetadata(
                query=clean_query,
                repository_id=clean_repo_id,
                total_sources=len(built_context.sources),
                vector_hits=retrieval_result.vector_hit_count,
                graph_hits=retrieval_result.graph_hit_count,
                hybrid_fused=retrieval_result.fused_hybrid_count,
                provider=self.llm_service.provider_name,
                model=self.llm_service.model_name,
                tokens_used=llm_response.total_tokens,
                latency_seconds=elapsed,
            )

            logger.info(
                "RAG pipeline completed for '%s' in %.2fs using %s/%s (sources: %d)",
                clean_repo_id,
                elapsed,
                self.llm_service.provider_name,
                self.llm_service.model_name,
                len(built_context.sources),
            )

            return RAGResponse(
                answer=llm_response.content,
                sources=built_context.sources,
                retrieval_metadata=metadata,
                is_insufficient_context=is_insufficient,
                is_successful=True,
                error=None,
            )

        except Exception as exc:
            elapsed = round(time.time() - start_time, 3)
            logger.error("LLM generation failed in RAG pipeline: %s", exc, exc_info=True)
            if self.strict:
                raise

            err_metadata = RAGMetadata(
                query=clean_query,
                repository_id=clean_repo_id,
                total_sources=len(built_context.sources),
                vector_hits=retrieval_result.vector_hit_count,
                graph_hits=retrieval_result.graph_hit_count,
                hybrid_fused=retrieval_result.fused_hybrid_count,
                provider=self.llm_service.provider_name,
                model=self.llm_service.model_name,
                tokens_used=None,
                latency_seconds=elapsed,
            )

            return RAGResponse(
                answer=f"Unable to generate response due to an error with LLM provider '{self.llm_service.provider_name}': {exc}",
                sources=built_context.sources,
                retrieval_metadata=err_metadata,
                is_insufficient_context=True,
                is_successful=False,
                error=str(exc),
            )
