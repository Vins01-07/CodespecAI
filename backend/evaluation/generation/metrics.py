"""
Generation quality metrics calculation for CodeSpecAI RAG evaluation.

Evaluates:
- Faithfulness (groundedness in context, absence of hallucination)
- Answer Relevance (alignment with user question)
- Context Relevance (signal-to-noise ratio of retrieved chunks)
- Citation/Source Correctness (accuracy and validity of [1], [2] citations)
- Answer Completeness (coverage of expected concepts / ground truth reference)
"""
from __future__ import annotations

import re
from typing import Sequence
from pydantic import BaseModel, Field

from app.models.generation_models import RAGResponse, RAGSourceItem
from evaluation.datasets.models import BenchmarkItem

CITATION_PATTERN = re.compile(r"\[(\d+)\]")


class GenerationMetricsResult(BaseModel):
    """
    Quality metrics calculated for a single RAG-generated response.
    """
    faithfulness: float = Field(..., description="Faithfulness / Groundedness score (0.0 to 1.0)")
    answer_relevance: float = Field(..., description="Answer Relevance score (0.0 to 1.0)")
    context_relevance: float = Field(..., description="Context Relevance score (0.0 to 1.0)")
    citation_correctness: float = Field(..., description="Citation Correctness score (0.0 to 1.0)")
    answer_completeness: float = Field(..., description="Answer Completeness score (0.0 to 1.0)")
    overall_score: float = Field(..., description="Unweighted average quality score (0.0 to 1.0)")
    details: dict[str, str] = Field(default_factory=dict, description="Diagnostic notes per metric")


def calculate_faithfulness(
    answer: str,
    sources: Sequence[RAGSourceItem],
    is_insufficient_context: bool = False,
) -> tuple[float, str]:
    """
    Calculate faithfulness: are factual statements in the answer grounded in retrieved context?

    Args:
        answer: Generated answer text.
        sources: List of RAGSourceItem retrieved and passed to prompt.
        is_insufficient_context: Whether the model explicitly signaled insufficient context.

    Returns:
        (score, explanation) tuple. Score is 0.0 to 1.0.
    """
    clean_ans = answer.strip()
    if not clean_ans:
        return 0.0, "Empty answer."

    upper_ans = clean_ans.upper()
    if "INSUFFICIENT CONTEXT" in upper_ans or "CANNOT ANSWER" in upper_ans or is_insufficient_context:
        # If context was indeed empty or minimal, faithfully stating insufficient context is 100% faithful
        if not sources or len(sources) == 0:
            return 1.0, "Faithfully acknowledged lack of repository context."
        return 0.9, "Acknowledged insufficient context while some sources were present."

    if not sources:
        # Generated a factual answer with ZERO context -> pure hallucination
        return 0.0, "Answer made factual claims despite zero retrieved repository context."

    # Concatenate all context text
    context_corpus = " ".join([f"{s.snippet} {s.symbol or ''} {s.file_path}" for s in sources]).lower()

    # Split answer into candidate sentences / clauses
    sentences = [s.strip() for s in re.split(r"[.\n;]", clean_ans) if len(s.strip()) > 10]
    if not sentences:
        return 1.0, "Answer contains no substantive claims."

    stop_words = {"the", "and", "from", "with", "this", "that", "into", "does", "have", "make", "also", "been", "were"}
    supported_count = 0
    for sentence in sentences:
        # Extract subwords and terms (splitting on underscores and non-alphanumeric chars)
        terms = [t.lower() for t in re.split(r"[_\W]+", sentence) if len(t) >= 3 and t.lower() not in stop_words]
        if not terms:
            supported_count += 1
            continue
        # Check fraction of key terms present in context
        terms_in_context = sum(1 for t in terms if t in context_corpus)
        overlap_ratio = terms_in_context / len(terms)
        if overlap_ratio >= 0.35:  # At least 35% of substantive tokens grounded in context
            supported_count += 1

    score = round(supported_count / len(sentences), 4)
    return score, f"{supported_count}/{len(sentences)} answer statements supported by retrieved context."


def calculate_answer_relevance(
    question: str,
    answer: str,
) -> tuple[float, str]:
    """
    Calculate answer relevance: does the response directly address the question's intent?

    Args:
        question: User query text.
        answer: Generated response text.

    Returns:
        (score, explanation) tuple. Score is 0.0 to 1.0.
    """
    clean_q = question.strip()
    clean_a = answer.strip()
    if not clean_q or not clean_a:
        return 0.0, "Empty question or answer."

    # Stop words to filter out
    stop_words = {"how", "what", "where", "when", "does", "with", "this", "that", "from", "into", "the", "and"}
    q_terms = [w.lower() for w in re.findall(r"\b[A-Za-z0-9_]{3,}\b", clean_q) if w.lower() not in stop_words]
    if not q_terms:
        return 1.0, "Question contains no substantive terms."

    lower_a = clean_a.lower()
    matched_terms = sum(1 for t in q_terms if t in lower_a)
    coverage = matched_terms / len(q_terms)

    # If answer indicates insufficient context, check if question keywords are acknowledged
    if "insufficient context" in lower_a or "no relevant" in lower_a:
        score = round(max(0.7, coverage), 4)
        return score, "Answer politely and relevantly identified insufficient repository context."

    # Minimum relevance score when substantive response provided
    score = round(min(1.0, max(0.2, coverage * 1.2)), 4)
    return score, f"Answer addressed {matched_terms}/{len(q_terms)} key query intents."


