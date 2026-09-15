"""
C# parser using tree-sitter-c-sharp.

Extracts:
- method_declaration, constructor_declaration, local_function_statement → FunctionDef
- class_declaration, interface_declaration, record_declaration          → ClassDef
- using_directive                                                        → ImportDef
"""
from __future__ import annotations

from tree_sitter import Language, Node
import tree_sitter_c_sharp as ts_csharp

from app.core.parser.base import BaseParser
from app.models.parser_models import ClassDef, FunctionDef, ImportDef


_CLASS_TYPES = {
    "class_declaration",
    "interface_declaration",
    "struct_declaration",
    "record_declaration",
    "enum_declaration",
}

_METHOD_TYPES = {
    "method_declaration",
    "constructor_declaration",
    "local_function_statement",
    "operator_declaration",
    "conversion_operator_declaration",
}


class CSharpParser(BaseParser):
    """Tree-sitter based parser for C# (.cs) source files."""

    @property
    def language(self) -> str:
        return "csharp"

    def _build_language(self) -> Language:
        return Language(ts_csharp.language())

    # ------------------------------------------------------------------
    # Functions
    # ------------------------------------------------------------------

    def _extract_functions(
        self, root: Node, source: bytes, file_path: str
    ) -> list[FunctionDef]:
        results: list[FunctionDef] = []
        self._walk_methods(root, source, file_path, results)
        return results

    def _walk_methods(
        self,
        node: Node,
        source: bytes,
        file_path: str,
        results: list[FunctionDef],
    ) -> None:
        for child in node.children:
            if child.type in _METHOD_TYPES:
                results.append(self._parse_method(child, source, file_path))
            elif child.type not in _CLASS_TYPES:
                self._walk_methods(child, source, file_path, results)

    def _parse_method(self, node: Node, source: bytes, file_path: str) -> FunctionDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<method>"
        params = self._parse_params(node, source)
        return_type = self._parse_return_type(node, source)
        body = node.child_by_field_name("body")
        calls = self._walk_calls(body, source) if body else []
        docstring = self._extract_xmldoc(node, source)
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

    def _parse_params(self, node: Node, source: bytes) -> list[str]:
        params_node = node.child_by_field_name("parameters")
        if not params_node:
            return []
        return [
            self._node_text(c, source)
            for c in params_node.children
            if c.type == "parameter" and c.is_named
        ]

    def _parse_return_type(self, node: Node, source: bytes) -> str | None:
        rt = node.child_by_field_name("type")
        if rt:
            return self._node_text(rt, source)
        return None

    @staticmethod
    def _extract_xmldoc(node: Node, source: bytes) -> str | None:
        """C# XML doc comments: lines of /// ... directly above declaration."""
        comments: list[str] = []
        prev = node.prev_sibling
        while prev and prev.type == "comment":
            text = source[prev.start_byte : prev.end_byte].decode(
                "utf-8", errors="replace"
            )
            if text.startswith("///"):
                comments.insert(0, text)
            else:
                break
            prev = prev.prev_sibling
        return "\n".join(comments) if comments else None

    # ------------------------------------------------------------------
    # Classes
    # ------------------------------------------------------------------

    def _extract_classes(
        self, root: Node, source: bytes, file_path: str
    ) -> list[ClassDef]:
        results: list[ClassDef] = []
        self._walk_classes(root, source, file_path, results)
        return results

    def _walk_classes(
        self, node: Node, source: bytes, file_path: str, results: list[ClassDef]
    ) -> None:
        for child in node.children:
            if child.type in _CLASS_TYPES:
                results.append(self._parse_class(child, source, file_path))
            else:
                self._walk_classes(child, source, file_path, results)

    def _parse_class(self, node: Node, source: bytes, file_path: str) -> ClassDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<class>"
        bases = self._parse_bases(node, source)
        body = node.child_by_field_name("body") or node.child_by_field_name("declaration_list")
        methods: list[FunctionDef] = []
        if body:
            self._walk_methods(body, source, file_path, methods)
        return ClassDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            bases=bases,
            methods=methods,
            docstring=self._extract_xmldoc(node, source),
        )

    def _parse_bases(self, class_node: Node, source: bytes) -> list[str]:
        bases: list[str] = []
        for child in class_node.children:
            if child.type == "base_list":
                for inner in child.children:
                    if inner.is_named and inner.type not in (":",):
                        bases.append(self._node_text(inner, source))
        return bases

    # ------------------------------------------------------------------
    # Imports (using directives)
    # ------------------------------------------------------------------

    def _extract_imports(self, root: Node, source: bytes) -> list[ImportDef]:
        results: list[ImportDef] = []
        for child in root.children:
            if child.type == "using_directive":
                results.append(self._parse_using(child, source))
        return results

    def _parse_using(self, node: Node, source: bytes) -> ImportDef:
        # using System.Collections.Generic;
        # using Alias = Some.Namespace;
        alias_node = node.child_by_field_name("alias")
        name_node = node.child_by_field_name("name")
        module = self._node_text(name_node, source) if name_node else ""
        alias = self._node_text(alias_node, source) if alias_node else None
        is_static = any(c.type == "static" for c in node.children)
        return ImportDef(
            module=module,
            alias=alias or ("static" if is_static else None),
        )
