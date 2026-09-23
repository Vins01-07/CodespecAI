"""
Ollama Local LLM Provider using httpx HTTP client.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

from app.config import settings
from app.core.rag.generation.base import (
    BaseLLMProvider,
    LLMAPIError,
    LLMTimeoutError,
)
from app.models.generation_models import LLMResponse

logger = logging.getLogger(__name__)


class OllamaLLMProvider(BaseLLMProvider):
    """
    Local Ollama LLM provider communicating with Ollama REST API (default http://localhost:11434).
    Enables running local open-source models without changing the RAG pipeline.
    """

    def __init__(
        self,
        model_name: str = "llama3",
        base_url: Optional[str] = None,
        timeout: float = 60.0,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._model_name = model_name
        self.base_url = (base_url or settings.OLLAMA_BASE_URL or "http://localhost:11434").rstrip("/")
        self.timeout = timeout or settings.LLM_REQUEST_TIMEOUT
        self._client = http_client

    @property
    def provider_name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return self._model_name

    def _get_client(self) -> httpx.Client:
        if self._client is not None:
            return self._client
        return httpx.Client(timeout=self.timeout)

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> LLMResponse:
        """
        Generate answer via Ollama /api/chat endpoint.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature if temperature is not None else settings.LLM_TEMPERATURE,
            },
        }
        if max_tokens is not None:
            payload["options"]["num_predict"] = max_tokens

        url = f"{self.base_url}/api/chat"

        try:
            client = self._get_client()
            should_close = self._client is None
            try:
                response = client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
            finally:
                if should_close:
                    client.close()

            content = data.get("message", {}).get("content", "")
            prompt_tokens = data.get("prompt_eval_count")
            completion_tokens = data.get("eval_count")
            total_tokens = (
                prompt_tokens + completion_tokens
                if prompt_tokens is not None and completion_tokens is not None
                else None
            )

            return LLMResponse(
                content=content,
                model=data.get("model", self.model_name),
                provider=self.provider_name,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                finish_reason=data.get("done_reason") or ("stop" if data.get("done") else None),
                raw_response=data,
            )

        except httpx.TimeoutException as exc:
            logger.error("Ollama request timed out after %.1fs: %s", self.timeout, exc)
            raise LLMTimeoutError(f"Ollama request timed out after {self.timeout}s: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            logger.error("Ollama HTTP %d error: %s", exc.response.status_code, exc.response.text)
            raise LLMAPIError(
                f"Ollama API returned HTTP {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except Exception as exc:
            logger.error("Unexpected Ollama API failure: %s", exc)
            raise LLMAPIError(f"Ollama generation failed: {exc}") from exc

    def health_check(self) -> bool:
        """Check if local Ollama server is responding."""
        try:
            client = self._get_client()
            should_close = self._client is None
            try:
                resp = client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
            finally:
                if should_close:
                    client.close()
        except Exception:
            return False
