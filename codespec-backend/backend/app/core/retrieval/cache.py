"""Redis-backed context cache for fast grounded RAG context retrieval."""

from __future__ import annotations

import hashlib
import logging
from typing import Any

import redis

from app.config import settings
from app.models.retrieval import HybridRetrievalResponse

logger = logging.getLogger(__name__)


class RedisContextCache:
    """Caches assembled hybrid retrieval responses in Redis with SHA-256 hashed keys."""

    def __init__(
        self,
        redis_url: str = settings.REDIS_URL,
        enabled: bool = settings.REDIS_CACHE_ENABLED,
        ttl_seconds: int = settings.REDIS_CACHE_TTL_SECONDS,
        client: Any | None = None,
    ) -> None:
        self.redis_url = redis_url
        self.enabled = enabled
        self.ttl_seconds = ttl_seconds
        self._client = client

    @property
    def client(self) -> Any:
        if self._client is None and self.enabled:
            try:
                self._client = redis.from_url(self.redis_url, decode_responses=True)
            except Exception as exc:
                logger.warning("Redis cache client initialization failed (%s)", type(exc).__name__)
                self._client = None
        return self._client

    @staticmethod
    def generate_key(
        repo_id: str,
        query: str,
        top_k: int,
        graph_depth: int,
        max_context_chars: int,
    ) -> str:
        """Create deterministic SHA-256 cache key for retrieval query parameters."""
        normalized_query = " ".join(query.strip().lower().split())
        raw_key = f"{repo_id}:{normalized_query}:{top_k}:{graph_depth}:{max_context_chars}"
        digest = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        return f"codespec:context:{repo_id}:{digest}"

    def get(self, key: str) -> HybridRetrievalResponse | None:
        """Retrieve warm context response from Redis. Returns None on miss or Redis outage."""
        if not self.enabled or self.client is None:
            return None
        try:
            cached_json = self.client.get(key)
            if not cached_json:
                return None
            return HybridRetrievalResponse.model_validate_json(cached_json)
        except Exception as exc:
            logger.warning("Redis context cache read failed (%s)", type(exc).__name__)
            return None

    def set(
        self,
        key: str,
        response: HybridRetrievalResponse,
        ttl_seconds: int | None = None,
    ) -> bool:
        """Store serialized context response in Redis with TTL. Fails gracefully."""
        if not self.enabled or self.client is None:
            return False
        try:
            ttl = ttl_seconds or self.ttl_seconds
            data = response.model_dump_json()
            self.client.set(key, data, ex=ttl)
            return True
        except Exception as exc:
            logger.warning("Redis context cache write failed (%s)", type(exc).__name__)
            return False

    def health(self) -> bool:
        """Check if Redis connection is active."""
        if not self.enabled:
            return False
        try:
            return bool(self.client and self.client.ping())
        except Exception:
            return False
