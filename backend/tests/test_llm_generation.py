"""
Unit tests for CodeSpecAI RAG Phase 7: LLM Abstraction and Initial Provider.
Tests ContextBuilder, BaseLLMProvider, Mock/OpenAI/Gemini/Ollama providers,
provider factory, error handling, and RAGGenerationService end-to-end.
"""
from __future__ import annotations

from unittest.mock import MagicMock
import httpx
import pytest

from app.core.rag.generation.base import (
    BaseLLMProvider,
    LLMAPIError,
    LLMConfigurationError,
    LLMTimeoutError,
)
from app.core.rag.generation.context_builder import ContextBuilder
from app.core.rag.generation.factory import get_llm_provider
from app.core.rag.generation.providers.gemini_provider import GeminiLLMProvider
from app.core.rag.generation.providers.mock_provider import MockLLMProvider
from app.core.rag.generation.providers.ollama_provider import OllamaLLMProvider
from app.core.rag.generation.providers.openai_provider import OpenAILLMProvider
from app.core.rag.generation.service import RAGGenerationService
from app.models.generation_models import Citation, GenerationResult, LLMResponse
from app.models.retrieval_models import (
    RetrievalProvenance,
    RetrievalResult,
    RetrievedItem,
)


# ===========================================================================
# Fixture Helpers
# ===========================================================================

def make_test_retrieved_item(
    item_id: str = "item_1",
    file_path: str = "services/auth.py",
    symbol: str = "login",
    content: str = "def login(username, password):\n    return True",
    score: float = 0.95,
    sources: list[str] | None = None,
) -> RetrievedItem:
    return RetrievedItem(
        id=item_id,
        repository_id="repo-1",
        file_path=file_path,
        symbol=symbol,
        file_type="source_code",
        content=content,
        start_line=10,
        end_line=15,
        score=score,
        rank=1,
        provenance=RetrievalProvenance(
            sources=sources or ["vector", "graph"],
            vector_score=0.92,
            graph_score=1.0,
            graph_relationships=["CALLS"],
        ),
        metadata={"language": "python"},
    )


# ===========================================================================
# 1. ContextBuilder Tests
# ===========================================================================

def test_context_builder_formats_prompt_and_citations():
    """Test ContextBuilder creates numbered citations and prompt blocks."""
    builder = ContextBuilder()
    item1 = make_test_retrieved_item("i1", "services/auth.py", "login", score=0.9)
    item2 = make_test_retrieved_item(
        "i2",
        "services/token.py",
        "create_token",
        content="def create_token(): pass",
        score=0.8,
        sources=["vector"],
    )

    retrieval_res = RetrievalResult(
        query="how does authentication work?",
        repository_id="repo-1",
        items=[item1, item2],
        total_results=2,
        strategy_used="rrf",
    )

    context = builder.build("how does authentication work?", retrieval_res)

    assert len(context.citations) == 2
    assert context.citations[0].index == 1
    assert context.citations[0].file_path == "services/auth.py"
    assert context.citations[0].symbol == "login"
    assert context.citations[1].index == 2
    assert context.citations[1].file_path == "services/token.py"

    assert "[1] File: `services/auth.py`" in context.user_prompt
    assert "[2] File: `services/token.py`" in context.user_prompt
    assert "Graph relationships: CALLS" in context.user_prompt
    assert "def login" in context.user_prompt
    assert context.estimated_tokens > 0


def test_context_builder_empty_retrieval():
    """Test ContextBuilder handles empty results without crashing and informs prompt."""
    builder = ContextBuilder()
    retrieval_res = RetrievalResult(
        query="nonexistent term",
        repository_id="repo-empty",
        items=[],
        total_results=0,
    )

    context = builder.build("nonexistent term", retrieval_res)
    assert len(context.citations) == 0
    assert "No relevant codebase context was found in repository 'repo-empty'" in context.user_prompt


