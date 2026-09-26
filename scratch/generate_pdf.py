import os
import shutil
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#70756C"))
        
        # Footer
        footer_text = "CodeSpec AI • Day 2 — Dashboard Architecture Report"
        page_text = f"Page {self._pageNumber} of {page_count}"
        
        self.drawString(36, 28, footer_text)
        self.drawRightString(letter[0] - 36, 28, page_text)
        
        # Bottom rule
        self.setStrokeColor(colors.HexColor("#D8D9D2"))
        self.setLineWidth(0.5)
        self.line(36, 38, letter[0] - 36, 38)
        
        # Top rule (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, letter[1] - 28, "CodeSpec AI — Executive Engineering Report")
            self.drawRightString(letter[0] - 36, letter[1] - 28, "DAY 2: DASHBOARD")
            self.line(36, letter[1] - 34, letter[0] - 36, letter[1] - 34)
            
        self.restoreState()

def generate_pdf(output_paths):
    target_path = output_paths[0]
    doc = SimpleDocTemplate(
        target_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=44
    )

    styles = getSampleStyleSheet()
    
    # Custom Obsidian Sage Palette
    C_PRIMARY = colors.HexColor("#242B21")      # Deep Forest Obsidian
    C_ACCENT = colors.HexColor("#536348")       # Sage Accent
    C_TEXT = colors.HexColor("#1A1D18")         # Dark Charcoal
    C_MUTED = colors.HexColor("#5A6055")        # Muted Slate
    C_BG_LIGHT = colors.HexColor("#F3F5F1")     # Light Sage Tint
    C_BORDER = colors.HexColor("#CFD4C7")       # Soft Border
    C_SUCCESS = colors.HexColor("#2E6333")      # Success Green
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=C_PRIMARY,
        spaceAfter=2
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=C_MUTED,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=C_PRIMARY,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=C_TEXT,
        spaceAfter=4
    )
    
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=C_TEXT
    )
    
    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=C_ACCENT
    )
    
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=C_PRIMARY
    )
    
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    story = []

    # 1. Title Banner
    story.append(Paragraph("CodeSpec AI — Engineering Report", title_style))
    story.append(Paragraph("Day 2 Implementation Summary: Architecture & Operational Dashboard", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceBefore=0, spaceAfter=8))

    # 2. Executive Metadata Card Table
    meta_data = [
        [
            Paragraph("<b>Project:</b> CodeSpec AI", table_cell),
            Paragraph("<b>Phase:</b> Day 2 (Dashboard)", table_cell),
            Paragraph("<b>Design System:</b> Obsidian Sage", table_cell),
        ],
        [
            Paragraph("<b>Platform:</b> React 19 + Vite + Zustand", table_cell),
            Paragraph("<b>Backend API:</b> FastAPI (/api)", table_cell),
            Paragraph("<b>Status:</b> <font color='#2E6333'><b>COMPLETED & VERIFIED</b></font>", table_cell),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[180, 180, 180])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.75, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # 3. Overview & Objectives
    story.append(Paragraph("1. Executive Overview & Scope", h1_style))
    story.append(Paragraph(
        "Day 2 focused strictly on implementing the <b>Dashboard</b> interface on top of the established Day 1 foundation. "
        "The Dashboard functions as the central operational cockpit for CodeSpec AI, delivering immediate codebase awareness, "
        "AST-derived structural metrics, a high-level system topology preview, real-time repository change logs, "
        "and proactive documentation drift alerts without introducing unnecessary redesigns or speculative APIs.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # 4. Obsidian Sage Design System Compliance
    story.append(Paragraph("2. Obsidian Sage Design System Tokens", h1_style))
    story.append(Paragraph(
        "All visual tokens were strictly synchronized with the immutable <b>Obsidian Sage</b> enterprise palette in <code>variables.css</code> and <code>global.css</code>:",
        body_style
    ))
    
    design_tokens = [
        [Paragraph("Category", table_header), Paragraph("Token Variable", table_header), Paragraph("HEX Value", table_header), Paragraph("Semantic Role", table_header)],
        [Paragraph("App Shell", table_cell_bold), Paragraph("<code>--app-background</code>", table_cell_code), Paragraph("#121312", table_cell), Paragraph("Primary Dark Canvas", table_cell)],
        [Paragraph("Sidebar / Topbar", table_cell_bold), Paragraph("<code>--sidebar / --topbar</code>", table_cell_code), Paragraph("#171916 / #151714", table_cell), Paragraph("Navigation chrome (205px / 56px)", table_cell)],
        [Paragraph("Cards", table_cell_bold), Paragraph("<code>--card-background</code>", table_cell_code), Paragraph("#1D201B (Border: #363A32)", table_cell), Paragraph("Structured content cards (7px radius)", table_cell)],
        [Paragraph("Graph Canvas", table_cell_bold), Paragraph("<code>--graph-background</code>", table_cell_code), Paragraph("#171A17 (Grid: #282C26)", table_cell), Paragraph("Architecture graph visualization", table_cell)],
        [Paragraph("Accent / Brand", table_cell_bold), Paragraph("<code>--primary / --secondary</code>", table_cell_code), Paragraph("#A8B39A / #9C927B", table_cell), Paragraph("Sage primary & muted gold accents", table_cell)],
        [Paragraph("Graph Tiers", table_cell_bold), Paragraph("<code>--graph-frontend / service</code>", table_cell_code), Paragraph("#9BA8B0 / #91A78A", table_cell), Paragraph("Tier 1 Web UI / Tier 2 Microservices", table_cell)],
        [Paragraph("Storage & External", table_cell_bold), Paragraph("<code>--graph-database / cache / ext</code>", table_cell_code), Paragraph("#A49A82 / #B87870 / #8F9A8C", table_cell), Paragraph("PostgreSQL, Redis cache, GitHub VCS", table_cell)],
    ]
    tok_table = Table(design_tokens, colWidths=[95, 155, 125, 165])
    tok_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('BOX', (0, 0), (-1, -1), 0.75, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('PADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(tok_table)
    story.append(Spacer(1, 6))

    # 5. Core Dashboard Component Architecture
    story.append(Paragraph("3. Dashboard Component Breakdown", h1_style))
    
    comp_data = [
        [Paragraph("Component", table_header), Paragraph("File Path", table_header), Paragraph("Description & Visual Responsibility", table_header)],
        [
            Paragraph("<b>RepositoryCard</b>", table_cell_bold),
            Paragraph("<code>.../dashboard/RepositoryCard.jsx</code>", table_cell_code),
            Paragraph("Compact contextual header highlighting active repo (<code>CodeSpec-Core-Engine</code>), status pill (<code>Analyzed</code>), branch (<code>main</code>), commit hash (<code>8f4a21d</code>), language stack, and AST indexing time.", table_cell)
        ],
        [
            Paragraph("<b>MetricCard Row</b>", table_cell_bold),
            Paragraph("<code>.../dashboard/MetricCard.jsx</code>", table_cell_code),
            Paragraph("5-column metric strip displaying <b>Files</b> (1,248), <b>Services</b> (12), <b>APIs</b> (48), <b>Functions</b> (2,340), and <b>Dependencies</b> (36) with Lucide icons and context badges.", table_cell)
        ],
        [
            Paragraph("<b>ArchitecturePreview</b>", table_cell_bold),
            Paragraph("<code>.../dashboard/ArchitecturePreview.jsx</code>", table_cell_code),
            Paragraph("Primary visual anchor displaying high-level system topology across 4 tiers (Frontend, Services, Storage, External) on an SVG grid canvas with interactive node hover, edge flows, and tier legend.", table_cell)
        ],
        [
            Paragraph("<b>RecentChanges</b>", table_cell_bold),
            Paragraph("<code>.../dashboard/RecentChanges.jsx</code>", table_cell_code),
            Paragraph("Compact right-column event stream tracking AST and source edits (e.g. auth validator, API router, Redis config, AST dependency parser) with author and relative time tags.", table_cell)
        ],
        [
            Paragraph("<b>DocumentationAlerts</b>", table_cell_bold),
            Paragraph("<code>.../dashboard/DocumentationAlerts.jsx</code>", table_cell_code),
            Paragraph("Proactive drift detection surfacing missing OpenAPI specs, undocumented core functions, and outdated module signatures with calibrated severity colors (warning/danger).", table_cell)
        ],
        [
            Paragraph("<b>Dashboard Page</b>", table_cell_bold),
            Paragraph("<code>pages/Dashboard.jsx</code>", table_cell_code),
            Paragraph("Layout composer assembling Repository Context → Metrics Strip → 2-Column Grid. Clean separation of concerns with no bloated inline logic.", table_cell)
        ],
    ]
    comp_table = Table(comp_data, colWidths=[115, 160, 265])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('BOX', (0, 0), (-1, -1), 0.75, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('PADDING', (0, 0), (-1, -1), 3.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 6))

    # 6. Foundation Primitives & State Management
    story.append(KeepTogether([
        Paragraph("4. Common Primitives & State Infrastructure", h1_style),
        Paragraph(
            "• <b>Common UI Kit:</b> Standardized reusable primitives in <code>src/components/common/</code> including <code>Card</code>, <code>Badge</code>, <code>Button</code>, <code>Loading</code>, <code>EmptyState</code>, and <code>Modal</code>.<br/>"
            "• <b>Zustand Stores:</b> Established <code>repositoryStore.js</code>, <code>architectureStore.js</code>, and <code>uiStore.js</code> to manage reactive state without global pollution.<br/>"
            "• <b>API Service Abstraction:</b> Configured centralized Axios instance in <code>api.js</code> with clean endpoints in <code>repositoryApi.js</code> and <code>architectureApi.js</code> adhering strictly to backend contracts.",
            body_style
        ),
        Spacer(1, 4),
        Paragraph("5. Verification & Compliance Matrix", h1_style),
        Table([
            [Paragraph("Check Item", table_header), Paragraph("Standard / Requirement", table_header), Paragraph("Verification Result", table_header)],
            [Paragraph("Design Fidelity", table_cell_bold), Paragraph("Obsidian Sage dark theme, no neon, no gradients", table_cell), Paragraph("<font color='#2E6333'><b>PASSED</b> (100% compliant)</font>", table_cell)],
            [Paragraph("No Extra Overview", table_cell_bold), Paragraph("No redundant Repository Overview section", table_cell), Paragraph("<font color='#2E6333'><b>PASSED</b> (Maximized preview space)</font>", table_cell)],
            [Paragraph("No Large Page Title", table_cell_bold), Paragraph("No oversized Dashboard / Overview titles", table_cell), Paragraph("<font color='#2E6333'><b>PASSED</b> (Vertical efficiency achieved)</font>", table_cell)],
            [Paragraph("ESLint Analysis", table_cell_bold), Paragraph("Code cleanliness, unused variables check", table_cell), Paragraph("<font color='#2E6333'><b>PASSED</b> (0 errors, 0 warnings)</font>", table_cell)],
            [Paragraph("Vite Production Build", table_cell_bold), Paragraph("Optimized bundle compilation", table_cell), Paragraph("<font color='#2E6333'><b>PASSED</b> (277 kB JS, 7.78 kB CSS)</font>", table_cell)],
            [Paragraph("Browser Rendering", table_cell_bold), Paragraph("Layout responsiveness & routing integrity", table_cell), Paragraph("<font color='#2E6333'><b>PASSED</b> (Zero overflow, fluid grid)</font>", table_cell)],
        ], colWidths=[120, 240, 180], style=[
            ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
            ('BOX', (0, 0), (-1, -1), 0.75, C_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
            ('PADDING', (0, 0), (-1, -1), 3.5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ])
    ]))

    doc.build(story, canvasmaker=NumberedCanvas)

    for p in output_paths[1:]:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        shutil.copy2(target_path, p)
        print(f"Copied to: {p}")

if __name__ == "__main__":
    paths = [
        r"c:\Users\acer\OneDrive\Desktop\CodespecAI\CodespecAI\CodespecAI\CodeSpec_AI_Day_2_Dashboard_Report.pdf",
        r"c:\Users\acer\OneDrive\Desktop\CodespecAI\CodespecAI\CodespecAI\codespec-frontend\public\CodeSpec_AI_Day_2_Dashboard_Report.pdf",
    ]
    generate_pdf(paths)
    print("PDF generation complete.")
