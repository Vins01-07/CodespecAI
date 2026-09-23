"""
Unit test suite for CodeSpecAI RAG Phase 1: Repository Content Classification.

Validates:
1. File type classification (source_code, markdown, pdf, plain_text, config, unsupported)
2. Ignored vendor and generated directories (.git, node_modules, .venv, dist, build, coverage, etc.)
3. Ignored binary and executable files (.exe, .dll, .pyc, .zip, .png, etc.)
4. Configurable extension handling and dynamic overrides
5. Metadata preservation and normalization (forward slashes, extensions, languages)
6. Backward compatibility of RepoScanner.scan() and filters.py
"""
import tempfile
from pathlib import Path
import pytest

from app.core.ingestion.classifier import FileClassifier
from app.core.ingestion.config import (
    ClassificationConfig,
    get_default_classification_config,
)
from app.core.ingestion.filters import (
    IGNORED_DIRECTORIES,
    IGNORED_FILES,
    SUPPORTED_EXTENSIONS,
    should_ignore,
)
from app.core.ingestion.scanner import RepoScanner
from app.models.classification import (
    ClassifiedFile,
    FileType,
    RepositoryClassificationResult,
)


# ===========================================================================
# 1. File Type & Language Classification Tests
# ===========================================================================

def test_source_code_classification():
    classifier = FileClassifier()

    cases = [
        ("main.py", ".py", "python"),
        ("types.ts", ".ts", "typescript"),
        ("Component.tsx", ".tsx", "typescript"),
        ("index.js", ".js", "javascript"),
        ("App.jsx", ".jsx", "javascript"),
        ("Server.java", ".java", "java"),
        ("main.go", ".go", "go"),
        ("Program.cs", ".cs", "csharp"),
        ("engine.cpp", ".cpp", "cpp"),
        ("lib.rs", ".rs", "rust"),
    ]

    for file_name, ext, expected_lang in cases:
        file_type, lang = classifier.config.classify(file_name, ext)
        assert file_type == FileType.SOURCE_CODE
        assert lang == expected_lang


def test_markdown_classification():
    classifier = FileClassifier()

    for ext in [".md", ".markdown", ".mdx", ".mkd"]:
        file_type, lang = classifier.config.classify(f"doc{ext}", ext)
        assert file_type == FileType.MARKDOWN
        assert lang == "markdown"


def test_pdf_classification():
    classifier = FileClassifier()

    file_type, lang = classifier.config.classify("specification.pdf", ".pdf")
    assert file_type == FileType.PDF
    assert lang == "pdf"


def test_plain_text_classification():
    classifier = FileClassifier()

    for ext in [".txt", ".text", ".log", ".rst"]:
        file_type, lang = classifier.config.classify(f"notes{ext}", ext)
        assert file_type == FileType.PLAIN_TEXT
        assert lang == "text"


def test_config_classification():
    classifier = FileClassifier()

    cases = [
        ("settings.json", ".json", "json"),
        ("deploy.yaml", ".yaml", "yaml"),
        ("ci.yml", ".yml", "yaml"),
        ("pyproject.toml", ".toml", "toml"),
        ("setup.cfg", ".cfg", "ini"),
        ("app.ini", ".ini", "ini"),
        ("pom.xml", ".xml", "xml"),
    ]

    for file_name, ext, expected_lang in cases:
        file_type, lang = classifier.config.classify(file_name, ext)
        assert file_type == FileType.CONFIG
        assert lang == expected_lang


def test_special_config_filenames():
    classifier = FileClassifier()

    cases = [
        ("Dockerfile", "", "dockerfile"),
        ("dockerfile", "", "dockerfile"),
        ("Makefile", "", "makefile"),
        ("Procfile", "", "procfile"),
        (".editorconfig", "", "editorconfig"),
        (".env.example", ".example", "env"),
        ("docker-compose.yml", ".yml", "yaml"),
    ]

    for file_name, ext, expected_lang in cases:
        file_type, lang = classifier.config.classify(file_name, ext)
        assert file_type == FileType.CONFIG
        assert lang == expected_lang


def test_unsupported_classification():
    classifier = FileClassifier()

    # Unknown non-binary extensions should be classified as unsupported
    for ext in [".xyz", ".dat", ".custom", ".unknown_format"]:
        file_type, lang = classifier.config.classify(f"file{ext}", ext)
        assert file_type == FileType.UNSUPPORTED
        assert lang is None


# ===========================================================================
# 2. Filtering of Ignored Directories, Files, and Binaries
# ===========================================================================

