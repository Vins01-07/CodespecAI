"""
Python AST parser using tree-sitter-python.

Extracts:
- function_definition  → FunctionDef (params, return type, call sites, docstring)
- class_definition     → ClassDef    (bases, methods, docstring)
- import_statement     → ImportDef
- import_from_statement→ ImportDef (relative-aware)
"""
from __future__ import annotations

from pathlib import Path

import tree_sitter_python as ts_python
from tree_sitter import Language, Node

from app.core.parser.base import BaseParser
from app.models.parser_models import ClassDef, FunctionDef, ImportDef


class PythonParser(BaseParser):
    """Tree-sitter based parser for Python source files."""

    @property
    def language(self) -> str:
        return "python"

    def _build_language(self) -> Language:
        return Language(ts_python.language())

    # ------------------------------------------------------------------
    # Functions
    # ------------------------------------------------------------------

    def _extract_functions(
        self, root: Node, source: bytes, file_path: str
    ) -> list[FunctionDef]:
        results: list[FunctionDef] = []
        self._collect_functions(root, source, file_path, results, is_method=False)
        return results

    def _collect_functions(
        self,
        node: Node,
        source: bytes,
        file_path: str,
        results: list[FunctionDef],
        is_method: bool,
    ) -> None:
        for child in node.children:
            if child.type == "function_definition":
                results.append(
                    self._parse_function(child, source, file_path, is_method)
                )
            elif child.type == "decorated_definition":
                # decorated functions: decorator(s) + function_definition
                for inner in child.children:
                    if inner.type == "function_definition":
                        results.append(
                            self._parse_function(inner, source, file_path, is_method)
                        )
            elif child.type not in ("class_definition",):
                # Recurse into module-level blocks but NOT into class bodies
                self._collect_functions(child, source, file_path, results, is_method)

    def _parse_function(
        self, node: Node, source: bytes, file_path: str, is_method: bool
    ) -> FunctionDef:
        name = self._first_child_text(node, source, "identifier") or "<anonymous>"
        params = self._parse_params(node, source)
        return_type = self._parse_return_type(node, source)
        body = node.child_by_field_name("body")
        docstring = self._extract_docstring_from_body(body, source) if body else None
        calls = self._walk_calls(body, source) if body else []

        return FunctionDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            parameters=params,
            return_type=return_type,
            calls=calls,
            docstring=docstring,
        )

    def _parse_params(self, func_node: Node, source: bytes) -> list[str]:
        params_node = func_node.child_by_field_name("parameters")
        if not params_node:
            return []
        result: list[str] = []
        for child in params_node.children:
            if child.type in (
                "identifier",
                "typed_parameter",
                "default_parameter",
                "typed_default_parameter",
                "list_splat_pattern",
                "dictionary_splat_pattern",
            ):
                result.append(
                    source[child.start_byte : child.end_byte].decode(
                        "utf-8", errors="replace"
                    )
                )
        return result

    def _parse_return_type(self, func_node: Node, source: bytes) -> str | None:
        ret = func_node.child_by_field_name("return_type")
        if ret:
            return source[ret.start_byte : ret.end_byte].decode(
                "utf-8", errors="replace"
            ).lstrip("->").strip()
        return None

    # ------------------------------------------------------------------
    # Classes
    # ------------------------------------------------------------------

    def _extract_classes(
        self, root: Node, source: bytes, file_path: str
    ) -> list[ClassDef]:
        results: list[ClassDef] = []
        for child in root.children:
            if child.type == "class_definition":
                results.append(self._parse_class(child, source, file_path))
            elif child.type == "decorated_definition":
                for inner in child.children:
                    if inner.type == "class_definition":
                        results.append(self._parse_class(inner, source, file_path))
        return results

    def _parse_class(self, node: Node, source: bytes, file_path: str) -> ClassDef:
        name = self._first_child_text(node, source, "identifier") or "<anonymous>"
        bases = self._parse_bases(node, source)
        body = node.child_by_field_name("body")
        docstring = self._extract_docstring_from_body(body, source) if body else None
        methods: list[FunctionDef] = []
        if body:
            self._collect_functions(body, source, file_path, methods, is_method=True)
        return ClassDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            bases=bases,
            methods=methods,
            docstring=docstring,
        )

    def _parse_bases(self, class_node: Node, source: bytes) -> list[str]:
        args = class_node.child_by_field_name("superclasses")
        if not args:
            return []
        return [
            source[c.start_byte : c.end_byte].decode("utf-8", errors="replace")
            for c in args.children
            if c.type not in (",", "(", ")", "keyword_argument")
        ]

    # ------------------------------------------------------------------
    # Imports
    # ------------------------------------------------------------------

    def _extract_imports(self, root: Node, source: bytes) -> list[ImportDef]:
        results: list[ImportDef] = []
        for child in root.children:
            if child.type == "import_statement":
                results.extend(self._parse_import(child, source))
            elif child.type == "import_from_statement":
                results.append(self._parse_import_from(child, source))
        return results

    def _parse_import(self, node: Node, source: bytes) -> list[ImportDef]:
        """import os, sys.path as sp"""
        imports: list[ImportDef] = []
        for child in node.children:
            if child.type == "dotted_name":
                module = self._node_text(child, source)
                imports.append(ImportDef(module=module))
            elif child.type == "aliased_import":
                name_node = child.child_by_field_name("name")
                alias_node = child.child_by_field_name("alias")
                module = self._node_text(name_node, source) if name_node else ""
                alias = self._node_text(alias_node, source) if alias_node else None
                imports.append(ImportDef(module=module, alias=alias))
        return imports

    def _parse_import_from(self, node: Node, source: bytes) -> ImportDef:
        """from .utils import helper, other as o"""
        # Count leading dots for relative imports
        dots = sum(1 for c in node.children if c.type in (".", "..."))
        module_node = node.child_by_field_name("module_name")
        module = self._node_text(module_node, source) if module_node else ""
        names: list[str] = []
        for child in node.children:
            if child.type == "import_from_as_names":
                for inner in child.children:
                    if inner.type in ("identifier", "aliased_import"):
                        names.append(self._node_text(inner, source))
            elif child.type == "wildcard_import":
                names.append("*")
        return ImportDef(module=module, names=names, is_relative=dots > 0)
