"""
GraphBuilder — writes parsed FileSummary objects into Neo4j.

All Cypher uses MERGE (idempotent) so re-ingesting the same repository
is always safe. A two-pass strategy is used:
  Pass 1 — create Repository / File / Function / Class nodes with unique symbol IDs
  Pass 2 — link edges using scope-aware symbol resolution:
    (:Repository)  -[:CONTAINS]->     (:File)
    (:File)        -[:DEFINES]->      (:Function)
    (:File)        -[:DEFINES]->      (:Class)
    (:Class)       -[:HAS_METHOD]->   (:Function)
    (:File)        -[:IMPORTS]->      (:File)
    (:Function)    -[:CALLS]->        (:Function)
    (:Function)    -[:INSTANTIATES]-> (:Class)
    (:Function)    -[:USES]->         (:Class)
    (:Class)       -[:EXTENDS]->      (:Class)
"""
from __future__ import annotations

import logging
import posixpath
from pathlib import Path
from typing import Any

from neo4j import Session

from app.core.graph.neo4j_client import get_session
from app.models.parser_models import ClassDef, FileSummary, FunctionDef

logger = logging.getLogger(__name__)


class RepoSymbolTable:
    """
    Repository-level symbol table and scope-aware resolver.

    Resolves:
      1. Class context (self. / this. / enclosing class)
      2. Current file context
      3. Explicit and aliased imports
      4. Qualified names
      5. Unambiguous global repository symbols (skips ambiguous calls to avoid false edges)
    """

    def __init__(self, summaries: list[FileSummary]) -> None:
        self.summaries = summaries
        self.files_by_path: dict[str, FileSummary] = {}
        self.files_by_stem: dict[str, list[str]] = {}
        self.files_by_module: dict[str, str] = {}

        self.classes_by_id: dict[str, ClassDef] = {}
        self.classes_by_file: dict[str, dict[str, ClassDef]] = {}
        self.classes_by_name: dict[str, list[ClassDef]] = {}

        self.funcs_by_id: dict[str, FunctionDef] = {}
        self.top_level_funcs_by_file: dict[str, dict[str, FunctionDef]] = {}
        self.methods_by_class: dict[tuple[str, str], dict[str, FunctionDef]] = {}
        self.funcs_by_name: dict[str, list[FunctionDef]] = {}

        self.resolved_file_imports: dict[str, set[str]] = {}
        self.imported_symbols: dict[str, dict[str, str]] = {}
        self.module_aliases: dict[str, dict[str, str]] = {}

        self._build_indexes()
        self._resolve_all_imports()

    @staticmethod
    def _norm(p: str) -> str:
        return p.replace("\\", "/")

    def _build_indexes(self) -> None:
        for s in self.summaries:
            path = self._norm(s.path)
            self.files_by_path[path] = s
            stem = Path(path).stem
            self.files_by_stem.setdefault(stem, []).append(path)

            mod_dotted = path.rsplit(".", 1)[0].replace("/", ".")
            self.files_by_module[mod_dotted] = path
            parts = mod_dotted.split(".")
            if len(parts) > 1:
                sub_mod = ".".join(parts[1:])
                self.files_by_module.setdefault(sub_mod, path)

            self.classes_by_file.setdefault(path, {})
            self.top_level_funcs_by_file.setdefault(path, {})

            for cls in s.classes:
                if cls.id:
                    self.classes_by_id[cls.id] = cls
                self.classes_by_file[path][cls.name] = cls
                self.classes_by_name.setdefault(cls.name, []).append(cls)

                for m in cls.methods:
                    if m.id:
                        self.funcs_by_id[m.id] = m
                    self.methods_by_class.setdefault((path, cls.name), {})[m.name] = m
                    self.funcs_by_name.setdefault(m.name, []).append(m)

            for fn in s.functions:
                if fn.id:
                    self.funcs_by_id[fn.id] = fn
                self.top_level_funcs_by_file[path][fn.name] = fn
                self.funcs_by_name.setdefault(fn.name, []).append(fn)

    def _resolve_module_to_file(
        self, current_file: str, module_str: str, is_relative: bool
    ) -> str | None:
        cur_dir = posixpath.dirname(current_file)
        clean_mod = module_str.replace("\\", "/").strip()
        if not clean_mod:
            return None

        if is_relative or clean_mod.startswith("."):
            rel_str = clean_mod
            dots = 0
            while rel_str.startswith("."):
                dots += 1
                rel_str = rel_str[1:]

            if clean_mod.startswith("./"):
                target_base = posixpath.normpath(posixpath.join(cur_dir, clean_mod[2:]))
            elif clean_mod.startswith("../"):
                target_base = posixpath.normpath(posixpath.join(cur_dir, clean_mod))
            else:
                target_dir = cur_dir
                for _ in range(max(0, dots - 1)):
                    target_dir = posixpath.dirname(target_dir)
                rel_clean = rel_str.lstrip(".").replace(".", "/")
                target_base = (
                    posixpath.normpath(posixpath.join(target_dir, rel_clean))
                    if rel_clean
                    else target_dir
                )

            candidates = [
                target_base,
                target_base + ".py",
                target_base + ".ts",
                target_base + ".tsx",
                target_base + ".js",
                target_base + ".jsx",
                target_base + ".java",
                target_base + ".go",
                target_base + ".cs",
                posixpath.join(target_base, "index.ts"),
                posixpath.join(target_base, "index.js"),
                posixpath.join(target_base, "__init__.py"),
            ]
            for cand in candidates:
                if cand in self.files_by_path:
                    return cand
            return None

        # Non-relative imports
        mod_as_path = clean_mod.replace(".", "/")
        candidates = [
            mod_as_path,
            mod_as_path + ".py",
            mod_as_path + ".ts",
            mod_as_path + ".tsx",
            mod_as_path + ".js",
            mod_as_path + ".jsx",
            mod_as_path + ".java",
            mod_as_path + ".go",
            mod_as_path + ".cs",
            posixpath.join(mod_as_path, "index.ts"),
            posixpath.join(mod_as_path, "index.js"),
            posixpath.join(mod_as_path, "__init__.py"),
        ]
        for cand in candidates:
            if cand in self.files_by_path:
                return cand
            for fpath in self.files_by_path:
                if fpath.endswith("/" + cand) or fpath == cand:
                    return fpath

        clean_dotted = clean_mod.replace("/", ".")
        if clean_dotted in self.files_by_module:
            return self.files_by_module[clean_dotted]

        stem = clean_mod.split(".")[-1].split("/")[-1]
        stems = self.files_by_stem.get(stem, [])
        if len(stems) == 1:
            return stems[0]

        return None

    def _resolve_all_imports(self) -> None:
        for s in self.summaries:
            file_path = self._norm(s.path)
            self.resolved_file_imports[file_path] = set()
            self.imported_symbols[file_path] = {}
            self.module_aliases[file_path] = {}

            for imp in s.imports:
                target_file = self._resolve_module_to_file(
                    file_path, imp.module, imp.is_relative
                )
                if not target_file or target_file == file_path:
                    continue

                self.resolved_file_imports[file_path].add(target_file)

                if imp.alias:
                    self.module_aliases[file_path][imp.alias] = target_file
                else:
                    stem = Path(target_file).stem
                    if stem not in ("__init__", "index"):
                        self.module_aliases[file_path][stem] = target_file

                for name in imp.names:
                    if name == "*":
                        for cls in self.classes_by_file.get(target_file, {}).values():
                            self.imported_symbols[file_path][cls.name] = cls.id or ""
                        for fn in self.top_level_funcs_by_file.get(target_file, {}).values():
                            self.imported_symbols[file_path][fn.name] = fn.id or ""
                    else:
                        cls = self.classes_by_file.get(target_file, {}).get(name)
                        if cls and cls.id:
                            self.imported_symbols[file_path][name] = cls.id
                        fn = self.top_level_funcs_by_file.get(target_file, {}).get(name)
                        if fn and fn.id:
                            self.imported_symbols[file_path][name] = fn.id

    def resolve_class(self, caller_file: str, class_name: str) -> ClassDef | None:
        caller_file = self._norm(caller_file)
        raw_name = class_name.strip()
        bare_name = raw_name.split(".")[-1]

        # 1. Current file
        if bare_name in self.classes_by_file.get(caller_file, {}):
            return self.classes_by_file[caller_file][bare_name]

        # 2. Explicitly imported symbol
        if bare_name in self.imported_symbols.get(caller_file, {}):
            target_id = self.imported_symbols[caller_file][bare_name]
            if target_id in self.classes_by_id:
                return self.classes_by_id[target_id]

        # 3. Qualified by module alias (e.g. auth.AuthService)
        if "." in raw_name:
            prefix, member = raw_name.rsplit(".", 1)
            if prefix in self.module_aliases.get(caller_file, {}):
                target_file = self.module_aliases[caller_file][prefix]
                if member in self.classes_by_file.get(target_file, {}):
                    return self.classes_by_file[target_file][member]

        # 4. In any imported file
        for imported_file in self.resolved_file_imports.get(caller_file, set()):
            if bare_name in self.classes_by_file.get(imported_file, {}):
                return self.classes_by_file[imported_file][bare_name]

        # 5. Global match only if unambiguous in the entire repo
        matches = self.classes_by_name.get(bare_name, [])
        if len(matches) == 1:
            return matches[0]

        return None

    def resolve_function(self, caller: FunctionDef, raw_call: str) -> FunctionDef | None:
        caller_file = self._norm(caller.file_path)
        call_clean = raw_call.strip()

        # 1. Check self. / this. method calls
        if call_clean.startswith("self.") or call_clean.startswith("this."):
            method_name = call_clean.split(".", 1)[1]
            if caller.class_name:
                m = self.methods_by_class.get((caller_file, caller.class_name), {}).get(method_name)
                if m:
                    return m
                cls = self.classes_by_file.get(caller_file, {}).get(caller.class_name)
                if cls:
                    for base_name in cls.bases:
                        base_cls = self.resolve_class(caller_file, base_name)
                        if base_cls:
                            base_m = self.methods_by_class.get(
                                (self._norm(base_cls.file_path), base_cls.name), {}
                            ).get(method_name)
                            if base_m:
                                return base_m
            return None

        # 2. Check if callee is an instantiation of a known Class (e.g. Calculator())
        if self.resolve_class(caller_file, call_clean):
            # Constructor call / instantiation — NOT a function call
            return None

        # 3. Direct bare name
        if "." not in call_clean:
            if caller.class_name:
                m = self.methods_by_class.get((caller_file, caller.class_name), {}).get(call_clean)
                if m:
                    return m

            fn = self.top_level_funcs_by_file.get(caller_file, {}).get(call_clean)
            if fn:
                return fn

            if call_clean in self.imported_symbols.get(caller_file, {}):
                target_id = self.imported_symbols[caller_file][call_clean]
                if target_id in self.funcs_by_id:
                    return self.funcs_by_id[target_id]

            imported_matches: list[FunctionDef] = []
            for imp_file in self.resolved_file_imports.get(caller_file, set()):
                if call_clean in self.top_level_funcs_by_file.get(imp_file, {}):
                    imported_matches.append(self.top_level_funcs_by_file[imp_file][call_clean])
            if len(imported_matches) == 1:
                return imported_matches[0]

            # Ambiguity check: only resolve if exactly 1 match in repo
            repo_matches = self.funcs_by_name.get(call_clean, [])
            if len(repo_matches) == 1:
                return repo_matches[0]

            return None

        # 4. Qualified call: `prefix.method`
        parts = call_clean.split(".")
        if len(parts) == 2:
            prefix, method = parts[0], parts[1]
            if prefix in self.module_aliases.get(caller_file, {}):
                target_file = self.module_aliases[caller_file][prefix]
                if method in self.top_level_funcs_by_file.get(target_file, {}):
                    return self.top_level_funcs_by_file[target_file][method]

            cls = self.resolve_class(caller_file, prefix)
            if cls:
                m = self.methods_by_class.get((self._norm(cls.file_path), cls.name), {}).get(method)
                if m:
                    return m

            # Receiver instance from uses / instantiations
            for used_name in caller.uses + caller.instantiations:
                used_cls = self.resolve_class(caller_file, used_name)
                if used_cls:
                    m = self.methods_by_class.get(
                        (self._norm(used_cls.file_path), used_cls.name), {}
                    ).get(method)
                    if m:
                        return m

        return None