def test_ignored_directories():
    ignored_dirs = [
        ".git",
        "node_modules",
        ".venv",
        "venv",
        "__pycache__",
        "dist",
        "build",
        "coverage",
        ".next",
        ".nuxt",
        "vendor",
        "target",
        ".idea",
        ".vscode",
        ".pytest_cache",
    ]

    for d in ignored_dirs:
        sample_path = Path(f"project/{d}/sub/file.py")
        assert should_ignore(sample_path) is True, f"Directory {d} should be ignored"


def test_ignored_lockfiles_and_os_metadata():
    ignored_filenames = [
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "poetry.lock",
        "Pipfile.lock",
        "Cargo.lock",
        ".DS_Store",
        "Thumbs.db",
        "desktop.ini",
    ]

    for fname in ignored_filenames:
        sample_path = Path(f"project/{fname}")
        assert should_ignore(sample_path) is True, f"File {fname} should be ignored"


def test_ignored_binary_and_executable_extensions():
    binary_files = [
        "app.exe",
        "library.dll",
        "driver.sys",
        "lib.so",
        "lib.dylib",
        "binary.bin",
        "module.pyc",
        "Program.class",
        "archive.zip",
        "bundle.tar.gz",
        "package.whl",
        "photo.png",
        "image.jpg",
        "graphic.jpeg",
        "icon.ico",
        "video.mp4",
        "font.woff2",
        "database.db",
        "local.sqlite",
    ]

    for bname in binary_files:
        sample_path = Path(f"project/{bname}")
        assert should_ignore(sample_path) is True, f"Binary {bname} should be ignored"


def test_pdf_is_not_ignored():
    pdf_path = Path("project/docs/specification.pdf")
    assert should_ignore(pdf_path) is False, "PDF files must not be ignored"


# ===========================================================================
# 3. Configurable Extension Handling Tests
# ===========================================================================

def test_dynamic_custom_extension_addition():
    config = ClassificationConfig()

    # Initially .sol is unsupported
    file_type, lang = config.classify("Contract.sol", ".sol")
    assert file_type == FileType.UNSUPPORTED

    # Add custom extension mapping
    config.add_custom_extension(".sol", FileType.SOURCE_CODE, language="solidity")

    file_type, lang = config.classify("Contract.sol", ".sol")
    assert file_type == FileType.SOURCE_CODE
    assert lang == "solidity"


def test_custom_ignored_directory_and_extension():
    config = ClassificationConfig()
    config.ignored_directories.add("my_custom_cache")
    config.ignored_binary_extensions.add(".custom_bin")

    assert config.should_ignore_path(Path("project/my_custom_cache/data.txt")) is True
    assert config.should_ignore_path(Path("project/archive.custom_bin")) is True


# ===========================================================================
# 4. End-to-End Repository Classification Scan
# ===========================================================================

