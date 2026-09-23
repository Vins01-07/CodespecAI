"""
Base parser interface for CodeSpec AI tree-sitter parsers.

All language-specific parsers extend BaseParser and implement the
`language` property plus optional override hooks.
"""
from __future__ import annotations

import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import TYPE_CHECKING

import tree_sitter

from app.models.parser_models import (
    ClassDef,
    FileSummary,
    FunctionDef,
    ImportDef,
)

if TYPE_CHECKING:
    from tree_sitter import Language, Node, Parser, Tree


class BaseParser(ABC):
    """Abstract base for all tree-sitter language parsers."""

    #Runs when parser is created
    def __init__(self) -> None:
        self._ts_language: Language = self._build_language()
        self._parser: Parser = tree_sitter.Parser(self._ts_language)

    # ------------------------------------------------------------------
    # Abstract interface
    # ------------------------------------------------------------------

    @property
    @abstractmethod
    def language(self) -> str:
        """Human-readable language name, e.g. 'python'."""

    @abstractmethod
    def _build_language(self) -> "Language":
        """Return the tree-sitter Language object for this parser."""

    @abstractmethod
    def _extract_functions(
        self, root: "Node", source: bytes, file_path: str
    ) -> list[FunctionDef]:
        """Walk the CST and return all top-level function definitions."""

    @abstractmethod
    def _extract_classes(
        self, root: "Node", source: bytes, file_path: str
    ) -> list[ClassDef]:
        """Walk the CST and return all class definitions."""

    @abstractmethod
    def _extract_imports(self, root: "Node", source: bytes) -> list[ImportDef]:
        """Walk the CST and return all import/using statements."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def parse(self, file_path: Path, base_dir: Path | None = None) -> FileSummary:
        """Parse a source file and return a structured FileSummary."""
        source = file_path.read_bytes()
        tree: Tree = self._parser.parse(source)
        root = tree.root_node

        if base_dir:
            try:
                norm_path = file_path.resolve().relative_to(base_dir.resolve()).as_posix()
            except ValueError:
                norm_path = file_path.as_posix()
        else:
            norm_path = file_path.as_posix()

        norm_path = norm_path.replace("\\", "/")

        functions = self._extract_functions(root, source, norm_path)
        classes = self._extract_classes(root, source, norm_path)
        imports = self._extract_imports(root, source)

        return FileSummary(
            path=norm_path,
            language=self.language,
            functions=functions,
            classes=classes,
            imports=imports,
        )

    # ------------------------------------------------------------------
    # Shared helpers (available to all subclasses)
    # ------------------------------------------------------------------

    @staticmethod
    def _node_text(node: "Node", source: bytes) -> str:
        """Return the UTF-8 text of a tree-sitter node."""
        return source[node.start_byte : node.end_byte].decode("utf-8", errors="replace")

    @staticmethod
    def _first_child_text(node: "Node", source: bytes, type_: str) -> str | None:
        """Return the text of the first direct child with the given type."""
        for child in node.children:
            if child.type == type_:
                return source[child.start_byte : child.end_byte].decode(
                    "utf-8", errors="replace"
                )
        return None

    @staticmethod
    def _children_of_type(node: "Node", type_: str) -> list["Node"]:
        """Return all immediate children of a given node type."""
        return [c for c in node.children if c.type == type_]

    @staticmethod
    def _children_of_types(node: "Node", types: set[str]) -> list["Node"]:
        """Return all immediate children whose type is in `types`."""
        return [c for c in node.children if c.type in types]

    @staticmethod
    def _extract_docstring_from_body(body_node: "Node", source: bytes) -> str | None:
        """
        Detect a leading string literal in a function/class body and return it.
        Works for Python triple-quoted strings and JSDoc-style block comments.
        """
        if body_node is None:
            return None
        for child in body_node.children:
            if child.type in ("expression_statement", "block"):
                # Python: expression_statement → string
                for inner in child.children:
                    if inner.type == "string":
                        raw = source[inner.start_byte : inner.end_byte].decode(
                            "utf-8", errors="replace"
                        )
                        # Strip quotes/triple-quotes
                        return re.sub(r'^[\'\"]{1,3}|[\'\"]{1,3}$', "", raw).strip()
            elif child.type == "string":
                raw = source[child.start_byte : child.end_byte].decode(
                    "utf-8", errors="replace"
                )
                return re.sub(r'^[\'\"]{1,3}|[\'\"]{1,3}$', "", raw).strip()
            elif child.type == "comment":
                text = source[child.start_byte : child.end_byte].decode(
                    "utf-8", errors="replace"
                )
                # JSDoc /** ... */ style
                if text.startswith("/**"):
                    return text.strip()
            # Stop at first meaningful statement
            if child.is_named and child.type not in (
                "comment",
                "expression_statement",
            ):
                break
        return None

    @staticmethod
    def _walk_calls(node: "Node", source: bytes) -> list[str]:
        """
        Recursively collect all call_expression identifiers under `node`.
        Returns bare function names like 'save', 'os.path.join', etc.
        Does not include explicit object creations (new_expression, etc.).
        """
        calls: list[str] = []

        def _walk(n: "Node") -> None:
            if n.type == "call":
                # Python tree-sitter: call → (function: ...) (arguments: ...)
                fn_node = n.child_by_field_name("function")
                if fn_node:
                    calls.append(
                        source[fn_node.start_byte : fn_node.end_byte]
                        .decode("utf-8", errors="replace")
                        .strip()
                    )
            elif n.type == "call_expression":
                # JS/TS/Java/Go tree-sitter
                fn_node = n.child_by_field_name("function")
                if fn_node:
                    calls.append(
                        source[fn_node.start_byte : fn_node.end_byte]
                        .decode("utf-8", errors="replace")
                        .strip()
                    )
            for child in n.children:
                _walk(child)

        _walk(node)
        return calls

    @staticmethod
    def _walk_instantiations(node: "Node", source: bytes) -> list[str]:
        """
        Recursively collect class/object instantiations under `node`:
        - JS/TS: new_expression (e.g. `new Calculator()`)
        - Java/C#: object_creation_expression (e.g. `new Calculator()`)
        - Go: composite_literal (e.g. `Calculator{}`)
        """
        instantiations: list[str] = []

        def _walk(n: "Node") -> None:
            if n.type == "new_expression":
                # JS/TS: (new_expression constructor: (identifier))
                ctor = n.child_by_field_name("constructor")
                if ctor:
                    instantiations.append(
                        source[ctor.start_byte : ctor.end_byte]
                        .decode("utf-8", errors="replace")
                        .strip()
                    )
            elif n.type == "object_creation_expression":
                # Java / C#: type field
                type_node = n.child_by_field_name("type")
                if type_node:
                    instantiations.append(
                        source[type_node.start_byte : type_node.end_byte]
                        .decode("utf-8", errors="replace")
                        .strip()
                    )
            elif n.type == "composite_literal":
                # Go: type: (type_identifier)
                type_node = n.child_by_field_name("type")
                if type_node:
                    instantiations.append(
                        source[type_node.start_byte : type_node.end_byte]
                        .decode("utf-8", errors="replace")
                        .strip()
                    )
            for child in n.children:
                _walk(child)

        _walk(node)
        return instantiations
