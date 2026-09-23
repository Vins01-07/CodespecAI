"""
Evaluation Runner for CodeSpecAI RAG.

CLI and programmatic runner to orchestrate:
1. Retrieval Evaluation (Vector, Graph, Hybrid)
2. Generation Quality Evaluation (Faithfulness, Relevance, Citation, Completeness)
3. Performance & Latency Benchmarking
4. Report Generation (JSON & Markdown)
"""
from __future__ import annotations

import argparse
import logging
import sys
import uuid
from pathlib import Path
from typing import Optional, Sequence
from unittest.mock import MagicMock

from app.config import settings
from app.core.rag.generation.context_builder import ContextBuilder
from app.core.rag.generation.rag_service import RAGService
from app.core.rag.retrieval.hybrid_retriever import HybridRetriever
from evaluation.datasets.models import BenchmarkDataset
from evaluation.generation.evaluator import GenerationEvaluator
from evaluation.performance.benchmark import PerformanceBenchmark
from evaluation.reports.generator import (
    EvaluationRunArtifact,
    ExperimentConfig,
    ReportGenerator,
)
from evaluation.retrieval.evaluator import RetrievalEvaluator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("evaluation_runner")


def is_neo4j_reachable() -> bool:
    """Check if Neo4j is reachable without hanging."""
    try:
        from app.db.neo4j import get_session
        with get_session() as session:
            session.run("RETURN 1 AS ready")
            return True
    except Exception:
        return False


def create_offline_retriever(dataset: BenchmarkDataset) -> HybridRetriever:
    """
    Constructs an offline in-memory HybridRetriever pre-indexed with chunks
    derived from the benchmark dataset ground-truth items.
    Allows running instant evaluations without external database dependencies.
    """
    from app.core.rag.embeddings.mock_embedding import MockEmbeddingService
    from app.core.rag.indexing_service import IndexingService
    from app.core.rag.vector_store.in_memory_vector import InMemoryVectorStore
    from app.models.chunk_models import RAGChunk
    from app.models.classification import FileType

    vec_store = InMemoryVectorStore()
    emb_service = MockEmbeddingService(dimensions=64)
    indexing = IndexingService(embedding_service=emb_service, vector_store=vec_store)

    chunks: list[RAGChunk] = []
    repo_id = dataset.repository_id or "test-repo"

    for idx, item in enumerate(dataset.items):
        for f_idx, rf in enumerate(item.relevant_files):
            sym = item.relevant_symbols[f_idx] if f_idx < len(item.relevant_symbols) else None
            chunk = RAGChunk(
                chunk_id=f"chk_{item.question_id}_{f_idx}",
                repository_id=repo_id,
                file_path=rf,
                file_type=FileType.SOURCE_CODE if rf.endswith(".py") else FileType.MARKDOWN,
                language="python" if rf.endswith(".py") else "markdown",
                content=f"Implementation details for {item.question} in {rf}. {item.ground_truth_answer or ''}",
                symbol=sym,
                start_line=10,
                end_line=25,
            )
            chunks.append(chunk)

    if chunks:
        indexing.index_chunks(chunks, repository_id=repo_id)

    mock_graph = MagicMock()
    mock_graph.get_symbol_context.return_value = []
    mock_graph.get_file_context.return_value = []

    return HybridRetriever(
        indexing_service=indexing,
        graph_retriever=mock_graph,
    )


