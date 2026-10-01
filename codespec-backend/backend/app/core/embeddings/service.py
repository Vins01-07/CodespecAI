"""Lazy local BGE-M3 dense embedding provider."""

from __future__ import annotations

import logging
import math
import os
import threading
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any, Protocol

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingError(RuntimeError):
    """Raised when model loading or embedding output validation fails."""


class EmbeddingProvider(Protocol):
    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        """Return one finite, normalized dense vector per input string."""


class BGEM3EmbeddingProvider:
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
                    vectors.extend(self._normalize(vector) for vector in dense_vectors)
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
            Path(self.cache_dir).mkdir(parents=True, exist_ok=True)
            os.environ.setdefault("HF_HOME", self.cache_dir)
            os.environ.setdefault("TRANSFORMERS_CACHE", self.cache_dir)
            if self.local_files_only:
                os.environ["HF_HUB_OFFLINE"] = "1"
                os.environ["TRANSFORMERS_OFFLINE"] = "1"
            if self._model_factory is None:
                from FlagEmbedding import BGEM3FlagModel

                factory = BGEM3FlagModel
            else:
                factory = self._model_factory
            model_options = {"use_fp16": self.device.lower().startswith("cuda")}
            if self.device.lower() != "auto":
                model_options["devices"] = [self.device]
            self._model = factory(self.model_path, **model_options)
        except Exception as exc:
            logger.warning("BGE-M3 model unavailable (%s)", type(exc).__name__)
            raise EmbeddingError("BGE-M3 model could not be loaded") from exc
        return self._model

    def _normalize(self, raw_vector: Any) -> list[float]:
        if hasattr(raw_vector, "tolist"):
            raw_vector = raw_vector.tolist()
        vector = [float(value) for value in raw_vector]
        if len(vector) != self.vector_size or not all(math.isfinite(value) for value in vector):
            raise EmbeddingError("Embedding vector has invalid dimension or values")
        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            raise EmbeddingError("Embedding vector has zero magnitude")
        return [value / norm for value in vector]