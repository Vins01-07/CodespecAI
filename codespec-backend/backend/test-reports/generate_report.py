from datetime import date
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from xml.sax.saxutils import escape


ROOT = Path(__file__).parent
OUTPUT = ROOT / "backend-verification-report.pdf"


def read_log(name: str) -> str:
    raw = (ROOT / name).read_bytes()
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        text = raw.decode("utf-16", errors="replace")
    else:
        text = raw.decode("utf-8-sig", errors="replace")
    return text.replace("\x00", "").replace("\r\n", "\n")


def pytest_result(name: str) -> str:
    matches = re.findall(r"\d+ passed(?:, \d+ [^\n]+)? in [^\n]+", read_log(name))
    return matches[-1].strip() if matches else "See transcript"


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        textColor=colors.HexColor("#17324D"),
        fontSize=21,
        leading=25,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="ReportSubTitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        textColor=colors.HexColor("#526579"),
        fontSize=9,
        leading=12,
        spaceAfter=14,
    )
)
styles.add(
    ParagraphStyle(
        name="SectionHead",
        parent=styles["Heading2"],
        textColor=colors.HexColor("#17324D"),
        fontSize=12,
        leading=15,
        spaceBefore=9,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="BodySmall",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=11,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="CodeSmall",
        fontName="Courier",
        fontSize=7.1,
        leading=9,
        leftIndent=5,
        rightIndent=5,
        borderColor=colors.HexColor("#D7E0E8"),
        borderWidth=0.5,
        borderPadding=5,
        backColor=colors.HexColor("#F4F7FA"),
        spaceBefore=2,
        spaceAfter=5,
    )
)

areas = [
    (
        "Ingestion",
        "app/workers/tasks.py; app/core/ingestion/scanner.py; git_fetcher.py; zip_handler.py",
        "python -m pytest tests/test_module2_tasks.py tests/test_index_workspace.py tests/test_repository_indexing.py -q --tb=short",
        "ingestion.txt",
    ),
    (
        "Tree-sitter parsing",
        "app/core/parser/registry.py; app/core/parser/; app/models/parser_models.py",
        "python -m pytest tests/test_module1.py -q --tb=short",
        "tree-sitter.txt",
    ),
    (
        "Embedding, Qdrant, and chunking",
        "app/core/embeddings/service.py; app/core/vectors/indexer.py; app/core/vectors/store.py; app/core/chunking/service.py",
        "python -m pytest tests/test_embeddings.py tests/test_vector_store.py tests/test_chunking.py -q --tb=short",
        "embedding-qdrant-chunking.txt",
    ),
    (
        "Relationship extraction and Neo4j impact",
        "app/core/graph/builder.py; app/db/neo4j.py; app/core/impact/service.py",
        "python -m pytest tests/test_impact_service.py -q --tb=short",
        "relationship-neo4j-impact.txt",
    ),
    (
        "FastAPI and Celery",
        "app/main.py; app/api/routes/; app/workers/celery_app.py; app/workers/tasks.py",
        "python -m pytest tests/test_module2_api.py tests/test_module2_tasks.py -q --tb=short",
        "fastapi-celery.txt",
    ),
    (
        "GraphRAG / hybrid retrieval",
        "app/core/retrieval/service.py; app/core/retrieval/graph.py; app/api/routes/retrieval.py; app/api/routes/rag.py",
        "python -m pytest tests/test_hybrid_retrieval.py -q --tb=short",
        "graphrag.txt",
    ),
]


def footer(canvas, document):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(
        0.62 * inch,
        0.32 * inch,
        "CodeSpec AI backend | Automated and live smoke-test evidence",
    )
    canvas.drawRightString(7.88 * inch, 0.32 * inch, f"Page {document.page}")
    canvas.restoreState()


doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=letter,
    rightMargin=0.62 * inch,
    leftMargin=0.62 * inch,
    topMargin=0.55 * inch,
    bottomMargin=0.55 * inch,
    title="Backend Verification Report",
    author="CodeSpec AI",
)
story = [
    Paragraph("Backend Verification Report", styles["ReportTitle"]),
    Paragraph(f"CodeSpec AI | Run date: {date.today().isoformat()}", styles["ReportSubTitle"]),
    Paragraph("Overall test result", styles["SectionHead"]),
    Paragraph(
        "<b>PASS: 50 tests passed</b> in the host suite and in the rebuilt Docker image. "
        "Each has two non-failing warnings: Starlette/httpx deprecation and local-Qdrant payload-index notice.",
        styles["BodySmall"],
    ),
    Paragraph("Focused tests", styles["SectionHead"]),
]