class GraphBuilder:
    """Builds and updates the Neo4j code graph from parsed FileSummary objects."""

    # ------------------------------------------------------------------
    # Public orchestration
    # ------------------------------------------------------------------

    def ingest_full_repo(
        self,
        repo_url: str,
        repo_name: str,
        branch: str,
        summaries: list[FileSummary],
    ) -> dict[str, int]:
        """
        Full ingestion pipeline for one repository.

        Returns a stats dict with node and relationship counts.
        """
        stats: dict[str, int] = {
            "files": 0,
            "functions": 0,
            "classes": 0,
            "imports_linked": 0,
            "calls_linked": 0,
            "instantiates_linked": 0,
            "uses_linked": 0,
            "extends_linked": 0,
        }

        # Build repository symbol table for scope-aware linking
        table = RepoSymbolTable(summaries)

        with get_session() as session:
            # Pass 1a — Repository node
            self._merge_repository(session, repo_url, repo_name, branch)

            # Pass 1b — File + Function + Class nodes
            for summary in summaries:
                self._merge_file(session, summary, repo_url)
                stats["files"] += 1

                fn_count = self._merge_functions(session, summary, repo_url)
                stats["functions"] += fn_count

                cls_count = self._merge_classes(session, summary, repo_url)
                stats["classes"] += cls_count

            # Pass 2 — Relationships
            stats["imports_linked"] = self._link_imports(session, table, repo_url)
            stats["extends_linked"] = self._link_extends(session, table, repo_url)
            stats["instantiates_linked"] = self._link_instantiates(session, table, repo_url)
            stats["uses_linked"] = self._link_uses(session, table, repo_url)
            stats["calls_linked"] = self._link_calls(session, table, repo_url)

        logger.info("Ingested repo %s — %s", repo_url, stats)
        return stats

    # ------------------------------------------------------------------
    # Node creation (Pass 1)
    # ------------------------------------------------------------------

    def _merge_repository(
        self, session: Session, repo_url: str, repo_name: str, branch: str
    ) -> None:
        session.run(
            """
            MERGE (r:Repository {url: $url})
            ON CREATE SET r.name = $name, r.branch = $branch, r.created_at = timestamp()
            ON MATCH  SET r.branch = $branch, r.updated_at = timestamp()
            """,
            url=repo_url,
            name=repo_name,
            branch=branch,
        )

    def _merge_file(
        self, session: Session, summary: FileSummary, repo_url: str
    ) -> None:
        session.run(
            """
            MATCH (r:Repository {url: $repo_url})
            MERGE (f:File {repo_url: $repo_url, path: $path})
            ON CREATE SET f.language = $language, f.created_at = timestamp()
            ON MATCH  SET f.language = $language, f.updated_at = timestamp()
            MERGE (r)-[:CONTAINS]->(f)
            """,
            repo_url=repo_url,
            path=summary.path,
            language=summary.language,
        )

    def _merge_functions(
        self, session: Session, summary: FileSummary, repo_url: str
    ) -> int:
        """Merge all top-level functions and class methods."""
        all_funcs: list[FunctionDef] = list(summary.functions)
        for cls in summary.classes:
            all_funcs.extend(cls.methods)

        for fn in all_funcs:
            session.run(
                """
                MATCH (f:File {repo_url: $repo_url, path: $file_path})
                MERGE (fn:Function {
                    repo_url: $repo_url,
                    id:       $id
                })
                ON CREATE SET
                    fn.name         = $name,
                    fn.file_path    = $file_path,
                    fn.class_name   = $class_name,
                    fn.line_start   = $line_start,
                    fn.line_end     = $line_end,
                    fn.parameters   = $parameters,
                    fn.return_type  = $return_type,
                    fn.docstring    = $docstring,
                    fn.created_at   = timestamp()
                ON MATCH SET
                    fn.name         = $name,
                    fn.file_path    = $file_path,
                    fn.class_name   = $class_name,
                    fn.line_start   = $line_start,
                    fn.line_end     = $line_end,
                    fn.parameters   = $parameters,
                    fn.return_type  = $return_type,
                    fn.docstring    = $docstring,
                    fn.updated_at   = timestamp()
                MERGE (f)-[:DEFINES]->(fn)
                """,
                repo_url=repo_url,
                id=fn.id,
                file_path=summary.path,
                name=fn.name,
                class_name=fn.class_name,
                line_start=fn.line_start,
                line_end=fn.line_end,
                parameters=fn.parameters,
                return_type=fn.return_type,
                docstring=fn.docstring,
            )
        return len(all_funcs)

    def _merge_classes(
        self, session: Session, summary: FileSummary, repo_url: str
    ) -> int:
        for cls in summary.classes:
            session.run(
                """
                MATCH (f:File {repo_url: $repo_url, path: $file_path})
                MERGE (c:Class {
                    repo_url: $repo_url,
                    id:       $id
                })
                ON CREATE SET
                    c.name       = $name,
                    c.file_path  = $file_path,
                    c.line_start = $line_start,
                    c.line_end   = $line_end,
                    c.bases      = $bases,
                    c.docstring  = $docstring,
                    c.created_at = timestamp()
                ON MATCH SET
                    c.name       = $name,
                    c.file_path  = $file_path,
                    c.line_start = $line_start,
                    c.line_end   = $line_end,
                    c.bases      = $bases,
                    c.docstring  = $docstring,
                    c.updated_at = timestamp()
                MERGE (f)-[:DEFINES]->(c)
                """,
                repo_url=repo_url,
                id=cls.id,
                file_path=summary.path,
                name=cls.name,
                line_start=cls.line_start,
                line_end=cls.line_end,
                bases=cls.bases,
                docstring=cls.docstring,
            )
            # Link class → its methods via HAS_METHOD
            for method in cls.methods:
                session.run(
                    """
                    MATCH (c:Class {repo_url: $repo_url, id: $class_id})
                    MATCH (fn:Function {repo_url: $repo_url, id: $method_id})
                    MERGE (c)-[:HAS_METHOD]->(fn)
                    """,
                    repo_url=repo_url,
                    class_id=cls.id,
                    method_id=method.id,
                )
        return len(summary.classes)

    # ------------------------------------------------------------------
    # Relationship linking (Pass 2)
    # ------------------------------------------------------------------

    def _link_imports(
        self, session: Session, table: RepoSymbolTable, repo_url: str
    ) -> int:
        """Create [:IMPORTS] edges between File nodes."""
        count = 0
        for src_path, targets in table.resolved_file_imports.items():
            for tgt_path in targets:
                session.run(
                    """
                    MATCH (src:File {repo_url: $repo_url, path: $src_path})
                    MATCH (tgt:File {repo_url: $repo_url, path: $tgt_path})
                    MERGE (src)-[:IMPORTS]->(tgt)
                    """,
                    repo_url=repo_url,
                    src_path=src_path,
                    tgt_path=tgt_path,
                )
                count += 1
        return count

    def _link_extends(
        self, session: Session, table: RepoSymbolTable, repo_url: str
    ) -> int:
        """Create Class -[:EXTENDS]-> Class edges."""
        count = 0
        for s in table.summaries:
            for cls in s.classes:
                for base_name in cls.bases:
                    parent_cls = table.resolve_class(cls.file_path, base_name)
                    if parent_cls and parent_cls.id and parent_cls.id != cls.id:
                        session.run(
                            """
                            MATCH (child:Class {repo_url: $repo_url, id: $child_id})
                            MATCH (parent:Class {repo_url: $repo_url, id: $parent_id})
                            MERGE (child)-[:EXTENDS]->(parent)
                            """,
                            repo_url=repo_url,
                            child_id=cls.id,
                            parent_id=parent_cls.id,
                        )
                        count += 1
        return count

    def _link_instantiates(
        self, session: Session, table: RepoSymbolTable, repo_url: str
    ) -> int:
        """Create Function -[:INSTANTIATES]-> Class edges."""
        count = 0
        for s in table.summaries:
            all_funcs: list[FunctionDef] = list(s.functions)
            for cls in s.classes:
                all_funcs.extend(cls.methods)

            for fn in all_funcs:
                # Combine explicit instantiations and calls that resolve to a class
                candidates = list(fn.instantiations)
                for raw_call in fn.calls:
                    target_cls = table.resolve_class(fn.file_path, raw_call)
                    if target_cls:
                        candidates.append(raw_call)

                linked_targets: set[str] = set()
                for inst_target in candidates:
                    target_cls = table.resolve_class(fn.file_path, inst_target)
                    if target_cls and target_cls.id and target_cls.id not in linked_targets:
                        session.run(
                            """
                            MATCH (caller:Function {repo_url: $repo_url, id: $caller_id})
                            MATCH (target:Class {repo_url: $repo_url, id: $class_id})
                            MERGE (caller)-[:INSTANTIATES]->(target)
                            """,
                            repo_url=repo_url,
                            caller_id=fn.id,
                            class_id=target_cls.id,
                        )
                        linked_targets.add(target_cls.id)
                        count += 1
        return count

    def _link_uses(
        self, session: Session, table: RepoSymbolTable, repo_url: str
    ) -> int:
        """Create Function -[:USES]-> Class edges."""
        count = 0
        for s in table.summaries:
            all_funcs: list[FunctionDef] = list(s.functions)
            for cls in s.classes:
                all_funcs.extend(cls.methods)

            for fn in all_funcs:
                # Combine type references and instantiations
                candidates = list(fn.uses) + list(fn.instantiations)
                linked_targets: set[str] = set()
                for type_name in candidates:
                    target_cls = table.resolve_class(fn.file_path, type_name)
                    if target_cls and target_cls.id and target_cls.id not in linked_targets:
                        session.run(
                            """
                            MATCH (caller:Function {repo_url: $repo_url, id: $caller_id})
                            MATCH (target:Class {repo_url: $repo_url, id: $class_id})
                            MERGE (caller)-[:USES]->(target)
                            """,
                            repo_url=repo_url,
                            caller_id=fn.id,
                            class_id=target_cls.id,
                        )
                        linked_targets.add(target_cls.id)
                        count += 1
        return count

    def _link_calls(
        self, session: Session, table: RepoSymbolTable, repo_url: str
    ) -> int:
        """Create Function -[:CALLS]-> Function edges using scoped resolution."""
        count = 0
        for s in table.summaries:
            all_funcs: list[FunctionDef] = list(s.functions)
            for cls in s.classes:
                all_funcs.extend(cls.methods)

            for fn in all_funcs:
                linked_callees: set[str] = set()
                for raw_call in fn.calls:
                    callee = table.resolve_function(fn, raw_call)
                    if callee and callee.id and callee.id not in linked_callees:
                        session.run(
                            """
                            MATCH (caller:Function {repo_url: $repo_url, id: $caller_id})
                            MATCH (callee:Function {repo_url: $repo_url, id: $callee_id})
                            MERGE (caller)-[:CALLS]->(callee)
                            """,
                            repo_url=repo_url,
                            caller_id=fn.id,
                            callee_id=callee.id,
                        )
                        linked_callees.add(callee.id)
                        count += 1
        return count

    # ------------------------------------------------------------------
    # Query helpers (used by API routes)
    # ------------------------------------------------------------------

    def get_repo_nodes(
        self, repo_url: str, skip: int = 0, limit: int = 500
    ) -> list[dict[str, Any]]:
        """Return all nodes belonging to a repository."""
        with get_session() as session:
            result = session.run(
                """
                MATCH (r:Repository {url: $url})-[:CONTAINS]->(f:File)
                OPTIONAL MATCH (f)-[:DEFINES]->(n)
                RETURN
                    f.path       AS file_path,
                    f.language   AS language,
                    labels(n)[0] AS node_type,
                    n.id         AS id,
                    n.name       AS name,
                    n.line_start AS line_start,
                    n.line_end   AS line_end,
                    n.docstring  AS docstring
                SKIP $skip LIMIT $limit
                """,
                url=repo_url,
                skip=skip,
                limit=limit,
            )
            return [dict(record) for record in result]

    def get_repo_edges(
        self, repo_url: str, skip: int = 0, limit: int = 1000
    ) -> list[dict[str, Any]]:
        """Return all relationships for a repository."""
        with get_session() as session:
            result = session.run(
                """
                MATCH (a {repo_url: $url})-[r]->(b {repo_url: $url})
                RETURN
                    labels(a)[0] AS from_type,
                    a.id         AS from_id,
                    a.name       AS from_name,
                    a.path       AS from_path,
                    type(r)      AS relationship,
                    labels(b)[0] AS to_type,
                    b.id         AS to_id,
                    b.name       AS to_name,
                    b.path       AS to_path
                SKIP $skip LIMIT $limit
                """,
                url=repo_url,
                skip=skip,
                limit=limit,
            )
            return [dict(record) for record in result]

    def get_file_subgraph(
        self, repo_url: str, file_path: str
    ) -> dict[str, list[dict[str, Any]]]:
        """Return the sub-graph (nodes + edges) for a single file."""
        with get_session() as session:
            nodes_result = session.run(
                """
                MATCH (f:File {repo_url: $url, path: $path})-[:DEFINES]->(n)
                RETURN labels(n)[0] AS type, n.id AS id, n.name AS name,
                       n.line_start AS line_start, n.line_end AS line_end,
                       n.docstring  AS docstring
                """,
                url=repo_url,
                path=file_path,
            )
            edges_result = session.run(
                """
                MATCH (f:File {repo_url: $url, path: $path})-[:DEFINES]->(a)
                MATCH (a)-[r]->(b)
                WHERE b.repo_url = $url
                RETURN a.id AS from_id, a.name AS from_name, type(r) AS relationship,
                       b.id AS to_id, b.name AS to_name
                """,
                url=repo_url,
                path=file_path,
            )
            return {
                "nodes": [dict(r) for r in nodes_result],
                "edges": [dict(r) for r in edges_result],
            }

    def list_repositories(self) -> list[dict[str, Any]]:
        """Return all ingested repositories."""
        with get_session() as session:
            result = session.run(
                """
                MATCH (r:Repository)
                OPTIONAL MATCH (r)-[:CONTAINS]->(f:File)
                RETURN r.url AS url, r.name AS name, r.branch AS branch,
                       count(f) AS file_count
                ORDER BY r.name
                """
            )
            return [dict(record) for record in result]
