"""
Comprehensive tests for CodeSpecAI RAG Evaluation & Benchmarking Layer.

Verifies:
- Information retrieval metrics (Precision@K, Recall@K, HitRate@K, MRR@K, NDCG@K)
- Generation metrics (Faithfulness, Relevance, Context, Citations, Completeness)
- Benchmark dataset validation and parsing
- RetrievalEvaluator across vector, graph, and hybrid modes
- GenerationEvaluator across simulated RAGResponses
- Performance benchmarking and latency statistics
- EvaluationRunner end-to-end execution and JSON/Markdown report generation
"""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock
import pytest

from app.models.generation_models import RAGMetadata, RAGResponse, RAGSourceItem
from app.models.retrieval_models import (
    HybridRetrievalConfig,
    RetrievalProvenance,
    RetrievalResult,
    RetrievedItem,
)
from evaluation.datasets.models import BenchmarkDataset, BenchmarkItem
from evaluation.generation.metrics import (
    calculate_answer_completeness,
    calculate_answer_relevance,
    calculate_citation_correctness,
    calculate_context_relevance,
    calculate_faithfulness,
    compute_generation_metrics,
)
from evaluation.performance.benchmark import LatencyStats, PerformanceBenchmark
from evaluation.reports.generator import (
    EvaluationRunArtifact,
    ExperimentConfig,
    ReportGenerator,
)
from evaluation.retrieval.evaluator import RetrievalEvaluator
from evaluation.retrieval.metrics import (
    compute_retrieval_metrics,
    hit_rate_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank_at_k,
)
from evaluation.runner import EvaluationRunner


# ===========================================================================
# 1. Retrieval Metrics Tests on Known Examples
# ===========================================================================

def test_precision_at_k():
    """Verify Precision@K on known sequences."""
    retrieved = ["doc_A", "doc_B", "doc_C", "doc_D", "doc_E"]
    relevant = {"doc_A", "doc_C"}

    # At K=1: ["doc_A"] -> 1 relevant / 1 = 1.0
    assert precision_at_k(retrieved, relevant, k=1) == 1.0

    # At K=2: ["doc_A", "doc_B"] -> 1 relevant / 2 = 0.5
    assert precision_at_k(retrieved, relevant, k=2) == 0.5

    # At K=3: ["doc_A", "doc_B", "doc_C"] -> 2 relevant / 3 = 0.6667
    assert precision_at_k(retrieved, relevant, k=3) == 0.6667

    # At K=5: ["doc_A", "doc_B", "doc_C", "doc_D", "doc_E"] -> 2 / 5 = 0.4
    assert precision_at_k(retrieved, relevant, k=5) == 0.4

    # Edge cases
    assert precision_at_k([], relevant, k=5) == 0.0
    assert precision_at_k(retrieved, set(), k=5) == 0.0
    assert precision_at_k(retrieved, relevant, k=0) == 0.0


def test_recall_at_k():
    """Verify Recall@K on known sequences."""
    retrieved = ["doc_A", "doc_B", "doc_C", "doc_D"]
    relevant = {"doc_A", "doc_C", "doc_Z"}  # 3 relevant items total

    # At K=1: only doc_A captured -> 1 / 3 = 0.3333
    assert recall_at_k(retrieved, relevant, k=1) == 0.3333

    # At K=3: doc_A and doc_C captured -> 2 / 3 = 0.6667
    assert recall_at_k(retrieved, relevant, k=3) == 0.6667

    # All captured scenario
    relevant_sub = {"doc_A", "doc_B"}
    assert recall_at_k(retrieved, relevant_sub, k=2) == 1.0

    # Edge case: empty relevant set
    assert recall_at_k(retrieved, set(), k=5) == 1.0


def test_hit_rate_at_k():
    """Verify HitRate@K returns 1.0 if any relevant item is in top-K, else 0.0."""
    retrieved = ["doc_X", "doc_Y", "doc_A", "doc_Z"]
    relevant = {"doc_A"}

    assert hit_rate_at_k(retrieved, relevant, k=1) == 0.0
    assert hit_rate_at_k(retrieved, relevant, k=2) == 0.0
    assert hit_rate_at_k(retrieved, relevant, k=3) == 1.0
    assert hit_rate_at_k(retrieved, relevant, k=4) == 1.0
    assert hit_rate_at_k([], relevant, k=5) == 0.0


