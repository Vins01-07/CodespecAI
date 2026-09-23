"""
Generation quality evaluation package for CodeSpecAI RAG.
"""
from evaluation.generation.evaluator import (
    FullGenerationReport,
    GenerationEvaluator,
    QueryGenerationEvaluation,
)
from evaluation.generation.metrics import (
    GenerationMetricsResult,
    calculate_answer_completeness,
    calculate_answer_relevance,
    calculate_citation_correctness,
    calculate_context_relevance,
    calculate_faithfulness,
    compute_generation_metrics,
)

__all__ = [
    "FullGenerationReport",
    "GenerationEvaluator",
    "GenerationMetricsResult",
    "QueryGenerationEvaluation",
    "calculate_answer_completeness",
    "calculate_answer_relevance",
    "calculate_citation_correctness",
    "calculate_context_relevance",
    "calculate_faithfulness",
    "compute_generation_metrics",
]
