"""
Performance benchmarking module for CodeSpecAI RAG pipeline.

Measures and profiles:
- Ingestion/Indexing latency, files processed, chunks generated
- Vector retrieval latency
- Graph retrieval latency
- Hybrid retrieval latency
- Context construction latency
- LLM generation latency
- Total end-to-end query latency
"""
from __future__ import annotations

import statistics
import time
from typing import Any, Optional, Sequence
from pydantic import BaseModel, Field

from app.core.rag.generation.context_builder import ContextBuilder
from app.core.rag.generation.factory import get_llm_provider
from app.core.rag.retrieval.hybrid_retriever import HybridRetriever
from app.models.retrieval_models import HybridRetrievalConfig
from evaluation.datasets.models import BenchmarkDataset, BenchmarkItem


class LatencyStats(BaseModel):
    """
    Descriptive statistics for a set of latency measurements in milliseconds.
    """
    count: int = Field(0, description="Total number of observations")
    mean_ms: float = Field(0.0, description="Average duration in milliseconds")
    median_ms: float = Field(0.0, description="Median (P50) duration in milliseconds")
    p95_ms: float = Field(0.0, description="95th percentile duration in milliseconds")
    min_ms: float = Field(0.0, description="Minimum duration in milliseconds")
    max_ms: float = Field(0.0, description="Maximum duration in milliseconds")

    @classmethod
    def from_samples(cls, samples: Sequence[float]) -> LatencyStats:
        """Compute statistical summary from a sequence of millisecond timings."""
        if not samples:
            return cls()
        s = sorted(samples)
        n = len(s)
        mean_val = statistics.mean(s)
        med_val = statistics.median(s)
        p95_idx = int(math_ceil(0.95 * n)) - 1
        p95_val = s[max(0, min(p95_idx, n - 1))]
        return cls(
            count=n,
            mean_ms=round(mean_val, 2),
            median_ms=round(med_val, 2),
            p95_ms=round(p95_val, 2),
            min_ms=round(min(s), 2),
            max_ms=round(max(s), 2),
        )


def math_ceil(val: float) -> int:
    import math
    return math.ceil(val)


class QueryPerformanceSample(BaseModel):
    """
    Component-level latency profiling for a single query.
    """
    question_id: str
    query: str
    repository_id: str
    vector_retrieval_ms: float
    graph_retrieval_ms: float
    hybrid_retrieval_ms: float
    context_construction_ms: float
    llm_generation_ms: float
    total_query_ms: float


class IndexingPerformanceReport(BaseModel):
    """
    Performance profiling for repository ingestion and vector indexing.
    """
    repository_id: str
    files_processed: int = 0
    chunks_generated: int = 0
    classification_time_ms: float = 0.0
    parsing_time_ms: float = 0.0
    chunking_time_ms: float = 0.0
    embedding_and_storage_time_ms: float = 0.0
    total_indexing_time_ms: float = 0.0


class FullPerformanceReport(BaseModel):
    """
    Aggregated performance profiling report across all benchmark queries.
    """
    total_queries: int
    vector_retrieval_stats: LatencyStats
    graph_retrieval_stats: LatencyStats
    hybrid_retrieval_stats: LatencyStats
    context_construction_stats: LatencyStats
    llm_generation_stats: LatencyStats
    total_query_stats: LatencyStats
    indexing_report: Optional[IndexingPerformanceReport] = None
    query_samples: list[QueryPerformanceSample] = Field(default_factory=list)


class PerformanceBenchmark:
    """
    Profiles component-by-component and end-to-end execution timing for CodeSpecAI RAG.
    """

    def __init__(
        self,
        retriever: Optional[HybridRetriever] = None,
        context_builder: Optional[ContextBuilder] = None,
        llm_service: Optional[Any] = None,
    ) -> None:
        """
        Initialize benchmark with existing services.
        """
        self.retriever = retriever or HybridRetriever()
        self.context_builder = context_builder or ContextBuilder()
        self.llm_service = llm_service or get_llm_provider()

    def profile_query(self, item: BenchmarkItem) -> QueryPerformanceSample:
        """
        Profile all stages of query execution:
        vector retrieval -> graph retrieval -> hybrid fusion -> context building -> LLM generation.
        """
        query = item.question
        repo_id = item.repository_id

        # 1. Profile Vector Retrieval Latency
        t0 = time.perf_counter()
        try:
            vector_res = self.retriever.query(
                query=query,
                repository_id=repo_id,
                config=HybridRetrievalConfig(include_graph_expansion=False, top_k=10),
            )
        except Exception:
            pass
        vector_ms = (time.perf_counter() - t0) * 1000.0

        # 2. Profile Hybrid Retrieval Latency (including graph expansion)
        t0 = time.perf_counter()
        hybrid_res = self.retriever.query(
            query=query,
            repository_id=repo_id,
            config=HybridRetrievalConfig(include_graph_expansion=True, top_k=10),
        )
        hybrid_ms = (time.perf_counter() - t0) * 1000.0

        # Graph expansion portion estimated as difference (or non-negative component)
        graph_ms = max(0.0, hybrid_ms - vector_ms)

        # 3. Profile Context Construction Latency
        t0 = time.perf_counter()
        built_ctx = self.context_builder.build(
            query=query,
            retrieval_result=hybrid_res,
        )
        context_ms = (time.perf_counter() - t0) * 1000.0

        # 4. Profile LLM Generation Latency
        t0 = time.perf_counter()
        try:
            self.llm_service.generate(
                prompt=built_ctx.user_prompt,
                system_prompt=built_ctx.system_prompt,
            )
        except Exception:
            pass
        llm_ms = (time.perf_counter() - t0) * 1000.0

        total_ms = hybrid_ms + context_ms + llm_ms

        return QueryPerformanceSample(
            question_id=item.question_id,
            query=query,
            repository_id=repo_id,
            vector_retrieval_ms=round(vector_ms, 2),
            graph_retrieval_ms=round(graph_ms, 2),
            hybrid_retrieval_ms=round(hybrid_ms, 2),
            context_construction_ms=round(context_ms, 2),
            llm_generation_ms=round(llm_ms, 2),
            total_query_ms=round(total_ms, 2),
        )

    def benchmark_dataset(
        self,
        dataset: BenchmarkDataset,
        indexing_report: Optional[IndexingPerformanceReport] = None,
    ) -> FullPerformanceReport:
        """
        Run performance benchmark across all queries in dataset.
        """
        samples: list[QueryPerformanceSample] = []
        for item in dataset.items:
            sample = self.profile_query(item)
            samples.append(sample)

        vec_times = [s.vector_retrieval_ms for s in samples]
        graph_times = [s.graph_retrieval_ms for s in samples]
        hyb_times = [s.hybrid_retrieval_ms for s in samples]
        ctx_times = [s.context_construction_ms for s in samples]
        llm_times = [s.llm_generation_ms for s in samples]
        tot_times = [s.total_query_ms for s in samples]

        return FullPerformanceReport(
            total_queries=len(samples),
            vector_retrieval_stats=LatencyStats.from_samples(vec_times),
            graph_retrieval_stats=LatencyStats.from_samples(graph_times),
            hybrid_retrieval_stats=LatencyStats.from_samples(hyb_times),
            context_construction_stats=LatencyStats.from_samples(ctx_times),
            llm_generation_stats=LatencyStats.from_samples(llm_times),
            total_query_stats=LatencyStats.from_samples(tot_times),
            indexing_report=indexing_report,
            query_samples=samples,
        )
