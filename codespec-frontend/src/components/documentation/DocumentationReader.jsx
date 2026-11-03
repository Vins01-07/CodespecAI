import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Copy,
    Check,
    FileText,
    ArrowLeft,
    ArrowRight,
    Code,
    Sparkles,
    Network,
    ExternalLink,
    AlertTriangle,
    Info,
    CheckCircle2,
    RefreshCw,
    GitBranch,
} from "lucide-react";
import Badge from "../common/Badge";

// Helper to convert heading text to URL-friendly anchor ID
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// Markdown Code Block with Language Badge & Copy Button
function RenderCodeBlock({ code, language }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="doc-reader-code-card">
            <div className="doc-code-header">
                <span className="doc-code-lang font-mono">{language || "text"}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="doc-code-copy-btn font-mono"
                    title="Copy code snippet"
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                </button>
            </div>
            <pre className="doc-code-pre font-mono">
                <code>{code}</code>
            </pre>
        </div>
    );
}

// Visual Architecture Diagram Box for System Architecture Specs
function ArchitectureFlowDiagram() {
    return (
        <div className="doc-arch-flow-diagram">
            <div className="arch-flow-header">
                <div className="arch-flow-title">
                    <Network size={14} className="arch-icon-cyan" />
                    <span>Architectural Pipeline &amp; Data Flow Topology</span>
                </div>
                <Badge variant="primary">LIVE SPEC</Badge>
            </div>

            <div className="arch-flow-tiers">
                <div className="flow-tier-node tier-client">
                    <span className="tier-tag">CLIENT TIER</span>
                    <span className="tier-name">React / Vite UI</span>
                    <span className="tier-sub font-mono">Port 5173</span>
                </div>

                <div className="flow-arrow">&rarr;</div>

                <div className="flow-tier-node tier-gateway">
                    <span className="tier-tag">GATEWAY</span>
                    <span className="tier-name">FastAPI Proxy</span>
                    <span className="tier-sub font-mono">Port 8000</span>
                </div>

                <div className="flow-arrow">&rarr;</div>

                <div className="flow-tier-node tier-core">
                    <span className="tier-tag">ANALYSIS ENGINE</span>
                    <span className="tier-name">AST / tree-sitter</span>
                    <span className="tier-sub font-mono">Neo4j Graph</span>
                </div>

                <div className="flow-arrow">&rarr;</div>

                <div className="flow-tier-node tier-storage">
                    <span className="tier-tag">PERSISTENCE</span>
                    <span className="tier-name">Postgres &amp; Redis</span>
                    <span className="tier-sub font-mono">L2 Cache</span>
                </div>
            </div>
        </div>
    );
}

