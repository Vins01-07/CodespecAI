"""
ContextBuilder — Formats retrieved context into structured, deduplicated prompts with citations.
Preserves full provenance (file_path, file_type, symbol, line_range, page_number, section, repository_id).
"""
from __future__ import annotations

import logging
from typing import Optional, Sequence

from app.models.generation_models import BuiltContext, Citation, RAGSourceItem
from app.models.retrieval_models import RetrievalResult, RetrievedItem

logger = logging.getLogger(__name__)

STRICT_RAG_SYSTEM_PROMPT = """You are CodeSpecAI, an expert software architecture and codebase intelligence assistant.
Your task is to answer developer queries grounded strictly in the provided repository context.

Strict Grounding Guidelines:
1. Base your answer solely on the provided codebase context, AST symbols, and structural relationships.
2. Do NOT invent, assume, or extrapolate repository facts, APIs, files, or implementations not explicitly in the context.
3. If the retrieved context is insufficient, incomplete, or does not contain the answer, explicitly state:
   "INSUFFICIENT CONTEXT: The provided repository context does not contain sufficient information to answer this query."
   Explain what specific information is missing and what related elements (if any) are present.
4. Ground your explanations by citing source references using bracket notation [1], [2], etc., corresponding to the numbered context blocks.
5. Refer to specific file paths, symbols, line numbers, PDF pages, or documentation sections when explaining your reasoning.
"""