rows = [[Paragraph("<b>Area</b>", styles["BodySmall"]), Paragraph("<b>Result</b>", styles["BodySmall"])] ]
for name, _, _, logfile in areas:
    rows.append(
        [
            Paragraph(escape(name), styles["BodySmall"]),
            Paragraph(escape(pytest_result(logfile)), styles["BodySmall"]),
        ]
    )
rows.extend(
    [
        [Paragraph("Live FastAPI", styles["BodySmall"]), Paragraph("PASS: /health reports ok; vector_store ready", styles["BodySmall"])],
        [Paragraph("Docker data services", styles["BodySmall"]), Paragraph("PASS: Redis, Neo4j, and Qdrant healthy", styles["BodySmall"])],
        [Paragraph("Celery queues", styles["BodySmall"]), Paragraph("PASS: celery and embeddings workers respond pong", styles["BodySmall"])],
        [Paragraph("Docker Compose", styles["BodySmall"]), Paragraph("PASS: config parses; Qdrant healthcheck fixed and verified", styles["BodySmall"])],
    ]
)
table = Table(rows, colWidths=[2.2 * inch, 4.9 * inch], repeatRows=1)
table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E5EDF4")),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#C8D3DD")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
    )
)
story.append(table)
story.append(Paragraph("Per-area commands and evidence", styles["SectionHead"]))

for index, (name, files, command, logfile) in enumerate(areas, 1):
    result = pytest_result(logfile)
    story.append(
        KeepTogether(
            [
                Paragraph(f"{index}. {escape(name)}", styles["SectionHead"]),
                Paragraph(f"<b>Main files:</b> {escape(files)}", styles["BodySmall"]),
                Paragraph(f"<b>Command:</b> <font name='Courier'>{escape(command)}</font>", styles["BodySmall"]),
                Paragraph(f"<b>Output:</b> {escape(result)} (full transcript: {escape(logfile)})", styles["BodySmall"]),
            ]
        )
    )

story.append(Paragraph("Live service outputs", styles["SectionHead"]))
health = read_log("docker-api-health.txt").strip()
story.append(Paragraph("<b>FastAPI GET /health:</b>", styles["BodySmall"]))
story.append(Preformatted(health, styles["CodeSmall"]))
smoke = read_log("runtime-smoke.txt").strip()
story.append(Paragraph("<b>Live Qdrant and Neo4j integration:</b>", styles["BodySmall"]))
story.append(Preformatted(smoke, styles["CodeSmall"]))
infra = read_log("docker-infrastructure.txt")
story.append(
    Paragraph(
        "Redis returned PONG; Neo4j returned 1 for RETURN 1 and persisted one caller-CALLS-target edge; "
        "Qdrant /healthz passed and repository-filtered vector search returned one hit. "
        "See docker-infrastructure.txt and runtime-smoke.txt for captured output.",
        styles["BodySmall"],
    )
)
celery = read_log("celery-workers.txt")
story.append(
    Paragraph(
        "Celery inspect ping returned pong for both live workers. Active queues were celery and embeddings. "
        "The API Swagger endpoint returned HTTP 200. See celery-workers.txt.",
        styles["BodySmall"],
    )
)
story.append(Paragraph("Docker build and configuration", styles["SectionHead"]))
story.append(
    Paragraph(
        "The backend image built with INSTALL_EMBEDDING_DEPS=false; all 50 tests passed inside that image. "
        "The Qdrant client is pinned to 1.13.3 for the Compose server 1.13.2. "
        "The Compose healthcheck no longer calls curl inside the minimal Qdrant image; its process check and the actual HTTP endpoint were both verified.",
        styles["BodySmall"],
    )
)
story.append(
    Paragraph(
        "Limitations: BGE-M3 model inference was not run because the heavyweight embedding dependency group and model weights were not provisioned. "
        "The embeddings queue worker was started and pinged, but no indexing task was submitted. "
        "The project-local backend .env file is absent; infrastructure ran through Compose, while API and Celery containers used explicit development environment values.",
        styles["BodySmall"],
    )
)
story.append(Paragraph("Saved evidence", styles["SectionHead"]))
story.append(
    Paragraph(
        "This folder contains focused pytest transcripts, full host and Docker test-suite outputs, live service checks, "
        "the runtime smoke-test script and output, rendered Compose config, build log, and test-summary.json.",
        styles["BodySmall"],
    )
)

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Created {OUTPUT.resolve()} ({OUTPUT.stat().st_size} bytes)")
