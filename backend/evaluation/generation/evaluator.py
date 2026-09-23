"""
Generation evaluator for CodeSpecAI RAG.

Evaluates:
- Faithfulness
- Answer Relevance
- Context Relevance
- Citation/Source Correctness
- Answer Completeness
Against benchmark datasets using the existing RAG pipeline.
"""
from __future__ import annotations

import logging
from typing import Optional
from pydantic import BaseModel, Field

from app.core.rag.generation.rag_service import RAGService
from app.models.generation_models import RAGResponse
from evaluation.datasets.models import BenchmarkDataset, BenchmarkItem
from evaluation.generation.metrics import (
    GenerationMetricsResult,
    compute_generation_metrics,
)

logger = logging.getLogger(__name__)


class QueryGenerationEvaluation(BaseModel):
    """
    Evaluation output for a single benchmark query.
    """
    question_id: str
    question: str
    answer: str
    sources_count: int
    is_insufficient_context: bool
    is_successful: bool
    metrics: GenerationMetricsResult


class FullGenerationReport(BaseModel):
    """
    Complete generation evaluation report over a dataset.
    """
    dataset_name: str
    dataset_version: str
    repository_id: str
    total_queries: int
    mean_faithfulness: float
    mean_answer_relevance: float
    mean_context_relevance: float
    mean_citation_correctness: float
    mean_answer_completeness: float
    mean_overall_score: float
    evaluations: list[QueryGenerationEvaluation] = Field(default_factory=list)


class GenerationEvaluator:
    """
    Orchestrates generation quality evaluation using the existing RAG pipeline.
    """

    def __init__(self, rag_service: Optional[RAGService] = None) -> None:
        """
        Initialize GenerationEvaluator with dependency injection.

        Args:
            rag_service: Existing RAGService instance.
        """
        self.rag_service = rag_service or RAGService()

    def evaluate_query(self, item: BenchmarkItem) -> QueryGenerationEvaluation:
        """
        Execute RAG for a single benchmark item and compute all quality metrics.

        Args:
            item: Benchmark query item.

        Returns:
            QueryGenerationEvaluation with metrics and answer details.
        """
        rag_response = self.rag_service.answer_query(
            query=item.question,
            repository_id=item.repository_id,
        )

        metrics = compute_generation_metrics(
            rag_response=rag_response,
            benchmark_item=item,
        )

        return QueryGenerationEvaluation(
            question_id=item.question_id,
            question=item.question,
            answer=rag_response.answer,
            sources_count=len(rag_response.sources),
            is_insufficient_context=rag_response.is_insufficient_context,
            is_successful=rag_response.is_successful,
            metrics=metrics,
        )

    def evaluate_dataset(self, dataset: BenchmarkDataset) -> FullGenerationReport:
        """
        Run generation evaluation over all items in a benchmark dataset.

        Args:
            dataset: BenchmarkDataset to evaluate.

        Returns:
            FullGenerationReport containing individual and macro-averaged metrics.
        """
        logger.info("Evaluating generation quality across %d benchmark queries...", len(dataset.items))
        evals: list[QueryGenerationEvaluation] = []

        for item in dataset.items:
            q_eval = self.evaluate_query(item)
            evals.append(q_eval)

        n = len(evals) if evals else 1
        avg_faith = sum(e.metrics.faithfulness for e in evals) / n
        avg_ans_rel = sum(e.metrics.answer_relevance for e in evals) / n
        avg_ctx_rel = sum(e.metrics.context_relevance for e in evals) / n
        avg_cit = sum(e.metrics.citation_correctness for e in evals) / n
        avg_comp = sum(e.metrics.answer_completeness for e in evals) / n
        avg_overall = sum(e.metrics.overall_score for e in evals) / n

        return FullGenerationReport(
            dataset_name=dataset.name,
            dataset_version=dataset.version,
            repository_id=dataset.repository_id or "all",
            total_queries=len(evals),
            mean_faithfulness=round(avg_faith, 4),
            mean_answer_relevance=round(avg_ans_rel, 4),
            mean_context_relevance=round(avg_ctx_rel, 4),
            mean_citation_correctness=round(avg_cit, 4),
            mean_answer_completeness=round(avg_comp, 4),
            mean_overall_score=round(avg_overall, 4),
            evaluations=evals,
        )
