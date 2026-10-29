"""Offline model weight loader and verification for BGE-M3."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Sequence

from app.config import settings

logger = logging.getLogger(__name__)

ESSENTIAL_CONFIG_FILES = ("config.json",)
ESSENTIAL_TOKENIZER_FILES = ("tokenizer.json", "tokenizer_config.json", "sentencepiece.bpe.model")
ESSENTIAL_WEIGHT_PATTERNS = ("model.safetensors", "pytorch_model.bin", "*.safetensors")


class ModelWeightError(RuntimeError):
    """Raised when local model weights are missing or corrupt."""


def resolve_offline_model_directory(
    model_path: str = settings.EMBEDDING_MODEL_PATH,
    cache_dir: str = settings.EMBEDDING_CACHE_DIR,
) -> Path:
    """Resolve the local directory where model weights are stored.
    
    Checks direct path first, then Hugging Face cache snapshots.
    Never initiates an outbound network download.
    """
    if not model_path.strip():
        raise ModelWeightError("Model path must not be empty")

    direct_path = Path(model_path).expanduser()
    if direct_path.is_dir():
        return direct_path.resolve()

    resolved_cache = Path(cache_dir).expanduser().resolve()
    # Check standard huggingface hub directory structure: models--org--repo/snapshots/<revision>
    repo_folder = f"models--{model_path.replace('/', '--')}"
    hub_path = resolved_cache / "hub" / repo_folder / "snapshots"
    if not hub_path.is_dir():
        hub_path = resolved_cache / repo_folder / "snapshots"

    if hub_path.is_dir():
        # Pick latest snapshot directory
        snapshots = [d for d in hub_path.iterdir() if d.is_dir()]
        if snapshots:
            # Sort by modification time or name
            latest = sorted(snapshots, key=lambda p: p.stat().st_mtime, reverse=True)[0]
            return latest.resolve()

    # Fallback to direct cache_dir if it contains model files
    if resolved_cache.is_dir() and (resolved_cache / "config.json").is_file():
        return resolved_cache

    raise ModelWeightError(
        f"Offline model weights for '{model_path}' not found in '{cache_dir}' or '{model_path}'"
    )


def verify_offline_weights(
    model_directory: Path | str,
    strict_weights: bool = True,
) -> dict[str, bool | str | int]:
    """Verify that essential model files are present on disk and non-empty.
    
    Guarantees zero network calls.
    """
    model_dir = Path(model_directory).resolve()
    if not model_dir.is_dir():
        raise ModelWeightError(f"Model path '{model_dir}' is not a directory")

    missing: list[str] = []
    
    # Check config
    for cfg in ESSENTIAL_CONFIG_FILES:
        cfg_file = model_dir / cfg
        if not cfg_file.is_file() or cfg_file.stat().st_size == 0:
            missing.append(cfg)

    # Check tokenizer
    has_tokenizer = any(
        (model_dir / tok).is_file() and (model_dir / tok).stat().st_size > 0
        for tok in ESSENTIAL_TOKENIZER_FILES
    )
    if not has_tokenizer:
        missing.append("tokenizer (tokenizer.json, tokenizer_config.json, or sentencepiece.bpe.model)")

    # Check weights
    has_weights = False
    for pat in ESSENTIAL_WEIGHT_PATTERNS:
        matches = [f for f in model_dir.glob(pat) if f.is_file() and f.stat().st_size > 0]
        if matches:
            has_weights = True
            break
    if strict_weights and not has_weights:
        missing.append("weights (model.safetensors, pytorch_model.bin, or *.safetensors)")

    if missing:
        raise ModelWeightError(
            f"Model directory '{model_dir}' is missing required offline files: {', '.join(missing)}"
        )

    file_count = sum(1 for f in model_dir.iterdir() if f.is_file())
    total_bytes = sum(f.stat().st_size for f in model_dir.iterdir() if f.is_file())

    return {
        "verified": True,
        "path": str(model_dir),
        "file_count": file_count,
        "total_bytes": total_bytes,
    }
