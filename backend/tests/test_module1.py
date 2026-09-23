"""
Focused test suite for Module 1 improvements in CodeSpec AI:
1. Unique symbol IDs (functions, methods, classes)
2. CALLS vs INSTANTIATES discrimination
3. Class inheritance (EXTENDS) across languages
4. Class/type dependency (USES) via AST
5. Scoped import and call resolution (avoiding false CALLS with duplicate names)
6. GraphBuilder 2-pass ingestion and relationship generation
7. Regression verification on existing test samples
"""
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from app.core.graph.builder import GraphBuilder, RepoSymbolTable
from app.core.parser.csharp_parser import CSharpParser
from app.core.parser.go_parser import GoParser
from app.core.parser.java_parser import JavaParser
from app.core.parser.javascript_parser import JavaScriptParser
from app.core.parser.python_parser import PythonParser
from app.core.parser.registry import ParserRegistry
from app.core.parser.typescript_parser import TypeScriptParser
from app.models.parser_models import ClassDef, FileSummary, FunctionDef, ImportDef


# ===========================================================================
# 1. Unique Symbol IDs Tests
# ===========================================================================

def test_python_unique_symbol_ids():
    code = b"""
class AuthService:
    def validate(self, token: str) -> bool:
        return True

class TokenService:
    def validate(self, token: str) -> bool:
        return False

def validate(data: str) -> bool:
    return True
"""
    parser = PythonParser()
    tree = parser._parser.parse(code)
    file_path = "services/auth.py"
    classes = parser._extract_classes(tree.root_node, code, file_path)
    functions = parser._extract_functions(tree.root_node, code, file_path)

    assert len(classes) == 2
    assert classes[0].id == "services/auth.py::AuthService"
    assert classes[1].id == "services/auth.py::TokenService"

    auth_validate = classes[0].methods[0]
    token_validate = classes[1].methods[0]
    top_validate = functions[0]

    assert auth_validate.id == "services/auth.py::AuthService::validate"
    assert token_validate.id == "services/auth.py::TokenService::validate"
    assert top_validate.id == "services/auth.py::validate"

    # Crucial: All three IDs are distinct despite having the same name 'validate'
    ids = {auth_validate.id, token_validate.id, top_validate.id}
    assert len(ids) == 3


def test_typescript_unique_symbol_ids():
    code = b"""
export class Calculator {
    add(a: number, b: number): number {
        return a + b;
    }
}

export function calculate(): number {
    return 42;
}
"""
    parser = TypeScriptParser()
    tree = parser._parser.parse(code)
    file_path = "src/calc.ts"
    classes = parser._extract_classes(tree.root_node, code, file_path)
    funcs = parser._extract_functions(tree.root_node, code, file_path)

    assert len(classes) == 1
    assert classes[0].id == "src/calc.ts::Calculator"
    assert classes[0].methods[0].id == "src/calc.ts::Calculator::add"
    assert funcs[0].id == "src/calc.ts::calculate"


def test_java_unique_symbol_ids():
    code = b"""
package com.example;

public class UserService {
    public void save(User user) {}
}
"""
    parser = JavaParser()
    tree = parser._parser.parse(code)
    file_path = "com/example/UserService.java"
    classes = parser._extract_classes(tree.root_node, code, file_path)

    assert len(classes) == 1
    assert classes[0].id == "com/example/UserService.java::UserService"
    assert classes[0].methods[0].id == "com/example/UserService.java::UserService::save"


# ===========================================================================
# 2. CALLS vs INSTANTIATES Tests
# ===========================================================================

def test_calls_vs_instantiates_python():
    code = b"""
class Calculator:
    def add(self, a: int, b: int) -> int:
        return a + b

def compute():
    calc = Calculator()
    return calc.add(1, 2)
"""
    parser = PythonParser()
    tree = parser._parser.parse(code)
    funcs = parser._extract_functions(tree.root_node, code, "test.py")
    classes = parser._extract_classes(tree.root_node, code, "test.py")

    compute_fn = funcs[0]
    assert "Calculator" in compute_fn.instantiations
    assert "calc.add" in compute_fn.calls

    # Verify via RepoSymbolTable that Calculator resolves to Class and NOT function
    summary = FileSummary(path="test.py", language="python", functions=funcs, classes=classes)
    table = RepoSymbolTable([summary])

    # Calculator() should resolve to ClassDef
    resolved_cls = table.resolve_class("test.py", "Calculator")
    assert resolved_cls is not None
    assert resolved_cls.name == "Calculator"

    # Calculator should NOT resolve to a Function
    assert table.resolve_function(compute_fn, "Calculator") is None

    # calc.add should resolve to Calculator::add
    callee = table.resolve_function(compute_fn, "calc.add")
    assert callee is not None
    assert callee.id == "test.py::Calculator::add"


