import zipfile
import hashlib
from pathlib import Path
from app.config import settings


class ZipHandler:
    def __init__(self, workspace: Path | None = None):
        self.workspace = workspace or Path(settings.REPO_WORKSPACE_DIR)
        self.workspace.mkdir(parents=True, exist_ok=True)

    def extract(self, zip_bytes: bytes, filename: str) -> tuple[Path, str]:
        slug = hashlib.sha256(zip_bytes).hexdigest()[:12]
        clean_name = Path(filename).stem
        dest = self.workspace / f"{clean_name}_{slug}"
        dest.mkdir(parents=True, exist_ok=True)

        zip_temp_path = dest / "upload.zip"
        zip_temp_path.write_bytes(zip_bytes)

        with zipfile.ZipFile(zip_temp_path, "r") as zip_ref:
            zip_ref.extractall(dest)

        zip_temp_path.unlink()
        repo_identifier = f"zip://{clean_name}_{slug}"
        return dest, repo_identifier