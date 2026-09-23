"""
Unit test suite for CodeSpecAI RAG Phase 3: Semantic Chunking.

Validates:
1. Source code chunking (functions preserved atomically, oversized code split with line spans)
2. Markdown chunking (section hierarchy and breadcrumbs preserved)
3. PDF chunking (1-indexed page numbers preserved across all chunks)
4. Plain text and config chunking (recursive splitting with overlap)
5. Parameter configurability (chunk size, overlap, min size)
6. Elimination of empty/meaningless chunks
7. Deterministic chunk IDs and vector payload compatibility
8. Batch repository chunking (ChunkingResult)
"""
import pytest

from app.core.rag.chunking.config import ChunkingConfig
from app.core.rag.chunking.service import SemanticChunkingService
from app.models.classification import FileType
from app.models.chunk_models import RAGChunk
from app.models.rag_models import NormalizedDocument


# ===========================================================================
# 1. Source Code Chunking Tests
# ===========================================================================

def test_source_code_function_preserved_atomically():
    func_content = (
        "def authenticate_user(username: str, token: str) -> bool:\n"
        '    """Authenticate a user using JWT token."""\n'
        "    if not username or not token:\n"
        "        return False\n"
        "    return token.startswith('secret_')\n"
    )

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="src/auth.py",
        file_type=FileType.SOURCE_CODE,
        language="python",
        content=func_content,
        start_line=10,
        end_line=15,
        section="function authenticate_user",
        symbol="src/auth.py::authenticate_user",
        metadata={"return_type": "bool"},
    )

    service = SemanticChunkingService()
    chunks = service.chunk_document(doc)

    # Function fits within default code_chunk_size (1500), so must NOT be split
    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk.file_path == "src/auth.py"
    assert chunk.start_line == 10
    assert chunk.end_line == 15
    assert chunk.symbol == "src/auth.py::authenticate_user"
    assert chunk.section == "function authenticate_user"
    assert chunk.chunk_index == 0
    assert chunk.total_chunks == 1
    assert chunk.parent_metadata["return_type"] == "bool"
    assert chunk.char_count == len(func_content.strip())
    assert chunk.token_count > 0


def test_oversized_source_code_splits_with_line_ranges():
    # Construct a code block larger than custom code_chunk_size
    lines = [f"    line_{i} = execute_step_{i}()" for i in range(1, 100)]
    long_content = "def huge_pipeline_function():\n" + "\n".join(lines) + "\n    return True\n"

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="src/pipeline.py",
        file_type=FileType.SOURCE_CODE,
        language="python",
        content=long_content,
        start_line=100,
        end_line=201,
        section="function huge_pipeline_function",
        symbol="src/pipeline.py::huge_pipeline_function",
    )

    config = ChunkingConfig(code_chunk_size=400, code_chunk_overlap=100)
    service = SemanticChunkingService(config=config)
    chunks = service.chunk_document(doc)

    assert len(chunks) > 1
    for idx, chunk in enumerate(chunks):
        assert chunk.chunk_index == idx
        assert chunk.total_chunks == len(chunks)
        assert chunk.symbol == "src/pipeline.py::huge_pipeline_function"
        assert chunk.start_line is not None
        assert chunk.end_line is not None
        assert chunk.start_line >= 100
        assert chunk.end_line <= 201
        assert chunk.start_line <= chunk.end_line


# ===========================================================================
# 2. Markdown Chunking Tests
# ===========================================================================

def test_markdown_preserves_section_hierarchy():
    sec_content = (
        "## Architecture Overview\n"
        "The system uses a graph database for AST relationships and vector index for RAG.\n"
        "Both query engines run asynchronously using Celery.\n"
    )

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="docs/architecture.md",
        file_type=FileType.MARKDOWN,
        language="markdown",
        content=sec_content,
        start_line=25,
        end_line=29,
        section="Documentation > Design > Architecture Overview",
    )

    service = SemanticChunkingService()
    chunks = service.chunk_document(doc)

    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk.section == "Documentation > Design > Architecture Overview"
    assert chunk.start_line == 25
    assert chunk.end_line == 29
    assert "The system uses a graph database" in chunk.content


def test_oversized_markdown_splits_paragraphs_preserving_section():
    p1 = "Paragraph 1 detailing the first step of the deployment pipeline in comprehensive detail." * 4
    p2 = "Paragraph 2 detailing the second step with monitoring and healthcheck procedures." * 4
    p3 = "Paragraph 3 detailing rollback criteria and failure recovery mechanisms." * 4
    long_markdown = f"{p1}\n\n{p2}\n\n{p3}"

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="docs/deploy.md",
        file_type=FileType.MARKDOWN,
        language="markdown",
        content=long_markdown,
        start_line=1,
        end_line=50,
        section="Deployment > Production Runbook",
    )

    config = ChunkingConfig(chunk_size=400, chunk_overlap=100)
    service = SemanticChunkingService(config=config)
    chunks = service.chunk_document(doc)

    assert len(chunks) > 1
    for chunk in chunks:
        # Every split chunk maintains the section hierarchy breadcrumb
        assert chunk.section == "Deployment > Production Runbook"
        assert chunk.file_type == FileType.MARKDOWN


# ===========================================================================
# 3. PDF Chunking Tests
# ===========================================================================

