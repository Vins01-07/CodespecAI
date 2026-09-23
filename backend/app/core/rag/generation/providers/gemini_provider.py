"""
Google Gemini LLM Provider using httpx HTTP client.
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


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini LLM provider using REST generateContent endpoint via httpx.
    """

    def __init__(
        self,
        model_name: str = "gemini-1.5-flash",
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._model_name = model_name
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.timeout = timeout or settings.LLM_REQUEST_TIMEOUT
        self._client = http_client

    @property
    def provider_name(self) -> str:
        return "gemini"

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
        Generate answer via Gemini REST API.
        """
        if not self.api_key:
            raise LLMConfigurationError(
                "Gemini API key not configured. Set GEMINI_API_KEY environment variable or pass api_key."
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

        payload: dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature if temperature is not None else settings.LLM_TEMPERATURE,
                "maxOutputTokens": max_tokens if max_tokens is not None else settings.LLM_MAX_TOKENS,
            },
        }

        if system_prompt:
            payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

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

            candidate = data["candidates"][0]
            content = candidate["content"]["parts"][0]["text"]
            usage = data.get("usageMetadata", {})

            return LLMResponse(
                content=content,
                model=self.model_name,
                provider=self.provider_name,
                prompt_tokens=usage.get("promptTokenCount"),
                completion_tokens=usage.get("candidatesTokenCount"),
                total_tokens=usage.get("totalTokenCount"),
                finish_reason=candidate.get("finishReason"),
                raw_response=data,
            )

        except httpx.TimeoutException as exc:
            logger.error("Gemini request timed out after %.1fs: %s", self.timeout, exc)
            raise LLMTimeoutError(f"Gemini request timed out after {self.timeout}s: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            logger.error("Gemini HTTP %d error: %s", exc.response.status_code, exc.response.text)
            raise LLMAPIError(
                f"Gemini API returned HTTP {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except Exception as exc:
            logger.error("Unexpected Gemini API failure: %s", exc)
            raise LLMAPIError(f"Gemini generation failed: {exc}") from exc

    def health_check(self) -> bool:
        return bool(self.api_key)