def test_calls_vs_instantiates_typescript():
    code = b"""
class Calculator {
    add(a: number, b: number): number { return a + b; }
}

function run() {
    const calc = new Calculator();
    const sum = calc.add(5, 10);
    helper();
}

function helper() {}
"""
    parser = TypeScriptParser()
    tree = parser._parser.parse(code)
    funcs = parser._extract_functions(tree.root_node, code, "src/index.ts")
    run_fn = next(f for f in funcs if f.name == "run")

    assert "Calculator" in run_fn.instantiations
    assert "calc.add" in run_fn.calls
    assert "helper" in run_fn.calls
    # new Calculator() should NOT be in calls
    assert "new Calculator" not in run_fn.calls


# ===========================================================================
# 3. Inheritance (EXTENDS) Tests Across Languages
# ===========================================================================

def test_inheritance_python():
    code = b"""
class BaseService:
    pass

class AuthService(BaseService):
    pass
"""
    parser = PythonParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "auth.py")
    auth_cls = next(c for c in classes if c.name == "AuthService")
    assert "BaseService" in auth_cls.bases


def test_inheritance_typescript():
    code = b"""
class BaseService {}
class AuthService extends BaseService implements IAuth {}
"""
    parser = TypeScriptParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "auth.ts")
    auth_cls = next(c for c in classes if c.name == "AuthService")
    assert "BaseService" in auth_cls.bases


def test_inheritance_java():
    code = b"""
public class AdminUser extends User implements Serializable {}
"""
    parser = JavaParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "AdminUser.java")
    admin = classes[0]
    assert "User" in admin.bases


def test_inheritance_csharp():
    code = b"""
public class Dog : Animal, ICanBark {}
"""
    parser = CSharpParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "Dog.cs")
    dog = classes[0]
    assert "Animal" in dog.bases


def test_inheritance_go_struct_embedding():
    code = b"""
package models

type Person struct {
    Name string
}

type Employee struct {
    Person
    Salary int
}
"""
    parser = GoParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "models.go")
    emp = next(c for c in classes if c.name == "Employee")
    assert "Person" in emp.bases


# ===========================================================================
# 4. USES / Dependency Tests
# ===========================================================================

def test_uses_dependency_python():
    code = b"""
class User:
    pass

class Result:
    pass

def process(user: User) -> Result:
    return Result()
"""
    parser = PythonParser()
    tree = parser._parser.parse(code)
    funcs = parser._extract_functions(tree.root_node, code, "process.py")
    process_fn = funcs[0]

    assert "User" in process_fn.uses
    assert "Result" in process_fn.uses


def test_uses_dependency_typescript():
    code = b"""
class User {}
class ApiResponse {}

function handle(u: User): ApiResponse {
    return new ApiResponse();
}
"""
    parser = TypeScriptParser()
    tree = parser._parser.parse(code)
    funcs = parser._extract_functions(tree.root_node, code, "handle.ts")
    handle_fn = funcs[0]

    assert "User" in handle_fn.uses
    assert "ApiResponse" in handle_fn.uses


# ===========================================================================
# 5. Scoped Import & Call Resolution (Preventing False CALLS)
# ===========================================================================

def test_duplicate_functions_no_false_calls():
    """
    Test scenario with 3 files:
    - services/auth.py has def validate(): ...
    - services/token.py has def validate(): ...
    - client.py imports validate from .auth and calls validate()
    - caller_unimported.py calls validate() without importing

    Expected:
    - client.py validate() calls ONLY services/auth.py::validate
    - caller_unimported.py validate() resolves to None (skips false edges)
    """
    s_auth = FileSummary(
        path="services/auth.py",
        language="python",
        functions=[FunctionDef(name="validate", file_path="services/auth.py", line_start=1, line_end=2)],
    )
    s_token = FileSummary(
        path="services/token.py",
        language="python",
        functions=[FunctionDef(name="validate", file_path="services/token.py", line_start=1, line_end=2)],
    )
    s_client = FileSummary(
        path="services/client.py",
        language="python",
        functions=[FunctionDef(name="run", file_path="services/client.py", line_start=1, line_end=3, calls=["validate"])],
        imports=[ImportDef(module=".auth", names=["validate"], is_relative=True)],
    )
    s_unimported = FileSummary(
        path="caller_unimported.py",
        language="python",
        functions=[FunctionDef(name="ambiguous_run", file_path="caller_unimported.py", line_start=1, line_end=3, calls=["validate"])],
    )

    table = RepoSymbolTable([s_auth, s_token, s_client, s_unimported])

    # 1. client.py resolved import points specifically to auth.py
    assert "services/auth.py" in table.resolved_file_imports["services/client.py"]

    # 2. client.py calling validate resolves specifically to auth.py::validate
    client_run = s_client.functions[0]
    target_callee = table.resolve_function(client_run, "validate")
    assert target_callee is not None
    assert target_callee.id == "services/auth.py::validate"

    # 3. unimported calling validate finds 2 candidates across repo and skips rather than guessing
    unimported_run = s_unimported.functions[0]
    ambiguous_callee = table.resolve_function(unimported_run, "validate")
    assert ambiguous_callee is None  # Skipped! False edge prevented!


