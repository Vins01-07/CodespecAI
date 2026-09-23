"""
Configuration file parser for RAG.
Preserves structured format metadata (JSON, YAML, TOML, INI, Dockerfile, Makefile).
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from app.core.rag.parsers.base import BaseContentParser, read_text_safely
from app.models.classification import ClassifiedFile, FileType
from app.models.rag_models import NormalizedDocument, ParserError, ParseResult

logger = logging.getLogger(__name__)


class ConfigParser(BaseContentParser):
    """
    Parses configuration and build files into normalized documents.
    Captures format-specific structure (e.g. INI sections, JSON top-level keys, Dockerfile commands)
    and preserves original line ranges without crashing on malformed syntax.
    """

    def parse(self, file: ClassifiedFile, repo_root: Path) -> ParseResult:
        file_path_str = file.file_path
        abs_path = (repo_root / file_path_str).resolve()

        if not abs_path.exists():
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="FileNotFound", message=f"File not found: {abs_path}")],
                is_successful=False,
            )

        content, err = read_text_safely(abs_path)
        if err or content is None:
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="ReadError", message=err or "Read error")],
                is_successful=False,
            )

        if not content.strip():
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="EmptyFile", message="Configuration file is empty")],
                is_successful=False,
            )

        lines = content.splitlines()
        total_lines = len(lines)
        documents: list[NormalizedDocument] = []
        errors: list[ParserError] = []

        cfg_format = file.language or file.extension.replace(".", "") or "config"
        metadata: dict[str, Any] = {"format": cfg_format, "total_lines": total_lines}

        # Format-specific structural analysis
        if cfg_format == "json":
            try:
                parsed_json = json.loads(content)
                if isinstance(parsed_json, dict):
                    metadata["top_level_keys"] = list(parsed_json.keys())
            except Exception as json_exc:
                errors.append(
                    ParserError(
                        file_path=file_path_str,
                        error_type="SyntaxWarning",
                        message=f"JSON syntax warning: {json_exc}",
                    )
                )

        elif cfg_format == "yaml":
            try:
                import yaml
                parsed_yaml = yaml.safe_load(content)
                if isinstance(parsed_yaml, dict):
                    metadata["top_level_keys"] = list(parsed_yaml.keys())
            except Exception as yaml_exc:
                errors.append(
                    ParserError(
                        file_path=file_path_str,
                        error_type="SyntaxWarning",
                        message=f"YAML syntax warning: {yaml_exc}",
                    )
                )

        # For INI / CFG files, parse section headers if present
        if cfg_format in {"ini", "cfg"}:
            section_indices: list[tuple[int, str]] = []
            for idx, line in enumerate(lines, start=1):
                stripped = line.strip()
                if stripped.startswith("[") and stripped.endswith("]"):
                    sec_name = stripped[1:-1].strip()
                    section_indices.append((idx, sec_name))

            if section_indices:
                for i, (s_line, s_name) in enumerate(section_indices):
                    end_idx = section_indices[i + 1][0] - 1 if i + 1 < len(section_indices) else total_lines
                    sec_content = "\n".join(lines[s_line - 1:end_idx]).strip()
                    documents.append(
                        NormalizedDocument(
                            repository_id=file.repository_id,
                            file_path=file_path_str,
                            file_type=FileType.CONFIG,
                            language=cfg_format,
                            content=sec_content,
                            start_line=s_line,
                            end_line=end_idx,
                            section=f"[{s_name}]",
                            symbol=None,
                            metadata={"format": cfg_format, "section": s_name},
                        )
                    )
                return ParseResult(file_path=file_path_str, documents=documents, errors=errors, is_successful=True)

        # Default document for single-section configs, JSON, YAML, Dockerfile, Makefile
        section_name = file.file_name if file.file_name.lower() in {"dockerfile", "makefile", "procfile"} else cfg_format
        documents.append(
            NormalizedDocument(
                repository_id=file.repository_id,
                file_path=file_path_str,
                file_type=FileType.CONFIG,
                language=cfg_format,
                content=content,
                start_line=1,
                end_line=total_lines,
                section=section_name,
                symbol=None,
                metadata=metadata,
            )
        )

        return ParseResult(
            file_path=file_path_str,
            documents=documents,
            errors=errors,
            is_successful=True,
        )