def test_reciprocal_rank_at_k():
    """Verify Mean Reciprocal Rank calculation."""
    # First hit at rank 1
    assert reciprocal_rank_at_k(["A", "B", "C"], {"A"}, k=3) == 1.0

    # First hit at rank 2
    assert reciprocal_rank_at_k(["B", "A", "C"], {"A"}, k=3) == 0.5

    # First hit at rank 3
    assert reciprocal_rank_at_k(["B", "C", "A"], {"A"}, k=3) == 0.3333

    # No hit in top-2
    assert reciprocal_rank_at_k(["B", "C", "A"], {"A"}, k=2) == 0.0


def test_ndcg_at_k_binary_and_graded():
    """Verify NDCG@K with binary and graded relevance."""
    # 1. Graded relevance: ideal ranking has NDCG = 1.0
    grades = {"A": 3, "B": 2, "C": 1}
    assert ndcg_at_k(["A", "B", "C"], grades, k=3) == 1.0

    # Reversed order should yield NDCG < 1.0
    reversed_ndcg = ndcg_at_k(["C", "B", "A"], grades, k=3)
    assert 0.65 < reversed_ndcg < 0.75

    # Zero relevant items in top-K
    assert ndcg_at_k(["X", "Y", "Z"], grades, k=3) == 0.0

    # Binary relevance via set
    binary_rel = {"A", "B"}
    assert ndcg_at_k(["A", "B", "C"], binary_rel, k=2) == 1.0
    assert ndcg_at_k(["C", "A", "B"], binary_rel, k=1) == 0.0


def test_compute_retrieval_metrics_container():
    """Verify composite metric computation."""
    res = compute_retrieval_metrics(
        retrieved_items=["A", "B", "C", "D", "E"],
        relevant_items={"A", "C"},
        k=5,
    )
    assert res.k == 5
    assert res.precision == 0.4
    assert res.recall == 1.0
    assert res.hit_rate == 1.0
    assert res.mrr == 1.0
    assert res.ndcg > 0.0


# ===========================================================================
# 2. Generation Metrics Tests
# ===========================================================================

def test_faithfulness_grounded_vs_hallucinated():
    """Verify faithfulness detects grounded text vs complete hallucinations."""
    source = RAGSourceItem(
        index=1,
        repository_id="repo1",
        file_path="src/auth.py",
        snippet="def validate_token(jwt_token: str) -> bool: return verify_signature(jwt_token)",
    )

    # 1. Grounded answer
    grounded_ans = "The validate_token function accepts a jwt_token and calls verify_signature to check validity."
    score_grounded, note = calculate_faithfulness(grounded_ans, [source])
    assert score_grounded >= 0.8

    # 2. Hallucinated answer (making up unrelated facts not in context)
    hallucinated_ans = "The QuantumBlockchainModule distributes microcurrency tokens using zero-knowledge elliptic proofs."
    score_hallucinated, _ = calculate_faithfulness(hallucinated_ans, [source])
    assert score_hallucinated < 0.3

    # 3. Insufficient context statement is fully faithful
    insufficient_ans = "INSUFFICIENT CONTEXT: No relevant context found in repository."
    score_insufficient, _ = calculate_faithfulness(insufficient_ans, [], is_insufficient_context=True)
    assert score_insufficient == 1.0


def test_answer_relevance():
    """Verify answer relevance measures query term alignment."""
    q = "How does the AuthService handle JWT expiration?"

    on_topic = "AuthService checks JWT expiration by validating the exp timestamp against current system time."
    score_on_topic, _ = calculate_answer_relevance(q, on_topic)
    assert score_on_topic >= 0.8

    off_topic = "The CSS styling is configured with green background buttons and responsive flexbox layouts."
    score_off_topic, _ = calculate_answer_relevance(q, off_topic)
    assert score_off_topic < 0.3


