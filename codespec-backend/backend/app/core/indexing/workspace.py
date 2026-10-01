"""Resolve existing Git/ZIP checkout paths without cloning or accepting paths."""

import hashlib
from pathlib import Path


def resolve_repository_workspace(repo_url: str, workspace: Path) -> Path | None:
    workspace_root = workspace.resolve()
    if repo_url.startswith("zip://"):
        relative_name = repo_url.removeprefix("zip://")
        if not relative_name or Path(relative_name).name != relative_name or ".." in relative_name:
            return None
        candidate = workspace_root / relative_name
    else:
        repository_name = repo_url.rstrip("/").rsplit("/", 1)[-1].replace(".git", "")
        slug = hashlib.sha256(repo_url.encode("utf-8")).hexdigest()[:12]
        candidate = workspace_root / f"{repository_name}_{slug}"

    try:
        resolved = candidate.resolve(strict=True)
    except FileNotFoundError:
        return None
    if resolved.is_dir() and resolved.is_relative_to(workspace_root):
        return resolved
    return None