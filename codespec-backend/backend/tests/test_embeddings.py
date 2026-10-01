import math

import pytest

from app.core.embeddings.service import BGEM3EmbeddingProvider, EmbeddingError


class FakeModel:
    def __init__(self, vector_size: int):
        self.vector_size = vector_size
        self.batch_sizes: list[int] = []

    def encode(self, texts, **kwargs):
        self.batch_sizes.append(len(texts))
        return {"dense_vecs": [[3.0] + [4.0] + [0.0] * (self.vector_size - 2) for _ in texts]}


def test_bge_provider_batches_and_normalizes_vectors():
    model = FakeModel(4)
    provider = BGEM3EmbeddingProvider(
        batch_size=2,
        vector_size=4,
        model_factory=lambda *args, **kwargs: model,
    )

    vectors = provider.embed_texts(["one", "two", "three"])

    assert model.batch_sizes == [2, 1]
    assert len(vectors) == 3
    assert vectors[0] == pytest.approx([0.6, 0.8, 0.0, 0.0])
    assert math.sqrt(sum(value * value for value in vectors[0])) == pytest.approx(1.0)


def test_bge_provider_reports_model_and_output_failures_without_text():
    def broken_factory(*args, **kwargs):
        raise OSError("model unavailable")

    provider = BGEM3EmbeddingProvider(model_factory=broken_factory)
    with pytest.raises(EmbeddingError, match="could not be loaded"):
        provider.embed_texts(["private source text"])

    class BadOutput:
        def encode(self, texts, **kwargs):
            return {"dense_vecs": [[float("nan")]]}

    invalid_provider = BGEM3EmbeddingProvider(
        vector_size=1,
        model_factory=lambda *args, **kwargs: BadOutput(),
    )
    with pytest.raises(EmbeddingError, match="invalid dimension or values"):
        invalid_provider.embed_texts(["private source text"])


def test_bge_provider_rejects_empty_inputs():
    provider = BGEM3EmbeddingProvider(model_factory=lambda *args, **kwargs: FakeModel(1024))
    with pytest.raises(ValueError):
        provider.embed_texts([" "])