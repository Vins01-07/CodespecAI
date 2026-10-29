import math
import os

import pytest

from app.core.embeddings.service import BGEM3EmbeddingProvider, EmbeddingError
from app.core.embeddings.provision import MODEL_FILES, provision_embedding_model


class FakeModel:
    def __init__(self, vector_size: int):
        self.vector_size = vector_size
        self.batch_sizes: list[int] = []

    def encode(self, texts, **kwargs):
        self.batch_sizes.append(len(texts))
        return {"dense_vecs": [[3.0] + [4.0] + [0.0] * (self.vector_size - 2) for _ in texts]}


def test_bge_provider_batches_and_normalizes_vectors(tmp_path):
    model = FakeModel(4)
    provider = BGEM3EmbeddingProvider(
        model_path=str(tmp_path),
        batch_size=2,
        vector_size=4,
        model_factory=lambda *args, **kwargs: model,
    )

    vectors = provider.embed_texts(["one", "two", "three"])

    assert model.batch_sizes == [2, 1]
    assert len(vectors) == 3
    assert vectors[0] == pytest.approx([0.6, 0.8, 0.0, 0.0])
    assert math.sqrt(sum(value * value for value in vectors[0])) == pytest.approx(1.0)


def test_bge_provider_uses_configured_local_cache_and_offline_mode(tmp_path, monkeypatch):
    import huggingface_hub

    monkeypatch.setenv("HF_HOME", "test-hf-home")
    monkeypatch.setenv("HF_HUB_CACHE", "test-hf-cache")
    monkeypatch.setenv("TRANSFORMERS_CACHE", "test-transformers-cache")
    monkeypatch.setenv("HF_HUB_OFFLINE", "0")
    monkeypatch.setenv("TRANSFORMERS_OFFLINE", "0")
    snapshot = tmp_path / "cached-model"
    snapshot.mkdir()
    download_options = {}

    def fake_snapshot_download(**kwargs):
        download_options.update(kwargs)
        return str(snapshot)

    monkeypatch.setattr(huggingface_hub, "snapshot_download", fake_snapshot_download)
    model = FakeModel(4)
    options = {}

    def factory(model_path, **kwargs):
        options["model_path"] = model_path
        options.update(kwargs)
        return model

    provider = BGEM3EmbeddingProvider(
        model_path="BAAI/bge-m3",
        vector_size=4,
        cache_dir=str(tmp_path),
        local_files_only=True,
        model_factory=factory,
    )
    provider.embed_texts(["one"])

    assert options["model_path"] == str(snapshot)
    assert options["cache_dir"] == str(tmp_path.resolve())
    assert options["use_fp16"] is False
    assert download_options == {
        "repo_id": "BAAI/bge-m3",
        "cache_dir": str(tmp_path.resolve()),
        "local_files_only": True,
        "allow_patterns": list(MODEL_FILES),
    }
    assert os.environ["HF_HUB_OFFLINE"] == "1"


def test_provision_downloads_configured_model_into_runtime_cache(tmp_path, monkeypatch):
    import huggingface_hub

    monkeypatch.setenv("HF_HOME", "test-hf-home")
    monkeypatch.setenv("HF_HUB_CACHE", "test-hf-cache")
    monkeypatch.setenv("TRANSFORMERS_CACHE", "test-transformers-cache")
    monkeypatch.setenv("HF_HUB_OFFLINE", "1")
    monkeypatch.setenv("TRANSFORMERS_OFFLINE", "1")
    calls = {}
    snapshot = tmp_path / "cache" / "models--BAAI--bge-m3" / "snapshots" / "commit"

    def fake_snapshot_download(**kwargs):
        calls.update(kwargs)
        snapshot.mkdir(parents=True)
        return str(snapshot)

    monkeypatch.setattr(huggingface_hub, "snapshot_download", fake_snapshot_download)
    result = provision_embedding_model("BAAI/bge-m3", str(tmp_path / "cache"))

    assert result == snapshot.resolve()
    assert calls == {
        "repo_id": "BAAI/bge-m3",
        "cache_dir": str((tmp_path / "cache").resolve()),
        "local_files_only": False,
        "allow_patterns": list(MODEL_FILES),
    }
    assert os.environ["HF_HUB_OFFLINE"] == "0"


def test_bge_provider_reports_model_and_output_failures_without_text(tmp_path):
    def broken_factory(*args, **kwargs):
        raise OSError("model unavailable")

    provider = BGEM3EmbeddingProvider(
        model_path=str(tmp_path), model_factory=broken_factory
    )
    with pytest.raises(EmbeddingError, match="could not be loaded"):
        provider.embed_texts(["private source text"])

    class BadOutput:
        def encode(self, texts, **kwargs):
            return {"dense_vecs": [[float("nan")]]}

    invalid_provider = BGEM3EmbeddingProvider(
        model_path=str(tmp_path),
        vector_size=1,
        model_factory=lambda *args, **kwargs: BadOutput(),
    )
    with pytest.raises(EmbeddingError, match="invalid dimension or values"):
        invalid_provider.embed_texts(["private source text"])


def test_bge_provider_rejects_empty_inputs():
    provider = BGEM3EmbeddingProvider(model_factory=lambda *args, **kwargs: FakeModel(1024))
    with pytest.raises(ValueError):
        provider.embed_texts([" "])