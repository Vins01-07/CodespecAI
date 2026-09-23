# CodeSpecAI RAG Evaluation & Benchmarking Subsystem

This subsystem provides a reproducible, offline evaluation framework for CodeSpecAI's RAG pipeline. It measures retrieval quality, generation groundedness, citation correctness, and end-to-end execution performance without modifying production services.

---

## 1. Architecture Overview

```
backend/
├── app/                        # Production application (UNCHANGED)
└── evaluation/                 # Standalone evaluation subsystem
    ├── datasets/
    │   ├── models.py           # BenchmarkItem & BenchmarkDataset schemas
    │   └── sample_benchmark.json # Realistic ground-truth benchmark suite
    ├── retrieval/
    │   ├── metrics.py          # Precision@K, Recall@K, HitRate@K, MRR@K, NDCG@K
    │   └── evaluator.py        # Evaluates Vector, Graph, and Hybrid retrieval
    ├── generation/
    │   ├── metrics.py          # Faithfulness, Relevance, Citation, Completeness
    │   └── evaluator.py        # End-to-end answer quality evaluation
    ├── performance/
    │   └── benchmark.py        # Latency profiling for every pipeline stage
    ├── reports/
    │   ├── generator.py        # JSON and Markdown artifact generation
    │   ├── latest.json         # Latest machine-readable run artifact
    │   └── latest.md           # Latest human-readable summary
    ├── runner.py               # CLI and programmatic evaluation coordinator
    └── README.md               # Reproducibility documentation (this file)
```

---

## 2. Benchmark Dataset Schema

Benchmark datasets are stored as JSON files conforming to [`BenchmarkDataset`](datasets/models.py):

```json
{
  "name": "CodeSpecAI Benchmark Suite",
  "version": "1.0.0",
  "repository_id": "test-repo",
  "items": [
    {
      "question_id": "q1_auth_token",
      "repository_id": "test-repo",
      "question": "How does the AuthService validate user JWT tokens?",
      "relevant_files": [
        "src/auth/service.py",
        "src/auth/token_util.py"
      ],
      "relevant_symbols": [
        "AuthService.validate_token",
        "decode_jwt"
      ],
      "relevant_sections": [],
      "relevant_pages": [],
      "relevance_grades": {
        "src/auth/service.py": 3,
        "src/auth/token_util.py": 2
      },
      "ground_truth_answer": "AuthService.validate_token decodes the JWT using decode_jwt...",
      "expected_concepts": [
        "validate_token",
        "JWT",
        "expiration"
      ]
    }
  ]
}
```

### Fields:
- `question_id`: Unique identifier for tracking query outcomes.
- `repository_id`: Repository scope ensuring isolation.
- `question`: User query string.
- `relevant_files`: List of files that contain ground-truth context.
- `relevant_symbols`: Target functions/classes/methods.
- `relevant_sections`: Documentation headings for Markdown docs.
- `relevant_pages`: PDF page numbers for specification documents.
- `relevance_grades`: Optional integer weights (e.g. 1 to 3) for graded NDCG calculations.
- `ground_truth_answer`: Optional gold standard reference text.
- `expected_concepts`: List of key entities/terms that must appear in the answer.

---

## 3. Metrics & Mathematical Definitions

### A. Retrieval Quality Metrics
Evaluated independently across **Vector Retrieval**, **Graph Retrieval**, and **Hybrid Retrieval** at configurable cutoffs (default: $K \in \{5, 10\}$):

1. **Precision@K**:
   $$\text{Precision@K} = \frac{|\{t \in T_K : t \in R\}|}{K}$$
   Fraction of top-$K$ retrieved items that are ground-truth relevant.

2. **Recall@K**:
   $$\text{Recall@K} = \frac{|\{t \in T_K : t \in R\}|}{|R|}$$
   Fraction of all ground-truth relevant items captured within the top-$K$.

