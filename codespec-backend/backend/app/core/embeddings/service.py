"""Dual-mode BGE-M3 embedding provider: TEI primary with offline local fallback."""

from __future__ import annotations

import logging
import math
import os
import threading
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any, Protocol

import httpx

from app.config import settings
from app.core.embeddings.provision import resolve_model_snapshot

logger = logging.getLogger(__name__)


class EmbeddingError(RuntimeError):
    """Raised when model loading, TEI request, or embedding output validation fails."""


class EmbeddingProvider(Protocol):
    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        """Return one finite, normalized dense vector per input string."""


def normalize_vector(raw_vector: Any, expected_size: int) -> list[float]:
    """Validate and L2-normalize an embedding vector."""
    if hasattr(raw_vector, "tolist"):
        raw_vector = raw_vector.tolist()
    vector = [float(value) for value in raw_vector]
    if len(vector) != expected_size or not all(math.isfinite(value) for value in vector):
        raise EmbeddingError("Embedding vector has invalid dimension or values")
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        raise EmbeddingError("Embedding vector has zero magnitude")
    return [value / norm for value in vector]


class TEIEmbeddingProvider:
    """High-throughput Text Embeddings Inference (TEI) client."""

    def __init__(
        self,
        endpoint: str = settings.TEI_ENDPOINT or "http://localhost:8080",
        vector_size: int = settings.QDRANT_VECTOR_SIZE,
        timeout_seconds: float = settings.TEI_TIMEOUT_SECONDS,
        client: httpx.Client | None = None,
    ) -> None:
        if vector_size < 1:
            raise ValueError("Vector size must be positive")
        self.endpoint = endpoint.rstrip("/")
        self.vector_size = vector_size
        self.timeout_seconds = timeout_seconds
        self._client = client

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=self.timeout_seconds)
        return self._client

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        if any(not isinstance(text, str) or not text.strip() for text in texts):
            raise ValueError("Embedding inputs must be non-empty strings")

        url = f"{self.endpoint}/embed"
        payload = {"inputs": list(texts), "truncate": True}
        client = self._get_client()

        try:
            response = client.post(url, json=payload)
            if response.status_code != 200:
                raise EmbeddingError(
                    f"TEI service returned HTTP {response.status_code}: {response.text[:200]}"
                )
            raw_vectors = response.json()
            if not isinstance(raw_vectors, list) or len(raw_vectors) != len(texts):
                raise EmbeddingError("TEI output count does not match input count")

            return [normalize_vector(vec, self.vector_size) for vec in raw_vectors]
        except (httpx.RequestError, httpx.TimeoutException) as exc:
            logger.warning("TEI request failed to %s (%s)", url, type(exc).__name__)
            raise EmbeddingError(f"TEI service unavailable at {url}") from exc
        except EmbeddingError:
            raise
        except Exception as exc:
            logger.warning("TEI inference failed (%s)", type(exc).__name__)
            raise EmbeddingError("TEI embedding failed") from exc

    def health(self) -> bool:
        """Check if TEI service is healthy and responsive."""
        try:
            client = self._get_client()
            res = client.get(f"{self.endpoint}/health", timeout=min(2.0, self.timeout_seconds))
            return res.status_code == 200
        except Exception:
            return False


