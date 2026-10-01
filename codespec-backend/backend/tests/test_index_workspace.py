import hashlib
from pathlib import Path

from app.core.indexing.workspace import resolve_repository_workspace


def test_resolves_existing_git_and_zip_workspaces_only(tmp_path: Path):
    repo_url = "https://example.test/team/project.git"
    slug = hashlib.sha256(repo_url.encode("utf-8")).hexdigest()[:12]
    git_path = tmp_path / f"project_{slug}"
    zip_path = tmp_path / "upload_abc123"
    git_path.mkdir()
    zip_path.mkdir()

    assert resolve_repository_workspace(repo_url, tmp_path) == git_path.resolve()
    assert resolve_repository_workspace("zip://upload_abc123", tmp_path) == zip_path.resolve()
    assert resolve_repository_workspace("zip://../outside", tmp_path) is None
    assert resolve_repository_workspace("https://example.test/missing", tmp_path) is None