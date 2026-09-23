"""
Base LLM provider interface and exceptions for CodeSpecAI RAG Generation.
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Optional

from app.models.generation_models import LLMResponse

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Base exception for all LLM provider errors."""
    pass


class LLMConfigurationError(LLMError):
    """Raised when an LLM provider is misconfigured (e.g. missing API key)."""
    pass


class LLMTimeoutError(LLMError):
    """Raised when an LLM provider request times out."""
    pass


class LLMAPIError(LLMError):
    """Raised when an LLM provider returns an HTTP error or malformed response."""
    pass


class BaseLLMProvider(ABC):
    """
    Abstract interface for all LLM providers.
    Enforces a uniform generation API so the RAG pipeline remains completely
    vendor-agnostic (switchable between Mock, OpenAI, Gemini, Ollama, etc.).
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'mock', 'openai', 'gemini', 'ollama')."""
        raise NotImplementedError

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name of the active model (e.g. 'gpt-4o-mini', 'llama3')."""
        raise NotImplementedError

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> LLMResponse:
        """
        Generate a text response for the given user prompt and optional system prompt.

        Args:
            prompt: Formatted user prompt with context.
            system_prompt: Optional system instruction prompt.
            max_tokens: Optional max output tokens.
            temperature: Optional sampling temperature.

        Returns:
            Normalized LLMResponse.
        """
        raise NotImplementedError

    def health_check(self) -> bool:
        """
        Optional health check verifying provider connectivity.
        Default implementation returns True.
        """
        return True
