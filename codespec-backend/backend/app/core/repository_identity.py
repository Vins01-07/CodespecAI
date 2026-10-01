"""Stable opaque identifiers for repository-scoped vector data."""

import hashlib


def repository_id(repo_url: str) -> str:
    """Derive an opaque ID without changing the key used by the graph schema."""
    normalized = repo_url.strip()
    if not normalized:
        raise ValueError("Repository key must not be empty")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()