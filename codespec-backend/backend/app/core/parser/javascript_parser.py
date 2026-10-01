"""
JavaScript / JSX parser using tree-sitter-javascript.

Extracts the same structural elements as TypeScriptParser but without
type annotations — reuses all TS logic via subclassing and overrides
only the language + Language build step.
"""
from __future__ import annotations

from tree_sitter import Language, Node
import tree_sitter_javascript as ts_javascript

from app.core.parser.typescript_parser import TypeScriptParser


class JavaScriptParser(TypeScriptParser):
    """
    Tree-sitter parser for JavaScript (.js / .jsx).

    Inherits all extraction logic from TypeScriptParser since the
    JavaScript grammar is a strict subset of the TypeScript grammar
    (no type annotations, no abstract classes). The only difference
    is the underlying tree-sitter Language object.
    """

    @property
    def language(self) -> str:
        return "javascript"

    def _build_language(self) -> Language:
        return Language(ts_javascript.language())