3. **Hit Rate@K**:
   $$\text{Hit Rate@K} = \mathbb{I}(\exists t \in T_K \text{ s.t. } t \in R)$$
   Returns `1.0` if at least one relevant item appears in the top-$K$, else `0.0`.

4. **Mean Reciprocal Rank (MRR@K)**:
   $$\text{RR@K} = \frac{1}{\text{rank of first relevant item in } T_K} \quad (\text{or } 0.0 \text{ if no hit})$$

5. **Normalized Discounted Cumulative Gain (NDCG@K)**:
   $$\text{DCG@K} = \sum_{i=1}^K \frac{2^{rel_i} - 1}{\log_2(i + 1)}, \quad \text{NDCG@K} = \frac{\text{DCG@K}}{\text{IDCG@K}}$$
   Measures ranking quality with position-discounted rewards for highly graded items.

---

### B. Generation Quality Metrics
Measures answer grounding, intent satisfaction, and citation precision:

1. **Faithfulness / Groundedness** (`[0.0, 1.0]`):
   Measures the proportion of factual statements in the answer supported by retrieved repository context. Detects hallucinations. If the model correctly states `"INSUFFICIENT CONTEXT"`, it receives full credit (`1.0`).

2. **Answer Relevance** (`[0.0, 1.0]`):
   Measures how directly the response addresses the user query intent and keywords.

3. **Context Relevance** (`[0.0, 1.0]`):
   Measures the signal-to-noise ratio in retrieved snippets (proportion of retrieved context chunks that are relevant to the query).

4. **Citation Correctness** (`[0.0, 1.0]`):
   Checks that:
   - Bracket citation tags `[1]`, `[2]` correspond to valid source indices.
   - The cited source items point to ground-truth relevant files or symbols.

5. **Answer Completeness** (`[0.0, 1.0]`):
   Measures the coverage of expected concepts and facts defined in ground truth.

---

### C. Performance & Latency Benchmarks
Profiles latency distributions (Mean, Median/P50, P95, Min, Max in milliseconds) across:
- **Vector Retrieval Latency**
- **Graph Retrieval Latency**
- **Hybrid Retrieval Latency** (vector + graph + rank fusion)
- **Context Construction Latency** (deduplication, provenance formatting, budget truncation)
- **LLM Generation Latency**
- **Total End-to-End Latency**

---

## 4. Running Benchmarks

### From CLI:
Run the complete evaluation suite using the sample benchmark dataset:
```bash
python -m evaluation.runner --dataset evaluation/datasets/sample_benchmark.json --k 5 10
```

### Options:
- `--dataset <path>`: Path to benchmark JSON file (default: `evaluation/datasets/sample_benchmark.json`).
- `--k <int ...>`: List of cutoffs to evaluate (e.g. `--k 3 5 10 20`).
- `--strategies <str ...>`: Retrieval modes to evaluate (e.g. `--strategies vector graph hybrid`).
- `--out <dir>`: Custom directory for output reports (default: `evaluation/reports/`).

### Programmatic Usage:
```python
from evaluation.datasets import BenchmarkDataset
from evaluation.runner import EvaluationRunner

dataset = BenchmarkDataset.from_file("evaluation/datasets/sample_benchmark.json")
runner = EvaluationRunner()
artifact = runner.run_all(dataset=dataset, k_values=[5, 10])

# Inspect reports
print(f"Overall Quality: {artifact.generation.mean_overall_score}")
print(f"Hybrid NDCG@10: {artifact.retrieval.strategies['hybrid'].mean_metrics_by_k[10].ndcg}")
```

---

## 5. Output Reports

Every run automatically writes:
1. **Machine-readable JSON**: `evaluation/reports/eval_results_<exp_id>.json` and `latest.json`
2. **Human-readable Markdown**: `evaluation/reports/eval_report_<exp_id>.md` and `latest.md`

All experiment configurations (timestamp, dataset version, provider, model, K cutoffs) are stored in the artifact for full reproducibility.
