"""
Parser registry — maps file extensions to language parser instances.

Usage:
    from app.core.parser.registry import ParserRegistry

    registry = ParserRegistry()
    summary = registry.parse_file(Path("src/main.py"))
    if summary:
        print(summary.functions)
"""
from __future__ import annotations

import logging
from pathlib import Path

from app.core.parser.base import BaseParser
from app.core.parser.python_parser import PythonParser
from app.core.parser.typescript_parser import TypeScriptParser
from app.core.parser.javascript_parser import JavaScriptParser
from app.core.parser.java_parser import JavaParser
from app.core.parser.go_parser import GoParser
from app.core.parser.csharp_parser import CSharpParser
from app.models.parser_models import FileSummary

logger = logging.getLogger(__name__)

# Extension → parser class mapping
_EXTENSION_MAP: dict[str, type[BaseParser]] = {
    ".py": PythonParser,
    ".ts": TypeScriptParser,
    ".tsx": TypeScriptParser,
    ".js": JavaScriptParser,
    ".jsx": JavaScriptParser,
    ".java": JavaParser,
    ".go": GoParser,
    ".cs": CSharpParser,
}


class ParserRegistry:
    """
    Singleton-style registry that lazily instantiates parsers on first use.

    Parsers are expensive to initialise (they load tree-sitter grammars),
    so we cache them by extension for the lifetime of the process.
    """

    def __init__(self) -> None:
        self._cache: dict[str, BaseParser] = {}

    def get_parser(self, path: Path) -> BaseParser | None:
        """Return the appropriate parser for a given file path, or None."""
        ext = path.suffix.lower()
        if ext not in _EXTENSION_MAP:
            return None
        if ext not in self._cache:
            parser_class = _EXTENSION_MAP[ext]
            try:
                self._cache[ext] = parser_class()
            except Exception as exc:  # noqa: BLE001
                logger.error(
                    "Failed to initialise parser for extension %s: %s", ext, exc
                )
                return None
        return self._cache[ext]

    def parse_file(self, path: Path) -> FileSummary | None:
        """
        Parse a single source file and return its FileSummary.

        Returns None if:
        - The file extension is not supported.
        - The file cannot be read.
        - The parser raises an unexpected error.
        """
        parser = self.get_parser(path)
        if parser is None:
            logger.debug("No parser available for: %s", path)
            return None
        try:
            summary = parser.parse(path)
            logger.debug(
                "Parsed %s → %d funcs, %d classes, %d imports",
                path.name,
                len(summary.functions),
                len(summary.classes),
                len(summary.imports),
            )
            return summary
        except FileNotFoundError:
            logger.warning("File not found during parsing: %s", path)
            return None
        except Exception as exc:  # noqa: BLE001
            logger.error("Error parsing %s: %s", path, exc, exc_info=True)
            return None

    def parse_files(self, paths: list[Path]) -> list[FileSummary]:
        """
        Parse multiple files and return only successful results.
        Files that fail silently are skipped (errors are logged).
        """
        summaries: list[FileSummary] = []
        for path in paths:
            summary = self.parse_file(path)
            if summary is not None:
                summaries.append(summary)
        return summaries

    @property
    def supported_extensions(self) -> set[str]:
        """Return the set of file extensions this registry can handle."""
        return set(_EXTENSION_MAP.keys())
