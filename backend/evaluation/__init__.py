"""
CodeSpecAI RAG Evaluation & Benchmarking Subsystem.

Provides offline evaluation for:
- Retrieval Quality (Precision@K, Recall@K, HitRate@K, MRR@K, NDCG@K)
- Generation Quality (Faithfulness, Answer Relevance, Context Relevance, Citation Correctness, Completeness)
- Pipeline Performance (Component and End-to-End Latencies)
"""
from __future__ import annotations

__version__ = "0.1.0"