def test_context_builder_budget_truncation():
    """Test ContextBuilder respects max_context_chars to prevent prompt overflow."""
    builder = ContextBuilder(max_context_chars=120)
    item1 = make_test_retrieved_item("i1", "a.py", "fn1", content="A" * 80)
    item2 = make_test_retrieved_item("i2", "b.py", "fn2", content="B" * 80)

    retrieval_res = RetrievalResult(
        query="query",
        repository_id="repo-1",
        items=[item1, item2],
        total_results=2,
    )

    context = builder.build("query", retrieval_res)
    # item 2 should be truncated to fit budget
    assert len(context.citations) == 1
    assert context.citations[0].file_path == "a.py"


# ===========================================================================
# 2. MockLLMProvider Tests
# ===========================================================================

def test_mock_llm_provider_generation():
    """Test MockLLMProvider default behavior and citation referencing."""
    provider = MockLLMProvider(model_name="test-mock")
    assert provider.provider_name == "mock"
    assert provider.model_name == "test-mock"
    assert provider.health_check() is True

    # When prompt contains [1] citation
    resp = provider.generate(prompt="Explain login using [1]", system_prompt="You are an assistant")
    assert isinstance(resp, LLMResponse)
    assert "[1]" in resp.content
    assert resp.model == "test-mock"
    assert resp.provider == "mock"
    assert resp.total_tokens is not None


def test_mock_llm_provider_custom_response():
    """Test MockLLMProvider with explicit custom response."""
    provider = MockLLMProvider(custom_response="Fixed answer with [1].")
    resp = provider.generate("any prompt")
    assert resp.content == "Fixed answer with [1]."


# ===========================================================================
# 3. Provider Factory Tests
# ===========================================================================

def test_provider_factory_resolution():
    """Test get_llm_provider creates correct provider classes."""
    p_mock = get_llm_provider("mock")
    assert isinstance(p_mock, MockLLMProvider)

    p_openai = get_llm_provider("openai", model_name="gpt-4o", api_key="sk-test")
    assert isinstance(p_openai, OpenAILLMProvider)
    assert p_openai.model_name == "gpt-4o"
    assert p_openai.api_key == "sk-test"

    p_gemini = get_llm_provider("gemini", model_name="gemini-1.5-pro", api_key="gem-test")
    assert isinstance(p_gemini, GeminiLLMProvider)
    assert p_gemini.model_name == "gemini-1.5-pro"

    p_ollama = get_llm_provider("ollama", model_name="codellama")
    assert isinstance(p_ollama, OllamaLLMProvider)
    assert p_ollama.model_name == "codellama"

    # Fallback for unknown provider
    p_fallback = get_llm_provider("unsupported_provider_xyz")
    assert isinstance(p_fallback, MockLLMProvider)


# ===========================================================================
# 4. Error Handling & Timeout Tests
# ===========================================================================

def test_openai_missing_key_raises_configuration_error():
    """Test OpenAILLMProvider raises LLMConfigurationError if no API key is provided."""
    provider = OpenAILLMProvider(api_key=None)
    # Ensure settings key is bypassed
    provider.api_key = None
    with pytest.raises(LLMConfigurationError, match="OpenAI API key not configured"):
        provider.generate("prompt")


def test_gemini_missing_key_raises_configuration_error():
    """Test GeminiLLMProvider raises LLMConfigurationError if no API key is provided."""
    provider = GeminiLLMProvider(api_key=None)
    provider.api_key = None
    with pytest.raises(LLMConfigurationError, match="Gemini API key not configured"):
        provider.generate("prompt")


def test_openai_timeout_mapped_to_llm_timeout_error():
    """Test httpx.TimeoutException is mapped to LLMTimeoutError."""
    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.side_effect = httpx.TimeoutException("Read timed out")

    provider = OpenAILLMProvider(api_key="sk-fake", http_client=mock_client, timeout=5.0)
    with pytest.raises(LLMTimeoutError, match="timed out"):
        provider.generate("prompt")


