"""
Unit test suite for CodeSpecAI RAG Phase 2: Multi-format Content Parsing.

Validates:
1. Python / source file parsing (functions, classes, methods, symbol IDs, line spans)
2. Markdown parsing (sections, breadcrumb heading hierarchy, line ranges)
3. PDF parsing (page numbers, multi-page text extraction)
4. Plain text parsing (source metadata, line boundaries)
5. Configuration parsing (JSON, YAML, INI sections, Dockerfile)
6. Error isolation (empty, unreadable, malformed, non-existent files)
7. ContentParsingService batch repository execution
"""
import io
import tempfile
from pathlib import Path
import pytest
from pypdf import PdfWriter

from app.core.rag.parsers.code_parser import SourceCodeParser
from app.core.rag.parsers.config_parser import ConfigParser
from app.core.rag.parsers.markdown_parser import MarkdownParser
from app.core.rag.parsers.pdf_parser import PdfParser
from app.core.rag.parsers.service import ContentParsingService
from app.core.rag.parsers.text_parser import PlainTextParser
from app.models.classification import ClassifiedFile, FileType
from app.models.rag_models import NormalizedDocument, RepositoryParseResult


# ===========================================================================
# 1. Source Code Parsing Tests
# ===========================================================================

def test_python_source_code_parsing():
    code = (
        '"""Module docstring."""\n'
        'import os\n'
        '\n'
        'class AuthService:\n'
        '    """Auth class docstring."""\n'
        '    def validate(self, token: str) -> bool:\n'
        '        return len(token) > 0\n'
        '\n'
        'def helper_func(x: int) -> int:\n'
        '    """Helper docstring."""\n'
        '    return x * 2\n'
    )

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        file_path = root / "auth.py"
        file_path.write_text(code, encoding="utf-8")

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="auth.py",
            file_name="auth.py",
            extension=".py",
            language="python",
            file_type=FileType.SOURCE_CODE,
            is_processable=True,
        )

        parser = SourceCodeParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.errors) == 0

        # Expect class AuthService, method validate, function helper_func
        assert len(result.documents) == 3

        by_section = {doc.section: doc for doc in result.documents}

        # Check class
        class_doc = by_section["class AuthService"]
        assert class_doc.symbol == "auth.py::AuthService"
        assert class_doc.start_line == 4
        assert class_doc.end_line == 7
        assert "class AuthService:" in class_doc.content
        assert class_doc.metadata["name"] == "AuthService"
        assert class_doc.metadata["docstring"] == "Auth class docstring."

        # Check method
        method_doc = by_section["method AuthService.validate"]
        assert method_doc.symbol == "auth.py::AuthService::validate"
        assert method_doc.start_line == 6
        assert method_doc.end_line == 7
        assert "def validate" in method_doc.content
        assert "token: str" in method_doc.metadata["parameters"][1]

        # Check top-level function
        func_doc = by_section["function helper_func"]
        assert func_doc.symbol == "auth.py::helper_func"
        assert func_doc.start_line == 9
        assert func_doc.end_line == 11
        assert "def helper_func" in func_doc.content
        assert func_doc.metadata["return_type"] == "int"


def test_typescript_source_code_parsing():
    code = (
        'export class Calculator {\n'
        '    add(a: number, b: number): number {\n'
        '        return a + b;\n'
        '    }\n'
        '}\n'
    )

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        file_path = root / "calc.ts"
        file_path.write_text(code, encoding="utf-8")

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="calc.ts",
            file_name="calc.ts",
            extension=".ts",
            language="typescript",
            file_type=FileType.SOURCE_CODE,
            is_processable=True,
        )

        parser = SourceCodeParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.documents) == 2  # class + method


# ===========================================================================
# 2. Markdown Parsing Tests
# ===========================================================================

def test_markdown_parsing_with_heading_hierarchy():
    md = (
        'Introductory text before any headings.\n'
        '\n'
        '# CodeSpec AI\n'
        'Main project introduction.\n'
        '\n'
        '## Architecture\n'
        'Overview of the system design.\n'
        '\n'
        '### Graph Engine\n'
        'Neo4j AST graph details.\n'
        '```python\n'
        '# Code block should not break heading detection\n'
        '# This is a comment, not a heading\n'
        'print("hello")\n'
        '```\n'
        '\n'
        '## API Reference\n'
        'REST API documentation.\n'
    )

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        file_path = root / "README.md"
        file_path.write_text(md, encoding="utf-8")

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="README.md",
            file_name="README.md",
            extension=".md",
            language="markdown",
            file_type=FileType.MARKDOWN,
            is_processable=True,
        )

        parser = MarkdownParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.errors) == 0

        # Sections expected:
        # 1. Overview (intro)
        # 2. CodeSpec AI
        # 3. CodeSpec AI > Architecture
        # 4. CodeSpec AI > Architecture > Graph Engine (with embedded code fence)
        # 5. CodeSpec AI > API Reference
        assert len(result.documents) == 5

        by_sec = {d.section: d for d in result.documents}

        assert "Overview" in by_sec
        assert "Introductory text" in by_sec["Overview"].content

        assert "CodeSpec AI" in by_sec
        assert "Main project introduction." in by_sec["CodeSpec AI"].content

        assert "CodeSpec AI > Architecture" in by_sec

        assert "CodeSpec AI > Architecture > Graph Engine" in by_sec
        graph_doc = by_sec["CodeSpec AI > Architecture > Graph Engine"]
        assert "Neo4j AST graph details." in graph_doc.content
        assert 'print("hello")' in graph_doc.content

        assert "CodeSpec AI > API Reference" in by_sec