def test_repository_classification_end_to_end():
    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)

        # Create valid files
        (root / "src").mkdir(parents=True)
        (root / "src" / "main.py").write_text("print('hello')", encoding="utf-8")
        (root / "src" / "app.ts").write_text("export const x = 1;", encoding="utf-8")
        (root / "README.md").write_text("# Project Docs", encoding="utf-8")
        (root / "specification.pdf").write_bytes(b"%PDF-1.4 mock content")
        (root / "notes.txt").write_text("plain text notes", encoding="utf-8")
        (root / "config.json").write_text('{"debug": true}', encoding="utf-8")
        (root / "Dockerfile").write_text("FROM python:3.11", encoding="utf-8")
        (root / "extra.xyz").write_text("unknown custom text", encoding="utf-8")

        # Create ignored vendor & generated files
        (root / "node_modules" / "pkg").mkdir(parents=True)
        (root / "node_modules" / "pkg" / "index.js").write_text("// vendor", encoding="utf-8")

        (root / ".git" / "objects").mkdir(parents=True)
        (root / ".git" / "config").write_text("git config", encoding="utf-8")

        (root / ".venv" / "lib").mkdir(parents=True)
        (root / ".venv" / "lib" / "site.py").write_text("# venv", encoding="utf-8")

        (root / "dist").mkdir(parents=True)
        (root / "dist" / "bundle.js").write_text("// bundle", encoding="utf-8")

        (root / "build").mkdir(parents=True)
        (root / "build" / "out.o").write_bytes(b"\x7fELF")

        (root / "package-lock.json").write_text("{}", encoding="utf-8")
        (root / "app.exe").write_bytes(b"MZ\x90\x00")
        (root / "logo.png").write_bytes(b"\x89PNG")

        # Perform classification scan
        scanner = RepoScanner()
        res: RepositoryClassificationResult = scanner.scan_and_classify(root, repository_id="test_repo_1")

        # Assert repository_id
        assert res.repository_id == "test_repo_1"

        # Check total scanned files
        scanned_paths = [f.file_path for f in res.files]

        # Verify ignored files are absent
        for path in scanned_paths:
            assert "node_modules" not in path
            assert ".git" not in path
            assert ".venv" not in path
            assert "dist" not in path
            assert "build" not in path
            assert not path.endswith("package-lock.json")
            assert not path.endswith(".exe")
            assert not path.endswith(".png")

        # Verify normalized paths use forward slashes
        for path in scanned_paths:
            assert "\\" not in path, f"Path {path} must use forward slashes"

        # Check files by type
        by_path = {f.file_path: f for f in res.files}

        # Source code
        assert by_path["src/main.py"].file_type == FileType.SOURCE_CODE
        assert by_path["src/main.py"].language == "python"
        assert by_path["src/main.py"].is_processable is True
        assert by_path["src/main.py"].extension == ".py"
        assert by_path["src/main.py"].file_name == "main.py"

        assert by_path["src/app.ts"].file_type == FileType.SOURCE_CODE
        assert by_path["src/app.ts"].language == "typescript"
        assert by_path["src/app.ts"].is_processable is True

        # Markdown
        assert by_path["README.md"].file_type == FileType.MARKDOWN
        assert by_path["README.md"].language == "markdown"
        assert by_path["README.md"].is_processable is True

        # PDF
        assert by_path["specification.pdf"].file_type == FileType.PDF
        assert by_path["specification.pdf"].is_processable is True

        # Plain text
        assert by_path["notes.txt"].file_type == FileType.PLAIN_TEXT
        assert by_path["notes.txt"].is_processable is True

        # Config
        assert by_path["config.json"].file_type == FileType.CONFIG
        assert by_path["config.json"].language == "json"
        assert by_path["config.json"].is_processable is True

        assert by_path["Dockerfile"].file_type == FileType.CONFIG
        assert by_path["Dockerfile"].language == "dockerfile"
        assert by_path["Dockerfile"].is_processable is True

        # Unsupported
        assert by_path["extra.xyz"].file_type == FileType.UNSUPPORTED
        assert by_path["extra.xyz"].is_processable is False

        # Summary statistics
        assert res.summary.total_files_scanned == 8
        assert res.summary.processable_files == 7
        assert res.summary.unsupported_files == 1
        assert res.summary.counts_by_type[FileType.SOURCE_CODE.value] == 2
        assert res.summary.counts_by_type[FileType.MARKDOWN.value] == 1
        assert res.summary.counts_by_type[FileType.PDF.value] == 1
        assert res.summary.counts_by_type[FileType.PLAIN_TEXT.value] == 1
        assert res.summary.counts_by_type[FileType.CONFIG.value] == 2
        assert res.summary.counts_by_type[FileType.UNSUPPORTED.value] == 1

        # Test processable files extractor
        processable = FileClassifier.get_processable_files(res.files)
        assert len(processable) == 7
        assert all(f.is_processable for f in processable)


# ===========================================================================
# 5. Backward Compatibility Tests
# ===========================================================================

def test_repo_scanner_scan_backward_compatibility():
    with tempfile.TemporaryDirectory() as tmp_dir:
        root = Path(tmp_dir)

        (root / "main.py").write_text("pass", encoding="utf-8")
        (root / "app.ts").write_text("export const a = 1;", encoding="utf-8")
        (root / "README.md").write_text("# Doc", encoding="utf-8")
        (root / "notes.txt").write_text("notes", encoding="utf-8")
        (root / "node_modules").mkdir()
        (root / "node_modules" / "lib.js").write_text("pass", encoding="utf-8")

        scanner = RepoScanner()
        paths = scanner.scan(root)

        # Legacy scan() only returns supported AST source files, excluding node_modules, md, txt
        assert len(paths) == 2
        filenames = {p.name for p in paths}
        assert filenames == {"main.py", "app.ts"}


def test_filters_backward_compatibility():
    assert ".git" in IGNORED_DIRECTORIES
    assert "node_modules" in IGNORED_DIRECTORIES
    assert "package-lock.json" in IGNORED_FILES
    assert ".py" in SUPPORTED_EXTENSIONS
    assert ".ts" in SUPPORTED_EXTENSIONS
    assert should_ignore(Path(".git/HEAD")) is True
    assert should_ignore(Path("src/main.py")) is False
