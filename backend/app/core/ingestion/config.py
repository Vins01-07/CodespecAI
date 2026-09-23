"""
Configurable extension handling and filtering rules for repository ingestion.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field

from app.models.classification import FileType

# Default source code extensions and their language names
DEFAULT_SOURCE_CODE_EXTENSIONS: dict[str, str] = {
    ".py": "python",
    ".pyi": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    ".java": "java",
    ".go": "go",
    ".cs": "csharp",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".hxx": "cpp",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".scala": "scala",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".sql": "sql",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
}

# Default markdown extensions
DEFAULT_MARKDOWN_EXTENSIONS: set[str] = {
    ".md",
    ".markdown",
    ".mdown",
    ".mkd",
    ".mdx",
}

# Default PDF extensions
DEFAULT_PDF_EXTENSIONS: set[str] = {
    ".pdf",
}

# Default plain text extensions
DEFAULT_PLAIN_TEXT_EXTENSIONS: set[str] = {
    ".txt",
    ".text",
    ".log",
    ".rst",
    ".asciidoc",
    ".adoc",
}

# Default configuration file extensions and format/language
DEFAULT_CONFIG_EXTENSIONS: dict[str, str] = {
    ".json": "json",
    ".jsonc": "json",
    ".json5": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".ini": "ini",
    ".cfg": "ini",
    ".conf": "config",
    ".xml": "xml",
    ".properties": "properties",
}

# Default filenames recognized as config regardless of extension
DEFAULT_CONFIG_FILENAMES: dict[str, str] = {
    "dockerfile": "dockerfile",
    "makefile": "makefile",
    "procfile": "procfile",
    ".editorconfig": "editorconfig",
    ".env.example": "env",
    "docker-compose.yml": "yaml",
    "docker-compose.yaml": "yaml",
}

# Default directories that should be skipped during scanning
DEFAULT_IGNORED_DIRECTORIES: set[str] = {
    ".git",
    ".svn",
    ".hg",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    "vendor",
    "target",
    "bin",
    "obj",
    ".idea",
    ".vscode",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    ".nyc_output",
    "htmlcov",
    ".turbo",
    ".parcel-cache",
}

# Default files that should be skipped
DEFAULT_IGNORED_FILES: set[str] = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "pipfile.lock",
    "cargo.lock",
    "composer.lock",
    "gemfile.lock",
    ".ds_store",
    "thumbs.db",
    "desktop.ini",
}

# Default binary or executable extensions that should be ignored
DEFAULT_IGNORED_BINARY_EXTENSIONS: set[str] = {
    # Executables, drivers, and libraries
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    ".msi",
    ".com",
    ".sys",
    ".drv",
    # Compiled bytecode and objects
    ".pyc",
    ".pyo",
    ".pyd",
    ".class",
    ".o",
    ".obj",
    ".a",
    ".lib",
    ".beam",
    # Archives
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".7z",
    ".rar",
    ".jar",
    ".war",
    ".ear",
    ".whl",
    ".egg",
    # Media and fonts (PDF is NOT ignored)
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".bmp",
    ".tiff",
    ".webp",
    ".mp3",
    ".wav",
    ".ogg",
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",
    ".webm",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".otf",
    # Databases
    ".db",
    ".sqlite",
    ".sqlite3",
}


class ClassificationConfig(BaseModel):
    """
    Configurable rules for file classification and repository filtering.
    All extension checks are case-insensitive.
    """
    source_code_extensions: dict[str, str] = Field(default_factory=lambda: dict(DEFAULT_SOURCE_CODE_EXTENSIONS))
    markdown_extensions: set[str] = Field(default_factory=lambda: set(DEFAULT_MARKDOWN_EXTENSIONS))
    pdf_extensions: set[str] = Field(default_factory=lambda: set(DEFAULT_PDF_EXTENSIONS))
    plain_text_extensions: set[str] = Field(default_factory=lambda: set(DEFAULT_PLAIN_TEXT_EXTENSIONS))
    config_extensions: dict[str, str] = Field(default_factory=lambda: dict(DEFAULT_CONFIG_EXTENSIONS))
    config_filenames: dict[str, str] = Field(default_factory=lambda: dict(DEFAULT_CONFIG_FILENAMES))

    ignored_directories: set[str] = Field(default_factory=lambda: set(DEFAULT_IGNORED_DIRECTORIES))
    ignored_files: set[str] = Field(default_factory=lambda: set(DEFAULT_IGNORED_FILES))
    ignored_binary_extensions: set[str] = Field(default_factory=lambda: set(DEFAULT_IGNORED_BINARY_EXTENSIONS))

    def is_ignored_directory(self, dir_name: str) -> bool:
        """Check if a directory name should be ignored."""
        return dir_name.lower() in {d.lower() for d in self.ignored_directories}

    def is_ignored_file(self, file_name: str) -> bool:
        """Check if a file name should be ignored."""
        return file_name.lower() in {f.lower() for f in self.ignored_files}

    def is_ignored_extension(self, ext: str) -> bool:
        """Check if a file extension represents an ignored binary/executable."""
        return ext.lower() in {e.lower() for e in self.ignored_binary_extensions}

    def should_ignore_path(self, path: Path) -> bool:
        """
        Check if a given path should be skipped entirely from ingestion.
        Checks directory hierarchy, filename, and binary extensions.
        """
        # Check any directory part in path
        lower_parts = {part.lower() for part in path.parts[:-1]}
        if any(part in {d.lower() for d in self.ignored_directories} for part in lower_parts):
            return True

        # Check filename
        if self.is_ignored_file(path.name):
            return True

        # Check binary/executable extension (unless it's in pdf_extensions)
        ext = path.suffix.lower()
        if ext not in self.pdf_extensions and self.is_ignored_extension(ext):
            return True

        return False

    def classify(self, file_name: str, ext: str) -> tuple[FileType, Optional[str]]:
        """
        Determine the FileType and optional language/format for a file.
        Returns (FileType, Optional[str]).
        """
        lower_name = file_name.lower()
        lower_ext = ext.lower()

        # Check special config filenames first (e.g. Dockerfile, Makefile, .editorconfig)
        if lower_name in {k.lower(): v for k, v in self.config_filenames.items()}:
            mapping = {k.lower(): v for k, v in self.config_filenames.items()}
            return FileType.CONFIG, mapping[lower_name]

        # 1. Source code
        if lower_ext in self.source_code_extensions:
            return FileType.SOURCE_CODE, self.source_code_extensions[lower_ext]

        # 2. Markdown
        if lower_ext in self.markdown_extensions:
            return FileType.MARKDOWN, "markdown"

        # 3. PDF
        if lower_ext in self.pdf_extensions:
            return FileType.PDF, "pdf"

        # 4. Plain Text
        if lower_ext in self.plain_text_extensions:
            return FileType.PLAIN_TEXT, "text"

        # 5. Config
        if lower_ext in self.config_extensions:
            return FileType.CONFIG, self.config_extensions[lower_ext]

        # 6. Unsupported (unrecognized extension or format)
        return FileType.UNSUPPORTED, None

    def add_custom_extension(
        self,
        ext: str,
        file_type: FileType,
        language: Optional[str] = None,
    ) -> None:
        """Dynamically add or override an extension classification."""
        ext = ext.lower() if ext.startswith(".") else f".{ext.lower()}"
        # Remove from other sets if present
        self.source_code_extensions.pop(ext, None)
        self.markdown_extensions.discard(ext)
        self.pdf_extensions.discard(ext)
        self.plain_text_extensions.discard(ext)
        self.config_extensions.pop(ext, None)

        if file_type == FileType.SOURCE_CODE:
            self.source_code_extensions[ext] = language or "unknown"
        elif file_type == FileType.MARKDOWN:
            self.markdown_extensions.add(ext)
        elif file_type == FileType.PDF:
            self.pdf_extensions.add(ext)
        elif file_type == FileType.PLAIN_TEXT:
            self.plain_text_extensions.add(ext)
        elif file_type == FileType.CONFIG:
            self.config_extensions[ext] = language or "config"


def get_default_classification_config() -> ClassificationConfig:
    """Return a new instance of the default ClassificationConfig."""
    return ClassificationConfig()
