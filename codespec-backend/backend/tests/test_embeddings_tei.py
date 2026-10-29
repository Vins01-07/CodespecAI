"""Tests for TEI client, dual-mode fallback, and offline weight verification."""

from __future__ import annotations

import httpx
import pytest

from app.core.embeddings.loader import (
    ModelWeightError,
    resolve_offline_model_directory,
    verify_offline_weights,
)
from app.core.embeddings.service import (
    DualModeEmbeddingProvider,
    EmbeddingError,
    TEIEmbeddingProvider,
)


class MockLocalProvider:
    def __init__(self, vector_size: int = 4):
        self.vector_size = vector_size
        self.call_count = 0

    def embed_texts(self, texts):
        self.call_count += 1
        return [[1.0] + [0.0] * (self.vector_size - 1) for _ in texts]


def test_offline_weight_verification_success(tmp_path):
    """Verify weight loader passes when essential files are present without network access."""
    model_dir = tmp_path / "bge-m3"
    model_dir.mkdir()
    (model_dir / "config.json").write_text('{"model_type": "xlm-roberta"}')
    (model_dir / "tokenizer.json").write_text('{"version": "1.0"}')
    (model_dir / "model.safetensors").write_bytes(b"\x00" * 128)

    info = verify_offline_weights(model_dir)
    assert info["verified"] is True
    assert info["file_count"] == 3


def test_offline_weight_verification_fails_missing_weights(tmp_path):
    """Verify ModelWeightError is raised if weight files are absent."""
    model_dir = tmp_path / "incomplete-model"
    model_dir.mkdir()
    (model_dir / "config.json").write_text('{"model_type": "xlm-roberta"}')
    (model_dir / "tokenizer.json").write_text('{"version": "1.0"}')

    with pytest.raises(ModelWeightError, match="missing required offline files"):
        verify_offline_weights(model_dir)


def test_tei_client_embeds_successfully(monkeypatch):
    """Verify TEI client requests /embed and normalizes vectors."""
    def fake_handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/embed"
        # Return 2 unnormalized vectors for 2 inputs of size 4
        return httpx.Response(200, json=[[3.0, 4.0, 0.0, 0.0], [0.0, 5.0, 0.0, 0.0]])

    transport = httpx.MockTransport(fake_handler)
    client = httpx.Client(transport=transport)
    tei = TEIEmbeddingProvider(endpoint="http://mock-tei:80", vector_size=4, client=client)

    vectors = tei.embed_texts(["hello", "world"])
    assert len(vectors) == 2
    assert vectors[0] == pytest.approx([0.6, 0.8, 0.0, 0.0])
    assert vectors[1] == pytest.approx([0.0, 1.0, 0.0, 0.0])


def test_tei_client_handles_http_error(monkeypatch):
    """Verify TEI client raises EmbeddingError when TEI endpoint fails."""
    def fake_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="Internal TEI CUDA OOM")

    transport = httpx.MockTransport(fake_handler)
    client = httpx.Client(transport=transport)
    tei = TEIEmbeddingProvider(endpoint="http://mock-tei:80", vector_size=4, client=client)

    with pytest.raises(EmbeddingError, match="HTTP 500"):
        tei.embed_texts(["hello"])


def test_dual_mode_prefers_tei_when_available():
    """Verify DualMode uses TEI primary and does not invoke local model when healthy."""
    def fake_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[[1.0, 0.0, 0.0, 0.0]])

    transport = httpx.MockTransport(fake_handler)
    tei = TEIEmbeddingProvider(
        endpoint="http://mock-tei:80",
        vector_size=4,
        client=httpx.Client(transport=transport),
    )
    local = MockLocalProvider(vector_size=4)
    dual = DualModeEmbeddingProvider(tei_provider=tei, local_provider=local, mode="dual")

    vectors = dual.embed_texts(["text"])
    assert len(vectors) == 1
    assert local.call_count == 0  # Local was never called


def test_dual_mode_falls_back_to_local_when_tei_offline():
    """Verify DualMode gracefully falls back to local provider when TEI is offline."""
    def fake_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Connection refused to TEI container")

    transport = httpx.MockTransport(fake_handler)
    tei = TEIEmbeddingProvider(
        endpoint="http://down-tei:80",
        vector_size=4,
        client=httpx.Client(transport=transport),
    )
    local = MockLocalProvider(vector_size=4)
    dual = DualModeEmbeddingProvider(tei_provider=tei, local_provider=local, mode="dual")

    vectors = dual.embed_texts(["text"])
    assert len(vectors) == 1
    assert local.call_count == 1  # Fallback succeeded seamlessly
