# ⚡ CodeSpec AI

### **AI-Powered Software Architecture Intelligence**

<p align="center">

**Understand. Visualize. Query. Predict.**

Turn any software repository into a **machine-readable architecture map** using AST parsing, dependency graphs, RAG, and LLMs.

<br/>

![Status](https://img.shields.io/badge/STATUS-IN_DEVELOPMENT-8A2BE2?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-LLM%20%2B%20RAG-7C3AED?style=for-the-badge)
![Backend](https://img.shields.io/badge/BACKEND-FastAPI-009688?style=for-the-badge)
![Parsing](https://img.shields.io/badge/PARSING-Tree--sitter-F97316?style=for-the-badge)
![Graph](https://img.shields.io/badge/GRAPH-Neo4j-008CC1?style=for-the-badge)
![Frontend](https://img.shields.io/badge/FRONTEND-React-61DAFB?style=for-the-badge)

</p>

---

## 🧠 What is CodeSpec AI?

Large codebases are difficult to understand.

A developer joins an unfamiliar project and immediately faces questions like:

> **"Where does this function get used?"**
> **"What breaks if I change this file?"**
> **"How does authentication flow through the system?"**
> **"Which modules depend on this service?"**

CodeSpec AI is designed to answer these questions by transforming a repository from **raw source code → structured architecture → searchable intelligence**.

```text
                 ┌─────────────────────┐
                 │    SOURCE CODE      │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │   TREE-SITTER AST   │
                 └──────────┬──────────┘
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
       STRUCTURE                     RELATIONSHIPS
              ↓                           ↓
       Files / Classes              Imports / Calls
       Functions / Modules           Dependencies
              └─────────────┬─────────────┘
                            ↓
                 ┌─────────────────────┐
                 │    NEO4J GRAPH      │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │     RAG + LLM       │
                 └──────────┬──────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   IMPACT ANALYSIS     AI EXPLANATIONS     DOCUMENTATION
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                 ┌─────────────────────┐
                 │   REACT DASHBOARD   │
                 └─────────────────────┘
```

---

# 🚀 The Core Idea

Traditional tools often make developers **search through code**.

CodeSpec AI aims to make the codebase **understandable as a system**.

### From this:

```text
100s / 1000s of files
        ↓
Manual searching
        ↓
Manual dependency tracing
        ↓
Manual architecture reconstruction
```

### To this:

```text
Repository
    ↓
CodeSpec AI
    ↓
Architecture Knowledge Graph
    ↓
AI-powered reasoning
    ↓
Actionable developer insights
```

---

# 🔥 What CodeSpec AI Can Do

| Capability                     | What it does                                          |
| ------------------------------ | ----------------------------------------------------- |
| 📦 **Repository Intelligence** | Ingest and understand complete repositories           |
| 🌳 **AST Parsing**             | Extract code structure using Tree-sitter              |
| 🔗 **Dependency Mapping**      | Discover imports, calls, references and relationships |
| 🕸️ **Architecture Graph**     | Represent the codebase using Neo4j                    |
| 💥 **Impact Analysis**         | Identify potentially affected components              |
| 🤖 **AI Understanding**        | Explain architecture using LLMs                       |
| 🔍 **RAG Querying**            | Answer questions using repository-specific context    |
| 📚 **Documentation**           | Generate technical explanations automatically         |
| 📊 **Visualization**           | Explore architecture through an interactive dashboard |

---

# 🏗️ How It Works

CodeSpec AI follows a **deterministic → intelligent** architecture.

```text
              ┌──────────────────┐
              │   Git Repository  │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ Repository       │
              │ Ingestion        │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ Tree-sitter      │
              │ Parsing          │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ Code Structure   │
              │ Extraction       │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ Dependency       │
              │ Extraction       │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ Neo4j Knowledge  │
              │ Graph            │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ Context          │
              │ Retrieval        │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ RAG + LLM        │
              └────────┬─────────┘
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   Impact Analysis   AI Query      Documentation
        │              │              │
        └──────────────┼──────────────┘
                       ↓
              ┌──────────────────┐
              │ React Dashboard  │
              └──────────────────┘
```

---

# 🌳 01 — Repository Intelligence

The first step is turning a repository into something the system can process.

### Pipeline

```text
Git URL / Repository
        ↓
Clone / Extract
        ↓
File Discovery
        ↓
Language Detection
        ↓
Supported Source Files
```

The ingestion layer handles:

* Git repository fetching
* Repository validation
* File discovery
* Language identification
* Unsupported-file filtering
* Workspace preparation

---

# 🌲 02 — AST-Based Code Understanding

Instead of treating source code as plain text, CodeSpec AI uses **Tree-sitter** to understand its syntax structure.

Example:

```python
class UserService:

    def create_user(self, user):
        return repository.save(user)
```

Instead of simply seeing text, CodeSpec AI can represent it as:

```text
Class
└── UserService
    └── Function
        └── create_user()
            └── Call
                └── repository.save()
```

This provides structured information for downstream analysis.

---

# 🧩 03 — Unified Parser Architecture

CodeSpec AI uses a common parser abstraction.

```text
                 Base Parser
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
     Python       JavaScript       Java
     Parser         Parser        Parser
        │             │             │
        └─────────────┼─────────────┘
                      ↓
             Common Code Model
```

Each parser can extract:

```text
📄 Files
📦 Modules
🏛 Classes
⚙ Functions
📥 Imports
📞 Function Calls
🔗 References
🧬 Relationships
```

The architecture is designed so new language parsers can be added without rebuilding the entire system.

---

# 🕸️ 04 — Dependency Knowledge Graph

This is where CodeSpec AI moves beyond simple code search.

Relationships become a **software knowledge graph**.

Example:

```text
┌──────────────┐
│ User Router  │
└──────┬───────┘
       │ CALLS
       ↓
┌──────────────┐
│ User Service │
└──────┬───────┘
       │ CALLS
       ↓
┌────────────────┐
│ User Repository│
└───────┬────────┘
        │ ACCESSES
        ↓
┌──────────────┐
│   Database   │
└──────────────┘
```

### Relationships

```text
CONTAINS
IMPORTS
CALLS
DEPENDS_ON
REFERENCES
EXTENDS
IMPLEMENTS
```

Stored and queried through **Neo4j**.

---

# 💥 05 — Change Impact Analysis

One of the key goals of CodeSpec AI:

> **"If I change this component, what else could be affected?"**

Example:

```text
          MODIFY
            │
            ↓
    UserService.py
            │
      ┌─────┴─────┐
      ↓           ↓
 UserRouter   AuthService
      │           │
      └─────┬─────┘
            ↓
      API / Auth Flow
```

The graph can be traversed to identify:

```text
Changed Component
       ↓
Direct Dependents
       ↓
Indirect Dependents
       ↓
Potential Impact Zone
```

The AI layer can then explain **why those components may be affected**.

> Impact analysis is intended as developer assistance; results should be validated against the actual code and tests.

---

# 🤖 06 — RAG + LLM Intelligence

Static analysis tells us:

> **What exists?**

AI helps answer:

> **What does it mean?**

CodeSpec AI combines:

```text
Source Code
     +
AST Metadata
     +
Dependency Graph
     +
Repository Context
     ↓
   Retrieval
     ↓
     RAG
     ↓
    LLM
     ↓
Architecture Intelligence
```

This allows repository-aware questions such as:

```text
💬 "How does authentication work?"

💬 "What happens when a user registers?"

💬 "What depends on UserService?"

💬 "Where is database access handled?"

💬 "Which components could be affected by this change?"

💬 "Explain the backend architecture."
```

---

# 📚 07 — Automatic Documentation

CodeSpec AI can transform extracted repository knowledge into technical documentation.

### File Level

```text
Purpose
Responsibilities
Dependencies
Exports
```

### Class Level

```text
Purpose
Methods
Relationships
Dependencies
```

### Function Level

```text
Purpose
Parameters
Return Value
Calls
Dependencies
```

### Architecture Level

```text
Components
Data Flow
Dependencies
System Boundaries
```

---

# 🎨 08 — Architecture Visualization

The dependency graph can be converted into an interactive architecture view.

```text
                 ┌──────────────┐
                 │   Frontend   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ API Router   │
                 └──────┬───────┘
                        ↓
             ┌──────────┴──────────┐
             ↓                     ↓
      ┌─────────────┐       ┌─────────────┐
      │   Service   │       │ Auth Layer  │
      └──────┬──────┘       └──────┬──────┘
             │                     │
             └──────────┬──────────┘
                        ↓
                 ┌──────────────┐
                 │   Database   │
                 └──────────────┘
```

The objective is simple:

**See the architecture without manually reading the entire repository.**

---

# ⚙️ Tech Stack

| Layer              | Technology        |
| ------------------ | ----------------- |
| 🎨 Frontend        | React             |
| ⚡ Backend          | FastAPI           |
| 🌳 Parsing         | Tree-sitter       |
| 🕸️ Graph          | Neo4j             |
| 🤖 AI              | LLM + RAG         |
| 📦 Repository      | Git / GitPython   |
| 🔄 Workers         | Celery            |
| ⚡ Queue / Cache    | Redis             |
| 🔌 API             | REST              |
| 🐳 Infrastructure  | Docker-compatible |
| 🌐 Version Control | GitHub            |

---

# 🧱 Architecture Layers

```text
┌────────────────────────────────────────────┐
│              React Dashboard               │
├────────────────────────────────────────────┤
│                 FastAPI                    │
├────────────────────────────────────────────┤
│          Analysis & AI Services            │
├────────────────────────────────────────────┤
│       RAG / Context Retrieval Layer        │
├────────────────────────────────────────────┤
│          Neo4j Knowledge Graph             │
├────────────────────────────────────────────┤
│       Dependency & Entity Extraction       │
├────────────────────────────────────────────┤
│           Tree-sitter Parsers              │
├────────────────────────────────────────────┤
│         Repository Ingestion               │
└────────────────────────────────────────────┘
```

---

# 📁 Project Structure

```text
codespec-ai/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── config/
│   │   ├── ingestion/
│   │   ├── parsers/
│   │   │   ├── base.py
│   │   │   ├── python_parser.py
│   │   │   ├── javascript_parser.py
│   │   │   └── ...
│   │   ├── graph/
│   │   ├── analysis/
│   │   ├── ai/
│   │   └── services/
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md
```

---

# 🔄 End-to-End Flow

```text
01  Repository
        ↓
02  Ingestion
        ↓
03  File Discovery
        ↓
04  Tree-sitter Parsing
        ↓
05  Entity Extraction
        ↓
06  Relationship Extraction
        ↓
07  Neo4j Graph
        ↓
08  Context Retrieval
        ↓
09  RAG
        ↓
10  LLM Reasoning
        ↓
11  Impact / Docs / Architecture
        ↓
12  React Dashboard
```

---

# 📊 Current Development Status

### 🟢 Module 1 — Repository Intelligence

```text
████████████████████████████  COMPLETE
```

Implemented foundation:

* Repository ingestion
* File discovery
* Tree-sitter integration
* Base parser architecture
* Language-specific parser architecture
* Structural extraction
* Dependency extraction
* Background processing architecture
* FastAPI backend foundation
* Neo4j graph infrastructure
* Celery + Redis infrastructure
* Docker-compatible infrastructure

### 🟡 Module 2 — AI & Impact Intelligence

```text
████████░░░░░░░░░░░░░░░░░░░░  IN PROGRESS
```

Planned / upcoming:

* Graph-based impact analysis
* Vector embeddings
* Qdrant integration
* Repository-aware RAG
* LLM reasoning
* AI architecture explanations
* Documentation generation

---

# 🧪 Repository Test

CodeSpec AI has been tested against a real software repository containing:

```text
79+
Supported Source Files
```

The ingestion and parsing pipeline processes the repository to extract its structural information and relationships.

```text
Repository
    ↓
79+ Source Files
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

# 🆚 The Problem → The Approach

| Traditional Workflow           | CodeSpec AI                    |
| ------------------------------ | ------------------------------ |
| 🔎 Search files manually       | 🌳 Parse code structurally     |
| 📖 Read hundreds of files      | 🧠 Build repository context    |
| 🔗 Trace dependencies manually | 🕸️ Graph relationships        |
| 🤔 Guess change impact         | 💥 Analyze dependency paths    |
| 📝 Write docs manually         | 🤖 AI-assisted documentation   |
| 🗺️ Draw architecture manually | 📊 Generate architecture views |
| 💬 Generic AI questions        | 🔍 Repository-aware answers    |

---

# 💡 Why This Architecture?

### Tree-sitter

Provides syntax-aware structural extraction instead of relying primarily on regex or text matching.

### Neo4j

Software systems are highly relational.

```text
A → CALLS → B
B → DEPENDS_ON → C
C → IMPORTS → D
```

Graphs make these relationships explicit and traversable.

### RAG

The LLM should not blindly reason about an entire repository.

Instead:

```text
Question
   ↓
Retrieve relevant context
   ↓
Small, focused context
   ↓
LLM
```

This keeps the AI layer focused on the repository information relevant to the question.

### Hybrid Intelligence

```text
DETERMINISTIC                 AI
──────────────                ──────────────
Parsing                       Explanation
AST Extraction                Reasoning
Dependencies                  Documentation
Graph Construction            Natural Language
Repository Structure          Architecture Summary
```

**CodeSpec AI does not ask an LLM to do everything.**

It combines deterministic software analysis with AI reasoning.

---

# 🚀 Scalability Vision

The architecture is designed so computationally expensive tasks can be processed asynchronously.

```text
                 Load Balancer
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
      API Servers            Worker Pool
                                  │
                           ┌──────┴──────┐
                           ↓             ↓
                       Parser        AI Workers
                       Workers           │
                           │             ↓
                           ↓            LLM
                         Neo4j           │
                                         ↓
                                       RAG
```

Future scaling strategies include:

* Asynchronous repository analysis
* Celery worker scaling
* Incremental analysis
* Repository caching
* Graph optimization
* Distributed analysis jobs
* CI/CD integration
* Pull-request analysis

---

# 💰 Cost-Aware AI Architecture

CodeSpec AI separates deterministic processing from AI processing.

```text
             Repository
                  ↓
          Deterministic Layer
                  ↓
       ┌──────────┴──────────┐
       ↓                     ↓
     Parser                Graph
       │                     │
       └──────────┬──────────┘
                  ↓
            Context Retrieval
                  ↓
                 RAG
                  ↓
                 LLM
```

Instead of repeatedly sending an entire repository to an LLM, the system can retrieve **only the context required for a particular task**.

---

# 🛣️ Roadmap

```text
MODULE 1
Repository Intelligence
████████████████████████████  ✅

MODULE 2
Graph + Impact Intelligence
████████████░░░░░░░░░░░░░░░  🚧

MODULE 3
RAG + LLM Intelligence
████░░░░░░░░░░░░░░░░░░░░░░░  🔜

MODULE 4
Developer Intelligence Platform
░░░░░░░░░░░░░░░░░░░░░░░░░░  🔮
```

### Next Milestones

* [ ] Extended graph relationships
* [ ] Graph traversal engine
* [ ] Change impact engine
* [ ] Qdrant vector database
* [ ] Embedding pipeline
* [ ] Repository-aware RAG
* [ ] LLM integration
* [ ] AI architecture explanations
* [ ] Automatic documentation
* [ ] Interactive dependency visualization
* [ ] GitHub PR analysis
* [ ] CI/CD integration
* [ ] Incremental repository analysis

---

# 🎯 The Vision

CodeSpec AI is being built toward a **Software Architecture Intelligence Layer** between developers and their codebases.

```text
                    SOURCE CODE
                         │
                         ↓
                  ┌──────────────┐
                  │ CodeSpec AI  │
                  └──────┬───────┘
                         ↓
             ┌───────────────────────┐
             │ Architecture Knowledge│
             └───────────┬───────────┘
                         ↓
              ┌────────────────────┐
              │ Developer Insights │
              └────────────────────┘
```

### The goal:

> **Turn codebases into living, searchable architecture knowledge.**

---

# 🔐 Engineering Principle

AI-generated results are intended to **assist developers, not replace engineering judgment**.

Structural analysis provides evidence from the repository, while AI-generated explanations may contain uncertainty.

Critical decisions should always be validated against:

```text
Source Code
    +
Tests
    +
Runtime Behavior
    +
Deployment Environment
```

---

# 👨‍💻 Project

### **CodeSpec AI**

**AI-Based Software Architecture & Impact Analysis System**

Built as a software-engineering and AI research project exploring how ASTs, graph databases, RAG, LLMs, and distributed processing can improve software comprehension and change management.

```text
         CODE
          ↓
      STRUCTURE
          ↓
        GRAPH
          ↓
       CONTEXT
          ↓
     INTELLIGENCE
```

<p align="center">

### ⚡ CodeSpec AI

**Understand the Codebase. Understand the Impact.**

</p>
