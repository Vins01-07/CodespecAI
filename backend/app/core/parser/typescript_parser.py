"""
TypeScript / TSX parser using tree-sitter-typescript.

Extracts:
- function_declaration, method_definition, arrow_function  → FunctionDef
- class_declaration, abstract_class_declaration            → ClassDef
- import_statement                                          → ImportDef
"""
from __future__ import annotations

from tree_sitter import Language, Node
import tree_sitter_typescript as ts_typescript

from app.core.parser.base import BaseParser
from app.models.parser_models import ClassDef, FunctionDef, ImportDef


_FUNC_TYPES = {
    "function_declaration",
    "function",          # anonymous functions
    "generator_function_declaration",
}

_METHOD_TYPES = {
    "method_definition",
    "public_field_definition",
}

_CLASS_TYPES = {
    "class_declaration",
    "abstract_class_declaration",
    "class",
}


class TypeScriptParser(BaseParser):
    """Tree-sitter based parser for TypeScript (.ts / .tsx) source files."""

    @property
    def language(self) -> str:
        return "typescript"

    def _build_language(self) -> Language:
        return Language(ts_typescript.language_typescript())

    # ------------------------------------------------------------------
    # Functions
    # ------------------------------------------------------------------

    def _extract_functions(
        self, root: Node, source: bytes, file_path: str
    ) -> list[FunctionDef]:
        results: list[FunctionDef] = []
        self._walk_for_functions(root, source, file_path, results)
        return results

    def _walk_for_functions(
        self,
        node: Node,
        source: bytes,
        file_path: str,
        results: list[FunctionDef],
    ) -> None:
        for child in node.children:
            if child.type in _FUNC_TYPES:
                results.append(self._parse_function(child, source, file_path))
            elif child.type == "export_statement":
                # export function foo() / export default function
                for inner in child.children:
                    if inner.type in _FUNC_TYPES:
                        results.append(self._parse_function(inner, source, file_path))
            elif child.type == "lexical_declaration":
                # const foo = (args) => ...
                for inner in child.children:
                    if inner.type == "variable_declarator":
                        val = inner.child_by_field_name("value")
                        if val and val.type == "arrow_function":
                            name_node = inner.child_by_field_name("name")
                            name = (
                                self._node_text(name_node, source)
                                if name_node
                                else "<arrow>"
                            )
                            results.append(
                                self._parse_arrow(val, source, file_path, name)
                            )
            # Recurse — but not into class bodies (handled separately)
            elif child.type not in _CLASS_TYPES:
                self._walk_for_functions(child, source, file_path, results)

    def _parse_function(
        self, node: Node, source: bytes, file_path: str
    ) -> FunctionDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<anonymous>"
        params = self._parse_params(node, source)
        return_type = self._parse_return_type(node, source)
        body = node.child_by_field_name("body")
        calls = self._walk_calls(body, source) if body else []
        docstring = self._extract_jsdoc(node, source)
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

    def _parse_arrow(
        self, node: Node, source: bytes, file_path: str, name: str
    ) -> FunctionDef:
        params = self._parse_params(node, source)
        return_type = self._parse_return_type(node, source)
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
            docstring=None,
        )

    def _parse_params(self, node: Node, source: bytes) -> list[str]:
        params_node = node.child_by_field_name("parameters")
        if not params_node:
            # Arrow functions may use a single `identifier` as param
            p = node.child_by_field_name("parameter")
            if p:
                return [self._node_text(p, source)]
            return []
        return [
            self._node_text(c, source)
            for c in params_node.children
            if c.type
            not in (",", "(", ")", "optional_parameter") and c.is_named
        ]

    def _parse_return_type(self, node: Node, source: bytes) -> str | None:
        rt = node.child_by_field_name("return_type")
        if rt:
            return self._node_text(rt, source).lstrip(":").strip()
        return None

    @staticmethod
    def _extract_jsdoc(node: Node, source: bytes) -> str | None:
        """Look for a /** ... */ comment immediately before `node`."""
        prev = node.prev_sibling
        while prev and prev.type in ("comment",):
            text = source[prev.start_byte : prev.end_byte].decode(
                "utf-8", errors="replace"
            )
            if text.startswith("/**"):
                return text.strip()
            prev = prev.prev_sibling
        return None

    # ------------------------------------------------------------------
    # Classes
    # ------------------------------------------------------------------

    def _extract_classes(
        self, root: Node, source: bytes, file_path: str
    ) -> list[ClassDef]:
        results: list[ClassDef] = []
        self._walk_for_classes(root, source, file_path, results)
        return results

    def _walk_for_classes(
        self,
        node: Node,
        source: bytes,
        file_path: str,
        results: list[ClassDef],
    ) -> None:
        for child in node.children:
            if child.type in _CLASS_TYPES:
                results.append(self._parse_class(child, source, file_path))
            elif child.type == "export_statement":
                for inner in child.children:
                    if inner.type in _CLASS_TYPES:
                        results.append(self._parse_class(inner, source, file_path))
            else:
                self._walk_for_classes(child, source, file_path, results)

    def _parse_class(self, node: Node, source: bytes, file_path: str) -> ClassDef:
        name_node = node.child_by_field_name("name")
        name = self._node_text(name_node, source) if name_node else "<anonymous>"
        bases = self._parse_heritage(node, source)
        body = node.child_by_field_name("body")
        methods: list[FunctionDef] = []
        if body:
            for child in body.children:
                if child.type in _METHOD_TYPES:
                    fn_name_node = child.child_by_field_name("name")
                    fn_name = (
                        self._node_text(fn_name_node, source)
                        if fn_name_node
                        else "<method>"
                    )
                    fn_body = child.child_by_field_name("value") or child.child_by_field_name("body")
                    params = self._parse_params(child, source)
                    rt = self._parse_return_type(child, source)
                    calls = self._walk_calls(fn_body, source) if fn_body else []
                    methods.append(
                        FunctionDef(
                            name=fn_name,
                            file_path=file_path,
                            line_start=child.start_point[0] + 1,
                            line_end=child.end_point[0] + 1,
                            parameters=params,
                            return_type=rt,
                            calls=calls,
                            docstring=self._extract_jsdoc(child, source),
                        )
                    )
        return ClassDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            bases=bases,
            methods=methods,
            docstring=self._extract_jsdoc(node, source),
        )

    def _parse_heritage(self, class_node: Node, source: bytes) -> list[str]:
        heritage = []
        for child in class_node.children:
            if child.type == "class_heritage":
                for inner in child.children:
                    if inner.type == "extends_clause":
                        for t in inner.children:
                            if t.is_named and t.type not in ("extends",):
                                heritage.append(self._node_text(t, source))
                    elif inner.type == "implements_clause":
                        for t in inner.children:
                            if t.is_named and t.type not in ("implements",):
                                heritage.append(self._node_text(t, source))
        return heritage

    # ------------------------------------------------------------------
    # Imports
    # ------------------------------------------------------------------

    def _extract_imports(self, root: Node, source: bytes) -> list[ImportDef]:
        results: list[ImportDef] = []
        for child in root.children:
            if child.type == "import_statement":
                results.append(self._parse_import(child, source))
        return results

    def _parse_import(self, node: Node, source: bytes) -> ImportDef:
        source_node = node.child_by_field_name("source")
        module = ""
        if source_node:
            raw = self._node_text(source_node, source)
            module = raw.strip("'\"")
        names: list[str] = []
        for child in node.children:
            if child.type == "import_clause":
                for inner in child.children:
                    if inner.type == "named_imports":
                        for spec in inner.children:
                            if spec.type == "import_specifier":
                                names.append(self._node_text(spec, source))
                    elif inner.type == "identifier":
                        names.append(self._node_text(inner, source))
        is_relative = module.startswith(".")
        return ImportDef(module=module, names=names, is_relative=is_relative)
