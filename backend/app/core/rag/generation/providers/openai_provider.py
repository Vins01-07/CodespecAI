"""
OpenAI LLM Provider using httpx HTTP client.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

from app.config import settings
from app.core.rag.generation.base import (
    BaseLLMProvider,
    LLMAPIError,
    LLMConfigurationError,
    LLMTimeoutError,
)
from app.models.generation_models import LLMResponse

logger = logging.getLogger(__name__)


class OpenAILLMProvider(BaseLLMProvider):
    """
    OpenAI chat completions provider using HTTP calls via httpx.
    """

    def __init__(
        self,
        model_name: str = "gpt-4o-mini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 30.0,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._model_name = model_name
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.base_url = (base_url or settings.LLM_BASE_URL or "https://api.openai.com/v1").rstrip("/")
        self.timeout = timeout or settings.LLM_REQUEST_TIMEOUT
        self._client = http_client

    @property
    def provider_name(self) -> str:
        return "openai"

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
        Generate answer via OpenAI Chat Completions API.
        """
        if not self.api_key:
            raise LLMConfigurationError(
                "OpenAI API key not configured. Set OPENAI_API_KEY environment variable or pass api_key."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature if temperature is not None else settings.LLM_TEMPERATURE,
            "max_tokens": max_tokens if max_tokens is not None else settings.LLM_MAX_TOKENS,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        url = f"{self.base_url}/chat/completions"

        try:
            client = self._get_client()
            # If using injected client, do not close it; if transient, close after use
            should_close = self._client is None
            try:
                response = client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
            finally:
                if should_close:
                    client.close()

            choice = data["choices"][0]
            content = choice["message"]["content"]
            usage = data.get("usage", {})

            return LLMResponse(
                content=content,
                model=data.get("model", self.model_name),
                provider=self.provider_name,
                prompt_tokens=usage.get("prompt_tokens"),
                completion_tokens=usage.get("completion_tokens"),
                total_tokens=usage.get("total_tokens"),
                finish_reason=choice.get("finish_reason"),
                raw_response=data,
            )

        except httpx.TimeoutException as exc:
            logger.error("OpenAI request timed out after %.1fs: %s", self.timeout, exc)
            raise LLMTimeoutError(f"OpenAI request timed out after {self.timeout}s: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            logger.error("OpenAI HTTP %d error: %s", exc.response.status_code, exc.response.text)
            raise LLMAPIError(
                f"OpenAI API returned HTTP {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except Exception as exc:
            logger.error("Unexpected OpenAI API failure: %s", exc)
            raise LLMAPIError(f"OpenAI generation failed: {exc}") from exc

    def health_check(self) -> bool:
        """Verify API key is configured."""
        return bool(self.api_key)
