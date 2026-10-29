"""Redis-backed per-repository lock for safe concurrent index generations."""

from typing import Any


class RepositoryLockBusy(RuntimeError):
    """Raised when another worker is reconciling the same repository."""


class RedisRepositoryLock:
    def __init__(self, redis_client: Any, timeout: int = 3600, blocking_timeout: int = 30):
        self.redis_client = redis_client
        self.timeout = timeout
        self.blocking_timeout = blocking_timeout

    def __call__(self, repository_key: str):
        return _RedisLockContext(
            self.redis_client,
            f"codespec:index:{repository_key}",
            self.timeout,
            self.blocking_timeout,
        )


class _RedisLockContext:
    def __init__(self, redis_client: Any, name: str, timeout: int, blocking_timeout: int):
        self.redis_client = redis_client
        self.name = name
        self.timeout = timeout
        self.blocking_timeout = blocking_timeout
        self.lock = None

    def __enter__(self):
        self.lock = self.redis_client.lock(
            self.name,
            timeout=self.timeout,
            blocking_timeout=self.blocking_timeout,
        )
        if not self.lock.acquire(blocking=True, blocking_timeout=self.blocking_timeout):
            raise RepositoryLockBusy("Repository indexing is already in progress")
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if self.lock is not None:
            self.lock.release()
        return False