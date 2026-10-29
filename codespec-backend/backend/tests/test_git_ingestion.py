import os
import stat
import shutil
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock
import pytest
from git import Repo

from app.core.ingestion.git_fetcher import GitFetcher
from app.workers import tasks


@pytest.fixture
def fake_git_remote(tmp_path: Path):
    """Creates a local Git repository to serve as a remote for testing GitFetcher."""
    remote_dir = tmp_path / "remote_repo"
    remote_dir.mkdir(parents=True, exist_ok=True)
    repo = Repo.init(str(remote_dir))

    # Commit on main: only README.md (no code files)
    readme = remote_dir / "README.md"
    readme.write_text("# Project Root\nDocs only.")
    repo.index.add([str(readme)])
    repo.index.commit("Initial commit on main")
    repo.git.branch("-M", "main")

    # Create backend branch: contains Python code file
    repo.git.checkout("-b", "backend")
    service_file = remote_dir / "service.py"
    service_file.write_text("def run():\n    return 'backend'\n")
    repo.index.add([str(service_file)])
    repo.index.commit("Add service.py on backend branch")

    # Switch back to main so remote HEAD is main
    repo.git.checkout("main")
    repo.close()

    yield remote_dir


def test_git_fetcher_new_clone_with_branch(fake_git_remote: Path, tmp_path: Path):
    workspace = tmp_path / "workspace"
    fetcher = GitFetcher(workspace=workspace)

    dest = fetcher.fetch(str(fake_git_remote), branch="backend")
    assert dest.exists()
    assert (dest / "service.py").exists()
    assert (dest / "README.md").exists()

    repo = Repo(str(dest))
    try:
        assert repo.active_branch.name == "backend"
        assert f"origin/backend" in [r.name for r in repo.refs]
    finally:
        repo.close()


def test_git_fetcher_existing_clone_switch_branch(fake_git_remote: Path, tmp_path: Path):
    workspace = tmp_path / "workspace"
    fetcher = GitFetcher(workspace=workspace)

    # 1. First fetch 'main' branch
    dest = fetcher.fetch(str(fake_git_remote), branch="main")
    assert dest.exists()
    assert (dest / "README.md").exists()
    assert not (dest / "service.py").exists()

    repo1 = Repo(str(dest))
    try:
        assert repo1.active_branch.name == "main"
    finally:
        repo1.close()

    # 2. Existing checkout re-used: switch to 'backend' branch
    dest2 = fetcher.fetch(str(fake_git_remote), branch="backend")
    assert dest2 == dest
    assert (dest / "service.py").exists()

    repo2 = Repo(str(dest))
    try:
        assert repo2.active_branch.name == "backend"
    finally:
        repo2.close()

    # 3. Pull latest again on existing branch
    dest3 = fetcher.fetch(str(fake_git_remote), branch="backend")
    assert dest3 == dest
    assert (dest / "service.py").exists()


def test_git_fetcher_missing_branch_raises_value_error(fake_git_remote: Path, tmp_path: Path):
    workspace = tmp_path / "workspace"
    fetcher = GitFetcher(workspace=workspace)

    with pytest.raises(ValueError, match="Branch 'nonexistent' not found in remote repository"):
        fetcher.fetch(str(fake_git_remote), branch="nonexistent")


def test_empty_repository_ingestion_rejected(fake_git_remote: Path, tmp_path: Path):
    workspace = tmp_path / "workspace"
    fetcher = GitFetcher(workspace=workspace)

    # Fetching 'main' (which only has README.md)
    dest = fetcher.fetch(str(fake_git_remote), branch="main")

    # _run_pipeline should reject this with a clear ValueError
    with pytest.raises(ValueError, match="No supported source files found in repository"):
        tasks._run_pipeline(
            repo_dir=dest,
            repo_url=str(fake_git_remote),
            repo_name="remote_repo",
            branch="main",
        )


def test_ingest_git_repo_fails_immediately_on_empty_repo(fake_git_remote: Path, monkeypatch, tmp_path: Path):
    workspace = tmp_path / "workspace"
    monkeypatch.setattr(tasks.settings, "REPO_WORKSPACE_DIR", str(workspace))

    res = tasks.ingest_git_repo.apply(args=[str(fake_git_remote)], kwargs={"branch": "main"})
    assert res.status == "FAILURE"
    assert isinstance(res.result, ValueError)
    assert "No supported source files found in repository" in str(res.result)