def test_class_method_and_instantiation_linking():
    """
    Test scenario:
    - calc.py: Calculator class with add() method
    - main.py: from .calc import Calculator; def run(): c = Calculator(); c.add()
    """
    s_calc = FileSummary(
        path="calc.py",
        language="python",
        classes=[
            ClassDef(
                name="Calculator",
                file_path="calc.py",
                line_start=1,
                line_end=4,
                methods=[FunctionDef(name="add", file_path="calc.py", line_start=2, line_end=3, class_name="Calculator")],
            )
        ],
    )
    s_main = FileSummary(
        path="main.py",
        language="python",
        functions=[
            FunctionDef(
                name="run",
                file_path="main.py",
                line_start=1,
                line_end=4,
                calls=["Calculator", "c.add"],
                instantiations=["Calculator"],
                uses=["Calculator"],
            )
        ],
        imports=[ImportDef(module=".calc", names=["Calculator"], is_relative=True)],
    )

    table = RepoSymbolTable([s_calc, s_main])

    run_fn = s_main.functions[0]

    # Instantiation
    target_cls = table.resolve_class(run_fn.file_path, "Calculator")
    assert target_cls is not None
    assert target_cls.id == "calc.py::Calculator"

    # Call on instance c.add() -> Calculator::add
    callee = table.resolve_function(run_fn, "c.add")
    assert callee is not None
    assert callee.id == "calc.py::Calculator::add"


# ===========================================================================
# 6. GraphBuilder Orchestration & Cypher Execution Test
# ===========================================================================

def test_graph_builder_orchestration_mocked_neo4j(monkeypatch):
    """Verify that GraphBuilder calls Neo4j session with correct parameters."""
    executed_queries = []

    class MockSession:
        def run(self, query: str, **kwargs):
            executed_queries.append((query.strip(), kwargs))
            return MagicMock()

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

    monkeypatch.setattr("app.core.graph.builder.get_session", lambda: MockSession())

    builder = GraphBuilder()

    s_base = FileSummary(
        path="base.py",
        language="python",
        classes=[ClassDef(name="BaseModel", file_path="base.py", line_start=1, line_end=3)],
    )
    s_user = FileSummary(
        path="user.py",
        language="python",
        classes=[
            ClassDef(
                name="User",
                file_path="user.py",
                line_start=1,
                line_end=5,
                bases=["BaseModel"],
                methods=[FunctionDef(name="validate", file_path="user.py", line_start=3, line_end=4, class_name="User")],
            )
        ],
        imports=[ImportDef(module=".base", names=["BaseModel"], is_relative=True)],
    )
    s_app = FileSummary(
        path="app.py",
        language="python",
        functions=[
            FunctionDef(
                name="init_app",
                file_path="app.py",
                line_start=1,
                line_end=4,
                calls=["User", "u.validate"],
                instantiations=["User"],
                uses=["User"],
            )
        ],
        imports=[ImportDef(module=".user", names=["User"], is_relative=True)],
    )

    stats = builder.ingest_full_repo(
        repo_url="https://github.com/example/demo",
        repo_name="demo",
        branch="main",
        summaries=[s_base, s_user, s_app],
    )

    assert stats["files"] == 3
    assert stats["classes"] == 2
    assert stats["functions"] == 2
    assert stats["imports_linked"] == 2  # user->base, app->user
    assert stats["extends_linked"] == 1  # User EXTENDS BaseModel
    assert stats["instantiates_linked"] == 1  # init_app INSTANTIATES User
    assert stats["uses_linked"] == 1  # init_app USES User
    assert stats["calls_linked"] == 1  # init_app CALLS User::validate

    # Check that EXTENDS query was issued
    extends_query_found = any("[:EXTENDS]" in q[0] for q in executed_queries)
    assert extends_query_found

    # Check that INSTANTIATES query was issued
    inst_query_found = any("[:INSTANTIATES]" in q[0] for q in executed_queries)
    assert inst_query_found

    # Check that USES query was issued
    uses_query_found = any("[:USES]" in q[0] for q in executed_queries)
    assert uses_query_found


