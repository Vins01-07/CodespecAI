from pathlib import Path

from app.core.chunking.service import ChunkingError, CodeChunker
from app.models.parser_models import ClassDef, FileSummary, FunctionDef


def test_source_chunks_have_stable_identity_and_parser_provenance(tmp_path: Path):
    source = "class Worker:\n    def run(self):\n        return 1\n"
    (tmp_path / "worker.py").write_text(source, encoding="utf-8")
    method = FunctionDef(
        name="run", file_path="worker.py", line_start=2, line_end=3, class_name="Worker"
    )
    summary = FileSummary(
        path="worker.py",
        language="python",
        classes=[ClassDef(name="Worker", file_path="worker.py", line_start=1, line_end=3, methods=[method])],
    )
    chunker = CodeChunker(min_chunk_chars=1)

    first = chunker.chunk_source_file("repo-key", tmp_path, summary)
    second = chunker.chunk_source_file("repo-key", tmp_path, summary)

    assert [chunk.chunk_id for chunk in first] == [chunk.chunk_id for chunk in second]
    assert [chunk.entity_type for chunk in first] == ["class", "method"]
    assert first[1].entity_id == method.id
    assert (first[1].start_line, first[1].end_line) == (2, 3)
    assert first[1].language == "python"
    assert first[1].repository_id == second[1].repository_id
    assert "def run" in first[1].text


def test_oversized_code_is_bounded_and_chunk_identity_is_distinct(tmp_path: Path):
    (tmp_path / "large.py").write_text("def run():\n" + "    value = 1\n" * 20, encoding="utf-8")
    function = FunctionDef(name="run", file_path="large.py", line_start=1, line_end=21)
    summary = FileSummary(path="large.py", language="python", functions=[function])
    chunks = CodeChunker(max_chunk_chars=32, overlap_lines=1, min_chunk_chars=1).chunk_source_file(
        "repo-key", tmp_path, summary
    )

    assert len(chunks) > 1
    assert all(len(chunk.text) <= 32 for chunk in chunks)
    assert len({chunk.chunk_id for chunk in chunks}) == len(chunks)


def test_markdown_chunks_keep_heading_ancestry_and_line_ranges(tmp_path: Path):
    (tmp_path / "guide.md").write_text(
        "# Guide\nintroductory paragraph\n## Setup\ninstall details\n## Usage\nusage details\n",
        encoding="utf-8",
    )
    chunks = CodeChunker(min_chunk_chars=1).chunk_markdown_file("repo-key", tmp_path, "guide.md")

    setup = next(chunk for chunk in chunks if chunk.entity_name == "Setup")
    assert "# Guide" in setup.text
    assert "## Setup" in setup.text
    assert setup.entity_type == "doc_section"
    assert setup.language == "markdown"
    assert setup.start_line == 3
    assert setup.end_line == 4


def test_chunker_rejects_paths_outside_repository(tmp_path: Path):
    outside = tmp_path.parent / "outside.py"
    outside.write_text("def outside(): pass", encoding="utf-8")
    summary = FileSummary(path="../outside.py", language="python")

    try:
        CodeChunker().chunk_source_file("repo-key", tmp_path, summary)
    except ChunkingError:
        pass
    else:
        raise AssertionError("Expected repository escape path to be rejected")