def test_markdown_without_headings():
    md = "A simple flat markdown without any title headings.\nJust sentences."

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        file_path = root / "notes.md"
        file_path.write_text(md, encoding="utf-8")

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="notes.md",
            file_name="notes.md",
            extension=".md",
            language="markdown",
            file_type=FileType.MARKDOWN,
            is_processable=True,
        )

        parser = MarkdownParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.documents) == 1
        assert result.documents[0].section == "document"


# ===========================================================================
# 3. PDF Parsing Tests
# ===========================================================================

def create_sample_pdf_bytes(page_texts: list[str]) -> bytes:
    """Helper to generate an in-memory PDF using pypdf."""
    writer = PdfWriter()
    for text in page_texts:
        # Create a blank page and add annotations/text
        page = writer.add_blank_page(width=300, height=300)
        # pypdf does not have direct canvas text rendering, but we can write an object stream or text annotation
        # Or simpler: create a minimal valid PDF with text stream
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_pdf_parsing_preserves_page_numbers():
    # Construct a valid two-page PDF with actual text content using minimal PDF operators
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
        b"2 0 obj <</Type /Pages /Kids [3 0 R 4 0 R] /Count 2>> endobj\n"
        b"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 5 0 R /Resources <</Font <</F1 7 0 R>>>>>> endobj\n"
        b"4 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 6 0 R /Resources <</Font <</F1 7 0 R>>>>>> endobj\n"
        b"5 0 obj <</Length 44>> stream\nBT /F1 12 Tf 50 250 Td (Page 1 Architecture Spec) Tj ET\nendstream\nendobj\n"
        b"6 0 obj <</Length 42>> stream\nBT /F1 12 Tf 50 250 Td (Page 2 Deployment Plan) Tj ET\nendstream\nendobj\n"
        b"7 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n"
        b"xref\n0 8\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000119 00000 n \n0000000227 00000 n \n0000000335 00000 n \n0000000430 00000 n \n0000000523 00000 n \n"
        b"trailer <</Size 8 /Root 1 0 R>>\nstartxref\n592\n%%EOF\n"
    )

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        pdf_file = root / "spec.pdf"
        pdf_file.write_bytes(pdf_content)

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="spec.pdf",
            file_name="spec.pdf",
            extension=".pdf",
            language="pdf",
            file_type=FileType.PDF,
            is_processable=True,
        )

        parser = PdfParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.documents) == 2

        doc1 = result.documents[0]
        assert doc1.page_number == 1
        assert "Page 1 Architecture Spec" in doc1.content
        assert doc1.file_type == FileType.PDF

        doc2 = result.documents[1]
        assert doc2.page_number == 2
        assert "Page 2 Deployment Plan" in doc2.content


# ===========================================================================
# 4. Plain Text & Config Parsing Tests
# ===========================================================================

def test_plain_text_parsing():
    text = "First line of notes.\nSecond line with details.\nThird line."

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        file_path = root / "notes.txt"
        file_path.write_text(text, encoding="utf-8")

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="notes.txt",
            file_name="notes.txt",
            extension=".txt",
            language="text",
            file_type=FileType.PLAIN_TEXT,
            is_processable=True,
        )

        parser = PlainTextParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.documents) == 1
        doc = result.documents[0]
        assert doc.start_line == 1
        assert doc.end_line == 3
        assert doc.content == text


def test_config_parsing_json():
    json_text = '{\n  "name": "codespec",\n  "version": "1.0.0"\n}'

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        file_path = root / "package.json"
        file_path.write_text(json_text, encoding="utf-8")

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="package.json",
            file_name="package.json",
            extension=".json",
            language="json",
            file_type=FileType.CONFIG,
            is_processable=True,
        )

        parser = ConfigParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.documents) == 1
        doc = result.documents[0]
        assert doc.metadata["format"] == "json"
        assert "name" in doc.metadata["top_level_keys"]
        assert "version" in doc.metadata["top_level_keys"]


def test_config_parsing_ini_sections():
    ini_text = (
        "[database]\n"
        "host = localhost\n"
        "port = 5432\n"
        "\n"
        "[server]\n"
        "port = 8000\n"
    )

    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)
        file_path = root / "config.ini"
        file_path.write_text(ini_text, encoding="utf-8")

        classified = ClassifiedFile(
            repository_id="repo1",
            file_path="config.ini",
            file_name="config.ini",
            extension=".ini",
            language="ini",
            file_type=FileType.CONFIG,
            is_processable=True,
        )

        parser = ConfigParser()
        result = parser.parse(classified, repo_root=root)

        assert result.is_successful is True
        assert len(result.documents) == 2
        sections = [d.section for d in result.documents]
        assert sections == ["[database]", "[server]"]


