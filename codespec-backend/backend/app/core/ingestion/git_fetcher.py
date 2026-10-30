import hashlib
import logging
import shutil
from pathlib import Path
from git import Repo, GitCommandError
from app.config import settings

logger = logging.getLogger(__name__)


class GitFetcher:
    def __init__(self, workspace: Path | None = None):
        self.workspace = workspace or Path(settings.REPO_WORKSPACE_DIR)
        self.workspace.mkdir(parents=True, exist_ok=True)

    def fetch(self, repo_url: str, branch: str | None = None) -> Path:
        slug = hashlib.sha256(repo_url.encode("utf-8")).hexdigest()[:12]
        repo_name = repo_url.rstrip("/").rsplit("/", 1)[-1].removesuffix(".git")
        dest = self.workspace / f"{repo_name}_{slug}"

        target_branch = branch.strip() if branch else None

        if dest.exists() and not (dest / ".git").is_dir():
            logger.warning(
                "Destination %s exists but is not a valid git repository. Recreating.",
                dest,
            )
            shutil.rmtree(dest, ignore_errors=True)

        if not (dest / ".git").is_dir():
            logger.info("Initializing new git clone for %s at %s", repo_url, dest)
            dest.mkdir(parents=True, exist_ok=True)
            repo = Repo.init(str(dest))
            repo.create_remote("origin", repo_url)
        else:
            logger.info("Reusing existing git checkout for %s at %s", repo_url, dest)
            repo = Repo(str(dest))
            if "origin" in repo.remotes:
                origin = repo.remotes.origin
                if origin.url != repo_url:
                    origin.set_url(repo_url)
            else:
                repo.create_remote("origin", repo_url)
   
   #fetch the targeted branch
        try:
            if target_branch:
                logger.info(
                    "Fetching refs/heads/%s into refs/remotes/origin/%s for %s",
                    target_branch,
                    target_branch,
                    repo_url,
                )
                repo.git.fetch(
                    "origin",
                    f"+refs/heads/{target_branch}:refs/remotes/origin/{target_branch}",
                    depth=1,
                )
                logger.info("Checking out branch %s", target_branch)
                repo.git.checkout("-B", target_branch, f"origin/{target_branch}")
                repo.git.reset("--hard", f"origin/{target_branch}")
                repo.git.clean("-fd")
            else:
                logger.info("Fetching default branch from origin for %s", repo_url)
                repo.git.fetch("origin", depth=1)
                try:
                    head_ref = repo.git.symbolic_ref("refs/remotes/origin/HEAD")
                    default_branch = head_ref.split("/")[-1]
                except Exception:
                    try:
                        repo.git.show_ref("--verify", "refs/remotes/origin/main")
                        default_branch = "main"
                    except Exception:
                        try:
                            repo.git.show_ref("--verify", "refs/remotes/origin/master")
                            default_branch = "master"
                        except Exception:
                            lines = repo.git.branch("-r").splitlines()
                            default_branch = lines[0].strip().split("/")[-1] if lines else "main"

                logger.info("Checking out default branch %s", default_branch)
                repo.git.checkout("-B", default_branch, f"origin/{default_branch}")
                repo.git.reset("--hard", f"origin/{default_branch}")
                repo.git.clean("-fd")

        except GitCommandError as exc:
            err_msg = (exc.stderr or str(exc)).lower()
            if (
                "couldn't find remote ref" in err_msg
                or "did not match any file" in err_msg
                or ("remote branch" in err_msg and "not found" in err_msg)
            ):
                branch_label = target_branch or "default"
                raise ValueError(
                    f"Branch '{branch_label}' not found in remote repository '{repo_url}'."
                ) from exc
            if "repository" in err_msg and "not found" in err_msg:
                raise ValueError(
                    f"Repository '{repo_url}' not found or inaccessible."
                ) from exc
            logger.error("Git fetch operation failed for %s: %s", repo_url, exc)
            raise

        return dest