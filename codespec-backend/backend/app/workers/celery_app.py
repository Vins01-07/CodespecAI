"""
Celery application factory for CodeSpec AI.

Broker  : Redis  (REDIS_URL from settings)
Backend : Redis  (same URL, different DB index)
"""
from celery import Celery
from app.config import settings

celery_app = Celery(
    "codespec",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL.replace("/0", "/1"),  # separate DB for results
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Keep task results for 24 h
    result_expires=86400,
    # Retry failed tasks up to 3 times with exponential backoff
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
)