def test_pdf_chunking_preserves_page_number():
    page_text = (
        "Specification Document v2.0\n"
        "Chapter 3: Security & Access Control Policies.\n"
        "All API endpoints require Bearer authentication tokens.\n"
    )

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="specs/security.pdf",
        file_type=FileType.PDF,
        language="pdf",
        content=page_text,
        page_number=3,
        section="Page 3",
        metadata={"total_pages": 10},
    )

    service = SemanticChunkingService()
    chunks = service.chunk_document(doc)

    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk.page_number == 3
    assert chunk.section == "Page 3"
    assert chunk.file_type == FileType.PDF
    assert chunk.parent_metadata["total_pages"] == 10


def test_oversized_pdf_page_splits_preserving_page_number():
    long_page_text = (
        "Section 1: Detailed hardware requirements for edge clusters.\n"
        "Node 1 specifications: 64GB RAM, 16 vCPUs, NVMe storage array.\n\n"
        "Section 2: Networking topology and BGP routing protocols.\n"
        "VLAN configurations and gateway routing policies across regions.\n\n"
        "Section 3: High availability failover with Raft consensus.\n"
    ) * 3

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="specs/hardware.pdf",
        file_type=FileType.PDF,
        language="pdf",
        content=long_page_text,
        page_number=5,
        section="Page 5",
    )

    config = ChunkingConfig(chunk_size=300, chunk_overlap=50)
    service = SemanticChunkingService(config=config)
    chunks = service.chunk_document(doc)

    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk.page_number == 5
        assert chunk.file_type == FileType.PDF


# ===========================================================================
# 4. Plain Text and Config Chunking Tests
# ===========================================================================

def test_plain_text_chunking():
    text = (
        "Entry 1: System started.\n\n"
        "Entry 2: Cache initialized.\n\n"
        "Entry 3: Ready for incoming connections.\n"
    )

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="logs/app.log",
        file_type=FileType.PLAIN_TEXT,
        language="text",
        content=text,
        start_line=1,
        end_line=6,
        section="text",
    )

    service = SemanticChunkingService()
    chunks = service.chunk_document(doc)

    assert len(chunks) == 1
    assert chunks[0].file_type == FileType.PLAIN_TEXT
    assert chunks[0].start_line == 1
    assert chunks[0].end_line == 6


def test_config_chunking_preserves_section():
    ini_content = (
        "[database]\n"
        "host = localhost\n"
        "port = 5432\n"
        "pool_size = 20\n"
    )

    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="config.ini",
        file_type=FileType.CONFIG,
        language="ini",
        content=ini_content,
        start_line=1,
        end_line=4,
        section="[database]",
        metadata={"format": "ini"},
    )

    service = SemanticChunkingService()
    chunks = service.chunk_document(doc)

    assert len(chunks) == 1
    assert chunks[0].section == "[database]"
    assert chunks[0].parent_metadata["format"] == "ini"


# ===========================================================================
# 5. Edge Cases: Empty Chunks, Deterministic IDs & Vector Compatibility
# ===========================================================================

def test_empty_and_noise_chunks_filtered():
    # Content below min_chunk_size (20 characters) should be dropped
    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="empty.py",
        file_type=FileType.SOURCE_CODE,
        language="python",
        content="   \n pass \n",
        start_line=1,
        end_line=2,
    )

    service = SemanticChunkingService()
    chunks = service.chunk_document(doc)

    # Clean filtering of noise
    assert len(chunks) == 0


def test_deterministic_chunk_ids():
    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="src/main.py",
        file_type=FileType.SOURCE_CODE,
        language="python",
        content="def run():\n    return 'running'",
        start_line=1,
        end_line=2,
    )

    service = SemanticChunkingService()
    run1 = service.chunk_document(doc)
    run2 = service.chunk_document(doc)

    assert len(run1) == 1
    assert len(run2) == 1
    assert run1[0].chunk_id == run2[0].chunk_id


def test_vector_payload_compatibility():
    doc = NormalizedDocument(
        repository_id="test_repo",
        file_path="src/main.py",
        file_type=FileType.SOURCE_CODE,
        language="python",
        content="def start():\n    pass",
        start_line=1,
        end_line=2,
        section="function start",
        symbol="main.py::start",
        metadata={"async": False},
    )

    service = SemanticChunkingService()
    chunks = service.chunk_document(doc)
    assert len(chunks) == 1

    payload = chunks[0].to_vector_payload()
    assert payload["chunk_id"] == chunks[0].chunk_id
    assert payload["file_path"] == "src/main.py"
    assert payload["file_type"] == "source_code"
    assert payload["symbol"] == "main.py::start"
    assert payload["parent_metadata"]["async"] is False


def test_batch_chunk_documents():
    docs = [
        NormalizedDocument(
            repository_id="repoA",
            file_path="src/a.py",
            file_type=FileType.SOURCE_CODE,
            language="python",
            content="def a():\n    return 1",
            start_line=1,
            end_line=2,
        ),
        NormalizedDocument(
            repository_id="repoA",
            file_path="README.md",
            file_type=FileType.MARKDOWN,
            language="markdown",
            content="# Title\nHello world documentation.",
            start_line=1,
            end_line=2,
        ),
    ]

    service = SemanticChunkingService()
    result = service.chunk_documents(docs, repository_id="repoA")

    assert result.repository_id == "repoA"
    assert result.total_documents_processed == 2
    assert result.total_chunks_produced == 2
    assert result.chunks_by_type[FileType.SOURCE_CODE.value] == 1
    assert result.chunks_by_type[FileType.MARKDOWN.value] == 1
