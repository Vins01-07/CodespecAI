# ⚡ CodeSpec AI

### **AI-Powered Software Architecture Intelligence**

<p align="center">

**Understand. Visualize. Query. Analyze.**

Turn any software repository into a **machine-readable architecture map** using AST parsing, dependency graphs, RAG, and LLMs.

<br/>

![Status](https://img.shields.io/badge/STATUS-IN%20DEVELOPMENT-8A2BE2?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge)
![Tree-sitter](https://img.shields.io/badge/Tree--sitter-F97316?style=for-the-badge)
![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge)
![AI](https://img.shields.io/badge/LLM%20%2B%20RAG-7C3AED?style=for-the-badge)

</p>

---

## 🧠 What is CodeSpec AI?

Large codebases are difficult to understand.

CodeSpec AI analyzes a repository and transforms:

```text
SOURCE CODE
     ↓
AST PARSING
     ↓
DEPENDENCY GRAPH
     ↓
REPOSITORY CONTEXT
     ↓
AI INTELLIGENCE
```

So developers can understand **how a system is structured, how components are connected, and what may be affected by a change.**

---

## 🔥 What It Does

| Capability                 | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| 🌳 **AST Parsing**         | Extract classes, functions, imports & structure |
| 🔗 **Dependency Analysis** | Discover relationships between components       |
| 🕸️ **Knowledge Graph**    | Represent architecture using Neo4j              |
| 💥 **Impact Analysis**     | Trace potentially affected components           |
| 🔍 **RAG**                 | Retrieve relevant repository context            |
| 🤖 **LLM Intelligence**    | Explain architecture in natural language        |
| 📚 **Documentation**       | Generate technical explanations                 |
| 📊 **Visualization**       | Explore architecture interactively              |

---

## 🏗️ Architecture

```text
              Git Repository
                    │
                    ▼
            ┌───────────────┐
            │   Ingestion   │
            └───────┬───────┘
                    ▼
            ┌───────────────┐
            │ Tree-sitter   │
            │     AST       │
            └───────┬───────┘
                    ▼
          ┌───────────────────┐
          │ Structure +       │
          │ Relationships     │
          └─────────┬─────────┘
                    ▼
            ┌───────────────┐
            │     Neo4j     │
            │ Knowledge Graph│
            └───────┬───────┘
                    ▼
             ┌────────────┐
             │ RAG + LLM  │
             └─────┬──────┘
                   ▼
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   Impact       AI Query    Documentation
   Analysis
```

---

## 🌳 AST → Architecture

Instead of treating code as plain text, CodeSpec AI extracts structured information.

```python
class UserService:

    def create_user(self, user):
        return repository.save(user)
```

Becomes:

```text
UserService
    │
    └── create_user()
            │
            └── repository.save()
```

The parser layer is designed around a **common abstraction**, allowing different programming languages to share the same analysis pipeline.

---

## 🕸️ Knowledge Graph

Code relationships become traversable graph relationships:

```text
UserRouter
     │
   CALLS
     ▼
UserService
     │
   CALLS
     ▼
UserRepository
     │
  ACCESSES
     ▼
 Database
```

Example relationships:

```text
CONTAINS
IMPORTS
CALLS
DEPENDS_ON
REFERENCES
EXTENDS
IMPLEMENTS
```

---

## 💥 Impact Analysis

One of the core goals:

> **"If I change this component, what else could be affected?"**

```text
          UserService
               │
        ┌──────┴──────┐
        ▼             ▼
   UserRouter     AuthService
        │             │
        └──────┬──────┘
               ▼
          API / Auth
             Flow
```

The graph provides the dependency paths; the AI layer can then explain the potential impact.

---

## 🤖 RAG + LLM

CodeSpec AI follows a **deterministic → intelligent** approach.

```text
AST + Graph + Repository
          ↓
   Context Retrieval
          ↓
         RAG
          ↓
         LLM
          ↓
Architecture Intelligence
```

This enables repository-aware questions such as:

```text
💬 How does authentication work?

💬 What depends on UserService?

💬 Where is database access handled?

💬 Explain the backend architecture.

💬 What could be affected by changing this file?
```

---

## ⚙️ Tech Stack

```text
Frontend       → React
Backend        → FastAPI
Parsing        → Tree-sitter
Graph          → Neo4j
AI             → LLM + RAG
Repository     → Git / GitPython
Workers        → Celery
Queue          → Redis
API            → REST
Infrastructure → Docker
```

---

## 📁 Project Structure

```text
codespec-ai/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ingestion/
│   │   ├── parser/
│   │   ├── graph/
│   │   ├── analysis/
│   │   └── ai/
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   └── src/
│
└── README.md
```

---

## 🚧 Development Status

### Module 1 — Repository Intelligence

**✅ Complete**

* Repository ingestion
* File discovery
* Tree-sitter integration
* Parser architecture
* Structural extraction
* Dependency extraction
* Neo4j infrastructure
* Celery + Redis
* FastAPI foundation
* Docker-compatible infrastructure

### Module 2 — Impact & AI Intelligence

**🚧 In Progress**

* Graph traversal
* Impact analysis
* Qdrant
* Embeddings
* Repository-aware RAG
* LLM integration

### Coming Next

```text
Graph Analysis
      ↓
Embeddings
      ↓
RAG
      ↓
LLM Reasoning
      ↓
Architecture Intelligence
```

---

## 🧪 Validation

The ingestion pipeline has been tested against a real repository containing:

**79+ supported source files**

```text
Repository
    ↓
79+ Files
    ↓
AST Parsing
    ↓
Entities
    ↓
Relationships
    ↓
Architecture Knowledge
```

---

## 💡 Why CodeSpec AI?

Traditional workflow:

```text
Search → Read → Trace → Guess → Document
```

CodeSpec AI:

```text
Repository
    ↓
Parse
    ↓
Graph
    ↓
Retrieve
    ↓
Understand
```

The key principle is simple:

> **Don't ask an LLM to understand the entire codebase blindly.**
>
> First build structured evidence. Then use AI to reason over the relevant context.

---

## 🛣️ Roadmap

* [x] Repository ingestion
* [x] AST parsing foundation
* [x] Multi-language parser architecture
* [x] Neo4j graph infrastructure
* [x] Background processing
* [ ] Graph-based impact analysis
* [ ] Qdrant + embeddings
* [ ] Repository-aware RAG
* [ ] LLM architecture explanations
* [ ] Automatic documentation
* [ ] Interactive dependency visualization
* [ ] GitHub PR analysis
* [ ] CI/CD integration

---

## 🎯 Vision

CodeSpec AI is being built as a **Software Architecture Intelligence Layer** between developers and their codebases.

```text
        SOURCE CODE
             ↓
        CodeSpec AI
             ↓
    Architecture Knowledge
             ↓
     Developer Insights
```

### ⚡ Understand the Codebase. Understand the Impact.
