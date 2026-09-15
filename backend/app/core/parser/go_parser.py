"""
Go parser using tree-sitter-go.

Extracts:
- function_declaration  → FunctionDef (top-level funcs)
- method_declaration    → FunctionDef (receiver methods)
- type_declaration      → ClassDef    (struct / interface types)
- import_declaration    → ImportDef
"""
from __future__ import annotations

from tree_sitter import Language, Node
import tree_sitter_go as ts_go

from app.core.parser.base import BaseParser
from app.models.parser_models import ClassDef, FunctionDef, ImportDef


class GoParser(BaseParser):
    """Tree-sitter based parser for Go (.go) source files."""

    @property
    def language(self) -> str:
        return "go"

    def _build_language(self) -> Language:
        return Language(ts_go.language())

    # ------------------------------------------------------------------
    # Functions
    # ------------------------------------------------------------------

    def _extract_functions(
        self, root: Node, source: bytes, file_path: str
    ) -> list[FunctionDef]:
        results: list[FunctionDef] = []
        for child in root.children:
            if child.type == "function_declaration":
                results.append(self._parse_func(child, source, file_path))
            elif child.type == "method_declaration":
                results.append(self._parse_method(child, source, file_path))
        return results

    def _parse_func(self, node: Node, source: bytes, file_path: str) -> FunctionDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<func>"
        params = self._parse_params(node.child_by_field_name("parameters"), source)
        return_type = self._parse_result(node, source)
        body = node.child_by_field_name("body")
        calls = self._walk_calls(body, source) if body else []
        return FunctionDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            parameters=params,
            return_type=return_type,
            calls=calls,
            docstring=self._extract_go_comment(node, source),
        )

    def _parse_method(self, node: Node, source: bytes, file_path: str) -> FunctionDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<method>"
        receiver = node.child_by_field_name("receiver")
        receiver_text = ""
        if receiver:
            receiver_text = self._node_text(receiver, source).strip("() ")
        params = self._parse_params(node.child_by_field_name("parameters"), source)
        return_type = self._parse_result(node, source)
        body = node.child_by_field_name("body")
        calls = self._walk_calls(body, source) if body else []
        return FunctionDef(
            name=f"{receiver_text}.{name}" if receiver_text else name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            parameters=params,
            return_type=return_type,
            calls=calls,
            docstring=self._extract_go_comment(node, source),
        )

    def _parse_params(self, params_node: Node | None, source: bytes) -> list[str]:
        if not params_node:
            return []
        result: list[str] = []
        for child in params_node.children:
            if child.type == "parameter_declaration":
                result.append(self._node_text(child, source))
            elif child.type == "variadic_parameter_declaration":
                result.append("..." + self._node_text(child, source))
        return result

    def _parse_result(self, node: Node, source: bytes) -> str | None:
        result = node.child_by_field_name("result")
        if result:
            return self._node_text(result, source)
        return None

    @staticmethod
    def _extract_go_comment(node: Node, source: bytes) -> str | None:
        """Go doc comments are single-line // comments directly above the declaration."""
        comments: list[str] = []
        prev = node.prev_sibling
        while prev and prev.type == "comment":
            text = source[prev.start_byte : prev.end_byte].decode(
                "utf-8", errors="replace"
            )
            comments.insert(0, text)
            prev = prev.prev_sibling
        return "\n".join(comments) if comments else None

    # ------------------------------------------------------------------
    # Classes (structs / interfaces modelled as ClassDef)
    # ------------------------------------------------------------------

    def _extract_classes(
        self, root: Node, source: bytes, file_path: str
    ) -> list[ClassDef]:
        results: list[ClassDef] = []
        for child in root.children:
            if child.type == "type_declaration":
                for spec in child.children:
                    if spec.type == "type_spec":
                        type_node = spec.child_by_field_name("type")
                        if type_node and type_node.type in (
                            "struct_type",
                            "interface_type",
                        ):
                            results.append(
                                self._parse_type_spec(spec, source, file_path)
                            )
        return results

    def _parse_type_spec(
        self, spec_node: Node, source: bytes, file_path: str
    ) -> ClassDef:
        name_node = spec_node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<type>"
        return ClassDef(
            name=name,
            file_path=file_path,
            line_start=spec_node.start_point[0] + 1,
            line_end=spec_node.end_point[0] + 1,
            bases=[],
            methods=[],
            docstring=self._extract_go_comment(spec_node.parent, source)
            if spec_node.parent
            else None,
        )

    # ------------------------------------------------------------------
    # Imports
    # ------------------------------------------------------------------

    def _extract_imports(self, root: Node, source: bytes) -> list[ImportDef]:
        results: list[ImportDef] = []
        for child in root.children:
            if child.type == "import_declaration":
                results.extend(self._parse_import_decl(child, source))
        return results

    def _parse_import_decl(self, node: Node, source: bytes) -> list[ImportDef]:
        imports: list[ImportDef] = []
        for child in node.children:
            if child.type == "import_spec_list":
                for spec in child.children:
                    if spec.type == "import_spec":
                        imports.append(self._parse_import_spec(spec, source))
            elif child.type == "import_spec":
                imports.append(self._parse_import_spec(child, source))
        return imports

    def _parse_import_spec(self, spec: Node, source: bytes) -> ImportDef:
        path_node = spec.child_by_field_name("path")
        module = ""
        if path_node:
            raw = self._node_text(path_node, source)
            module = raw.strip('"')
        alias_node = spec.child_by_field_name("name")
        alias = self._node_text(alias_node, source) if alias_node else None
        return ImportDef(module=module, alias=alias)
