"""
Factory for instantiating the configured vector store.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.config import settings
from app.core.rag.vector_store.base import BaseVectorStore
from app.core.rag.vector_store.in_memory_vector import InMemoryVectorStore
from app.core.rag.vector_store.neo4j_vector import Neo4jVectorStore

logger = logging.getLogger(__name__)


def get_vector_store(
    provider: Optional[str] = None,
    index_name: Optional[str] = None,
    dimensions: Optional[int] = None,
    **kwargs,
) -> BaseVectorStore:
    """
    Instantiate and return the configured vector store.
    Supported providers: 'neo4j', 'in_memory'.
    """
    prov = (provider or settings.VECTOR_STORE_PROVIDER or "neo4j").lower()
    idx = index_name or settings.VECTOR_INDEX_NAME or "rag_chunk_embeddings"
    dims = dimensions or settings.VECTOR_DIMENSIONS or 1536

    if prov == "in_memory":
        return InMemoryVectorStore(index_name=idx, dimensions=dims)
    elif prov == "neo4j":
        try:
            return Neo4jVectorStore(index_name=idx, dimensions=dims, **kwargs)
        except Exception as exc:
            logger.warning("Could not connect to Neo4j vector store (%s), falling back to in_memory", exc)
            return InMemoryVectorStore(index_name=idx, dimensions=dims)
    else:
        logger.warning("Unrecognized vector store provider '%s', defaulting to in_memory", prov)
        return InMemoryVectorStore(index_name=idx, dimensions=dims)
