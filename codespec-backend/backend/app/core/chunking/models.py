"""Immutable chunk data shared by embedding and vector-store services."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CodeChunk:
    chunk_id: str
    repository_id: str
    file_path: str
    entity_id: str
    entity_name: str
    entity_type: str
    language: str
    start_line: int
    end_line: int
    chunk_index: int
    content_hash: str
    file_revision: str
    text: str
