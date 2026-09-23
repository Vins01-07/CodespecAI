"""
RAGGenerationService — Orchestrating service for generation using Hybrid Retrieval and LLM abstraction.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from app.core.rag.generation.base import BaseLLMProvider
from app.core.rag.generation.context_builder import ContextBuilder
from app.core.rag.generation.factory import get_llm_provider
from app.core.rag.retrieval.hybrid_retriever import HybridRetriever
from app.core.rag.generation.rag_service import RAGService
from app.models.generation_models import GenerationResult
from app.models.retrieval_models import HybridRetrievalConfig, RetrievalResult

logger = logging.getLogger(__name__)


class RAGGenerationService:
    """
    Coordinates the full RAG generation pipeline:
    HybridRetriever (Phase 6) -> ContextBuilder -> BaseLLMProvider -> GenerationResult.
    """

    def __init__(
        self,
        hybrid_retriever: Optional[HybridRetriever] = None,
        context_builder: Optional[ContextBuilder] = None,
        llm_provider: Optional[BaseLLMProvider] = None,
        strict: bool = False,
    ) -> None:
        """
        Initialize RAGGenerationService with dependency injection.

        Args:
            hybrid_retriever: Phase 6 HybridRetriever instance.
            context_builder: Context and citation builder.
            llm_provider: Configured LLM provider instance.
            strict: If True, provider errors raise; if False (default), returns failed GenerationResult.
        """
        self.hybrid_retriever = hybrid_retriever or HybridRetriever()
        self.context_builder = context_builder or ContextBuilder()
        self.llm_provider = llm_provider or get_llm_provider()
        self.strict = strict

    def answer_query(
        self,
        query: str,
        repository_id: str,
        retrieval_config: Optional[HybridRetrievalConfig] = None,
        custom_instructions: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> GenerationResult:
        """
        Execute full RAG generation: retrieve context, build prompt, call LLM, and assemble result.

        Args:
            query: User's question or search query.
            repository_id: Repository ID to scope retrieval.
            retrieval_config: Optional retrieval configuration overrides.
            custom_instructions: Optional extra system instructions.
            max_tokens: Optional LLM max output tokens.
            temperature: Optional LLM sampling temperature.

        Returns:
            GenerationResult containing the answer, citations, and retrieval audit trail.
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
            logger.error("Retrieval failed during RAG generation: %s", exc, exc_info=True)
            if self.strict:
                raise
            retrieval_result = RetrievalResult(
                query=clean_query,
                repository_id=clean_repo_id,
                items=[],
            )

        # Step 2: Context Building & Citation Extraction
        built_context = self.context_builder.build(
            query=clean_query,
            retrieval_result=retrieval_result,
            custom_instructions=custom_instructions,
        )

        # Step 3: LLM Generation
        try:
            llm_response = self.llm_provider.generate(
                prompt=built_context.user_prompt,
                system_prompt=built_context.system_prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            elapsed = round(time.time() - start_time, 3)
            logger.info(
                "RAG generation completed for '%s' in %.2fs using %s/%s",
                clean_repo_id,
                elapsed,
                self.llm_provider.provider_name,
                self.llm_provider.model_name,
            )

            return GenerationResult(
                answer=llm_response.content,
                query=clean_query,
                repository_id=clean_repo_id,
                citations=built_context.citations,
                retrieval_result=retrieval_result,
                provider=self.llm_provider.provider_name,
                model=self.llm_provider.model_name,
                tokens_used=llm_response.total_tokens,
                is_successful=True,
                error=None,
            )

        except Exception as exc:
            logger.error("LLM generation failed for '%s': %s", clean_repo_id, exc, exc_info=True)
            if self.strict:
                raise

            return GenerationResult(
                answer=f"Unable to generate response due to an error with LLM provider '{self.llm_provider.provider_name}': {exc}",
                query=clean_query,
                repository_id=clean_repo_id,
                citations=built_context.citations,
                retrieval_result=retrieval_result,
                provider=self.llm_provider.provider_name,
                model=self.llm_provider.model_name,
                tokens_used=None,
                is_successful=False,
                error=str(exc),
            )