// Markdown Content Parser & Formatter
function MarkdownArticleRenderer({ content = "" }) {
    // Parse markdown lines into structured elements
    const elements = useMemo(() => {
        if (!content) return [];
        const lines = content.split("\n");
        const parsed = [];
        let inCodeBlock = false;
        let codeBuffer = [];
        let codeLang = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block delimiter
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    parsed.push({
                        type: "code",
                        code: codeBuffer.join("\n"),
                        lang: codeLang,
                    });
                    codeBuffer = [];
                    codeLang = "";
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                    codeLang = line.replace("```", "").trim();
                }
                continue;
            }

            if (inCodeBlock) {
                codeBuffer.push(line);
                continue;
            }

            // Headings
            if (line.startsWith("### ")) {
                const text = line.replace("### ", "").trim();
                parsed.push({ type: "h3", text, id: slugify(text) });
            } else if (line.startsWith("## ")) {
                const text = line.replace("## ", "").trim();
                parsed.push({ type: "h2", text, id: slugify(text) });
            } else if (line.startsWith("# ")) {
                const text = line.replace("# ", "").trim();
                parsed.push({ type: "h1", text, id: slugify(text) });
            }
            // Blockquotes & Callouts
            else if (line.startsWith("> ")) {
                const raw = line.replace("> ", "").trim();
                const isWarning = raw.toLowerCase().includes("warning");
                const isNote = raw.toLowerCase().includes("note");
                parsed.push({
                    type: "callout",
                    text: raw.replace(/\*\*(.*?)\*\*:?/g, "$1:"),
                    variant: isWarning ? "warning" : isNote ? "note" : "info",
                });
            }
            // Unordered list
            else if (line.startsWith("- ") || line.startsWith("* ")) {
                const text = line.substring(2).trim();
                parsed.push({ type: "li", text });
            }
            // Numbered list
            else if (/^\d+\.\s/.test(line)) {
                const text = line.replace(/^\d+\.\s/, "").trim();
                parsed.push({ type: "oli", text });
            }
            // Horizontal rule
            else if (line === "---" || line === "***") {
                parsed.push({ type: "hr" });
            }
            // Paragraph
            else if (line.trim().length > 0) {
                parsed.push({ type: "p", text: line });
            }
        }

        // Flush any unclosed code block
        if (inCodeBlock && codeBuffer.length > 0) {
            parsed.push({
                type: "code",
                code: codeBuffer.join("\n"),
                lang: codeLang,
            });
        }

        return parsed;
    }, [content]);

    // Format inline markdown (bold, inline code)
    const renderInline = (str) => {
        if (!str) return null;
        // Split by inline code `...`
        const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith("`") && part.endsWith("`")) {
                return (
                    <code key={idx} className="doc-inline-code font-mono">
                        {part.slice(1, -1)}
                    </code>
                );
            }
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={idx} className="doc-bold-text">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    return (
        <div className="markdown-doc-stream">
            {elements.map((el, i) => {
                switch (el.type) {
                    case "h1":
                        // Usually rendered in article header, but render if present
                        return (
                            <h1 key={i} id={el.id} className="doc-h1-anchor">
                                {el.text}
                            </h1>
                        );
                    case "h2":
                        return (
                            <h2 key={i} id={el.id} className="doc-h2-anchor">
                                <span className="h2-text">{el.text}</span>
                                <a href={`#${el.id}`} className="doc-anchor-hash" aria-label="Anchor">
                                    #
                                </a>
                            </h2>
                        );
                    case "h3":
                        return (
                            <h3 key={i} id={el.id} className="doc-h3-anchor">
                                <span className="h3-text">{el.text}</span>
                                <a href={`#${el.id}`} className="doc-anchor-hash" aria-label="Anchor">
                                    #
                                </a>
                            </h3>
                        );
                    case "code":
                        return <RenderCodeBlock key={i} code={el.code} language={el.lang} />;
                    case "callout":
                        return (
                            <div key={i} className={`doc-callout-box callout-${el.variant}`}>
                                <div className="callout-icon-col">
                                    {el.variant === "warning" ? (
                                        <AlertTriangle size={15} />
                                    ) : el.variant === "note" ? (
                                        <Info size={15} />
                                    ) : (
                                        <CheckCircle2 size={15} />
                                    )}
                                </div>
                                <div className="callout-body">{renderInline(el.text)}</div>
                            </div>
                        );
                    case "li":
                        return (
                            <div key={i} className="doc-bullet-item">
                                <span className="bullet-dot" />
                                <span className="bullet-text">{renderInline(el.text)}</span>
                            </div>
                        );
                    case "oli":
                        return (
                            <div key={i} className="doc-numbered-item">
                                <span className="num-prefix font-mono">&bull;</span>
                                <span className="num-text">{renderInline(el.text)}</span>
                            </div>
                        );
                    case "hr":
                        return <hr key={i} className="doc-divider-line" />;
                    case "p":
                    default:
                        return (
                            <p key={i} className="doc-paragraph">
                                {renderInline(el.text)}
                            </p>
                        );
                }
            })}
        </div>
    );
}

