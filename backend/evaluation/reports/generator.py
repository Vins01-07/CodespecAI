"""
Report generation module for CodeSpecAI RAG evaluation.

Produces:
1. Machine-readable JSON results (reports/eval_results_<timestamp>.json & latest.json)
2. Human-readable Markdown reports (reports/eval_report_<timestamp>.md & latest.md)
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from pydantic import BaseModel, Field

from evaluation.generation.evaluator import FullGenerationReport
from evaluation.performance.benchmark import FullPerformanceReport
from evaluation.retrieval.evaluator import FullRetrievalReport


class ExperimentConfig(BaseModel):
    """
    Metadata recording experiment parameters for full reproducibility.
    """
    experiment_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    repository_id: str
    dataset_name: str
    dataset_version: str
    retrieval_strategies: list[str]
    k_values: list[int]
    llm_provider: str
    llm_model: str
    embedding_provider: str
    vector_store: str


class EvaluationRunArtifact(BaseModel):
    """
    Unified evaluation run combining experiment config, retrieval, generation, and performance.
    """
    config: ExperimentConfig
    retrieval: Optional[FullRetrievalReport] = None
    generation: Optional[FullGenerationReport] = None
    performance: Optional[FullPerformanceReport] = None


class ReportGenerator:
    """
    Generates and saves machine-readable JSON and human-readable Markdown reports.
    """

    def __init__(self, output_dir: str | Path | None = None) -> None:
        """
        Initialize report generator.

        Args:
            output_dir: Directory where reports will be saved (default: backend/evaluation/reports).
        """
        if output_dir:
            self.output_dir = Path(output_dir)
        else:
            self.output_dir = Path(__file__).resolve().parent
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def save_json(self, artifact: EvaluationRunArtifact, filename: Optional[str] = None) -> Path:
        """Save evaluation results to machine-readable JSON."""
        name = filename or f"eval_results_{artifact.config.experiment_id}.json"
        target_path = self.output_dir / name
        with target_path.open("w", encoding="utf-8") as f:
            json.dump(artifact.model_dump(), f, indent=2)

        # Also save as latest.json for convenience
        latest_path = self.output_dir / "latest.json"
        with latest_path.open("w", encoding="utf-8") as f:
            json.dump(artifact.model_dump(), f, indent=2)

        return target_path

    def generate_markdown(self, artifact: EvaluationRunArtifact) -> str:
        """Generate human-readable Markdown report."""
        cfg = artifact.config
        lines = [
            f"# CodeSpecAI RAG Evaluation & Benchmarking Report",
            f"",
            f"**Experiment ID:** `{cfg.experiment_id}`  ",
            f"**Timestamp:** `{cfg.timestamp}`  ",
            f"**Target Repository:** `{cfg.repository_id}`  ",
            f"**Benchmark Dataset:** `{cfg.dataset_name}` (v{cfg.dataset_version})  ",
            f"**LLM Provider/Model:** `{cfg.llm_provider}` / `{cfg.llm_model}`  ",
            f"**Embedding / Vector Store:** `{cfg.embedding_provider}` / `{cfg.vector_store}`  ",
            f"",
            f"---",
            f"",
        ]

        # 1. Retrieval Quality Table
        if artifact.retrieval:
            lines.append("## 1. Retrieval Quality Benchmarks")
            lines.append("")
            lines.append("| Strategy | Cutoff K | Precision@K | Recall@K | Hit Rate@K | MRR@K | NDCG@K |")
            lines.append("|---|---|---|---|---|---|---|")
            for strat_name, strat_summary in artifact.retrieval.strategies.items():
                for k, metrics in strat_summary.mean_metrics_by_k.items():
                    lines.append(
                        f"| **{strat_name.upper()}** | K={k} | "
                        f"{metrics.precision:.4f} | {metrics.recall:.4f} | "
                        f"{metrics.hit_rate:.4f} | {metrics.mrr:.4f} | {metrics.ndcg:.4f} |"
                    )
            lines.append("")

        # 2. Generation Quality Table
        if artifact.generation:
            lines.append("## 2. Generation Quality Benchmarks")
            lines.append("")
            lines.append("| Metric | Macro-Average Score | Target Criteria |")
            lines.append("|---|---|---|")
            lines.append(f"| **Faithfulness / Groundedness** | `{artifact.generation.mean_faithfulness:.4f}` | Zero hallucination; claims backed by context |")
            lines.append(f"| **Answer Relevance** | `{artifact.generation.mean_answer_relevance:.4f}` | Direct answer to question intent |")
            lines.append(f"| **Context Relevance** | `{artifact.generation.mean_context_relevance:.4f}` | Signal-to-noise ratio in retrieved context |")
            lines.append(f"| **Citation Correctness** | `{artifact.generation.mean_citation_correctness:.4f}` | Valid `[k]` tags pointing to relevant sources |")
            lines.append(f"| **Answer Completeness** | `{artifact.generation.mean_answer_completeness:.4f}` | Coverage of key expected concepts/facts |")
            lines.append(f"| **Overall Quality Score** | **`{artifact.generation.mean_overall_score:.4f}`** | Aggregate quality average |")
            lines.append("")

        # 3. Performance Latency Profiling Table
        if artifact.performance:
            perf = artifact.performance
            lines.append("## 3. Performance & Latency Benchmarks")
            lines.append("")
            lines.append("| Pipeline Stage | Mean (ms) | Median / P50 (ms) | P95 (ms) | Min (ms) | Max (ms) |")
            lines.append("|---|---|---|---|---|---|")
            for name, stats in [
                ("Vector Retrieval", perf.vector_retrieval_stats),
                ("Graph Retrieval", perf.graph_retrieval_stats),
                ("Hybrid Retrieval (Fusion)", perf.hybrid_retrieval_stats),
                ("Context Construction", perf.context_construction_stats),
                ("LLM Generation", perf.llm_generation_stats),
                ("Total End-to-End Query", perf.total_query_stats),
            ]:
                lines.append(
                    f"| **{name}** | {stats.mean_ms:.1f} | {stats.median_ms:.1f} | "
                    f"{stats.p95_ms:.1f} | {stats.min_ms:.1f} | {stats.max_ms:.1f} |"
                )
            lines.append("")

        # 4. Detailed Query Breakdowns
        if artifact.generation and artifact.generation.evaluations:
            lines.append("## 4. Query-Level Evaluation Breakdown")
            lines.append("")
            for idx, qe in enumerate(artifact.generation.evaluations, 1):
                lines.append(f"### Query {idx}: `{qe.question_id}`")
                lines.append(f"**Question:** {qe.question}  ")
                lines.append(f"**Answer:** {qe.answer}  ")
                lines.append(
                    f"**Scores:** Faith: `{qe.metrics.faithfulness:.2f}` | "
                    f"AnsRel: `{qe.metrics.answer_relevance:.2f}` | "
                    f"CtxRel: `{qe.metrics.context_relevance:.2f}` | "
                    f"CitCor: `{qe.metrics.citation_correctness:.2f}` | "
                    f"Comp: `{qe.metrics.answer_completeness:.2f}`"
                )
                lines.append("")

        return "\n".join(lines)

    def save_markdown(self, artifact: EvaluationRunArtifact, filename: Optional[str] = None) -> Path:
        """Save human-readable Markdown evaluation report."""
        md_text = self.generate_markdown(artifact)
        name = filename or f"eval_report_{artifact.config.experiment_id}.md"
        target_path = self.output_dir / name
        with target_path.open("w", encoding="utf-8") as f:
            f.write(md_text)

        # Also save as latest.md
        latest_path = self.output_dir / "latest.md"
        with latest_path.open("w", encoding="utf-8") as f:
            f.write(md_text)

        return target_path