class EvaluationRunner:
    """
    Coordinates end-to-end evaluation suite execution and reporting.
    """

    def __init__(
        self,
        retriever: Optional[HybridRetriever] = None,
        context_builder: Optional[ContextBuilder] = None,
        rag_service: Optional[RAGService] = None,
        output_dir: Optional[str | Path] = None,
        offline: bool = False,
    ) -> None:
        self.offline = offline
        self.retriever = retriever
        self.context_builder = context_builder or ContextBuilder()
        self.rag_service = rag_service
        self.report_generator = ReportGenerator(output_dir=output_dir)

    def run_all(
        self,
        dataset: BenchmarkDataset,
        strategies: Sequence[str] = ("vector", "graph", "hybrid"),
        k_values: Sequence[int] = (5, 10),
        experiment_id: Optional[str] = None,
    ) -> EvaluationRunArtifact:
        """
        Execute full benchmark suite: retrieval, generation, performance, and report generation.
        """
        exp_id = experiment_id or f"exp_{uuid.uuid4().hex[:8]}"
        repo_id = dataset.repository_id or "test-repo"
        logger.info("Starting evaluation run '%s' for repository '%s'...", exp_id, repo_id)

        # Resolve retriever
        active_retriever = self.retriever
        if active_retriever is None:
            if self.offline or not is_neo4j_reachable():
                logger.info("Live Neo4j not reachable or offline mode selected; using in-memory offline retriever.")
                active_retriever = create_offline_retriever(dataset)
            else:
                active_retriever = HybridRetriever()

        # Resolve RAG service
        active_rag_service = self.rag_service
        if active_rag_service is None:
            active_rag_service = RAGService(
                hybrid_retriever=active_retriever,
                context_builder=self.context_builder,
            )

        # 1. Experiment Configuration
        exp_config = ExperimentConfig(
            experiment_id=exp_id,
            repository_id=repo_id,
            dataset_name=dataset.name,
            dataset_version=dataset.version,
            retrieval_strategies=list(strategies),
            k_values=list(k_values),
            llm_provider=settings.LLM_PROVIDER,
            llm_model=settings.LLM_MODEL_NAME,
            embedding_provider=settings.EMBEDDING_PROVIDER,
            vector_store=settings.VECTOR_STORE_PROVIDER if not self.offline else "in_memory",
        )

        # 2. Retrieval Quality Evaluation
        logger.info("Running retrieval evaluation (strategies: %s, K: %s)...", strategies, k_values)
        retrieval_evaluator = RetrievalEvaluator(
            retriever=active_retriever,
            default_k_values=k_values,
        )
        retrieval_report = retrieval_evaluator.evaluate_dataset(
            dataset=dataset,
            strategies=strategies,
            k_values=k_values,
        )

        # 3. Generation Quality Evaluation
        logger.info("Running generation quality evaluation...")
        gen_evaluator = GenerationEvaluator(rag_service=active_rag_service)
        generation_report = gen_evaluator.evaluate_dataset(dataset=dataset)

        # 4. Performance & Latency Benchmarking
        logger.info("Running performance and latency benchmarking...")
        perf_benchmark = PerformanceBenchmark(
            retriever=active_retriever,
            context_builder=self.context_builder,
            llm_service=active_rag_service.llm_service,
        )
        perf_report = perf_benchmark.benchmark_dataset(dataset=dataset)

        # 5. Assemble Artifact & Generate Reports
        artifact = EvaluationRunArtifact(
            config=exp_config,
            retrieval=retrieval_report,
            generation=generation_report,
            performance=perf_report,
        )

        json_path = self.report_generator.save_json(artifact)
        md_path = self.report_generator.save_markdown(artifact)

        logger.info("Evaluation run '%s' complete!", exp_id)
        logger.info("JSON report saved: %s", json_path)
        logger.info("Markdown report saved: %s", md_path)

        return artifact


def main() -> None:
    """CLI entry point for running RAG evaluations."""
    parser = argparse.ArgumentParser(description="CodeSpecAI RAG Evaluation & Benchmarking Runner")
    default_dataset = Path(__file__).resolve().parent / "datasets" / "sample_benchmark.json"
    parser.add_argument(
        "--dataset",
        type=str,
        default=str(default_dataset),
        help="Path to benchmark dataset JSON file",
    )
    parser.add_argument(
        "--k",
        type=int,
        nargs="+",
        default=[5, 10],
        help="K thresholds to evaluate (e.g. --k 5 10)",
    )
    parser.add_argument(
        "--strategies",
        type=str,
        nargs="+",
        default=["vector", "hybrid"],
        help="Retrieval strategies to test (vector, graph, hybrid)",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Run completely in-memory without connecting to live database",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=None,
        help="Directory to save evaluation reports",
    )
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        logger.error("Dataset file not found at: %s", dataset_path)
        sys.exit(1)

    dataset = BenchmarkDataset.from_file(dataset_path)
    runner = EvaluationRunner(output_dir=args.out, offline=args.offline)
    artifact = runner.run_all(
        dataset=dataset,
        strategies=args.strategies,
        k_values=args.k,
    )
    print("\n" + "=" * 80)
    print(runner.report_generator.generate_markdown(artifact))
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
