# CodeSpecAI RAG Evaluation & Benchmarking Report

**Experiment ID:** `exp_8ce3ef3d`  
**Timestamp:** `2026-09-23T17:22:11.657060+00:00`  
**Target Repository:** `test-repo`  
**Benchmark Dataset:** `CodeSpecAI Benchmark Suite` (v1.0.0)  
**LLM Provider/Model:** `mock` / `gpt-4o-mini`  
**Embedding / Vector Store:** `mock` / `in_memory`  

---

## 1. Retrieval Quality Benchmarks

| Strategy | Cutoff K | Precision@K | Recall@K | Hit Rate@K | MRR@K | NDCG@K |
|---|---|---|---|---|---|---|
| **VECTOR** | K=5 | 0.1600 | 0.5500 | 0.6000 | 0.2000 | 0.0861 |
| **VECTOR** | K=10 | 0.1200 | 0.8000 | 0.8000 | 0.2333 | 0.1574 |
| **HYBRID** | K=5 | 0.1600 | 0.5500 | 0.6000 | 0.2000 | 0.0861 |
| **HYBRID** | K=10 | 0.1200 | 0.8000 | 0.8000 | 0.2333 | 0.1574 |

## 2. Generation Quality Benchmarks

| Metric | Macro-Average Score | Target Criteria |
|---|---|---|
| **Faithfulness / Groundedness** | `0.0000` | Zero hallucination; claims backed by context |
| **Answer Relevance** | `0.2000` | Direct answer to question intent |
| **Context Relevance** | `0.2000` | Signal-to-noise ratio in retrieved context |
| **Citation Correctness** | `0.5200` | Valid `[k]` tags pointing to relevant sources |
| **Answer Completeness** | `0.0000` | Coverage of key expected concepts/facts |
| **Overall Quality Score** | **`0.1840`** | Aggregate quality average |

## 3. Performance & Latency Benchmarks

| Pipeline Stage | Mean (ms) | Median / P50 (ms) | P95 (ms) | Min (ms) | Max (ms) |
|---|---|---|---|---|---|
| **Vector Retrieval** | 0.2 | 0.2 | 0.3 | 0.2 | 0.3 |
| **Graph Retrieval** | 0.1 | 0.1 | 0.2 | 0.1 | 0.2 |
| **Hybrid Retrieval (Fusion)** | 0.4 | 0.4 | 0.4 | 0.3 | 0.4 |
| **Context Construction** | 0.1 | 0.1 | 0.1 | 0.1 | 0.1 |
| **LLM Generation** | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| **Total End-to-End Query** | 0.5 | 0.5 | 0.6 | 0.4 | 0.6 |

## 4. Query-Level Evaluation Breakdown

### Query 1: `q1_auth_token`
**Question:** How does the AuthService validate user JWT tokens?  
**Answer:** Based on the provided codebase context [1], the implementation defines the requested functionality. Related components and dependencies are linked as described in [1].  
**Scores:** Faith: `0.00` | AnsRel: `0.20` | CtxRel: `0.33` | CitCor: `0.40` | Comp: `0.00`

### Query 2: `q2_db_connection`
**Question:** Where is the database connection pool initialized and managed?  
**Answer:** Based on the provided codebase context [1], the implementation defines the requested functionality. Related components and dependencies are linked as described in [1].  
**Scores:** Faith: `0.00` | AnsRel: `0.20` | CtxRel: `0.33` | CitCor: `0.40` | Comp: `0.00`

### Query 3: `q3_architecture_doc`
**Question:** What is the recommended deployment flow according to the architecture documentation?  
**Answer:** Based on the provided codebase context [1], the implementation defines the requested functionality. Related components and dependencies are linked as described in [1].  
**Scores:** Faith: `0.00` | AnsRel: `0.20` | CtxRel: `0.17` | CitCor: `0.40` | Comp: `0.00`

### Query 4: `q4_spec_pdf`
**Question:** What security compliance rules are outlined in the security specification PDF?  
**Answer:** Based on the provided codebase context [1], the implementation defines the requested functionality. Related components and dependencies are linked as described in [1].  
**Scores:** Faith: `0.00` | AnsRel: `0.20` | CtxRel: `0.17` | CitCor: `0.40` | Comp: `0.00`

### Query 5: `q5_insufficient_context`
**Question:** How does the QuantumPaymentProcessor process cryptocurrency microtransactions?  
**Answer:** Based on the provided codebase context [1], the implementation defines the requested functionality. Related components and dependencies are linked as described in [1].  
**Scores:** Faith: `0.00` | AnsRel: `0.20` | CtxRel: `0.00` | CitCor: `1.00` | Comp: `0.00`
