"""
Benchmark dataset schemas and models for CodeSpecAI RAG evaluation.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional
from pydantic import BaseModel, Field


class BenchmarkItem(BaseModel):
    """
    A single evaluation query with ground truth source provenance and expected answers.
    """
    question_id: str = Field(..., description="Unique identifier for the benchmark question")
    repository_id: str = Field(..., description="Repository isolation scope")
    question: str = Field(..., description="User question or query about the codebase")
    relevant_files: list[str] = Field(
        default_factory=list,
        description="List of ground truth file paths relevant to answering the question",
    )
    relevant_symbols: list[str] = Field(
        default_factory=list,
        description="List of ground truth symbol names (functions, classes) relevant to the query",
    )
    relevant_sections: list[str] = Field(
        default_factory=list,
        description="Markdown documentation headings or config sections relevant to the query",
    )
    relevant_pages: list[int] = Field(
        default_factory=list,
        description="1-indexed PDF page numbers relevant to the query",
    )
    relevance_grades: dict[str, int] = Field(
        default_factory=dict,
        description="Optional graded relevance map (e.g. 'auth.py' -> 3, 'user.py' -> 1) for NDCG",
    )
    ground_truth_answer: Optional[str] = Field(
        None,
        description="Gold standard reference answer for generation evaluation",
    )
    expected_concepts: list[str] = Field(
        default_factory=list,
        description="Key terms, facts, or entities expected in a complete answer",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional evaluation metadata (e.g., query category, complexity)",
    )

    def is_file_relevant(self, file_path: str) -> bool:
        """Check if file_path matches any relevant file (normalizing slashes)."""
        clean = file_path.replace("\\", "/").strip().lower()
        for rf in self.relevant_files:
            if clean == rf.replace("\\", "/").strip().lower() or clean.endswith(rf.replace("\\", "/").strip().lower()):
                return True
        return False

    def is_symbol_relevant(self, symbol: Optional[str]) -> bool:
        """Check if symbol matches any relevant symbol."""
        if not symbol:
            return False
        clean = symbol.strip().lower()
        for rs in self.relevant_symbols:
            if clean == rs.strip().lower() or clean.endswith(f".{rs.strip().lower()}"):
                return True
        return False

    def get_grade(self, item_identifier: str) -> int:
        """Get relevance grade (default: 1 if relevant, 0 if not)."""
        if item_identifier in self.relevance_grades:
            return self.relevance_grades[item_identifier]
        if self.is_file_relevant(item_identifier) or self.is_symbol_relevant(item_identifier):
            return 1
        return 0


class BenchmarkDataset(BaseModel):
    """
    Collection of benchmark items representing an evaluation suite.
    """
    name: str = Field(..., description="Dataset name")
    version: str = Field("1.0.0", description="Dataset version")
    description: Optional[str] = Field(None, description="Dataset description")
    repository_id: Optional[str] = Field(None, description="Primary repository ID if single-repo")
    items: list[BenchmarkItem] = Field(default_factory=list, description="List of benchmark items")

    @classmethod
    def from_file(cls, path: str | Path) -> BenchmarkDataset:
        """Load benchmark dataset from a JSON file."""
        file_path = Path(path)
        with file_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(**data)

    def to_file(self, path: str | Path) -> None:
        """Persist benchmark dataset to a JSON file."""
        file_path = Path(path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with file_path.open("w", encoding="utf-8") as f:
            json.dump(self.model_dump(), f, indent=2)