def calculate_context_relevance(
    sources: Sequence[RAGSourceItem],
    benchmark_item: BenchmarkItem,
) -> tuple[float, str]:
    """
    Calculate context relevance: what fraction of retrieved sources are actually relevant?

    Args:
        sources: Retrieved source items included in prompt context.
        benchmark_item: Benchmark query with ground truth targets.

    Returns:
        (score, explanation) tuple. Score is 0.0 to 1.0.
    """
    if not sources:
        # If ground truth also expected no relevant files, context relevance is 1.0
        if not benchmark_item.relevant_files and not benchmark_item.relevant_symbols:
            return 1.0, "Correctly retrieved 0 items for empty target query."
        return 0.0, "No context items retrieved."

    relevant_count = 0
    for src in sources:
        is_rel_file = benchmark_item.is_file_relevant(src.file_path)
        is_rel_sym = benchmark_item.is_symbol_relevant(src.symbol)
        if is_rel_file or is_rel_sym:
            relevant_count += 1

    score = round(relevant_count / len(sources), 4)
    return score, f"{relevant_count}/{len(sources)} retrieved context sources are relevant to ground truth."


def calculate_citation_correctness(
    answer: str,
    sources: Sequence[RAGSourceItem],
    benchmark_item: BenchmarkItem,
) -> tuple[float, str]:
    """
    Calculate citation correctness:
    1. Are citation tags [k] present in the answer?
    2. Do cited indices [k] exist in sources?
    3. Do cited sources match ground truth relevant files / symbols?

    Args:
        answer: Generated answer text.
        sources: Sources available to the answer.
        benchmark_item: Ground truth targets.

    Returns:
        (score, explanation) tuple. Score is 0.0 to 1.0.
    """
    clean_ans = answer.strip()
    citation_matches = CITATION_PATTERN.findall(clean_ans)

    if not citation_matches:
        # If answer is insufficient context, citations are not required
        if "INSUFFICIENT CONTEXT" in clean_ans.upper() or not sources:
            return 1.0, "No citations required for insufficient context answer."
        return 0.2, "Answer made claims without referencing any [k] citation tags."

    citation_indices = [int(m) for m in citation_matches]
    source_map = {src.index: src for src in sources}

    valid_indices = 0
    ground_truth_matches = 0

    for idx in citation_indices:
        if idx in source_map:
            valid_indices += 1
            src = source_map[idx]
            if benchmark_item.is_file_relevant(src.file_path) or benchmark_item.is_symbol_relevant(src.symbol):
                ground_truth_matches += 1

    index_validity_ratio = valid_indices / len(citation_indices)
    grounding_ratio = ground_truth_matches / len(citation_indices) if benchmark_item.relevant_files else index_validity_ratio

    # Weighted blend: 40% index validity, 60% ground truth alignment
    score = round(0.4 * index_validity_ratio + 0.6 * grounding_ratio, 4)
    return score, f"{valid_indices}/{len(citation_indices)} valid citations, {ground_truth_matches} correctly aligned with ground truth."


def calculate_answer_completeness(
    answer: str,
    benchmark_item: BenchmarkItem,
) -> tuple[float, str]:
    """
    Calculate answer completeness: does the answer cover expected key concepts and facts?

    Args:
        answer: Generated answer text.
        benchmark_item: Benchmark item with expected_concepts and ground_truth_answer.

    Returns:
        (score, explanation) tuple. Score is 0.0 to 1.0.
    """
    expected = benchmark_item.expected_concepts
    if not expected:
        # Fall back to checking key terms from ground_truth_answer if provided
        if benchmark_item.ground_truth_answer:
            stop_words = {"the", "and", "from", "with", "this", "that", "into", "does"}
            expected = [
                w.lower() for w in re.findall(r"\b[A-Za-z0-9_]{4,}\b", benchmark_item.ground_truth_answer)
                if w.lower() not in stop_words
            ][:8]
        else:
            return 1.0, "No specific expected concepts defined for query."

    if not expected:
        return 1.0, "No ground truth concepts defined."

    lower_ans = answer.lower()
    covered = sum(1 for concept in expected if concept.lower() in lower_ans)
    score = round(covered / len(expected), 4)
    return score, f"Covered {covered}/{len(expected)} expected concepts."


def compute_generation_metrics(
    rag_response: RAGResponse,
    benchmark_item: BenchmarkItem,
) -> GenerationMetricsResult:
    """
    Compute all generation quality metrics for a single RAGResponse.
    """
    faith_score, faith_note = calculate_faithfulness(
        answer=rag_response.answer,
        sources=rag_response.sources,
        is_insufficient_context=rag_response.is_insufficient_context,
    )
    ans_rel_score, ans_rel_note = calculate_answer_relevance(
        question=benchmark_item.question,
        answer=rag_response.answer,
    )
    ctx_rel_score, ctx_rel_note = calculate_context_relevance(
        sources=rag_response.sources,
        benchmark_item=benchmark_item,
    )
    cit_score, cit_note = calculate_citation_correctness(
        answer=rag_response.answer,
        sources=rag_response.sources,
        benchmark_item=benchmark_item,
    )
    comp_score, comp_note = calculate_answer_completeness(
        answer=rag_response.answer,
        benchmark_item=benchmark_item,
    )

    overall = round(
        (faith_score + ans_rel_score + ctx_rel_score + cit_score + comp_score) / 5.0,
        4,
    )

    return GenerationMetricsResult(
        faithfulness=faith_score,
        answer_relevance=ans_rel_score,
        context_relevance=ctx_rel_score,
        citation_correctness=cit_score,
        answer_completeness=comp_score,
        overall_score=overall,
        details={
            "faithfulness": faith_note,
            "answer_relevance": ans_rel_note,
            "context_relevance": ctx_rel_note,
            "citation_correctness": cit_note,
            "answer_completeness": comp_note,
        },
    )
