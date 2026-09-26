import { useState, useEffect, useMemo } from "react";
import {
    BookOpen,
    ShieldAlert,
    Sparkles,
    Search,
    RefreshCw,
    FolderGit2,
    Filter,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Tag,
    Copy,
    Check,
} from "lucide-react";
import useRepositoryStore from "../store/repositoryStore";
import documentationApi from "../services/documentationApi";
import DocumentationList from "../components/documentation/DocumentationList";
import DocumentationAlert from "../components/documentation/DocumentationAlert";
import UpdateSuggestion from "../components/documentation/UpdateSuggestion";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";

function Documentation() {
    const { activeRepository, repositories, setActiveRepository } = useRepositoryStore();

    // Data states
    const [documents, setDocuments] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // UI & filter states
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("all"); // "all", "alerts", "suggestions"
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [copiedDoc, setCopiedDoc] = useState(false);

    const readyRepositories = repositories.filter((r) => r.status === "Ready");
    const currentRepo = activeRepository?.status === "Ready" ? activeRepository : readyRepositories[0] || activeRepository;

    // Load documentation data from API
    const loadDocumentationData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [docsRes, alertsRes, suggsRes] = await Promise.all([
                documentationApi.getDocumentation(currentRepo?.id),
                documentationApi.getDocumentationAlerts(currentRepo?.id),
                documentationApi.getUpdateSuggestions(currentRepo?.id),
            ]);

            const docItems = docsRes?.items || (Array.isArray(docsRes) ? docsRes : []);
            const alertItems = alertsRes?.alerts || (Array.isArray(alertsRes) ? alertsRes : []);
            const suggItems = suggsRes?.suggestions || (Array.isArray(suggsRes) ? suggsRes : []);

            setDocuments(docItems);
            setAlerts(alertItems);
            setSuggestions(suggItems);

            setSelectedDoc((prev) => {
                if (prev && docItems.some((d) => d.id === prev.id)) {
                    return prev;
                }
                return docItems[0] || null;
            });
        } catch (err) {
            console.error("Failed to load documentation data:", err);
            setError(err.message || "Failed to load documentation from server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDocumentationData();
    }, [currentRepo?.id]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await documentationApi.syncDocumentation(currentRepo?.id);
            await loadDocumentationData();
        } catch (err) {
            console.error("Failed to sync documentation:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleResolveAlert = (alertToResolve) => {
        setAlerts((prev) => prev.filter((a) => a.id !== alertToResolve.id));
    };

    const handleApplySuggestion = (suggestionToApply) => {
        setTimeout(() => {
            setSuggestions((prev) => prev.filter((s) => s.id !== suggestionToApply.id));
        }, 1500);
    };

    const handleCopyDocContent = () => {
        if (selectedDoc?.content) {
            navigator.clipboard.writeText(selectedDoc.content);
            setCopiedDoc(true);
            setTimeout(() => setCopiedDoc(false), 2000);
        }
    };

    // Extract unique categories
    const categories = useMemo(() => {
        const set = new Set(["all"]);
        documents.forEach((d) => {
            if (d.category) set.add(d.category);
        });
        return Array.from(set);
    }, [documents]);

    // Filter documents
    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
            const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                doc.title?.toLowerCase().includes(q) ||
                doc.module?.toLowerCase().includes(q) ||
                doc.summary?.toLowerCase().includes(q) ||
                (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)));

            return matchesCategory && matchesStatus && matchesSearch;
        });
    }, [documents, categoryFilter, statusFilter, searchQuery]);

    // Calculate health & completeness score
    const healthScore = useMemo(() => {
        if (!documents.length) return 0;
        const avgCompleteness =
            documents.reduce((acc, doc) => acc + (doc.completeness || 0), 0) / documents.length;
        const penalty = alerts.filter((a) => a.severity === "danger").length * 10 + alerts.length * 3;
        return Math.max(10, Math.min(100, Math.round(avgCompleteness - penalty)));
    }, [documents, alerts]);

    return (
        <div className="documentation-page">
            {/* ── Top Header Bar ────────────────────────────────────────────── */}
            <div className="doc-page-header cs-card">
                <div className="doc-header-main">
                    <div className="doc-title-row">
                        <div className="doc-icon-header">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h1 className="doc-page-title">Documentation Hub</h1>
                            <p className="doc-page-subtitle">
                                Codebase specifications, OpenAPI schemas, AST docstrings & drift tracking
                            </p>
                        </div>
                    </div>

                    <div className="doc-header-controls">
                        {/* Repository Selector */}
                        <div className="doc-repo-select-wrap">
                            <FolderGit2 size={13} className="repo-icon" />
                            <select
                                className="doc-repo-select"
                                value={currentRepo?.id || ""}
                                onChange={(e) => {
                                    const r = repositories.find((x) => x.id === e.target.value);
                                    if (r) setActiveRepository(r);
                                }}
                            >
                                {repositories.map((repo) => (
                                    <option key={repo.id} value={repo.id}>
                                        {repo.name} ({repo.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sync Button */}
                        <Button
                            variant="secondary"
                            onClick={handleSync}
                            disabled={isSyncing || isLoading}
                            className="doc-sync-btn"
                        >
                            <RefreshCw size={13} className={isSyncing ? "spinning" : ""} />
                            <span>{isSyncing ? "Syncing AST..." : "Rescan Docs"}</span>
                        </Button>
                    </div>
                </div>

                {/* ── Key Metrics Summary Bar ───────────────────────────────── */}
                <div className="doc-metrics-bar">
                    <div className="metric-pill">
                        <span className="metric-label">Total Specs:</span>
                        <span className="metric-value font-mono">{documents.length}</span>
                    </div>
                    <div className="metric-divider" />
                    <div className="metric-pill">
                        <span className="metric-label">Alerts:</span>
                        <span
                            className="metric-value font-mono"
                            style={{
                                color: alerts.length > 0 ? "var(--warning)" : "var(--success)",
                            }}
                        >
                            {alerts.length} issues
                        </span>
                    </div>
                    <div className="metric-divider" />
                    <div className="metric-pill">
                        <span className="metric-label">AI Suggestions:</span>
                        <span className="metric-value font-mono" style={{ color: "var(--primary)" }}>
                            {suggestions.length} ready
                        </span>
                    </div>
                    <div className="metric-divider" />
                    <div className="metric-pill">
                        <span className="metric-label">Doc Health:</span>
                        <span
                            className="metric-value font-mono"
                            style={{
                                color:
                                    healthScore > 80
                                        ? "var(--success)"
                                        : healthScore > 50
                                        ? "var(--warning)"
                                        : "var(--danger)",
                            }}
                        >
                            {healthScore}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Navigation Tabs ───────────────────────────────────────────── */}
            <div className="doc-nav-tabs">
                <button
                    type="button"
                    className={`nav-tab-btn ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveTab("all")}
                >
                    <BookOpen size={14} />
                    <span>Documentation Index</span>
                    <span className="tab-count font-mono">{documents.length}</span>
                </button>
                <button
                    type="button"
                    className={`nav-tab-btn ${activeTab === "alerts" ? "active" : ""}`}
                    onClick={() => setActiveTab("alerts")}
                >
                    <ShieldAlert size={14} />
                    <span>Alerts & Discrepancies</span>
                    {alerts.length > 0 && (
                        <span className="tab-count warning font-mono">{alerts.length}</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`nav-tab-btn ${activeTab === "suggestions" ? "active" : ""}`}
                    onClick={() => setActiveTab("suggestions")}
                >
                    <Sparkles size={14} />
                    <span>Update Recommendations</span>
                    {suggestions.length > 0 && (
                        <span className="tab-count primary font-mono">{suggestions.length}</span>
                    )}
                </button>
            </div>

            {/* ── Error & Loading States ────────────────────────────────────── */}
            {isLoading && (
                <div className="doc-loading-container cs-card">
                    <Loading message="Scanning repository specifications & AST docstrings..." />
                </div>
            )}

            {!isLoading && error && (
                <div className="doc-error-card cs-card">
                    <AlertTriangle size={20} className="error-icon" />
                    <div className="error-content">
                        <h3>Failed to retrieve documentation</h3>
                        <p>{error}</p>
                    </div>
                    <Button variant="secondary" onClick={loadDocumentationData}>
                        Retry Request
                    </Button>
                </div>
            )}

            {/* ── Main Tab Views ────────────────────────────────────────────── */}
            {!isLoading && !error && (
                <>
                    {/* TAB 1: ALL DOCUMENTATION (SPLIT EXPLORER & VIEWER) */}
                    {activeTab === "all" && (
                        <div className="doc-explorer-layout">
                            {/* Left Pane: Filters & Document List */}
                            <div className="doc-left-panel">
                                <div className="doc-search-filter-bar cs-card">
                                    <div className="doc-search-input-wrap">
                                        <Search size={13} className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Filter specifications, symbols..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="doc-search-input"
                                        />
                                    </div>

                                    <div className="doc-dropdowns-row">
                                        <select
                                            className="doc-filter-select"
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <option value="all">All Categories</option>
                                            {categories
                                                .filter((c) => c !== "all")
                                                .map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                        </select>

                                        <select
                                            className="doc-filter-select"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="up-to-date">Up to Date</option>
                                            <option value="needs-review">Needs Review</option>
                                            <option value="outdated">Outdated</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="doc-list-scroll-wrap">
                                    <DocumentationList
                                        documents={filteredDocuments}
                                        selectedDocId={selectedDoc?.id}
                                        onSelectDoc={(doc) => setSelectedDoc(doc)}
                                        onResetFilters={() => {
                                            setSearchQuery("");
                                            setCategoryFilter("all");
                                            setStatusFilter("all");
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Right Pane: Document Detail / Reader View */}
                            <div className="doc-right-panel">
                                {selectedDoc ? (
                                    <div className="doc-viewer-card cs-card">
                                        {/* Document Header */}
                                        <div className="doc-viewer-header">
                                            <div className="viewer-title-section">
                                                <div className="viewer-badges">
                                                    {selectedDoc.category && (
                                                        <Badge variant="neutral">{selectedDoc.category}</Badge>
                                                    )}
                                                    {selectedDoc.module && (
                                                        <Badge variant="default" className="font-mono">
                                                            {selectedDoc.module}
                                                        </Badge>
                                                    )}
                                                    <span className="viewer-completeness font-mono">
                                                        {selectedDoc.completeness}% completeness
                                                    </span>
                                                </div>
                                                <h2 className="viewer-title">{selectedDoc.title}</h2>
                                                <div className="viewer-meta-row">
                                                    {selectedDoc.author && (
                                                        <span>Author: {selectedDoc.author}</span>
                                                    )}
                                                    {selectedDoc.lastUpdated && (
                                                        <span>Last Updated: {selectedDoc.lastUpdated}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="viewer-actions">
                                                <button
                                                    type="button"
                                                    className="viewer-copy-btn"
                                                    onClick={handleCopyDocContent}
                                                    title="Copy Markdown specification"
                                                >
                                                    {copiedDoc ? <Check size={13} /> : <Copy size={13} />}
                                                    <span>{copiedDoc ? "Copied" : "Copy Markdown"}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Markdown / Document Content */}
                                        <div className="doc-viewer-body">
                                            <div className="markdown-prose">
                                                <pre className="doc-content-view font-mono">
                                                    {selectedDoc.content || selectedDoc.summary || "No content available for this document."}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Tags & Linked Alerts */}
                                        {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                                            <div className="doc-viewer-footer">
                                                <span className="footer-label">Indexed Topics:</span>
                                                <div className="doc-tags-list">
                                                    {selectedDoc.tags.map((tag) => (
                                                        <span key={tag} className="doc-tag-item">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="doc-viewer-empty cs-card">
                                        <EmptyState
                                            title="No specification selected"
                                            message="Select a document from the left list to read architecture specs and API schemas."
                                            icon={BookOpen}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ALERTS & DISCREPANCIES */}
                    {activeTab === "alerts" && (
                        <div className="doc-alerts-view">
                            <div className="alerts-section-intro cs-card">
                                <div>
                                    <h3 className="section-title">Documentation Alerts & Codebase Drift</h3>
                                    <p className="section-subtitle">
                                        Missing docstrings, undocumented API endpoints, and schema drift detected by AST static analysis.
                                    </p>
                                </div>
                                <Badge variant="warning">{alerts.length} Issues Detected</Badge>
                            </div>

                            {alerts.length === 0 ? (
                                <div className="cs-card">
                                    <EmptyState
                                        title="No documentation alerts"
                                        message="All indexed functions, schemas, and endpoints have up-to-date specifications."
                                        icon={CheckCircle2}
                                    />
                                </div>
                            ) : (
                                <div className="alerts-grid">
                                    {alerts.map((alert) => (
                                        <DocumentationAlert
                                            key={alert.id}
                                            alert={alert}
                                            onFix={handleResolveAlert}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: UPDATE RECOMMENDATIONS */}
                    {activeTab === "suggestions" && (
                        <div className="doc-suggestions-view">
                            <div className="suggestions-section-intro cs-card">
                                <div>
                                    <h3 className="section-title">Automated Update Suggestions</h3>
                                    <p className="section-subtitle">
                                        AI-generated docstrings and schema patches ready for automatic synchronization with your active codebase.
                                    </p>
                                </div>
                                <Badge variant="default">{suggestions.length} Recommendations</Badge>
                            </div>

                            {suggestions.length === 0 ? (
                                <div className="cs-card">
                                    <EmptyState
                                        title="No pending suggestions"
                                        message="Specifications match current repository AST declarations."
                                        icon={CheckCircle2}
                                    />
                                </div>
                            ) : (
                                <div className="suggestions-grid">
                                    {suggestions.map((suggestion) => (
                                        <UpdateSuggestion
                                            key={suggestion.id}
                                            suggestion={suggestion}
                                            onApply={handleApplySuggestion}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Page Styles ───────────────────────────────────────────────── */}
            <style>{`
                .documentation-page {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                .doc-page-header {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 14px 18px;
                }
                .doc-header-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    flex-wrap: wrap;
                }
                .doc-title-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .doc-icon-header {
                    width: 32px;
                    height: 32px;
                    border-radius: var(--border-radius);
                    background: rgba(168, 179, 154, 0.12);
                    color: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .doc-page-title {
                    margin: 0;
                    font-size: 16.5px;
                    font-weight: 600;
                    color: var(--text-primary);
                    letter-spacing: -0.01em;
                }
                .doc-page-subtitle {
                    margin: 2px 0 0;
                    font-size: 11.5px;
                    color: var(--text-secondary);
                }
                .doc-header-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .doc-repo-select-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                    padding: 4px 8px;
                }
                .repo-icon {
                    color: var(--secondary);
                }
                .doc-repo-select {
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 11.5px;
                    outline: none;
                    cursor: pointer;
                }
                .doc-repo-select option {
                    background: var(--card-background);
                    color: var(--text-primary);
                }
                .doc-sync-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .doc-metrics-bar {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding-top: 10px;
                    border-top: 1px solid var(--card-border);
                    flex-wrap: wrap;
                }
                .metric-pill {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                }
                .metric-label {
                    color: var(--text-muted);
                }
                .metric-value {
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .metric-divider {
                    width: 1px;
                    height: 12px;
                    background: var(--card-border);
                }
                .doc-nav-tabs {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border-bottom: 1px solid var(--card-border);
                    padding-bottom: 4px;
                    overflow-x: auto;
                }
                .nav-tab-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 12px;
                    font-size: 12px;
                    font-weight: 500;
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid transparent;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    transition: all 0.15s ease;
                    white-space: nowrap;
                }
                .nav-tab-btn:hover {
                    color: var(--text-primary);
                    background: var(--card-background-hover);
                }
                .nav-tab-btn.active {
                    color: var(--primary);
                    background: var(--active-background);
                    border-color: var(--active-border);
                    font-weight: 600;
                }
                .tab-count {
                    font-size: 10px;
                    padding: 1px 5px;
                    border-radius: 10px;
                    background: var(--card-background);
                    color: var(--text-secondary);
                    border: 1px solid var(--card-border);
                }
                .tab-count.warning {
                    background: rgba(182, 154, 103, 0.15);
                    color: var(--warning);
                    border-color: rgba(182, 154, 103, 0.3);
                }
                .tab-count.primary {
                    background: rgba(168, 179, 154, 0.15);
                    color: var(--primary);
                    border-color: rgba(168, 179, 154, 0.3);
                }
                .doc-explorer-layout {
                    display: grid;
                    grid-template-columns: 350px minmax(0, 1fr);
                    gap: 14px;
                    align-items: stretch;
                    min-height: calc(100vh - 240px);
                }
                @media (max-width: 1024px) {
                    .doc-explorer-layout {
                        grid-template-columns: 1fr;
                        min-height: auto;
                    }
                }
                .doc-left-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    height: 100%;
                }
                .doc-search-filter-bar {
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex-shrink: 0;
                }
                .doc-search-input-wrap {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    padding: 5px 8px;
                }
                .search-icon {
                    color: var(--text-muted);
                    flex-shrink: 0;
                }
                .doc-search-input {
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 11.5px;
                    outline: none;
                    width: 100%;
                }
                .doc-dropdowns-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }
                .doc-filter-select {
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    padding: 4px 6px;
                    font-size: 11px;
                    color: var(--text-secondary);
                    outline: none;
                    cursor: pointer;
                    width: 100%;
                }
                .doc-filter-select option {
                    background: var(--card-background);
                    color: var(--text-primary);
                }
                .doc-list-scroll-wrap {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    max-height: calc(100vh - 270px);
                    overflow-y: auto;
                    padding-right: 2px;
                }
                .doc-right-panel {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .doc-viewer-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    flex: 1;
                }
                .doc-viewer-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 380px;
                    flex: 1;
                }
                .doc-viewer-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 14px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--card-border);
                    flex-wrap: wrap;
                }
                .viewer-title-section {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    min-width: 0;
                    flex: 1;
                }
                .viewer-badges {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .viewer-completeness {
                    font-size: 10.5px;
                    color: var(--primary);
                    background: rgba(168, 179, 154, 0.1);
                    border: 1px solid rgba(168, 179, 154, 0.25);
                    padding: 1px 6px;
                    border-radius: var(--radius-sm);
                }
                .viewer-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    line-height: 1.35;
                }
                .viewer-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .viewer-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .viewer-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 9px;
                    font-size: 11px;
                    font-weight: 500;
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .viewer-copy-btn:hover {
                    color: var(--text-primary);
                    border-color: var(--primary);
                }
                .doc-viewer-body {
                    background: var(--app-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    padding: 14px 16px;
                    max-height: 520px;
                    overflow-y: auto;
                }
                .doc-content-view {
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.6;
                    color: var(--text-primary);
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .doc-viewer-footer {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding-top: 10px;
                    border-top: 1px solid var(--card-border);
                    flex-wrap: wrap;
                }
                .footer-label {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .doc-tags-list {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .doc-tag-item {
                    font-size: 10.5px;
                    color: var(--text-secondary);
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    padding: 1px 6px;
                    border-radius: 3px;
                }
                .doc-alerts-view,
                .doc-suggestions-view {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .alerts-section-intro,
                .suggestions-section-intro {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    gap: 14px;
                }
                .section-title {
                    margin: 0;
                    font-size: 13.5px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .section-subtitle {
                    margin: 2px 0 0;
                    font-size: 11.5px;
                    color: var(--text-secondary);
                }
                .alerts-grid,
                .suggestions-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .doc-loading-container {
                    padding: 48px 0;
                    display: flex;
                    justify-content: center;
                }
                .doc-error-card {
                    background: rgba(184, 120, 112, 0.08);
                    border: 1px solid rgba(184, 120, 112, 0.3);
                    border-radius: var(--border-radius);
                    padding: 16px 18px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .error-icon {
                    color: var(--danger);
                    flex-shrink: 0;
                }
                .error-content h3 {
                    margin: 0;
                    font-size: 13.5px;
                    color: var(--danger);
                }
                .error-content p {
                    margin: 2px 0 0;
                    font-size: 11.5px;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}

export default Documentation;