# ===========================================================================
# 7. Regression on test_samples/test.py
# ===========================================================================

def test_regression_test_sample():
    sample_path = Path(__file__).resolve().parent.parent / "test_samples" / "test.py"
    if not sample_path.exists():
        pytest.skip("test_samples/test.py not found")

    reg = ParserRegistry()
    summary = reg.parse_file(sample_path)
    assert summary is not None
    assert summary.language == "python"
    assert len(summary.classes) == 1
    assert summary.classes[0].name == "Calculator"
    assert len(summary.classes[0].methods) == 1
    assert summary.classes[0].methods[0].name == "add"
    assert summary.classes[0].methods[0].class_name == "Calculator"

    assert len(summary.functions) == 1
    assert summary.functions[0].name == "calculate"
    assert "Calculator" in summary.functions[0].instantiations
    assert "Calculator" in summary.functions[0].uses


# ===========================================================================
# 8. Additional Multi-Language & Aliased Import Tests
# ===========================================================================

def test_javascript_instantiation_and_inheritance():
    code = b"""
class Animal {
    speak() {}
}

class Dog extends Animal {
    bark() {}
}

function createPet() {
    const d = new Dog();
    d.bark();
}
"""
    parser = JavaScriptParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "pets.js")
    funcs = parser._extract_functions(tree.root_node, code, "pets.js")

    assert len(classes) == 2
    dog_cls = next(c for c in classes if c.name == "Dog")
    assert "Animal" in dog_cls.bases

    pet_fn = funcs[0]
    assert "Dog" in pet_fn.instantiations
    assert "Dog" in pet_fn.uses
    assert "d.bark" in pet_fn.calls


def test_java_instantiations_and_uses():
    code = b"""
package com.demo;

public class OrderService {
    public Invoice createOrder(Customer customer) {
        Invoice inv = new Invoice();
        return inv;
    }
}
"""
    parser = JavaParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "com/demo/OrderService.java")
    method = classes[0].methods[0]

    assert "Invoice" in method.instantiations
    assert "Customer" in method.uses
    assert "Invoice" in method.uses


def test_csharp_instantiations_and_uses():
    code = b"""
namespace Demo {
    public class OrderProcessor {
        public Result Process(Order order) {
            Result res = new Result();
            return res;
        }
    }
}
"""
    parser = CSharpParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "Demo/OrderProcessor.cs")
    method = classes[0].methods[0]

    assert "Result" in method.instantiations
    assert "Order" in method.uses
    assert "Result" in method.uses


def test_go_receiver_and_uses():
    code = b"""
package service

type Calculator struct {}

func (c *Calculator) Add(a int, b int) int {
    return a + b
}

func Process(c *Calculator) int {
    calc := Calculator{}
    return calc.Add(1, 2)
}
"""
    parser = GoParser()
    tree = parser._parser.parse(code)
    classes = parser._extract_classes(tree.root_node, code, "service/calc.go")
    funcs = parser._extract_functions(tree.root_node, code, "service/calc.go")

    assert len(classes) == 1
    assert classes[0].name == "Calculator"
    assert len(classes[0].methods) == 1
    assert classes[0].methods[0].id == "service/calc.go::Calculator::Add"

    proc_fn = next(f for f in funcs if f.name == "Process")
    assert "Calculator" in proc_fn.uses
    assert "Calculator" in proc_fn.instantiations


def test_aliased_import_call_resolution():
    """
    Test scenario:
    - services/auth.py: def validate(): ...
    - main.py: import services.auth as auth; def run(): auth.validate()
    """
    s_auth = FileSummary(
        path="services/auth.py",
        language="python",
        functions=[FunctionDef(name="validate", file_path="services/auth.py", line_start=1, line_end=2)],
    )
    s_main = FileSummary(
        path="main.py",
        language="python",
        functions=[FunctionDef(name="run", file_path="main.py", line_start=1, line_end=3, calls=["auth.validate"])],
        imports=[ImportDef(module="services.auth", alias="auth", is_relative=False)],
    )

    table = RepoSymbolTable([s_auth, s_main])

    run_fn = s_main.functions[0]
    callee = table.resolve_function(run_fn, "auth.validate")

    assert callee is not None
    assert callee.id == "services/auth.py::validate"

