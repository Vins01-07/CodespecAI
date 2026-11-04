import { useState, useEffect, useMemo, useCallback } from "react";
import {
    BookOpen,
    ShieldAlert,
    Sparkles,
    Search,
    RefreshCw,
    FolderGit2,
    AlertTriangle,
    X,
} from "lucide-react";
import useRepositoryStore from "../store/repositoryStore";
import documentationApi from "../services/documentationApi";
import DocumentationList from "../components/documentation/DocumentationList";
import DocumentationReader from "../components/documentation/DocumentationReader";
import DocumentationAlert from "../components/documentation/DocumentationAlert";
import UpdateSuggestion from "../components/documentation/UpdateSuggestion";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";

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
    const [activeTab, setActiveTab] = useState("all"); // "all" | "alerts" | "suggestions"
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    const readyRepositories = repositories.filter((r) => r.status === "Ready");
    const currentRepo = activeRepository?.status === "Ready" ? activeRepository : readyRepositories[0] || activeRepository;
    const currentRepoId = currentRepo?.id;

    // Load documentation data from API
    const loadDocumentationData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [docsRes, alertsRes, suggsRes] = await Promise.all([
                documentationApi.getDocumentation(currentRepoId),
                documentationApi.getDocumentationAlerts(currentRepoId),
                documentationApi.getUpdateSuggestions(currentRepoId),
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
    }, [currentRepoId]);

    useEffect(() => {
        let isMounted = true;
        async function init() {
            try {
                const [docsRes, alertsRes, suggsRes] = await Promise.all([
                    documentationApi.getDocumentation(currentRepoId),
                    documentationApi.getDocumentationAlerts(currentRepoId),
                    documentationApi.getUpdateSuggestions(currentRepoId),
                ]);
                if (isMounted) {
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
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to load documentation data:", err);
                    setError(err.message || "Failed to load documentation from server");
                    setIsLoading(false);
                }
            }
        }
        init();
        return () => {
            isMounted = false;
        };
    }, [currentRepoId]);

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
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                doc.title?.toLowerCase().includes(q) ||
                doc.module?.toLowerCase().includes(q) ||
                doc.summary?.toLowerCase().includes(q) ||
                (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)));

            return matchesCategory && matchesSearch;
        });
    }, [documents, categoryFilter, searchQuery]);

    // Previous and Next document resolution
    const { previousDoc, nextDoc } = useMemo(() => {
        if (!selectedDoc || !filteredDocuments.length) {
            return { previousDoc: null, nextDoc: null };
        }
        const index = filteredDocuments.findIndex((d) => d.id === selectedDoc.id);
        const prev = index > 0 ? filteredDocuments[index - 1] : null;
        const next = index >= 0 && index < filteredDocuments.length - 1 ? filteredDocuments[index + 1] : null;
        return { previousDoc: prev, nextDoc: next };
    }, [selectedDoc, filteredDocuments]);

    // Calculate health & completeness score
    const healthScore = useMemo(() => {
        if (!documents.length) return 0;
        const avgCompleteness =
            documents.reduce((acc, doc) => acc + (doc.completeness || 0), 0) / documents.length;
        const penalty = alerts.filter((a) => a.severity === "danger").length * 10 + alerts.length * 3;
        return Math.max(10, Math.min(100, Math.round(avgCompleteness - penalty)));
    }, [documents, alerts]);

    return (
        <div className="doc-page-container">
            {/* Top Page Header Banner */}
            <header className="doc-top-banner">
                <div className="doc-top-title-group">
                    <h1 className="doc-page-title">
                        <span className="title-white">Git </span>
                        <span className="title-red">Docs</span>
                    </h1>
                    <span className="doc-page-subtitle">
                        Codebase specifications, architectural topology &amp; continuous AST sync
                    </span>
                </div>

                <div className="doc-top-controls">
                    {/* Repository Selector */}
                    {currentRepo && (
                        <div className="doc-repo-selector">
                            <FolderGit2 size={13} className="repo-icon-accent" />
                            <select
                                className="doc-repo-select-element font-mono"
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
                    )}

                    {/* Rescan Button */}
                    <button
                        type="button"
                        onClick={handleSync}
                        disabled={isSyncing || isLoading}
                        className="doc-sync-btn"
                        title="Rescan repository AST and sync docstrings"
                    >
                        <RefreshCw size={13} className={isSyncing ? "spin-icon" : ""} />
                        <span>{isSyncing ? "Syncing AST..." : "Rescan Docs"}</span>
                    </button>
                </div>
            </header>

            {/* Metrics Status Strip */}
            <section className="doc-metrics-strip" aria-label="Documentation Health">
                <div className="strip-metric-item">
                    <span className="strip-label">Total Specs</span>
                    <span className="strip-value font-mono">{documents.length}</span>
                </div>

                <div className="strip-divider" />

                <div className="strip-metric-item">
                    <span className="strip-label">Drift Alerts</span>
                    <span
                        className="strip-value font-mono"
                        style={{ color: alerts.length > 0 ? "#F59E0B" : "#10B981" }}
                    >
                        {alerts.length} issues
                    </span>
                </div>

                <div className="strip-divider" />

                <div className="strip-metric-item">
                    <span className="strip-label">AI Suggestions</span>
                    <span className="strip-value font-mono" style={{ color: "#00F2FE" }}>
                        {suggestions.length} ready
                    </span>
                </div>

                <div className="strip-divider" />

                <div className="strip-metric-item">
                    <span className="strip-label">Doc Health</span>
                    <span
                        className="strip-value font-mono"
                        style={{
                            color:
                                healthScore > 80
                                    ? "#10B981"
                                    : healthScore > 50
                                    ? "#F59E0B"
                                    : "var(--bright-red)",
                        }}
                    >
                        {healthScore}%
                    </span>
                </div>
            </section>

            {/* Loading & Error States */}
            {isLoading && (
                <div className="doc-state-container">
                    <Loading message="Scanning repository specifications & AST docstrings..." />
                </div>
            )}

            {!isLoading && error && (
                <div className="doc-error-box">
                    <AlertTriangle size={22} className="error-icon" />
                    <div className="error-content">
                        <h3>Failed to retrieve documentation</h3>
                        <p>{error}</p>
                    </div>
                    <Button variant="secondary" onClick={loadDocumentationData}>
                        Retry Request
                    </Button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                THREE-AREA DOCUMENTATION WORKSPACE
                Area 1: Left Section Tree Navigation
                Area 2: Central Reading Area with Breadcrumbs & Code Blocks
                Area 3: Right-Side Table of Contents (Inside Reader)
                ══════════════════════════════════════════════════════════ */}
            {!isLoading && !error && (
                <div className="doc-workspace-grid">
                    {/* AREA 1: Left Sidebar Section Tree */}
                    <aside className={`doc-left-sidebar ${mobileDrawerOpen ? "mobile-open" : ""}`}>
                        <div className="sidebar-inner-card">
                            {/* Mode Switcher Pills */}
                            <div className="doc-mode-tabs">
                                <button
                                    type="button"
                                    className={`mode-tab-btn ${activeTab === "all" ? "active" : ""}`}
                                    onClick={() => setActiveTab("all")}
                                >
                                    <BookOpen size={13} />
                                    <span>Specs</span>
                                    <span className="mode-tab-count font-mono">{documents.length}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`mode-tab-btn ${activeTab === "alerts" ? "active" : ""}`}
                                    onClick={() => setActiveTab("alerts")}
                                >
                                    <ShieldAlert size={13} />
                                    <span>Alerts</span>
                                    {alerts.length > 0 && (
                                        <span className="mode-tab-count alert font-mono">{alerts.length}</span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className={`mode-tab-btn ${activeTab === "suggestions" ? "active" : ""}`}
                                    onClick={() => setActiveTab("suggestions")}
                                >
                                    <Sparkles size={13} />
                                    <span>AI Fixes</span>
                                    {suggestions.length > 0 && (
                                        <span className="mode-tab-count ai font-mono">{suggestions.length}</span>
                                    )}
                                </button>
                            </div>

                            {/* Search bar inside section tree */}
                            <div className="doc-tree-search-wrap">
                                <Search size={13} className="search-icon-muted" />
                                <input
                                    type="text"
                                    placeholder="Filter documentation..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="doc-tree-search-input"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="search-clear-btn"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Dropdown */}
                            {categories.length > 1 && (
                                <div className="doc-category-filter-row">
                                    <span className="filter-label">Category:</span>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="doc-cat-select font-mono"
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c === "all" ? "All Categories" : c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Section Tree List */}
                            <div className="doc-tree-scroll-pane">
                                <DocumentationList
                                    documents={filteredDocuments}
                                    selectedDocId={selectedDoc?.id}
                                    onSelectDoc={(doc) => {
                                        setSelectedDoc(doc);
                                        setActiveTab("all");
                                        setMobileDrawerOpen(false);
                                    }}
                                    onResetFilters={() => {
                                        setSearchQuery("");
                                        setCategoryFilter("all");
                                    }}
                                />
                            </div>
                        </div>
                    </aside>

                    {/* AREA 2 & 3: Central Reading Area & Right TOC */}
                    <main className="doc-main-content-pane">
                        {activeTab === "all" && (
                            <DocumentationReader
                                document={selectedDoc}
                                previousDoc={previousDoc}
                                nextDoc={nextDoc}
                                onNavigateDoc={(doc) => {
                                    setSelectedDoc(doc);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                onRescan={handleSync}
                                isSyncing={isSyncing}
                            />
                        )}

                        {activeTab === "alerts" && (
                            <div className="doc-alerts-container">
                                <div className="alerts-header-card">
                                    <h2 className="alerts-title">Documentation Alerts &amp; Codebase Drift</h2>
                                    <p className="alerts-sub">
                                        Missing docstrings, undocumented endpoints, and schema drift detected by AST analysis.
                                    </p>
                                </div>

                                {alerts.length > 0 ? (
                                    <div className="alerts-feed-list">
                                        {alerts.map((alert) => (
                                            <DocumentationAlert
                                                key={alert.id}
                                                alert={alert}
                                                onFix={handleResolveAlert}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="alerts-empty-card">
                                        <EmptyState
                                            title="No Documentation Drift"
                                            message="All symbols and API routes are documented and up to date."
                                            icon={BookOpen}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "suggestions" && (
                            <div className="doc-suggestions-container">
                                <div className="suggestions-header-card">
                                    <h2 className="suggestions-title">AI Documentation Recommendations</h2>
                                    <p className="suggestions-sub">
                                        Automated docstring generation and OpenAPI annotations ready to be applied.
                                    </p>
                                </div>

                                {suggestions.length > 0 ? (
                                    <div className="suggestions-feed-list">
                                        {suggestions.map((sug) => (
                                            <UpdateSuggestion
                                                key={sug.id}
                                                suggestion={sug}
                                                onApply={handleApplySuggestion}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="suggestions-empty-card">
                                        <EmptyState
                                            title="No Pending Recommendations"
                                            message="All documentation specifications match existing code signatures."
                                            icon={Sparkles}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            )}

            <style>{`
                .doc-page-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                    gap: 16px;
                }

                /* Top Banner */
                .doc-top-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .doc-top-title-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .doc-page-title {
                    margin: 0;
                    font-size: 26px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }

                .title-white {
                    color: #F5F5F7;
                }

                .title-red {
                    color: #FF3548;
                    text-shadow: 0 0 16px rgba(255, 53, 72, 0.4);
                }

                .doc-page-subtitle {
                    font-size: 12.5px;
                    color: #A1A1AC;
                }

                .doc-top-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .doc-repo-selector {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    padding: 6px 12px;
                }

                .repo-icon-accent {
                    color: #FF3548;
                    flex-shrink: 0;
                }

                .doc-repo-select-element {
                    background: transparent;
                    border: none;
                    color: #F5F5F7;
                    font-size: 11.5px;
                    outline: none;
                    cursor: pointer;
                }

                .doc-repo-select-element option {
                    background: #151820;
                    color: #F5F5F7;
                }

                .doc-sync-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    height: 34px;
                    padding: 0 14px;
                    background: linear-gradient(135deg, #FF3548 0%, #E32636 100%);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 9px;
                    color: #FFFFFF;
                    font-size: 11.5px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(227, 38, 54, 0.35);
                    transition: all var(--duration-fast) ease;
                }

                .doc-sync-btn:hover:not(:disabled) {
                    box-shadow: 0 4px 16px rgba(227, 38, 54, 0.55);
                    transform: translateY(-1px);
                }

                .doc-sync-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .spin-icon {
                    animation: spin 1s linear infinite;
                }

                /* Metrics Status Strip */
                .doc-metrics-strip {
                    display: flex;
                    align-items: center;
                    background: rgba(16, 21, 30, 0.7);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    padding: 10px 20px;
                    gap: 20px;
                    overflow-x: auto;
                }

                .strip-metric-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }

                .strip-label {
                    font-size: 11.5px;
                    color: #8E8E98;
                    font-weight: 500;
                }

                .strip-value {
                    font-size: 12.5px;
                    font-weight: 700;
                    color: #F5F5F7;
                }

                .strip-divider {
                    width: 1px;
                    height: 16px;
                    background: rgba(255, 255, 255, 0.08);
                    flex-shrink: 0;
                }

                /* Three-Area Workspace */
                .doc-workspace-grid {
                    display: grid;
                    grid-template-columns: 290px minmax(0, 1fr);
                    align-items: start;
                    gap: 16px;
                    width: 100%;
                }

                /* AREA 1: Left Section Tree Sidebar */
                .doc-left-sidebar {
                    width: 290px;
                    flex-shrink: 0;
                    align-self: start;
                    margin: 0;
                    position: sticky;
                    top: calc(var(--topbar-height) + 14px);
                    max-height: calc(100vh - var(--topbar-height) - 36px);
                    display: flex;
                    flex-direction: column;
                }

                @media (max-width: 900px) {
                    .doc-left-sidebar {
                        width: 100%;
                        position: static;
                        max-height: none;
                    }
                }

                .sidebar-inner-card {
                    background: rgba(16, 21, 30, 0.8) !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 18px !important;
                    padding: 14px !important;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45) !important;
                    height: 100%;
                }

                @media (max-width: 900px) {
                    .doc-workspace-grid {
                        grid-template-columns: minmax(0, 1fr);
                    }
                }

                .doc-mode-tabs {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 4px;
                    background: #090A0D;
                    padding: 3px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                }

                .mode-tab-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    padding: 6px 4px;
                    background: transparent;
                    border: none;
                    border-radius: 7px;
                    color: #8E8E98;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                    white-space: nowrap;
                }

                .mode-tab-btn:hover {
                    color: #F5F5F7;
                }

                .mode-tab-btn.active {
                    background: #1B1B22;
                    color: #F5F5F7;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                }

                .mode-tab-count {
                    font-size: 9.5px;
                    background: rgba(255, 255, 255, 0.08);
                    padding: 0 4px;
                    border-radius: 4px;
                }

                .mode-tab-count.alert {
                    background: rgba(245, 158, 11, 0.2);
                    color: #F59E0B;
                }

                .mode-tab-count.ai {
                    background: rgba(22, 140, 163, 0.25);
                    color: #00F2FE;
                }

                .doc-tree-search-wrap {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #090A0D;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 9px;
                    padding: 6px 10px;
                    transition: border-color var(--duration-fast) ease;
                }

                .doc-tree-search-wrap:focus-within {
                    border-color: rgba(22, 140, 163, 0.45);
                    box-shadow: 0 0 12px rgba(22, 140, 163, 0.15);
                }

                .search-icon-muted {
                    color: #686875;
                    flex-shrink: 0;
                }

                .doc-tree-search-input {
                    flex: 1;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                    color: #F5F5F7 !important;
                    font-size: 11.5px;
                    padding: 0;
                    box-shadow: none !important;
                }

                .search-clear-btn {
                    background: transparent;
                    border: none;
                    color: #8E8E98;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 0;
                }

                .doc-category-filter-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 0 2px;
                }

                .filter-label {
                    font-size: 10.5px;
                    color: #8E8E98;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }

                .doc-cat-select {
                    background: #090A0D;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                    color: #A1A1AC;
                    font-size: 10.5px;
                    padding: 3px 6px;
                    outline: none;
                    cursor: pointer;
                }

                .doc-tree-scroll-pane {
                    flex: 1;
                    overflow-y: auto;
                    max-height: calc(100vh - 320px);
                    padding-right: 4px;
                }

                /* AREA 2 & 3: Main Pane */
                .doc-main-content-pane {
                    flex: 1;
                    min-width: 0;
                }

                /* Alerts View */
                .doc-alerts-container,
                .doc-suggestions-container {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .alerts-header-card,
                .suggestions-header-card {
                    background: rgba(16, 21, 30, 0.75);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 18px 22px;
                }

                .alerts-title,
                .suggestions-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: #F5F5F7;
                    margin: 0 0 4px 0;
                }

                .alerts-sub,
                .suggestions-sub {
                    font-size: 12px;
                    color: #A1A1AC;
                    margin: 0;
                }

                .alerts-feed-list,
                .suggestions-feed-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .alerts-empty-card,
                .suggestions-empty-card {
                    background: rgba(16, 21, 30, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 36px;
                }

                .doc-state-container {
                    padding: 40px;
                    background: rgba(16, 21, 30, 0.6);
                    border-radius: 16px;
                }

                .doc-error-box {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: rgba(255, 53, 72, 0.08);
                    border: 1px solid rgba(255, 53, 72, 0.3);
                    border-radius: 14px;
                    padding: 20px;
                }

                .error-icon {
                    color: var(--bright-red);
                    flex-shrink: 0;
                }

                .error-content h3 {
                    margin: 0 0 4px 0;
                    font-size: 14px;
                    color: #F5F5F7;
                }

                .error-content p {
                    margin: 0;
                    font-size: 12px;
                    color: #A1A1AC;
                }
            `}</style>
        </div>
    );
}

export default Documentation;
