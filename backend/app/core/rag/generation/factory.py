"""
Factory for instantiating the configured LLM provider.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from app.config import settings
from app.core.rag.generation.base import BaseLLMProvider
from app.core.rag.generation.providers.gemini_provider import GeminiLLMProvider
from app.core.rag.generation.providers.mock_provider import MockLLMProvider
from app.core.rag.generation.providers.ollama_provider import OllamaLLMProvider
from app.core.rag.generation.providers.openai_provider import OpenAILLMProvider

logger = logging.getLogger(__name__)


def get_llm_provider(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    **kwargs: Any,
) -> BaseLLMProvider:
    """
    Instantiate and return the configured LLM provider.
    Supported providers: 'mock', 'openai', 'gemini', 'ollama'.

    Args:
        provider: Provider name ('mock', 'openai', 'gemini', 'ollama'). Defaults to settings.LLM_PROVIDER.
        model_name: Model identifier (e.g. 'gpt-4o-mini', 'llama3'). Defaults to settings.LLM_MODEL_NAME.
        **kwargs: Additional provider-specific kwargs (e.g. api_key, base_url, timeout).

    Returns:
        Instance implementing BaseLLMProvider.
    """
    prov = (provider or settings.LLM_PROVIDER or "mock").strip().lower()
    model = model_name or settings.LLM_MODEL_NAME

    if prov == "mock":
        return MockLLMProvider(model_name=model or "mock-llm-v1", **kwargs)
    elif prov == "openai":
        return OpenAILLMProvider(model_name=model or "gpt-4o-mini", **kwargs)
    elif prov == "gemini":
        return GeminiLLMProvider(model_name=model or "gemini-1.5-flash", **kwargs)
    elif prov == "ollama":
        return OllamaLLMProvider(model_name=model or "llama3", **kwargs)
    else:
        logger.warning("Unrecognized LLM provider '%s', falling back to MockLLMProvider", prov)
        return MockLLMProvider(model_name=f"fallback-{prov}", **kwargs)
