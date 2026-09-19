from dataclasses import dataclass, field


@dataclass
class FunctionDef:
    name: str
    file_path: str
    line_start: int
    line_end: int
    parameters: list[str] = field(default_factory=list)
    return_type: str | None = None
    calls: list[str] = field(default_factory=list)
    docstring: str | None = None
    id: str | None = None
    class_name: str | None = None
    instantiations: list[str] = field(default_factory=list)
    uses: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        norm_path = self.file_path.replace("\\", "/")
        if not self.id:
            if self.class_name:
                self.id = f"{norm_path}::{self.class_name}::{self.name}"
            else:
                self.id = f"{norm_path}::{self.name}"


@dataclass
class ClassDef:
    name: str
    file_path: str
    line_start: int
    line_end: int
    bases: list[str] = field(default_factory=list)
    methods: list[FunctionDef] = field(default_factory=list)
    docstring: str | None = None
    id: str | None = None

    def __post_init__(self) -> None:
        norm_path = self.file_path.replace("\\", "/")
        if not self.id:
            self.id = f"{norm_path}::{self.name}"


@dataclass
class ImportDef:
    module: str
    names: list[str] = field(default_factory=list)
    alias: str | None = None
    is_relative: bool = False


@dataclass
class FileSummary:
    path: str
    language: str
    functions: list[FunctionDef] = field(default_factory=list)
    classes: list[ClassDef] = field(default_factory=list)
    imports: list[ImportDef] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.path = self.path.replace("\\", "/")