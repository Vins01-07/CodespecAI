"""Provision the configured BGE-M3 model into the local Hugging Face cache."""

from __future__ import annotations

import os
from pathlib import Path

from app.config import settings

MODEL_FILES = (
    "config.json",
    "pytorch_model.bin",
    "model.safetensors",
    "*.safetensors",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    "added_tokens.json",
    "sentencepiece.bpe.model",
    "vocab.txt",
    "merges.txt",
    "colbert_linear.pt",
    "sparse_linear.pt",
    "modules.json",
    "1_Pooling/**",
    "config_sentence_transformers.json",
    "sentence_bert_config.json",
)


def resolve_model_snapshot(
    model_path: str,
    cache_dir: str,
    *,
    local_files_only: bool,
) -> Path:
    """Resolve a local model directory or the configured HF snapshot."""
    if not model_path.strip():
        raise ValueError("EMBEDDING_MODEL_PATH must not be empty")
    configured_path = Path(model_path).expanduser()
    if configured_path.is_dir():
        return configured_path.resolve()
    if configured_path.exists():
        raise ValueError("EMBEDDING_MODEL_PATH must be a model ID or model directory")

    resolved_cache = Path(cache_dir).expanduser().resolve()
    resolved_cache.mkdir(parents=True, exist_ok=True)
    os.environ["HF_HOME"] = str(resolved_cache)
    os.environ["HF_HUB_CACHE"] = str(resolved_cache)
    os.environ["TRANSFORMERS_CACHE"] = str(resolved_cache)
    offline = "1" if local_files_only else "0"
    os.environ["HF_HUB_OFFLINE"] = offline
    os.environ["TRANSFORMERS_OFFLINE"] = offline

    from huggingface_hub import snapshot_download

    snapshot_path = snapshot_download(
        repo_id=model_path,
        cache_dir=str(resolved_cache),
        local_files_only=local_files_only,
        allow_patterns=list(MODEL_FILES),
    )
    provisioned_path = Path(snapshot_path).resolve()
    if not provisioned_path.is_dir():
        raise RuntimeError("Hugging Face did not return a local model snapshot directory")
    return provisioned_path


def provision_embedding_model(
    model_path: str = settings.EMBEDDING_MODEL_PATH,
    cache_dir: str = settings.EMBEDDING_CACHE_DIR,
) -> Path:
    """Download a model repository outside the runtime inference path."""
    return resolve_model_snapshot(
        model_path,
        cache_dir,
        local_files_only=False,
    )


def main() -> None:
    model_directory = provision_embedding_model()
    print(f"Provisioned {settings.EMBEDDING_MODEL_PATH} at {model_directory}")
    print(f"Runtime local-only mode: {settings.EMBEDDING_LOCAL_FILES_ONLY}")


if __name__ == "__main__":
    main()
