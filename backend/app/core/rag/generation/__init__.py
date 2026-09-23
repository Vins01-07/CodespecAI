"""
Generation package for CodeSpecAI RAG.
Contains ContextBuilder, LLM abstraction, providers, and RAGGenerationService.
"""
from app.core.rag.generation.base import (
    BaseLLMProvider,
    LLMAPIError,
    LLMConfigurationError,
    LLMError,
    LLMTimeoutError,
)
from app.core.rag.generation.context_builder import ContextBuilder
from app.core.rag.generation.factory import get_llm_provider
from app.core.rag.generation.rag_service import RAGService
from app.core.rag.generation.service import RAGGenerationService

__all__ = [
    "BaseLLMProvider",
    "ContextBuilder",
    "LLMAPIError",
    "LLMConfigurationError",
    "LLMError",
    "LLMTimeoutError",
    "RAGGenerationService",
    "RAGService",
    "get_llm_provider",
]
