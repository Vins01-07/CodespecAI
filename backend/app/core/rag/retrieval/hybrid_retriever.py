"""
HybridRetriever — Unified retrieval pipeline combining semantic vector search
and Neo4j knowledge graph retrieval.

Executes repository-scoped vector retrieval, extracts seed symbols/files,
expands them via Neo4j graph traversal, fuses results with configurable ranking
(RRF / Weighted), and preserves complete provenance.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Optional, Sequence

from app.core.rag.indexing_service import IndexingService
from app.core.rag.retrieval.graph_retriever import GraphRetriever
from app.models.chunk_models import RAGChunk
from app.models.graph_retrieval_models import GraphRetrievalResult
from app.models.retrieval_models import (
    HybridRetrievalConfig,
    RetrievalProvenance,
    RetrievalResult,
    RetrievalSourceType,
    RetrievedItem,
)
from app.models.vector_models import VectorSearchResult

logger = logging.getLogger(__name__)

# Pattern to extract candidate code symbols and filenames from raw query text
SYMBOL_OR_FILE_PATTERN = re.compile(
    r"\b[A-Za-z_][A-Za-z0-9_]{2,}(?:::|\.)[A-Za-z0-9_]+\b|"  # qualified symbol (e.g. AuthService.validate)
    r"\b[A-Z][a-zA-Z0-9]{2,}\b|"                             # PascalCase class name (e.g. OrderProcessor)
    r"\b[a-z_][a-z0-9_]{3,}\b|"                              # snake_case function (e.g. process_payment)
    r"\b[\w\-\./]+\.(?:py|ts|js|jsx|tsx|java|go|cs|md|json)\b"  # file path (e.g. auth.py)
)


class HybridRetriever:
    """
    Unified hybrid retrieval engine.
    Orchestrates dense semantic search and structured graph expansion.
    """

    def __init__(
        self,
        indexing_service: Optional[IndexingService] = None,
        graph_retriever: Optional[GraphRetriever] = None,
        default_config: Optional[HybridRetrievalConfig] = None,
    ) -> None:
        """
        Initialize HybridRetriever with optional service injection.

        Args:
            indexing_service: Vector store & embedding coordinator.
            graph_retriever: Neo4j graph retrieval service.
            default_config: Default configuration parameters if not passed to query().
        """
        self.indexing_service = indexing_service or IndexingService()
        self.graph_retriever = graph_retriever or GraphRetriever()
        self.default_config = default_config or HybridRetrievalConfig()

    @staticmethod
    def _preprocess_query(query: str) -> list[str]:
        """
        Extract potential symbol names or file paths from the query to seed direct graph queries.
        """
        if not query:
            return []
        matches = SYMBOL_OR_FILE_PATTERN.findall(query)
        # Filter out common stop words that look like identifiers
        stop_words = {"this", "that", "from", "with", "what", "where", "when", "does", "have", "make", "user"}
        cleaned = [m for m in matches if m.lower() not in stop_words]
        return list(dict.fromkeys(cleaned))[:5]  # Deduplicate preserving order, cap at 5

    def query(
        self,
        query: str,
        repository_id: str,
        config: Optional[HybridRetrievalConfig] = None,
    ) -> RetrievalResult:
        """
        Execute repository-scoped hybrid retrieval combining vector and graph context.

        Args:
            query: User search query or question.
            repository_id: Repository identifier for mandatory tenant isolation.
            config: Optional runtime configuration override.

        Returns:
            RetrievalResult containing ranked items and audit provenance.
        """
        cfg = config or self.default_config

        if not query or not query.strip() or not repository_id or not repository_id.strip():
            return RetrievalResult(
                query=query or "",
                repository_id=repository_id or "",
                items=[],
                total_results=0,
                vector_hit_count=0,
                graph_hit_count=0,
                fused_hybrid_count=0,
                strategy_used=cfg.ranking_strategy,
            )

        clean_query = query.strip()
        clean_repo_id = repository_id.strip()

        # ------------------------------------------------------------------
        # Step 1: Vector Retrieval
        # ------------------------------------------------------------------
        raw_vector_hits: list[VectorSearchResult] = []
        try:
            hits = self.indexing_service.similarity_search(
                query=clean_query,
                repository_id=clean_repo_id,
                top_k=cfg.vector_top_k,
                min_score=cfg.vector_min_score,
            )
            # Enforce repository isolation
            raw_vector_hits = [h for h in hits if h.chunk.repository_id == clean_repo_id]
        except Exception as exc:
            logger.warning("Vector search unavailable during hybrid retrieval: %s", exc)
            raw_vector_hits = []

        # ------------------------------------------------------------------
        # Step 2: Seed Extraction & Graph Expansion
        # ------------------------------------------------------------------
        raw_graph_hits: list[GraphRetrievalResult] = []
        seeds: list[tuple[str, str]] = []  # (seed_type: 'symbol'|'file', identifier)

        if cfg.include_graph_expansion and self.graph_retriever:
            # 1. Seeds from top vector hits
            for hit in raw_vector_hits:
                chunk = hit.chunk
                if chunk.symbol:
                    seeds.append(("symbol", chunk.symbol))
                if chunk.parent_metadata and chunk.parent_metadata.get("parent_symbol"):
                    seeds.append(("symbol", chunk.parent_metadata["parent_symbol"]))
                if chunk.file_path:
                    seeds.append(("file", chunk.file_path))

            # 2. Seeds from query preprocessing
            query_candidates = self._preprocess_query(clean_query)
            for cand in query_candidates:
                if "." in cand and ("/" in cand or cand.endswith(".py") or cand.endswith(".ts") or cand.endswith(".js")):
                    seeds.append(("file", cand))
                else:
                    seeds.append(("symbol", cand))

            # Deduplicate seeds
            unique_seeds = list(dict.fromkeys(seeds))[:8]

            # Execute graph expansion for each seed
            seen_graph_keys: set[tuple[str, str, str]] = set()
            for seed_type, seed_val in unique_seeds:
                try:
                    if seed_type == "symbol":
                        g_results = self.graph_retriever.get_symbol_context(
                            symbol=seed_val,
                            repository_id=clean_repo_id,
                            depth=cfg.graph_expansion_depth,
                            limit=cfg.graph_limit_per_seed,
                        )
                    else:
                        g_results = self.graph_retriever.get_file_context(
                            file_path=seed_val,
                            repository_id=clean_repo_id,
                            limit=cfg.graph_limit_per_seed,
                        )

                    for gr in g_results:
                        # Enforce repository isolation
                        if gr.repository_id != clean_repo_id:
                            continue
                        key = (gr.file_path or "", gr.relationship, gr.related_entity.id)
                        if key not in seen_graph_keys:
                            seen_graph_keys.add(key)
                            # Record the focal seed on metadata for provenance
                            gr.metadata["focal_seed"] = seed_val
                            raw_graph_hits.append(gr)

                except Exception as exc:
                    logger.warning("Graph retrieval failed for seed '%s': %s", seed_val, exc)

        # ------------------------------------------------------------------
        # Step 3: Result Fusion & Deduplication
        # ------------------------------------------------------------------
        fused_items: list[RetrievedItem] = self._fuse_results(
            raw_vector_hits=raw_vector_hits,
            raw_graph_hits=raw_graph_hits,
            repository_id=clean_repo_id,
            config=cfg,
        )

        # ------------------------------------------------------------------
        # Step 4: Final Ranking & Slicing
        # ------------------------------------------------------------------
        fused_items.sort(key=lambda x: x.score, reverse=True)
        for idx, item in enumerate(fused_items, start=1):
            item.rank = idx

        final_items = fused_items[: cfg.top_k]
        hybrid_count = sum(1 for item in final_items if len(item.provenance.sources) > 1)

        return RetrievalResult(
            query=clean_query,
            repository_id=clean_repo_id,
            items=final_items,
            total_results=len(final_items),
            vector_hit_count=len(raw_vector_hits),
            graph_hit_count=len(raw_graph_hits),
            fused_hybrid_count=hybrid_count,
            strategy_used=cfg.ranking_strategy,
        )

    def _fuse_results(
        self,
        raw_vector_hits: list[VectorSearchResult],
        raw_graph_hits: list[GraphRetrievalResult],
        repository_id: str,
        config: HybridRetrievalConfig,
    ) -> list[RetrievedItem]:
        """
        Merge vector and graph hits into unified, deduplicated RetrievedItem objects.
        Applies Reciprocal Rank Fusion (RRF) or Weighted Linear Combination.
        """
        # Map by unique canonical key: (file_path, symbol or chunk_id)
        merged_map: dict[str, dict[str, Any]] = {}

        # 1. Process Vector Hits
        for v_rank, v_hit in enumerate(raw_vector_hits, start=1):
            chunk = v_hit.chunk
            # Canonical grouping key
            canon_key = f"{chunk.file_path}::{chunk.symbol}" if chunk.symbol else f"{chunk.file_path}::chk_{chunk.chunk_id}"

            merged_map[canon_key] = {
                "id": chunk.chunk_id,
                "repository_id": repository_id,
                "file_path": chunk.file_path,
                "symbol": chunk.symbol,
                "file_type": str(chunk.file_type),
                "content": chunk.content,
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
                "page_number": chunk.page_number,
                "section": chunk.section,
                "vector_score": v_hit.score,
                "vector_rank": v_rank,
                "graph_score": None,
                "graph_rank": None,
                "graph_relationships": [],
                "focal_seed": None,
                "metadata": {
                    "language": chunk.language,
                    "section": chunk.section,
                    "page_number": chunk.page_number,
                    **chunk.parent_metadata,
                },
                "sources": [RetrievalSourceType.VECTOR.value],
            }

        # 2. Process Graph Hits
        for g_rank, g_hit in enumerate(raw_graph_hits, start=1):
            ent = g_hit.related_entity
            ent_path = ent.file_path or g_hit.file_path or ""
            ent_symbol = ent.name if ent.type in {"Function", "Class", "Method"} else None
            canon_key = f"{ent_path}::{ent_symbol}" if ent_symbol else f"{ent_path}::{ent.id}"

            # Calculate graph relevance score (decay based on depth)
            depth_decay = 1.0 / (1.0 + 0.5 * (g_hit.depth - 1))
            calculated_graph_score = min(1.0, max(0.1, depth_decay))

            if canon_key in merged_map:
                # Merge into existing vector candidate -> HYBRID!
                item = merged_map[canon_key]
                if RetrievalSourceType.GRAPH.value not in item["sources"]:
                    item["sources"].append(RetrievalSourceType.GRAPH.value)
                item["graph_score"] = calculated_graph_score
                item["graph_rank"] = g_rank
                if g_hit.relationship not in item["graph_relationships"]:
                    item["graph_relationships"].append(g_hit.relationship)
                if not item["focal_seed"]:
                    item["focal_seed"] = g_hit.metadata.get("focal_seed")
                if ent.docstring and "docstring" not in item["metadata"]:
                    item["metadata"]["docstring"] = ent.docstring
                if ent.signature and "signature" not in item["metadata"]:
                    item["metadata"]["signature"] = ent.signature
            else:
                # New item originated solely from graph expansion
                # Generate a readable synthetic snippet from entity definition
                content_lines = []
                if ent.docstring:
                    content_lines.append(f"/** {ent.docstring} */")
                if ent.signature:
                    content_lines.append(f"{ent.type.lower()} {ent.name}{ent.signature}")
                elif ent.name:
                    content_lines.append(f"{ent.type.lower()} {ent.name}")
                content_text = "\n".join(content_lines) if content_lines else f"{ent.type}: {ent.name} in {ent_path}"

                merged_map[canon_key] = {
                    "id": ent.id or f"graph_{g_hit.relationship}_{canon_key}",
                    "repository_id": repository_id,
                    "file_path": ent_path,
                    "symbol": ent_symbol,
                    "file_type": "source_code",
                    "content": content_text,
                    "start_line": ent.line_start,
                    "end_line": ent.line_end,
                    "vector_score": None,
                    "vector_rank": None,
                    "graph_score": calculated_graph_score,
                    "graph_rank": g_rank,
                    "graph_relationships": [g_hit.relationship],
                    "focal_seed": g_hit.metadata.get("focal_seed"),
                    "metadata": {
                        "entity_type": ent.type,
                        "signature": ent.signature,
                        "docstring": ent.docstring,
                        **ent.properties,
                    },
                    "sources": [RetrievalSourceType.GRAPH.value],
                }

        # 3. Apply Ranking Strategy
        fused_items: list[RetrievedItem] = []
        for entry in merged_map.values():
            final_score = self._compute_score(
                vector_score=entry["vector_score"],
                vector_rank=entry["vector_rank"],
                graph_score=entry["graph_score"],
                graph_rank=entry["graph_rank"],
                config=config,
            )

            provenance = RetrievalProvenance(
                sources=entry["sources"],
                vector_score=entry["vector_score"],
                vector_rank=entry["vector_rank"],
                graph_score=entry["graph_score"],
                graph_rank=entry["graph_rank"],
                graph_relationships=entry["graph_relationships"],
                focal_seed=entry["focal_seed"],
            )

            fused_items.append(
                RetrievedItem(
                    id=entry["id"],
                    repository_id=entry["repository_id"],
                    file_path=entry["file_path"],
                    symbol=entry["symbol"],
                    file_type=entry["file_type"],
                    content=entry["content"],
                    start_line=entry["start_line"],
                    end_line=entry["end_line"],
                    page_number=entry.get("page_number"),
                    section=entry.get("section"),
                    score=round(final_score, 5),
                    rank=1,
                    provenance=provenance,
                    metadata=entry["metadata"],
                )
            )

        return fused_items

    @staticmethod
    def _compute_score(
        vector_score: Optional[float],
        vector_rank: Optional[int],
        graph_score: Optional[float],
        graph_rank: Optional[int],
        config: HybridRetrievalConfig,
    ) -> float:
        """
        Compute fused ranking score via RRF (Reciprocal Rank Fusion) or Weighted sum.
        """
        if config.ranking_strategy == "weighted":
            v_component = (config.vector_weight * vector_score) if vector_score is not None else 0.0
            g_component = (config.graph_weight * graph_score) if graph_score is not None else 0.0
            return v_component + g_component
        else:
            # Default: Reciprocal Rank Fusion (RRF)
            # RRF score = sum(weight / (k + rank))
            k = config.rrf_k
            v_rrf = (config.vector_weight / (k + vector_rank)) if vector_rank is not None else 0.0
            g_rrf = (config.graph_weight / (k + graph_rank)) if graph_rank is not None else 0.0
            return v_rrf + g_rrf