// Right-Side Table of Contents Component
function TableOfContents({ headings = [], activeId }) {
    if (!headings || headings.length === 0) return null;

    const scrollToHeading = (id) => {
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <aside className="doc-right-toc-card">
            <div className="toc-header">
                <span className="toc-title">On this page</span>
            </div>

            <nav className="toc-links-list">
                {headings.map((h) => {
                    const isActive = activeId === h.id;
                    return (
                        <button
                            key={h.id}
                            type="button"
                            onClick={() => scrollToHeading(h.id)}
                            className={`toc-link-item ${h.level === 3 ? "toc-indent" : ""} ${
                                isActive ? "active" : ""
                            }`}
                        >
                            <span className="toc-link-text">{h.text}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="toc-related-resources">
                <span className="related-title">Related Pages</span>
                <div className="related-links">
                    <Link to="/architecture" className="related-link-item">
                        <Network size={12} />
                        <span>Interactive Architecture</span>
                        <ExternalLink size={10} className="ext-icon" />
                    </Link>
                    <Link to="/system-qa" className="related-link-item">
                        <Sparkles size={12} />
                        <span>Ask AI about this spec</span>
                        <ExternalLink size={10} className="ext-icon" />
                    </Link>
                    <Link to="/change-impact" className="related-link-item">
                        <GitBranch size={12} />
                        <span>Change Impact Analysis</span>
                        <ExternalLink size={10} className="ext-icon" />
                    </Link>
                </div>
            </div>

            <style>{`
                .doc-right-toc-card {
                    width: 220px;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    position: sticky;
                    top: calc(var(--topbar-height) + 14px);
                    max-height: calc(100vh - var(--topbar-height) - 48px);
                    overflow-y: auto;
                    padding-left: 12px;
                    border-left: 1px solid rgba(255, 255, 255, 0.08);
                }

                @media (max-width: 1140px) {
                    .doc-right-toc-card {
                        display: none;
                    }
                }

                .toc-header {
                    display: flex;
                    align-items: center;
                }

                .toc-title {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #8E8E98;
                }

                .toc-links-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .toc-link-item {
                    background: transparent;
                    border: none;
                    text-align: left;
                    font-size: 11.5px;
                    color: #A1A1AC;
                    cursor: pointer;
                    padding: 4px 6px;
                    border-radius: 6px;
                    line-height: 1.35;
                    transition: all var(--duration-fast) ease;
                }

                .toc-link-item:hover {
                    color: #F5F5F7;
                    background: rgba(255, 255, 255, 0.03);
                }

                .toc-link-item.active {
                    color: #00F2FE !important;
                    font-weight: 600;
                    background: rgba(22, 140, 163, 0.12);
                    border-left: 2px solid #00F2FE;
                    border-radius: 0 6px 6px 0;
                }

                .toc-indent {
                    padding-left: 14px;
                    font-size: 11px;
                    color: #8E8E98;
                }

                .toc-related-resources {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }

                .related-title {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #8E8E98;
                }

                .related-links {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .related-link-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    color: #A1A1AC;
                    text-decoration: none;
                    padding: 5px 8px;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all var(--duration-fast) ease;
                }

                .related-link-item:hover {
                    color: #F5F5F7;
                    border-color: rgba(22, 140, 163, 0.35);
                    background: rgba(22, 140, 163, 0.1);
                }

                .ext-icon {
                    margin-left: auto;
                    opacity: 0.5;
                }
            `}</style>
        </aside>
    );
}

// Main DocumentationReader Component
function DocumentationReader({
    document: doc,
    previousDoc,
    nextDoc,
    onNavigateDoc,
    onRescan,
    isSyncing = false,
}) {
    const [copiedDoc, setCopiedDoc] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState("");
    const [viewMode, setViewMode] = useState("rendered"); // "rendered" | "raw"

    // Extract table of contents headings
    const docContent = doc?.content;
    const headings = useMemo(() => {
        if (!docContent) return [];
        const lines = docContent.split("\n");
        const list = [];
        for (const line of lines) {
            if (line.startsWith("## ")) {
                const text = line.replace("## ", "").trim();
                list.push({ text, id: slugify(text), level: 2 });
            } else if (line.startsWith("### ")) {
                const text = line.replace("### ", "").trim();
                list.push({ text, id: slugify(text), level: 3 });
            }
        }
        return list;
    }, [docContent]);

    // Active heading tracking on scroll
    useEffect(() => {
        if (!headings.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSectionId(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: "0px 0px -70% 0px" }
        );

        headings.forEach((h) => {
            const el = document.getElementById(h.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [headings, doc?.id]);

    const handleCopyMarkdown = () => {
        if (doc?.content) {
            navigator.clipboard.writeText(doc.content);
            setCopiedDoc(true);
            setTimeout(() => setCopiedDoc(false), 2000);
        }
    };

    if (!doc) {
        return (
            <div className="doc-reader-empty-pane">
                <FileText size={32} style={{ color: "var(--secondary-text)" }} />
                <h3>Select a specification to begin reading</h3>
            </div>
        );
    }

    const isArchDoc = doc.id?.includes("overview") || doc.category === "Architecture";

    return (
        <div className="doc-central-workspace">
            {/* Center Reading Container */}
            <article className="doc-article-container">
                {/* Breadcrumbs Row */}
                <div className="doc-breadcrumbs-bar">
                    <div className="breadcrumbs-trail font-mono">
                        <span>Docs</span>
                        <span className="crumb-slash">/</span>
                        <span>{doc.category || "General"}</span>
                        <span className="crumb-slash">/</span>
                        <span className="crumb-current">{doc.module || doc.id}</span>
                    </div>

                    <div className="doc-status-indicators">
                        <span className="sync-status-pill font-mono">
                            <span className="sync-dot-green" />
                            {doc.status === "up-to-date" ? "Ready & Indexed" : doc.status || "Synced"}
                        </span>

                        {doc.completeness && (
                            <span className="doc-completeness-pill font-mono">
                                {doc.completeness}% spec
                            </span>
                        )}
                    </div>
                </div>

                {/* Article Header */}
                <header className="doc-article-header">
                    <h1 className="article-title">{doc.title}</h1>

                    {doc.summary && (
                        <div className="article-summary-card">
                            <p className="summary-text">{doc.summary}</p>
                        </div>
                    )}

                    {/* Meta & Toolbar */}
                    <div className="article-meta-toolbar">
                        <div className="meta-left">
                            {doc.author && (
                                <span className="meta-item">
                                    <span className="meta-k">Author:</span> {doc.author}
                                </span>
                            )}
                            {doc.lastUpdated && (
                                <span className="meta-item">
                                    <span className="meta-k">Updated:</span> {doc.lastUpdated}
                                </span>
                            )}
                            {doc.module && (
                                <span className="meta-item font-mono">
                                    <span className="meta-k">Module:</span> {doc.module}
                                </span>
                            )}
                        </div>

                        <div className="toolbar-actions">
                            {onRescan && (
                                <button
                                    type="button"
                                    onClick={onRescan}
                                    disabled={isSyncing}
                                    className="tool-btn font-mono"
                                    title="Rescan and refresh this specification"
                                >
                                    <RefreshCw size={12} className={isSyncing ? "spin-icon" : ""} />
                                    <span>{isSyncing ? "Syncing..." : "Rescan Spec"}</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setViewMode((m) => (m === "rendered" ? "raw" : "rendered"))}
                                className={`tool-btn font-mono ${viewMode === "raw" ? "active" : ""}`}
                                title="Toggle Raw Markdown"
                            >
                                <Code size={12} />
                                <span>{viewMode === "raw" ? "Rendered View" : "Raw Markdown"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleCopyMarkdown}
                                className="tool-btn font-mono"
                                title="Copy full Markdown"
                            >
                                {copiedDoc ? <Check size={12} /> : <Copy size={12} />}
                                <span>{copiedDoc ? "Copied!" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Topic Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                        <div className="article-tags-row">
                            {doc.tags.map((t) => (
                                <span key={t} className="article-tag font-mono">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {/* Architecture Visual Diagram for Overview Spec */}
                {isArchDoc && <ArchitectureFlowDiagram />}

                {/* Article Body Content */}
                <div className="doc-article-body">
                    {viewMode === "rendered" ? (
                        <MarkdownArticleRenderer content={doc.content || doc.summary} />
                    ) : (
                        <div className="raw-markdown-view">
                            <pre className="raw-markdown-pre font-mono">{doc.content}</pre>
                        </div>
                    )}
                </div>

                {/* Previous & Next Navigation Footer */}
                <footer className="doc-article-footer-nav">
                    {previousDoc ? (
                        <button
                            type="button"
                            onClick={() => onNavigateDoc && onNavigateDoc(previousDoc)}
                            className="nav-page-btn prev-btn"
                        >
                            <ArrowLeft size={14} className="nav-icon" />
                            <div className="nav-btn-text">
                                <span className="nav-label">Previous</span>
                                <span className="nav-title">{previousDoc.title}</span>
                            </div>
                        </button>
                    ) : (
                        <div className="nav-placeholder" />
                    )}

                    {nextDoc ? (
                        <button
                            type="button"
                            onClick={() => onNavigateDoc && onNavigateDoc(nextDoc)}
                            className="nav-page-btn next-btn"
                        >
                            <div className="nav-btn-text align-right">
                                <span className="nav-label">Next</span>
                                <span className="nav-title">{nextDoc.title}</span>
                            </div>
                            <ArrowRight size={14} className="nav-icon" />
                        </button>
                    ) : (
                        <div className="nav-placeholder" />
                    )}
                </footer>
            </article>

            {/* Right-Side Table of Contents */}
            <TableOfContents headings={headings} activeId={activeSectionId} />

            <style>{`
                .doc-central-workspace {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    width: 100%;
                    min-width: 0;
                }

                .doc-article-container {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    background: rgba(16, 21, 30, 0.75) !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 18px !important;
                    padding: 24px 28px !important;
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5) !important;
                }

                .arch-flow-tiers {
                    display: grid;
                    grid-template-columns:
                        minmax(100px, 1fr) 18px
                        minmax(100px, 1fr) 18px
                        minmax(100px, 1fr) 18px
                        minmax(100px, 1fr) !important;
                    align-items: stretch;
                    gap: 10px;
                }

                .arch-flow-tiers .flow-arrow {
                    align-self: center;
                    justify-self: center;
                    width: auto;
                    overflow: visible;
                }

                .flow-tier-node {
                    min-height: 72px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                /* Breadcrumbs */
                .doc-breadcrumbs-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding-bottom: 14px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    margin-bottom: 18px;
                    flex-wrap: wrap;
                }

                .breadcrumbs-trail {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #8E8E98;
                }

                .crumb-slash {
                    color: rgba(255, 255, 255, 0.2);
                }

                .crumb-current {
                    color: #00F2FE;
                    font-weight: 600;
                }

                .doc-status-indicators {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .sync-status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 10.5px;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    background: rgba(16, 185, 129, 0.12);
                    color: #10B981;
                    border: 1px solid rgba(16, 185, 129, 0.28);
                }

                .sync-dot-green {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #10B981;
                    box-shadow: 0 0 6px #10B981;
                }

                .doc-completeness-pill {
                    font-size: 10.5px;
                    color: #A1A1AC;
                    padding: 2px 7px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                }

                /* Article Header */
                .doc-article-header {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 22px;
                }

                .article-title {
                    font-size: 26px;
                    font-weight: 800;
                    color: #F5F5F7;
                    letter-spacing: -0.6px;
                    line-height: 1.25;
                    margin: 0;
                }

                .article-summary-card {
                    background: rgba(22, 140, 163, 0.08);
                    border-left: 3px solid #00F2FE;
                    border-radius: 0 10px 10px 0;
                    padding: 10px 14px;
                }

                .summary-text {
                    margin: 0;
                    font-size: 13px;
                    color: #D1D1DB;
                    line-height: 1.5;
                }

                .article-meta-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    flex-wrap: wrap;
                    padding-top: 4px;
                }

                .meta-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    font-size: 11.5px;
                    color: #A1A1AC;
                    flex-wrap: wrap;
                }

                .meta-k {
                    color: #686875;
                }

                .toolbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tool-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                    color: #A1A1AC;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }

                .tool-btn:hover {
                    color: #FFFFFF;
                    background: rgba(22, 140, 163, 0.15);
                    border-color: rgba(22, 140, 163, 0.4);
                }

                .tool-btn.active {
                    color: #00F2FE;
                    background: rgba(22, 140, 163, 0.2);
                    border-color: #00F2FE;
                }

                .article-tags-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .article-tag {
                    font-size: 10.5px;
                    padding: 2px 8px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    color: #8E8E98;
                }

                /* Architecture Diagram */
                .doc-arch-flow-diagram {
                    background: #090A0D;
                    border: 1px solid rgba(22, 140, 163, 0.25);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .arch-flow-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .arch-flow-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    color: #F5F5F7;
                }

                .arch-icon-cyan {
                    color: #00F2FE;
                }

                .arch-flow-tiers {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 4px 0;
                }

                .flow-tier-node {
                    flex: 1;
                    min-width: 120px;
                    background: #14161F;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    text-align: center;
                }

                .tier-tag {
                    font-size: 9px;
                    font-weight: 700;
                    color: #00F2FE;
                    letter-spacing: 0.05em;
                }

                .tier-name {
                    font-size: 12px;
                    font-weight: 700;
                    color: #F5F5F7;
                }

                .tier-sub {
                    font-size: 10px;
                    color: #8E8E98;
                }

                .flow-arrow {
                    color: rgba(22, 140, 163, 0.6);
                    font-size: 16px;
                    flex-shrink: 0;
                }

                /* Markdown Prose Stream */
                .markdown-doc-stream {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    font-size: 13.5px;
                    line-height: 1.65;
                    color: #D1D1DB;
                }

                .doc-h1-anchor {
                    font-size: 22px;
                    font-weight: 800;
                    color: #F5F5F7;
                    margin: 16px 0 6px 0;
                }

                .doc-h2-anchor {
                    font-size: 18px;
                    font-weight: 700;
                    color: #F5F5F7;
                    margin: 20px 0 6px 0;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .doc-h3-anchor {
                    font-size: 15px;
                    font-weight: 700;
                    color: #F5F5F7;
                    margin: 14px 0 4px 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .doc-anchor-hash {
                    color: transparent;
                    text-decoration: none;
                    font-weight: 400;
                    transition: color var(--duration-fast) ease;
                }

                .doc-h2-anchor:hover .doc-anchor-hash,
                .doc-h3-anchor:hover .doc-anchor-hash {
                    color: #00F2FE;
                }

                .doc-paragraph {
                    margin: 0;
                    color: #D1D1DB;
                }

                .doc-bold-text {
                    color: #F5F5F7;
                    font-weight: 700;
                }

                .doc-inline-code {
                    background: #090A0D;
                    color: #00F2FE;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    padding: 1px 5px;
                    font-size: 12px;
                }

                /* Code Block */
                .doc-reader-code-card {
                    background: #090A0D;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 6px 0;
                }

                .doc-code-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 12px;
                    background: #111319;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }

                .doc-code-lang {
                    font-size: 10.5px;
                    color: #8E8E98;
                    text-transform: lowercase;
                }

                .doc-code-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: transparent;
                    border: none;
                    color: #A1A1AC;
                    font-size: 10.5px;
                    cursor: pointer;
                }

                .doc-code-copy-btn:hover {
                    color: #FFFFFF;
                }

                .doc-code-pre {
                    margin: 0;
                    padding: 12px 14px;
                    font-size: 12px;
                    line-height: 1.5;
                    overflow-x: auto;
                    color: #E2E8F0;
                }

                /* Callout Banners */
                .doc-callout-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px 14px;
                    border-radius: 10px;
                    margin: 8px 0;
                }

                .callout-warning {
                    background: rgba(245, 158, 11, 0.08);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    color: #FCD34D;
                }

                .callout-note {
                    background: rgba(22, 140, 163, 0.08);
                    border: 1px solid rgba(22, 140, 163, 0.3);
                    color: #7DD3FC;
                }

                .callout-info {
                    background: rgba(37, 77, 156, 0.08);
                    border: 1px solid rgba(37, 77, 156, 0.3);
                    color: #93C5FD;
                }

                .callout-icon-col {
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .callout-body {
                    font-size: 12.5px;
                    line-height: 1.45;
                }

                /* Lists */
                .doc-bullet-item,
                .doc-numbered-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding-left: 6px;
                }

                .bullet-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #00F2FE;
                    margin-top: 8px;
                    flex-shrink: 0;
                }

                .num-prefix {
                    color: #8E8E98;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .doc-divider-line {
                    border: none;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    margin: 12px 0;
                }

                /* Raw Markdown View */
                .raw-markdown-view {
                    background: #090A0D;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    padding: 16px;
                }

                .raw-markdown-pre {
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #E2E8F0;
                    white-space: pre-wrap;
                }

                /* Bottom Navigation Footer */
                .doc-article-footer-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    margin-top: 36px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }

                .nav-page-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    padding: 12px 16px;
                    cursor: pointer;
                    color: #A1A1AC;
                    transition: all var(--duration-fast) ease;
                    max-width: 48%;
                }

                .nav-page-btn:hover {
                    background: rgba(22, 140, 163, 0.1);
                    border-color: rgba(22, 140, 163, 0.35);
                    color: #F5F5F7;
                    transform: translateY(-1px);
                }

                .next-btn {
                    margin-left: auto;
                }

                .nav-btn-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .nav-btn-text.align-right {
                    text-align: right;
                }

                .nav-label {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #8E8E98;
                }

                .nav-title {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #F5F5F7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .nav-icon {
                    color: #00F2FE;
                    flex-shrink: 0;
                }

                .nav-placeholder {
                    width: 1px;
                }
            `}</style>
        </div>
    );
}

export default DocumentationReader;