def test_openai_http_error_mapped_to_llm_api_error():
    """Test HTTP status error is mapped to LLMAPIError."""
    mock_client = MagicMock(spec=httpx.Client)
    req = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    resp = httpx.Response(500, request=req, text="Internal Server Error")
    mock_client.post.side_effect = httpx.HTTPStatusError("Server Error", request=req, response=resp)

    provider = OpenAILLMProvider(api_key="sk-fake", http_client=mock_client)
    with pytest.raises(LLMAPIError, match="HTTP 500"):
        provider.generate("prompt")


def test_ollama_http_mock_response():
    """Test OllamaLLMProvider parsing valid response from mocked client."""
    mock_client = MagicMock(spec=httpx.Client)
    req = httpx.Request("POST", "http://localhost:11434/api/chat")
    resp_data = {
        "model": "llama3",
        "message": {"role": "assistant", "content": "Local model output [1]."},
        "prompt_eval_count": 25,
        "eval_count": 10,
        "done": True,
    }
    mock_client.post.return_value = httpx.Response(200, request=req, json=resp_data)

    provider = OllamaLLMProvider(model_name="llama3", http_client=mock_client)
    response = provider.generate("User query")

    assert response.content == "Local model output [1]."
    assert response.provider == "ollama"
    assert response.model == "llama3"
    assert response.total_tokens == 35


# ===========================================================================
# 5. RAGGenerationService Orchestration Tests
# ===========================================================================

def test_rag_generation_service_end_to_end():
    """Test full RAG generation pipeline from retrieval through prompt to answer."""
    # Mock retrieval service
    mock_retriever = MagicMock()
    item = make_test_retrieved_item("i1", "services/auth.py", "login")
    mock_retriever.query.return_value = RetrievalResult(
        query="explain login",
        repository_id="repo-1",
        items=[item],
        total_results=1,
    )

    # Mock LLM provider
    mock_llm = MockLLMProvider(custom_response="The login function validates credentials [1].")

    service = RAGGenerationService(
        hybrid_retriever=mock_retriever,
        context_builder=ContextBuilder(),
        llm_provider=mock_llm,
    )

    result = service.answer_query("explain login", repository_id="repo-1")

    assert isinstance(result, GenerationResult)
    assert result.is_successful is True
    assert result.query == "explain login"
    assert result.repository_id == "repo-1"
    assert "login function validates credentials [1]" in result.answer
    assert len(result.citations) == 1
    assert result.citations[0].file_path == "services/auth.py"
    assert result.citations[0].symbol == "login"
    assert result.provider == "mock"
    assert result.retrieval_result.total_results == 1


def test_rag_generation_service_failure_gracefully_handled():
    """Test provider failure returns failed GenerationResult without raising when strict=False."""
    mock_retriever = MagicMock()
    mock_retriever.query.return_value = RetrievalResult(query="q", repository_id="r", items=[])

    failing_llm = MagicMock(spec=BaseLLMProvider)
    failing_llm.provider_name = "failing_mock"
    failing_llm.model_name = "failing_model"
    failing_llm.generate.side_effect = LLMAPIError("API connection refused")

    service = RAGGenerationService(
        hybrid_retriever=mock_retriever,
        llm_provider=failing_llm,
        strict=False,
    )

    result = service.answer_query("q", repository_id="r")

    assert result.is_successful is False
    assert "Unable to generate response" in result.answer
    assert "API connection refused" in result.error


def test_rag_generation_service_strict_mode_raises():
    """Test provider failure raises when strict=True."""
    mock_retriever = MagicMock()
    mock_retriever.query.return_value = RetrievalResult(query="q", repository_id="r", items=[])

    failing_llm = MagicMock(spec=BaseLLMProvider)
    failing_llm.provider_name = "failing_mock"
    failing_llm.model_name = "failing_model"
    failing_llm.generate.side_effect = LLMAPIError("API connection refused")

    service = RAGGenerationService(
        hybrid_retriever=mock_retriever,
        llm_provider=failing_llm,
        strict=True,
    )

    with pytest.raises(LLMAPIError):
        service.answer_query("q", repository_id="r")
