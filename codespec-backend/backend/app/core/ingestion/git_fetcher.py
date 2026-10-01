import hashlib ##for creating hashes
import logging ##to print useful information about the process
from pathlib import Path
from git import Repo, GitCommandError ##allows to iteract python with git repositories
from app.config import settings ## importing the settings object from your application configuration.

logger = logging.getLogger(__name__)


class GitFetcher:
    def __init__(self, workspace: Path | None = None):
        self.workspace = workspace or Path(settings.REPO_WORKSPACE_DIR)
        self.workspace.mkdir(parents=True, exist_ok=True)

    def fetch(self, repo_url: str, branch: str | None = None) -> Path:
        slug = hashlib.sha256(repo_url.encode()).hexdigest()[:12]
        repo_name = repo_url.rstrip("/").rsplit("/", 1)[-1].replace(".git", "")
        dest = self.workspace / f"{repo_name}_{slug}"

        if dest.exists():
            logger.info("Pulling latest in existing checkout: %s", dest)
            repo = Repo(str(dest))
            if branch:
                repo.git.checkout(branch)
            repo.remotes.origin.pull()
            return dest

        logger.info("Cloning %s to %s", repo_url, dest)
        clone_kwargs = {"depth": 1}
        if branch:
            clone_kwargs["branch"] = branch

        Repo.clone_from(repo_url, str(dest), **clone_kwargs)
        return dest