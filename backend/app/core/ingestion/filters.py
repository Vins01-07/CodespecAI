"""
Filtering rules for repository ingestion.
Identifies files and directories that should be skipped (vendor, build, binary, lockfiles, etc.).
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from app.core.ingestion.config import (
    ClassificationConfig,
    DEFAULT_IGNORED_BINARY_EXTENSIONS,
    DEFAULT_IGNORED_DIRECTORIES,
    DEFAULT_IGNORED_FILES,
    get_default_classification_config,
)

# Exported for backwards compatibility
IGNORED_DIRECTORIES: set[str] = set(DEFAULT_IGNORED_DIRECTORIES)
IGNORED_FILES: set[str] = set(DEFAULT_IGNORED_FILES)
IGNORED_BINARY_EXTENSIONS: set[str] = set(DEFAULT_IGNORED_BINARY_EXTENSIONS)

# Supported extensions for AST parser (legacy compatibility)
SUPPORTED_EXTENSIONS: set[str] = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".cs"
}

_default_config = get_default_classification_config()


def is_binary_content(path: Path, chunk_size: int = 1024) -> bool:
    """
    Check if a file contains null bytes (heuristic for binary files).
    Never treats PDF files as ignored binary here if handled by classification.
    """
    try:
        with path.open("rb") as f:
            chunk = f.read(chunk_size)
            return b"\x00" in chunk
    except Exception:
        return False


def should_ignore(path: Path, config: Optional[ClassificationConfig] = None) -> bool:
    """
    Determine if a file or directory should be ignored during repository ingestion.

    Skips:
    - Vendor and generated directories (.git, node_modules, .venv, dist, build, coverage, etc.)
    - Lockfiles and OS metadata (.DS_Store, Thumbs.db, package-lock.json, etc.)
    - Binary and executable files (.exe, .dll, .so, .pyc, .zip, etc.)
    - Sniffed binary files (excluding .pdf which is processed by RAG)
    """
    cfg = config or _default_config

    # 1. Check directory path parts
    lower_parts = [part.lower() for part in path.parts]
    ignored_dirs_lower = {d.lower() for d in cfg.ignored_directories}

    # If any part of the path is an ignored directory (e.g. node_modules, .git, dist)
    if any(part in ignored_dirs_lower for part in lower_parts):
        return True

    # 2. Check filename
    if cfg.is_ignored_file(path.name):
        return True

    # 3. Check binary / executable extension
    ext = path.suffix.lower()
    if ext:
        # PDFs are explicitly supported for RAG, do not ignore
        if ext in cfg.pdf_extensions:
            return False
        if cfg.is_ignored_extension(ext):
            return True

    # 4. Optional heuristic for extensionless or unknown files that exist on disk
    if path.is_file() and not ext:
        # Known extensionless text config files should not be ignored
        if path.name.lower() in {k.lower() for k in cfg.config_filenames}:
            return False
        # If it's a binary file without extension (e.g. compiled binary), ignore it
        if is_binary_content(path):
            return True

    return False