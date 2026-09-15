"""
Java parser using tree-sitter-java.

Extracts:
- method_declaration                       → FunctionDef
- class_declaration, interface_declaration → ClassDef
- import_declaration                       → ImportDef
"""
from __future__ import annotations

from tree_sitter import Language, Node
import tree_sitter_java as ts_java

from app.core.parser.base import BaseParser
from app.models.parser_models import ClassDef, FunctionDef, ImportDef


_CLASS_TYPES = {
    "class_declaration",
    "interface_declaration",
    "enum_declaration",
    "annotation_type_declaration",
    "record_declaration",
}


class JavaParser(BaseParser):
    """Tree-sitter based parser for Java (.java) source files."""

    @property
    def language(self) -> str:
        return "java"

    def _build_language(self) -> Language:
        return Language(ts_java.language())

    # ------------------------------------------------------------------
    # Functions
    # ------------------------------------------------------------------

    def _extract_functions(
        self, root: Node, source: bytes, file_path: str
    ) -> list[FunctionDef]:
        results: list[FunctionDef] = []
        self._walk_methods(root, source, file_path, results, depth=0)
        return results

    def _walk_methods(
        self,
        node: Node,
        source: bytes,
        file_path: str,
        results: list[FunctionDef],
        depth: int,
    ) -> None:
        for child in node.children:
            if child.type == "method_declaration":
                results.append(self._parse_method(child, source, file_path))
            elif child.type == "constructor_declaration":
                results.append(self._parse_constructor(child, source, file_path))
            else:
                # Recurse into class bodies, blocks, etc.
                self._walk_methods(child, source, file_path, results, depth + 1)

    def _parse_method(self, node: Node, source: bytes, file_path: str) -> FunctionDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<method>"
        params = self._parse_params(node, source)
        return_type = self._parse_return_type(node, source)
        body = node.child_by_field_name("body")
        calls = self._walk_calls(body, source) if body else []
        docstring = self._extract_javadoc(node, source)
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

    def _parse_constructor(
        self, node: Node, source: bytes, file_path: str
    ) -> FunctionDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<constructor>"
        params = self._parse_params(node, source)
        body = node.child_by_field_name("body")
        calls = self._walk_calls(body, source) if body else []
        return FunctionDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            parameters=params,
            return_type=None,
            calls=calls,
            docstring=self._extract_javadoc(node, source),
        )

    def _parse_params(self, node: Node, source: bytes) -> list[str]:
        params_node = node.child_by_field_name("parameters")
        if not params_node:
            return []
        return [
            self._node_text(c, source)
            for c in params_node.children
            if c.type == "formal_parameter" and c.is_named
        ]

    def _parse_return_type(self, node: Node, source: bytes) -> str | None:
        rt = node.child_by_field_name("type")
        if rt:
            return self._node_text(rt, source)
        return None

    @staticmethod
    def _extract_javadoc(node: Node, source: bytes) -> str | None:
        """Look for a /** ... */ block_comment immediately before node."""
        prev = node.prev_sibling
        while prev:
            if prev.type == "block_comment":
                text = source[prev.start_byte : prev.end_byte].decode(
                    "utf-8", errors="replace"
                )
                if text.startswith("/**"):
                    return text.strip()
            elif prev.type not in ("modifiers", "annotation"):
                break
            prev = prev.prev_sibling
        return None

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
        bases = self._parse_supers(node, source)
        body = node.child_by_field_name("body")
        methods: list[FunctionDef] = []
        if body:
            self._walk_methods(body, source, file_path, methods, 0)
        return ClassDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            bases=bases,
            methods=methods,
            docstring=self._extract_javadoc(node, source),
        )

    def _parse_supers(self, class_node: Node, source: bytes) -> list[str]:
        supers: list[str] = []
        for child in class_node.children:
            if child.type == "superclass":
                for inner in child.children:
                    if inner.is_named and inner.type not in ("extends",):
                        supers.append(self._node_text(inner, source))
            elif child.type == "super_interfaces":
                for inner in child.children:
                    if inner.type == "type_list":
                        for t in inner.children:
                            if t.is_named:
                                supers.append(self._node_text(t, source))
        return supers

    # ------------------------------------------------------------------
    # Imports
    # ------------------------------------------------------------------

    def _extract_imports(self, root: Node, source: bytes) -> list[ImportDef]:
        results: list[ImportDef] = []
        for child in root.children:
            if child.type == "import_declaration":
                results.append(self._parse_import(child, source))
        return results

    def _parse_import(self, node: Node, source: bytes) -> ImportDef:
        # import com.example.MyClass;  or  import com.example.*;
        parts: list[str] = []
        for child in node.children:
            if child.type in ("scoped_identifier", "identifier", "asterisk"):
                parts.append(self._node_text(child, source))
        module = ".".join(parts) if parts else ""
        static = any(c.type == "static" for c in node.children)
        return ImportDef(module=module, names=[], is_relative=False, alias="static" if static else None)
