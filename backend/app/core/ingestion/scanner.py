from pathlib import Path ##for working files and directories
from app.core.ingestion.filters import should_ignore, SUPPORTED_EXTENSIONS #filter out unwanted files and directories, and check for supported file extensions


class RepoScanner:
    def scan(self, root_dir: Path | str) -> list[Path]: 
        root = Path(root_dir).resolve() ##to convert path to absolute path and resolve any symlinks
        if not root.is_dir():
            raise FileNotFoundError(f"Directory not found: {root}")

        files: list[Path] = [] ##list to contain path objects of files that meet the criteria
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if should_ignore(path):
                continue
            if path.suffix.lower() in SUPPORTED_EXTENSIONS:
                files.append(path)

        files.sort()
        return files