def test_context_relevance():
    """Verify context relevance calculates signal-to-noise ratio."""
    item = BenchmarkItem(
        question_id="q1",
        repository_id="repo1",
        question="How does auth work?",
        relevant_files=["src/auth.py"],
    )

    sources = [
        RAGSourceItem(index=1, repository_id="repo1", file_path="src/auth.py", snippet="..."),
        RAGSourceItem(index=2, repository_id="repo1", file_path="src/unrelated.py", snippet="..."),
    ]

    score, _ = calculate_context_relevance(sources, item)
    # 1 of 2 sources is relevant -> 0.5
    assert score == 0.5


def test_citation_correctness():
    """Verify citation correctness checks indices and target alignment."""
    item = BenchmarkItem(
        question_id="q1",
        repository_id="repo1",
        question="Where is token validation?",
        relevant_files=["src/auth.py"],
    )

    sources = [
        RAGSourceItem(index=1, repository_id="repo1", file_path="src/auth.py", snippet="validate"),
        RAGSourceItem(index=2, repository_id="repo1", file_path="src/styles.css", snippet="body"),
    ]

    # Cites [1] correctly pointing to src/auth.py
    good_ans = "Validation is handled in [1] via auth service."
    score_good, _ = calculate_citation_correctness(good_ans, sources, item)
    assert score_good == 1.0

    # Cites [2] pointing to irrelevant file src/styles.css
    bad_target_ans = "Validation is handled in [2]."
    score_bad, _ = calculate_citation_correctness(bad_target_ans, sources, item)
    assert score_bad < 0.6

    # Cites non-existent index [9]
    invalid_idx_ans = "Validation is handled in [9]."
    score_inv, _ = calculate_citation_correctness(invalid_idx_ans, sources, item)
    assert score_inv == 0.0


def test_answer_completeness():
    """Verify answer completeness measures expected concept coverage."""
    item = BenchmarkItem(
        question_id="q1",
        repository_id="repo1",
        question="What is the pipeline flow?",
        relevant_files=[],
        expected_concepts=["ingestion", "vector", "graph", "generation"],
    )

    complete_ans = "The pipeline covers ingestion, vector indexing, graph expansion, and generation."
    score_comp, _ = calculate_answer_completeness(complete_ans, item)
    assert score_comp == 1.0

    partial_ans = "The pipeline covers ingestion and vector search."
    score_part, _ = calculate_answer_completeness(partial_ans, item)
    assert score_part == 0.5


# ===========================================================================
# 3. Dataset Parsing and Schema Tests
# ===========================================================================

def test_benchmark_dataset_parsing(tmp_path: Path):
    """Verify BenchmarkDataset loading and JSON serialization."""
    item = BenchmarkItem(
        question_id="test_q1",
        repository_id="repo_abc",
        question="How does indexing work?",
        relevant_files=["src/index.py"],
        relevant_symbols=["Indexer.run"],
        relevance_grades={"src/index.py": 3},
        ground_truth_answer="Indexing scans files and upserts vectors.",
        expected_concepts=["scans", "upserts"],
    )
    dataset = BenchmarkDataset(
        name="Test Benchmark",
        version="1.0.0",
        repository_id="repo_abc",
        items=[item],
    )

    test_file = tmp_path / "dataset.json"
    dataset.to_file(test_file)

    loaded = BenchmarkDataset.from_file(test_file)
    assert loaded.name == "Test Benchmark"
    assert len(loaded.items) == 1
    assert loaded.items[0].question_id == "test_q1"
    assert loaded.items[0].is_file_relevant("src/index.py") is True
    assert loaded.items[0].is_file_relevant("src/other.py") is False


# ===========================================================================
# 4. Retrieval & Generation Evaluators with Mocks
# ===========================================================================

