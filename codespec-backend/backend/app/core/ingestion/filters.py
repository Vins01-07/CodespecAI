from pathlib import Path

IGNORED_DIRECTORIES = {
    ".git", "node_modules", "__pycache__", ".venv", "venv",
    "dist", "build", "coverage", ".next", ".nuxt", "vendor",
    "target", "bin", "obj", ".idea", ".vscode"
}

IGNORED_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "poetry.lock", "Pipfile.lock", ".DS_Store", "Thumbs.db"
}

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".cs"
}


def should_ignore(path: Path) -> bool:
    if path.name in IGNORED_FILES:
        return True
    return any(part in IGNORED_DIRECTORIES for part in path.parts)