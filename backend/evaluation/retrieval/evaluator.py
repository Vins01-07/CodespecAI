"""
Retrieval evaluator for CodeSpecAI RAG.

Evaluates:
- Vector Retrieval
- Graph Retrieval
- Hybrid Retrieval
Against benchmark datasets at configurable K cutoffs (e.g. K=5, K=10).
"""
from __future__ import annotations

import logging
from typing import Any, Optional, Sequence
from pydantic import BaseModel, Field

from app.core.rag.retrieval.hybrid_retriever import HybridRetriever
from app.models.retrieval_models import HybridRetrievalConfig, RetrievalResult, RetrievedItem
from evaluation.datasets.models import BenchmarkDataset, BenchmarkItem
from evaluation.retrieval.metrics import (
    RetrievalMetricsResult,
    compute_retrieval_metrics,
)

logger = logging.getLogger(__name__)


class QueryRetrievalEvaluation(BaseModel):
    """
    Detailed retrieval evaluation for a single benchmark query.
    """
    question_id: str
    query: str
    strategy: str  # 'vector', 'graph', 'hybrid'
    retrieved_count: int
    retrieved_files: list[str]
    retrieved_symbols: list[str]
    metrics_by_k: dict[int, RetrievalMetricsResult]


class StrategyEvaluationSummary(BaseModel):
    """
    Aggregated evaluation summary for a specific retrieval strategy across all queries.
    """
    strategy: str
    total_queries: int
    mean_metrics_by_k: dict[int, RetrievalMetricsResult]
    query_evaluations: list[QueryRetrievalEvaluation] = Field(default_factory=list)


class FullRetrievalReport(BaseModel):
    """
    Complete comparative retrieval evaluation report across multiple strategies.
    """
    dataset_name: str
    dataset_version: str
    repository_id: str
    k_values: list[int]
    strategies: dict[str, StrategyEvaluationSummary]