def test_retrieval_evaluator_vector_graph_hybrid():
    """Test RetrievalEvaluator running across vector, graph, and hybrid modes."""
    mock_retriever = MagicMock()

    item_auth = RetrievedItem(
        id="c1",
        repository_id="repo1",
        file_path="src/auth.py",
        symbol="login",
        content="def login(): pass",
        score=0.95,
        rank=1,
        provenance=RetrievalProvenance(sources=["vector", "graph"]),
    )

    mock_retriever.query.return_value = RetrievalResult(
        query="test",
        repository_id="repo1",
        items=[item_auth],
        total_results=1,
    )

    evaluator = RetrievalEvaluator(retriever=mock_retriever, default_k_values=[5, 10])

    dataset = BenchmarkDataset(
        name="Mock Dataset",
        version="1.0",
        repository_id="repo1",
        items=[
            BenchmarkItem(
                question_id="q1",
                repository_id="repo1",
                question="How does login work?",
                relevant_files=["src/auth.py"],
                relevant_symbols=["login"],
            )
        ],
    )

    report = evaluator.evaluate_dataset(dataset, strategies=["vector", "hybrid"], k_values=[5, 10])
    assert "vector" in report.strategies
    assert "hybrid" in report.strategies
    assert report.strategies["hybrid"].mean_metrics_by_k[5].precision > 0.0
    assert report.strategies["hybrid"].mean_metrics_by_k[5].hit_rate == 1.0


# ===========================================================================
# 5. Performance Latency Profiling Tests
# ===========================================================================

def test_latency_stats_calculation():
    """Verify LatencyStats computes accurate percentiles and averages."""
    samples = [10.0, 20.0, 30.0, 40.0, 50.0]
    stats = LatencyStats.from_samples(samples)

    assert stats.count == 5
    assert stats.mean_ms == 30.0
    assert stats.median_ms == 30.0
    assert stats.min_ms == 10.0
    assert stats.max_ms == 50.0
    assert stats.p95_ms == 50.0


# ===========================================================================
# 6. Evaluation Runner & Report Generation Tests
# ===========================================================================

def test_evaluation_runner_generates_json_and_markdown(tmp_path: Path):
    """Test full EvaluationRunner execution generating reports."""
    mock_retriever = MagicMock()
    mock_retriever.query.return_value = RetrievalResult(
        query="test query",
        repository_id="repo1",
        items=[
            RetrievedItem(
                id="c1",
                repository_id="repo1",
                file_path="src/service.py",
                symbol="process",
                content="def process(): return True",
                score=0.9,
                rank=1,
                provenance=RetrievalProvenance(sources=["vector"]),
            )
        ],
        total_results=1,
    )

    mock_rag_service = MagicMock()
    mock_rag_service.answer_query.return_value = RAGResponse(
        answer="The request is processed via process in [1].",
        sources=[
            RAGSourceItem(
                index=1,
                repository_id="repo1",
                file_path="src/service.py",
                symbol="process",
                snippet="def process(): return True",
                score=0.9,
                sources=["vector"],
            )
        ],
        retrieval_metadata=RAGMetadata(
            query="test query",
            repository_id="repo1",
            provider="mock",
            model="mock",
        ),
        is_insufficient_context=False,
        is_successful=True,
    )
    mock_rag_service.llm_service = MagicMock()
    mock_rag_service.llm_service.generate.return_value = MagicMock(content="Mock answer")

    dataset = BenchmarkDataset(
        name="Sample Benchmark",
        version="1.0.0",
        repository_id="repo1",
        items=[
            BenchmarkItem(
                question_id="q1",
                repository_id="repo1",
                question="How does process work?",
                relevant_files=["src/service.py"],
                expected_concepts=["processed"],
            )
        ],
    )

    runner = EvaluationRunner(
        retriever=mock_retriever,
        rag_service=mock_rag_service,
        output_dir=tmp_path,
    )

    artifact = runner.run_all(
        dataset=dataset,
        strategies=["vector", "hybrid"],
        k_values=[5, 10],
        experiment_id="test_exp_123",
    )

    assert artifact.config.experiment_id == "test_exp_123"
    assert artifact.retrieval is not None
    assert artifact.generation is not None
    assert artifact.performance is not None

    # Verify JSON file created
    json_file = tmp_path / "eval_results_test_exp_123.json"
    assert json_file.exists()
    with json_file.open("r", encoding="utf-8") as f:
        data = json.load(f)
        assert data["config"]["experiment_id"] == "test_exp_123"

    # Verify Markdown file created
    md_file = tmp_path / "eval_report_test_exp_123.md"
    assert md_file.exists()
    content = md_file.read_text(encoding="utf-8")
    assert "CodeSpecAI RAG Evaluation & Benchmarking Report" in content
    assert "Precision@K" in content
    assert "Faithfulness" in content