class ContextBuilder:
    """
    Assembles compact, deduplicated prompt context and source citations from HybridRetriever results.
    """

    def __init__(
        self,
        system_prompt: str = STRICT_RAG_SYSTEM_PROMPT,
        max_context_chars: int = 24000,
        max_tokens: Optional[int] = None,
        max_snippet_chars: int = 250,
    ) -> None:
        """
        Initialize ContextBuilder.

        Args:
            system_prompt: System prompt with strict grounding instructions.
            max_context_chars: Character limit for context blocks.
            max_tokens: Optional token limit (converted to ~4 chars/token if provided).
            max_snippet_chars: Maximum character length for citation preview snippets.
        """
        self.system_prompt = system_prompt
        self.max_context_chars = (max_tokens * 4) if max_tokens else max_context_chars
        self.max_snippet_chars = max_snippet_chars

    def _deduplicate_items(self, items: Sequence[RetrievedItem]) -> list[RetrievedItem]:
        """
        Remove duplicate or redundant retrieval results:
          1. Identical text content.
          2. Exact matching (file_path, symbol, start_line, end_line).
          3. Subsumed line ranges within the same file (keep the higher scoring/larger item).
        """
        unique_items: list[RetrievedItem] = []
        seen_contents: set[str] = set()
        seen_spans: dict[str, list[tuple[int, int]]] = {}

        for item in items:
            clean_content = item.content.strip()
            # 1. Exact content hash deduplication
            if clean_content in seen_contents:
                continue

            # 2. Check for duplicate or subsumed line spans in the same file
            fp = item.file_path
            start = item.start_line
            end = item.end_line

            is_subsumed = False
            if start is not None and end is not None and fp in seen_spans:
                for existing_start, existing_end in seen_spans[fp]:
                    # If this item is entirely inside an already included item, skip it
                    if existing_start <= start and end <= existing_end:
                        is_subsumed = True
                        break

            if is_subsumed:
                continue

            seen_contents.add(clean_content)
            if start is not None and end is not None:
                seen_spans.setdefault(fp, []).append((start, end))

            unique_items.append(item)

        return unique_items

    def build(
        self,
        query: str,
        retrieval_result: RetrievalResult,
        custom_instructions: Optional[str] = None,
    ) -> BuiltContext:
        """
        Build a compact, structured prompt and complete source provenance from retrieval results.

        Args:
            query: User's question or search query.
            retrieval_result: Result from Phase 6 HybridRetriever.query().
            custom_instructions: Optional extra instructions appended to the system prompt.

        Returns:
            BuiltContext containing system_prompt, user_prompt, citations, and sources.
        """
        raw_items: Sequence[RetrievedItem] = retrieval_result.items or []
        deduped_items = self._deduplicate_items(raw_items)

        citations: list[Citation] = []
        sources: list[RAGSourceItem] = []
        context_blocks: list[str] = []
        current_chars = 0

        for idx, item in enumerate(deduped_items, start=1):
            # Format compact header with full provenance
            header_parts = [f"[{idx}] File: `{item.file_path}`"]

            if item.symbol:
                header_parts.append(f"| Symbol: `{item.symbol}`")
            if item.file_type and item.file_type != "source_code":
                header_parts.append(f"| Type: {item.file_type}")
            if item.start_line is not None and item.end_line is not None:
                header_parts.append(f"| Lines: {item.start_line}–{item.end_line}")

            # Check PDF page number
            page_num = item.page_number or item.metadata.get("page_number")
            if page_num is not None:
                header_parts.append(f"| Page: {page_num}")

            # Check section / breadcrumb
            sec = item.section or item.metadata.get("section")
            if sec:
                header_parts.append(f"| Section: {sec}")

            header_parts.append(f"| Source: {', '.join(item.provenance.sources)}")

            block_lines = [" ".join(header_parts)]
            if item.provenance.graph_relationships:
                block_lines.append(f"Graph relationships: {', '.join(item.provenance.graph_relationships)}")

            lang = item.metadata.get("language") or ""
            block_lines.append(f"```{lang}\n{item.content.strip()}\n```")
            block_text = "\n".join(block_lines)

            # Enforce budget limit
            if current_chars + len(block_text) > self.max_context_chars and idx > 1:
                logger.info(
                    "ContextBuilder truncated items at %d/%d to fit within %d characters",
                    idx - 1,
                    len(deduped_items),
                    self.max_context_chars,
                )
                break

            context_blocks.append(block_text)
            current_chars += len(block_text)

            # Snippet for source item
            snippet = item.content.strip()[: self.max_snippet_chars]
            if len(item.content.strip()) > self.max_snippet_chars:
                snippet += "..."

            # Create Citation (Phase 7 backward compatibility)
            citations.append(
                Citation(
                    index=idx,
                    file_path=item.file_path,
                    symbol=item.symbol,
                    start_line=item.start_line,
                    end_line=item.end_line,
                    snippet=snippet,
                    score=item.score,
                    sources=item.provenance.sources,
                    page_number=page_num,
                    section=sec,
                )
            )

            # Create RAGSourceItem (Phase 8 full provenance)
            sources.append(
                RAGSourceItem(
                    index=idx,
                    repository_id=item.repository_id,
                    file_path=item.file_path,
                    file_type=item.file_type,
                    symbol=item.symbol,
                    start_line=item.start_line,
                    end_line=item.end_line,
                    page_number=page_num,
                    section=sec,
                    snippet=snippet,
                    score=item.score,
                    sources=item.provenance.sources,
                    metadata=item.metadata,
                )
            )

        # Assemble user prompt
        user_prompt_parts = [f"User Question: {query}\n"]

        if context_blocks:
            user_prompt_parts.append("Relevant Codebase Context:\n")
            user_prompt_parts.append("\n\n".join(context_blocks))
            user_prompt_parts.append(
                "\n\nPlease answer the question based strictly on the context above, citing referenced files, symbols, line numbers, and pages using [1], [2], etc."
            )
        else:
            user_prompt_parts.append(
                f"Note: No relevant codebase context was found in repository '{retrieval_result.repository_id}' for this query.\n"
                "Please clearly explain that no matching context could be retrieved from the codebase."
            )

        full_user_prompt = "\n".join(user_prompt_parts)
        effective_system_prompt = self.system_prompt
        if custom_instructions:
            effective_system_prompt = f"{self.system_prompt}\n\nAdditional Instructions:\n{custom_instructions}"

        estimated_tokens = (len(effective_system_prompt) + len(full_user_prompt)) // 4

        return BuiltContext(
            system_prompt=effective_system_prompt,
            user_prompt=full_user_prompt,
            citations=citations,
            sources=sources,
            estimated_tokens=estimated_tokens,
        )