class RetrievalEvaluator:
    """
    Orchestrates retrieval evaluation over benchmark datasets using existing retrieval services.
    """

    def __init__(
        self,
        retriever: Optional[HybridRetriever] = None,
        default_k_values: Sequence[int] = (5, 10),
    ) -> None:
        """
        Initialize RetrievalEvaluator with dependency injection.

        Args:
            retriever: Existing HybridRetriever instance (Phase 6).
            default_k_values: K thresholds to calculate metrics for (default: 5, 10).
        """
        self.retriever = retriever or HybridRetriever()
        self.k_values = sorted(list(default_k_values))

    def evaluate_query(
        self,
        item: BenchmarkItem,
        strategy: str = "hybrid",
        k_values: Optional[Sequence[int]] = None,
    ) -> QueryRetrievalEvaluation:
        """
        Run retrieval for a single benchmark query and compute metrics at all K thresholds.

        Args:
            item: Benchmark query item with ground truth targets.
            strategy: 'vector', 'graph', or 'hybrid'.
            k_values: K cutoffs to evaluate.

        Returns:
            QueryRetrievalEvaluation container with computed metrics.
        """
        ks = sorted(list(k_values or self.k_values))
        max_k = max(ks) if ks else 10

        # Configure retrieval according to chosen strategy
        config = HybridRetrievalConfig(
            top_k=max_k,
            vector_top_k=max_k,
            include_graph_expansion=(strategy in ("hybrid", "graph")),
            ranking_strategy="rrf",
        )

        retrieval_res: RetrievalResult
        if strategy == "vector":
            # Vector-only retrieval disables graph expansion
            config.include_graph_expansion = False
            retrieval_res = self.retriever.query(
                query=item.question,
                repository_id=item.repository_id,
                config=config,
            )
        elif strategy == "graph":
            # Graph-focused: if retriever has graph component, query graph context
            # or execute hybrid with graph expansion
            retrieval_res = self.retriever.query(
                query=item.question,
                repository_id=item.repository_id,
                config=config,
            )
            # Filter items to those having graph provenance if available
            graph_items = [
                it for it in retrieval_res.items
                if "graph" in it.provenance.sources
            ]
            if graph_items:
                retrieval_res = RetrievalResult(
                    query=item.question,
                    repository_id=item.repository_id,
                    items=graph_items,
                    total_results=len(graph_items),
                )
        else:
            # Default: Hybrid fusion
            retrieval_res = self.retriever.query(
                query=item.question,
                repository_id=item.repository_id,
                config=config,
            )

        # Extract normalized identifiers for matching
        # An item is identified by its file_path (primary) or symbol
        retrieved_files = [it.file_path for it in retrieval_res.items]
        retrieved_symbols = [it.symbol for it in retrieval_res.items if it.symbol]

        # Ground truth identifiers: files + symbols
        ground_truth_targets: set[str] = set()
        for f in item.relevant_files:
            ground_truth_targets.add(f.replace("\\", "/").strip().lower())
        for s in item.relevant_symbols:
            ground_truth_targets.add(s.strip().lower())

        # Construct normalized retrieved list
        retrieved_matches: list[str] = []
        for it in retrieval_res.items:
            norm_file = it.file_path.replace("\\", "/").strip().lower()
            norm_sym = it.symbol.strip().lower() if it.symbol else None
            # If symbol matches ground truth, use symbol; else use file
            if norm_sym and norm_sym in ground_truth_targets:
                retrieved_matches.append(norm_sym)
            else:
                retrieved_matches.append(norm_file)

        # Build grades map for NDCG
        normalized_grades: dict[str, int] = {}
        for target, grade in item.relevance_grades.items():
            normalized_grades[target.replace("\\", "/").strip().lower()] = grade

        # Compute metrics across each K threshold
        metrics_by_k: dict[int, RetrievalMetricsResult] = {}
        for k in ks:
            metrics_by_k[k] = compute_retrieval_metrics(
                retrieved_items=retrieved_matches,
                relevant_items=ground_truth_targets,
                k=k,
                relevance_grades=normalized_grades if normalized_grades else None,
            )

        return QueryRetrievalEvaluation(
            question_id=item.question_id,
            query=item.question,
            strategy=strategy,
            retrieved_count=len(retrieval_res.items),
            retrieved_files=retrieved_files,
            retrieved_symbols=retrieved_symbols,
            metrics_by_k=metrics_by_k,
        )

    def evaluate_dataset(
        self,
        dataset: BenchmarkDataset,
        strategies: Sequence[str] = ("vector", "graph", "hybrid"),
        k_values: Optional[Sequence[int]] = None,
    ) -> FullRetrievalReport:
        """
        Evaluate an entire benchmark dataset across specified retrieval strategies and K cutoffs.

        Args:
            dataset: BenchmarkDataset instance.
            strategies: Strategies to evaluate (default: 'vector', 'graph', 'hybrid').
            k_values: K cutoffs to evaluate (default: self.k_values).

        Returns:
            FullRetrievalReport containing individual and aggregated metrics.
        """
        ks = sorted(list(k_values or self.k_values))
        strategy_summaries: dict[str, StrategyEvaluationSummary] = {}

        for strat in strategies:
            logger.info("Evaluating retrieval strategy '%s' across %d queries...", strat, len(dataset.items))
            query_evals: list[QueryRetrievalEvaluation] = []

            for item in dataset.items:
                q_eval = self.evaluate_query(item=item, strategy=strat, k_values=ks)
                query_evals.append(q_eval)

            # Compute macro-averages for each K
            mean_metrics_by_k: dict[int, RetrievalMetricsResult] = {}
            num_queries = len(query_evals) if query_evals else 1

            for k in ks:
                avg_p = sum(qe.metrics_by_k[k].precision for qe in query_evals) / num_queries
                avg_r = sum(qe.metrics_by_k[k].recall for qe in query_evals) / num_queries
                avg_hit = sum(qe.metrics_by_k[k].hit_rate for qe in query_evals) / num_queries
                avg_mrr = sum(qe.metrics_by_k[k].mrr for qe in query_evals) / num_queries
                avg_ndcg = sum(qe.metrics_by_k[k].ndcg for qe in query_evals) / num_queries

                mean_metrics_by_k[k] = RetrievalMetricsResult(
                    k=k,
                    precision=round(avg_p, 4),
                    recall=round(avg_r, 4),
                    hit_rate=round(avg_hit, 4),
                    mrr=round(avg_mrr, 4),
                    ndcg=round(avg_ndcg, 4),
                )

            strategy_summaries[strat] = StrategyEvaluationSummary(
                strategy=strat,
                total_queries=len(query_evals),
                mean_metrics_by_k=mean_metrics_by_k,
                query_evaluations=query_evals,
            )

        return FullRetrievalReport(
            dataset_name=dataset.name,
            dataset_version=dataset.version,
            repository_id=dataset.repository_id or "all",
            k_values=ks,
            strategies=strategy_summaries,
        )
