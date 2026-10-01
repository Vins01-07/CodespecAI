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
        self._collect_functions(root, source, file_path, results, is_method=False, class_name=None)
        return results

    def _collect_functions(
        self,
        node: Node,
        source: bytes,
        file_path: str,
        results: list[FunctionDef],
        is_method: bool,
        class_name: str | None = None,
    ) -> None:
        for child in node.children:
            if child.type == "function_definition":
                results.append(
                    self._parse_function(child, source, file_path, is_method, class_name)
                )
            elif child.type == "decorated_definition":
                # decorated functions: decorator(s) + function_definition
                for inner in child.children:
                    if inner.type == "function_definition":
                        results.append(
                            self._parse_function(inner, source, file_path, is_method, class_name)
                        )
            elif child.type not in ("class_definition",):
                # Recurse into module-level blocks but NOT into class bodies
                self._collect_functions(child, source, file_path, results, is_method, class_name)

    def _parse_function(
        self,
        node: Node,
        source: bytes,
        file_path: str,
        is_method: bool,
        class_name: str | None = None,
    ) -> FunctionDef:
        name = self._first_child_text(node, source, "identifier") or "<anonymous>"
        params = self._parse_params(node, source)
        return_type = self._parse_return_type(node, source)
        body = node.child_by_field_name("body")
        docstring = self._extract_docstring_from_body(body, source) if body else None
        calls = self._walk_calls(body, source) if body else []
        instantiations = self._extract_python_instantiations(body, source) if body else []
        uses = self._extract_python_uses(node, body, source, instantiations)

        return FunctionDef(
            name=name,
            file_path=file_path,
            line_start=node.start_point[0] + 1,
            line_end=node.end_point[0] + 1,
            parameters=params,
            return_type=return_type,
            calls=calls,
            docstring=docstring,
            class_name=class_name,
            instantiations=instantiations,
            uses=uses,
        )

    def _extract_python_instantiations(self, body_node: Node, source: bytes) -> list[str]:
        """Detect object instantiations like Calculator() or module.Calculator()."""
        instantiations: list[str] = []

        def _walk(n: Node) -> None:
            if n.type == "call":
                fn_node = n.child_by_field_name("function")
                if fn_node:
                    fn_text = self._node_text(fn_node, source).strip()
                    # Check if target name ends with an uppercase identifier (PEP 8 class naming)
                    last_part = fn_text.split(".")[-1]
                    if last_part and last_part[0].isupper() and not last_part.isupper():
                        instantiations.append(fn_text)
            for child in n.children:
                _walk(child)

        _walk(body_node)
        return list(dict.fromkeys(instantiations))

    def _extract_python_uses(
        self, func_node: Node, body_node: Node | None, source: bytes, instantiations: list[str]
    ) -> list[str]:
        """Collect class and type dependencies from parameters, return type, and body."""
        uses: set[str] = set()
        builtin_types = {
            "int", "float", "str", "bool", "bytes", "list", "dict", "set",
            "tuple", "None", "Any", "Optional", "Union", "Callable", "Iterable",
            "Sequence", "Mapping", "object", "type", "self", "cls",
        }

        def _add_type_str(raw: str | None) -> None:
            if not raw:
                return
            # Split out identifiers from complex annotations like Optional[User] or list[User]
            import re
            for token in re.findall(r"\b[A-Za-z_][A-Za-z0-9_]*\b", raw):
                if token not in builtin_types and (token[0].isupper() or "_" in token):
                    uses.add(token)

        # 1. Parameter type annotations
        params_node = func_node.child_by_field_name("parameters")
        if params_node:
            for child in params_node.children:
                if child.type in ("typed_parameter", "typed_default_parameter"):
                    type_node = child.child_by_field_name("type")
                    if type_node:
                        _add_type_str(self._node_text(type_node, source))

        # 2. Return type annotation
        ret_type = self._parse_return_type(func_node, source)
        _add_type_str(ret_type)

        # 3. Instantiations are also uses
        for inst in instantiations:
            cls_name = inst.split(".")[-1]
            if cls_name not in builtin_types:
                uses.add(cls_name)

        # 4. Body type annotations (e.g. user: User = ...)
        if body_node:
            def _walk_body_types(n: Node) -> None:
                if n.type == "type":
                    _add_type_str(self._node_text(n, source))
                elif n.type == "call":
                    # Check isinstance(x, User) or issubclass(x, User)
                    fn_node = n.child_by_field_name("function")
                    if fn_node and self._node_text(fn_node, source) in ("isinstance", "issubclass"):
                        args_node = n.child_by_field_name("arguments")
                        if args_node and len(args_node.children) >= 3:
                            # 2nd argument
                            for arg in args_node.children[1:]:
                                if arg.type == "identifier":
                                    _add_type_str(self._node_text(arg, source))
                for child in n.children:
                    _walk_body_types(child)

            _walk_body_types(body_node)

        return sorted(uses)

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
            self._collect_functions(body, source, file_path, methods, is_method=True, class_name=name)
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