class BGEM3EmbeddingProvider:
    """Local offline BGE-M3 dense embedding provider."""

    def __init__(
        self,
        model_path: str = settings.EMBEDDING_MODEL_PATH,
        device: str = settings.EMBEDDING_DEVICE,
        batch_size: int = settings.EMBEDDING_BATCH_SIZE,
        max_length: int = settings.EMBEDDING_MAX_LENGTH,
        vector_size: int = settings.QDRANT_VECTOR_SIZE,
        local_files_only: bool = settings.EMBEDDING_LOCAL_FILES_ONLY,
        cache_dir: str = settings.EMBEDDING_CACHE_DIR,
        model_factory: Callable[..., Any] | None = None,
    ) -> None:
        if batch_size < 1 or max_length < 1 or vector_size < 1:
            raise ValueError("Embedding limits must be positive")
        self.model_path = model_path
        self.device = device
        self.batch_size = batch_size
        self.max_length = max_length
        self.vector_size = vector_size
        self.local_files_only = local_files_only
        self.cache_dir = cache_dir
        self._model_factory = model_factory
        self._model: Any | None = None
        self._lock = threading.Lock()

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        if any(not isinstance(text, str) or not text.strip() for text in texts):
            raise ValueError("Embedding inputs must be non-empty strings")

        vectors: list[list[float]] = []
        with self._lock:
            model = self._get_model()
            for batch_start in range(0, len(texts), self.batch_size):
                batch = list(texts[batch_start : batch_start + self.batch_size])
                try:
                    output = model.encode(
                        batch,
                        batch_size=len(batch),
                        max_length=self.max_length,
                        return_dense=True,
                        return_sparse=False,
                        return_colbert_vecs=False,
                    )
                    dense_vectors = output["dense_vecs"]
                    if hasattr(dense_vectors, "tolist"):
                        dense_vectors = dense_vectors.tolist()
                    if len(dense_vectors) != len(batch):
                        raise EmbeddingError("Embedding output count does not match input count")
                    vectors.extend(normalize_vector(vector, self.vector_size) for vector in dense_vectors)
                except EmbeddingError:
                    raise
                except Exception as exc:
                    logger.warning("BGE-M3 batch failed (%s)", type(exc).__name__)
                    raise EmbeddingError("BGE-M3 embedding batch failed") from exc
        return vectors

    def _get_model(self) -> Any:
        if self._model is not None:
            return self._model
        try:
            cache_dir = str(Path(self.cache_dir).expanduser().resolve())
            Path(cache_dir).mkdir(parents=True, exist_ok=True)
            os.environ["HF_HOME"] = cache_dir
            os.environ["HF_HUB_CACHE"] = cache_dir
            os.environ["TRANSFORMERS_CACHE"] = cache_dir
            offline = "1" if self.local_files_only else "0"
            os.environ["HF_HUB_OFFLINE"] = offline
            os.environ["TRANSFORMERS_OFFLINE"] = offline
            model_source = str(
                resolve_model_snapshot(
                    self.model_path,
                    cache_dir,
                    local_files_only=self.local_files_only,
                )
            )
            if self._model_factory is None:
                from FlagEmbedding import BGEM3FlagModel

                factory = BGEM3FlagModel
            else:
                factory = self._model_factory
            model_options = {
                "use_fp16": self.device.lower().startswith("cuda"),
                "cache_dir": cache_dir,
            }
            if self.device.lower() != "auto":
                model_options["devices"] = [self.device]
            self._model = factory(model_source, **model_options)
        except Exception as exc:
            logger.warning("BGE-M3 model unavailable (%s)", type(exc).__name__)
            raise EmbeddingError("BGE-M3 model could not be loaded") from exc
        return self._model


# Alias for backward compatibility
LocalEmbeddingProvider = BGEM3EmbeddingProvider


class DualModeEmbeddingProvider:
    """Orchestrates TEI primary provider with automatic fallback to local offline weights."""

    def __init__(
        self,
        tei_provider: TEIEmbeddingProvider | None = None,
        local_provider: LocalEmbeddingProvider | None = None,
        mode: str = settings.EMBEDDING_PROVIDER,
    ) -> None:
        self.mode = mode.lower()
        self.tei_provider = tei_provider
        self.local_provider = local_provider or LocalEmbeddingProvider()

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []

        # If explicitly local mode, skip TEI
        if self.mode == "local" or not self.tei_provider:
            return self.local_provider.embed_texts(texts)

        # If TEI or Dual mode, attempt TEI first
        try:
            return self.tei_provider.embed_texts(texts)
        except EmbeddingError as exc:
            if self.mode == "tei":
                raise
            logger.warning(
                "TEI embedding provider failed (%s), falling back to local model provider",
                str(exc),
            )
            return self.local_provider.embed_texts(texts)
        except Exception as exc:
            if self.mode == "tei":
                raise EmbeddingError("TEI provider failed") from exc
            logger.warning("Unexpected TEI failure (%s), falling back to local provider", type(exc).__name__)
            return self.local_provider.embed_texts(texts)