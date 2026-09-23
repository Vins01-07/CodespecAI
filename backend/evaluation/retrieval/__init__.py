"""
Retrieval evaluation package for CodeSpecAI RAG.
"""
from evaluation.retrieval.evaluator import (
    FullRetrievalReport,
    QueryRetrievalEvaluation,
    RetrievalEvaluator,
    StrategyEvaluationSummary,
)
from evaluation.retrieval.metrics import (
    RetrievalMetricsResult,
    compute_retrieval_metrics,
    hit_rate_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank_at_k,
)

__all__ = [
    "FullRetrievalReport",
    "QueryRetrievalEvaluation",
    "RetrievalEvaluator",
    "RetrievalMetricsResult",
    "StrategyEvaluationSummary",
    "compute_retrieval_metrics",
    "hit_rate_at_k",
    "ndcg_at_k",
    "precision_at_k",
    "recall_at_k",
    "reciprocal_rank_at_k",
]
