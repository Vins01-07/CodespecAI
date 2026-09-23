"""
Mock LLM Provider for local development and deterministic testing.
"""
from __future__ import annotations

import logging
from typing import Callable, Optional

from app.core.rag.generation.base import BaseLLMProvider
from app.models.generation_models import LLMResponse

logger = logging.getLogger(__name__)


class MockLLMProvider(BaseLLMProvider):
    """
    Deterministic Mock LLM Provider with zero external network dependencies.
    Useful for test suites, offline execution, and CI/CD pipelines.
    """

    def __init__(
        self,
        model_name: str = "mock-llm-v1",
        custom_response: Optional[str] = None,
        response_generator: Optional[Callable[[str, Optional[str]], str]] = None,
    ) -> None:
        """
        Initialize MockLLMProvider.

        Args:
            model_name: Mock model name.
            custom_response: Fixed response string to return.
            response_generator: Optional callable to generate dynamic mock answers based on prompt.
        """
        self._model_name = model_name
        self.custom_response = custom_response
        self.response_generator = response_generator

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return self._model_name

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> LLMResponse:
        """
        Generate a mock LLM answer citing relevant sources.
        """
        if self.custom_response is not None:
            content = self.custom_response
        elif self.response_generator is not None:
            content = self.response_generator(prompt, system_prompt)
        else:
            # Check if prompt contains context blocks
            if "[1]" in prompt:
                content = (
                    "Based on the provided codebase context [1], the implementation defines the requested functionality. "
                    "Related components and dependencies are linked as described in [1]."
                )
            elif "No relevant codebase context was found" in prompt:
                content = "No relevant codebase context was found in the repository for the query."
            else:
                content = f"Mock response for query based on model {self.model_name}."

        p_tokens = len(prompt) // 4
        c_tokens = len(content) // 4

        return LLMResponse(
            content=content,
            model=self.model_name,
            provider=self.provider_name,
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            total_tokens=p_tokens + c_tokens,
            finish_reason="stop",
            raw_response={"mock": True, "prompt_chars": len(prompt)},
        )

    def health_check(self) -> bool:
        return True