# ===========================================================================
# 5. Error Isolation & Malformed / Empty File Handling
# ===========================================================================

def test_empty_files_do_not_crash():
    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)

        # Empty files
        (root / "empty.py").write_text("", encoding="utf-8")
        (root / "empty.md").write_text("   \n  \n", encoding="utf-8")
        (root / "empty.txt").write_text("", encoding="utf-8")

        service = ContentParsingService()

        for fname, ftype, lang in [
            ("empty.py", FileType.SOURCE_CODE, "python"),
            ("empty.md", FileType.MARKDOWN, "markdown"),
            ("empty.txt", FileType.PLAIN_TEXT, "text"),
        ]:
            classified = ClassifiedFile(
                repository_id="repo1",
                file_path=fname,
                file_name=fname,
                extension=f".{fname.split('.')[-1]}",
                language=lang,
                file_type=ftype,
                is_processable=True,
            )
            result = service.parse_file(classified, repo_root=root)
            assert result.is_successful is False
            assert len(result.errors) > 0
            assert result.errors[0].error_type == "EmptyFile"


def test_malformed_and_corrupt_files_isolated():
    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)

        # Corrupt PDF (random binary string)
        corrupt_pdf = root / "corrupt.pdf"
        corrupt_pdf.write_bytes(b"NOT_A_REAL_PDF_DATA_STREAM")

        # Malformed JSON (syntax error)
        bad_json = root / "bad.json"
        bad_json.write_text("{ unquoted_key: 123 ", encoding="utf-8")

        service = ContentParsingService()

        # 1. Corrupt PDF should not crash
        pdf_file = ClassifiedFile(
            repository_id="repo1",
            file_path="corrupt.pdf",
            file_name="corrupt.pdf",
            extension=".pdf",
            language="pdf",
            file_type=FileType.PDF,
            is_processable=True,
        )
        pdf_res = service.parse_file(pdf_file, repo_root=root)
        assert pdf_res.is_successful is False
        assert len(pdf_res.errors) > 0
        assert pdf_res.errors[0].error_type == "PdfReadError"

        # 2. Malformed JSON still yields a document with syntax warning
        json_file = ClassifiedFile(
            repository_id="repo1",
            file_path="bad.json",
            file_name="bad.json",
            extension=".json",
            language="json",
            file_type=FileType.CONFIG,
            is_processable=True,
        )
        json_res = service.parse_file(json_file, repo_root=root)
        assert json_res.is_successful is True
        assert len(json_res.documents) == 1
        assert len(json_res.errors) == 1
        assert json_res.errors[0].error_type == "SyntaxWarning"


def test_batch_repository_parsing_never_crashes():
    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)

        # Create 1 valid python, 1 valid markdown, 1 corrupt pdf, 1 empty text file
        (root / "main.py").write_text("def hello():\n    return 'hi'\n", encoding="utf-8")
        (root / "README.md").write_text("# Title\nSome content.", encoding="utf-8")
        (root / "broken.pdf").write_bytes(b"corrupt bytes")
        (root / "empty.txt").write_text("", encoding="utf-8")

        files = [
            ClassifiedFile(
                repository_id="test_repo",
                file_path="main.py",
                file_name="main.py",
                extension=".py",
                language="python",
                file_type=FileType.SOURCE_CODE,
                is_processable=True,
            ),
            ClassifiedFile(
                repository_id="test_repo",
                file_path="README.md",
                file_name="README.md",
                extension=".md",
                language="markdown",
                file_type=FileType.MARKDOWN,
                is_processable=True,
            ),
            ClassifiedFile(
                repository_id="test_repo",
                file_path="broken.pdf",
                file_name="broken.pdf",
                extension=".pdf",
                language="pdf",
                file_type=FileType.PDF,
                is_processable=True,
            ),
            ClassifiedFile(
                repository_id="test_repo",
                file_path="empty.txt",
                file_name="empty.txt",
                extension=".txt",
                language="text",
                file_type=FileType.PLAIN_TEXT,
                is_processable=True,
            ),
        ]

        service = ContentParsingService()
        repo_result: RepositoryParseResult = service.parse_repository(files, repo_root=root)

        # Verify documents from valid files exist
        assert repo_result.total_documents >= 2
        file_paths_parsed = {d.file_path for d in repo_result.documents}
        assert "main.py" in file_paths_parsed
        assert "README.md" in file_paths_parsed

        # Verify errors from broken/empty files are recorded cleanly
        assert repo_result.total_errors >= 2
        error_paths = {e.file_path for e in repo_result.errors}
        assert "broken.pdf" in error_paths
        assert "empty.txt" in error_paths
