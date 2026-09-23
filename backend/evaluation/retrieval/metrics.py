"""
Information Retrieval (IR) metrics calculation for CodeSpecAI RAG evaluation.

Implements standard IR ranking evaluation metrics:
- Precision@K
- Recall@K
- Hit Rate@K (Hit@K)
- Mean Reciprocal Rank (MRR@K)
- Normalized Discounted Cumulative Gain (NDCG@K)
"""
from __future__ import annotations

import math
from typing import Sequence
from pydantic import BaseModel, Field


class RetrievalMetricsResult(BaseModel):
    """
    Evaluation metrics computed for a specific K threshold.
    """
    k: int = Field(..., description="Rank evaluation cutoff K")
    precision: float = Field(0.0, description="Precision@K: fraction of top-K items that are relevant")
    recall: float = Field(0.0, description="Recall@K: fraction of ground truth relevant items in top-K")
    hit_rate: float = Field(0.0, description="HitRate@K: 1.0 if at least one relevant item in top-K, else 0.0")
    mrr: float = Field(0.0, description="Reciprocal Rank (RR@K): 1 / rank of first relevant item")
    ndcg: float = Field(0.0, description="NDCG@K: Normalized Discounted Cumulative Gain")


def precision_at_k(
    retrieved_items: Sequence[str],
    relevant_items: set[str] | Sequence[str],
    k: int,
) -> float:
    """
    Calculate Precision@K:
      Precision@K = |{retrieved[:k]} ∩ {relevant}| / k

    Args:
        retrieved_items: Ordered sequence of retrieved item identifiers (rank 1 to N).
        relevant_items: Ground truth set of relevant item identifiers.
        k: Cutoff rank.

    Returns:
        Precision score between 0.0 and 1.0.
    """
    if k <= 0:
        return 0.0
    rel_set = set(relevant_items)
    top_k = list(retrieved_items[:k])
    if not top_k:
        return 0.0
    relevant_retrieved = sum(1 for item in top_k if item in rel_set)
    return round(relevant_retrieved / k, 4)


def recall_at_k(
    retrieved_items: Sequence[str],
    relevant_items: set[str] | Sequence[str],
    k: int,
) -> float:
    """
    Calculate Recall@K:
      Recall@K = |{retrieved[:k]} ∩ {relevant}| / |{relevant}|

    Args:
        retrieved_items: Ordered sequence of retrieved item identifiers.
        relevant_items: Ground truth set of relevant item identifiers.
        k: Cutoff rank.

    Returns:
        Recall score between 0.0 and 1.0. Returns 1.0 if both ground truth and retrieved are empty.
    """
    rel_set = set(relevant_items)
    if not rel_set:
        # If there are no relevant items to retrieve, recall is 1.0 if nothing retrieved, else 1.0
        return 1.0
    if k <= 0:
        return 0.0
    top_k = list(retrieved_items[:k])
    relevant_retrieved = sum(1 for item in top_k if item in rel_set)
    return round(relevant_retrieved / len(rel_set), 4)


def hit_rate_at_k(
    retrieved_items: Sequence[str],
    relevant_items: set[str] | Sequence[str],
    k: int,
) -> float:
    """
    Calculate Hit Rate@K:
      HitRate@K = 1.0 if any item in top-k is relevant, else 0.0.

    Args:
        retrieved_items: Ordered sequence of retrieved item identifiers.
        relevant_items: Ground truth set of relevant item identifiers.
        k: Cutoff rank.

    Returns:
        1.0 if hit, 0.0 otherwise.
    """
    if k <= 0:
        return 0.0
    rel_set = set(relevant_items)
    if not rel_set:
        return 0.0
    top_k = list(retrieved_items[:k])
    for item in top_k:
        if item in rel_set:
            return 1.0
    return 0.0


def reciprocal_rank_at_k(
    retrieved_items: Sequence[str],
    relevant_items: set[str] | Sequence[str],
    k: int,
) -> float:
    """
    Calculate Reciprocal Rank (RR@K):
      RR@K = 1 / rank of first relevant item in retrieved[:k], or 0.0 if none.

    Args:
        retrieved_items: Ordered sequence of retrieved item identifiers.
        relevant_items: Ground truth set of relevant item identifiers.
        k: Cutoff rank.

    Returns:
        Reciprocal rank score between 0.0 and 1.0.
    """
    if k <= 0:
        return 0.0
    rel_set = set(relevant_items)
    if not rel_set:
        return 0.0
    top_k = list(retrieved_items[:k])
    for rank_idx, item in enumerate(top_k, start=1):
        if item in rel_set:
            return round(1.0 / rank_idx, 4)
    return 0.0


def ndcg_at_k(
    retrieved_items: Sequence[str],
    relevance_map: dict[str, int] | set[str] | Sequence[str],
    k: int,
) -> float:
    """
    Calculate Normalized Discounted Cumulative Gain (NDCG@K):
      DCG@K = sum_{i=1}^k (2^{rel_i} - 1) / log2(i + 1)
      IDCG@K = sum_{i=1}^min(k, |R|) (2^{ideal_rel_i} - 1) / log2(i + 1)
      NDCG@K = DCG@K / IDCG@K

    Supports both graded relevance (dict[str, int]) and binary relevance (set/sequence).

    Args:
        retrieved_items: Ordered sequence of retrieved item identifiers.
        relevance_map: Mapping of item identifier -> relevance grade (e.g. 0 to 3),
                       or set/sequence of relevant items (treated as binary grade 1).
        k: Cutoff rank.

    Returns:
        NDCG score between 0.0 and 1.0.
    """
    if k <= 0:
        return 0.0

    # Normalize to grade dictionary
    grade_dict: dict[str, int]
    if isinstance(relevance_map, dict):
        grade_dict = relevance_map
    else:
        grade_dict = {item: 1 for item in relevance_map}

    if not grade_dict:
        return 0.0

    top_k = list(retrieved_items[:k])

    # Calculate DCG@K
    dcg = 0.0
    for idx, item in enumerate(top_k, start=1):
        rel = grade_dict.get(item, 0)
        if rel > 0:
            dcg += (2.0 ** rel - 1.0) / math.log2(idx + 1)

    # Calculate Ideal DCG (IDCG@K)
    sorted_ideal_grades = sorted([g for g in grade_dict.values() if g > 0], reverse=True)
    if not sorted_ideal_grades:
        return 0.0

    idcg = 0.0
    for idx, rel in enumerate(sorted_ideal_grades[:k], start=1):
        idcg += (2.0 ** rel - 1.0) / math.log2(idx + 1)

    if idcg == 0.0:
        return 0.0

    return round(min(dcg / idcg, 1.0), 4)


def compute_retrieval_metrics(
    retrieved_items: Sequence[str],
    relevant_items: set[str] | Sequence[str],
    k: int,
    relevance_grades: dict[str, int] | None = None,
) -> RetrievalMetricsResult:
    """
    Compute all standard retrieval metrics at a given K cutoff.
    """
    rel_set = set(relevant_items)
    grades = relevance_grades if relevance_grades is not None else {item: 1 for item in rel_set}

    p = precision_at_k(retrieved_items, rel_set, k)
    r = recall_at_k(retrieved_items, rel_set, k)
    hit = hit_rate_at_k(retrieved_items, rel_set, k)
    mrr = reciprocal_rank_at_k(retrieved_items, rel_set, k)
    ndcg = ndcg_at_k(retrieved_items, grades, k)

    return RetrievalMetricsResult(
        k=k,
        precision=p,
        recall=r,
        hit_rate=hit,
        mrr=mrr,
        ndcg=ndcg,
    )
