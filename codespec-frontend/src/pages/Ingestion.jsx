import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Upload,
    FolderGit2,
    GitBranch,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Clock,
    FileSearch,
    Code2,
    Network,
    Database,
    PackageCheck,
    ArrowRight,
    RefreshCw,
    XCircle,
    Files,
    Server,
    HardDrive,
} from "lucide-react";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import useRepositoryStore from "../store/repositoryStore";

// ─── Pipeline stage definitions ───────────────────────────────────────────
const PIPELINE_STAGES = [
    {
        id: "ingestion",
        label: "Repository Ingestion",
        description: "Cloning repository and preparing workspace",
        icon: Upload,
    },
    {
        id: "scanning",
        label: "File Scanning",
        description: "Discovering source files and project structure",
        icon: FileSearch,
    },
    {
        id: "parsing",
        label: "Code Parsing",
        description: "Tree-sitter AST analysis across all source files",
        icon: Code2,
    },
    {
        id: "extraction",
        label: "Symbol & Dependency Extraction",
        description: "Extracting functions, classes, imports, and call graphs",
        icon: PackageCheck,
    },
    {
        id: "graph",
        label: "Graph Construction",
        description: "Building Neo4j knowledge graph from parsed symbols",
        icon: Network,
    },
    {
        id: "completed",
        label: "Completed",
        description: "Repository analysis ready for exploration",
        icon: CheckCircle2,
    },
];

// ─── Map repository status to a pipeline stage index ──────────────────────
function resolveStageIndex(repo) {
    if (!repo) return -1;
    const status = (repo.status || "").toLowerCase();

    if (status === "ready" || status === "analyzed" || status === "completed") return 5; // completed
    if (status === "failed" || status === "error") {
        // Try to figure out which stage failed from lastIndexed text
        const hint = (repo.lastIndexed || "").toLowerCase();
        if (hint.includes("graph") || hint.includes("neo4j")) return 4;
        if (hint.includes("extract") || hint.includes("symbol") || hint.includes("depend")) return 3;
        if (hint.includes("pars") || hint.includes("ast") || hint.includes("tree-sitter")) return 2;
        if (hint.includes("scan") || hint.includes("discover")) return 1;
        return 2; // default to parsing stage for failures
    }
    if (status === "processing" || status === "indexing") {
        const hint = (repo.lastIndexed || "").toLowerCase();
        if (hint.includes("graph") || hint.includes("neo4j")) return 4;
        if (hint.includes("extract") || hint.includes("symbol")) return 3;
        if (hint.includes("pars") || hint.includes("ast")) return 2;
        if (hint.includes("scan") || hint.includes("discover")) return 1;
        return 2; // default active stage
    }
    if (status === "pending") return 0;

    return -1;
}

function getOverallStatus(repo) {
    if (!repo) return "none";
    const s = (repo.status || "").toLowerCase();
    if (s === "ready" || s === "analyzed" || s === "completed") return "completed";
    if (s === "failed" || s === "error") return "failed";
    if (s === "processing" || s === "indexing") return "processing";
    if (s === "pending") return "pending";
    return "none";
}

// ─── Page Component ───────────────────────────────────────────────────────
function Ingestion() {
    const navigate = useNavigate();
    const { repositories, activeRepository } = useRepositoryStore();

    // Find the repository that is currently processing / most recently relevant
    const [selectedRepoId, setSelectedRepoId] = useState(null);

    // Derive the repo to display: first pick selected, then any processing, then active
    const processingRepos = repositories.filter(
        (r) => ["processing", "indexing", "pending"].includes((r.status || "").toLowerCase())
    );

    const displayRepo = (() => {
        if (selectedRepoId) {
            const found = repositories.find((r) => r.id === selectedRepoId);
            if (found) return found;
        }
        if (processingRepos.length > 0) return processingRepos[0];
        return activeRepository;
    })();

    const overallStatus = getOverallStatus(displayRepo);
    const activeStageIndex = resolveStageIndex(displayRepo);

    // ─── Status badge helper ──────────────────────────────────────────────
    const getStatusBadge = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "ready" || s === "analyzed" || s === "completed")
            return { variant: "success", label: "Completed", icon: CheckCircle2 };
        if (s === "processing" || s === "indexing")
            return { variant: "warning", label: "Processing", icon: Loader2, spin: true };
        if (s === "failed" || s === "error")
            return { variant: "danger", label: "Failed", icon: AlertTriangle };
        if (s === "pending")
            return { variant: "default", label: "Pending", icon: Clock };
        return { variant: "default", label: "Idle", icon: Clock };
    };

    const statusBadge = getStatusBadge(displayRepo?.status);
    const StatusBadgeIcon = statusBadge.icon;

    // ─── Loading state (initial) ──────────────────────────────────────────
    const [isInitLoading, setIsInitLoading] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setIsInitLoading(false), 400);
        return () => clearTimeout(t);
    }, []);

    if (isInitLoading) {
        return (
            <div className="ingestion-page-container">
                <div className="cs-card" style={{ padding: "40px" }}>
                    <Loading text="Loading ingestion status..." size={22} />
                </div>
            </div>
        );
    }

    // ─── No processing target ─────────────────────────────────────────────
    if (!displayRepo) {
        return (
            <div className="ingestion-page-container">
                <header className="ing-page-header">
                    <div className="header-info">
                        <div className="title-row">
                            <div className="header-icon-wrap"><Upload size={20} /></div>
                            <h1 className="header-title">Ingestion & Processing</h1>
                        </div>
                        <p className="header-desc">
                            Monitor repository analysis pipeline — from ingestion to knowledge graph construction.
                        </p>
                    </div>
                </header>

                <Card>
                    <div style={{ padding: "12px" }}>
                        <EmptyState
                            icon={Upload}
                            title="No active ingestion"
                            description="Select or add a repository to begin codebase analysis with CodeSpec AI."
                            action={
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={FolderGit2}
                                    onClick={() => navigate("/repository")}
                                >
                                    Go to Repositories
                                </Button>
                            }
                        />
                    </div>
                </Card>

                <style>{ingestionStyles}</style>
            </div>
        );
    }

    return (
        <div className="ingestion-page-container">
            {/* ─── Header ────────────────────────────────────────────────── */}
            <header className="ing-page-header">
                <div className="header-info">
                    <div className="title-row">
                        <div className="header-icon-wrap"><Upload size={20} /></div>
                        <h1 className="header-title">Ingestion & Processing</h1>
                    </div>
                    <p className="header-desc">
                        Monitor repository analysis pipeline — from ingestion to knowledge graph construction.
                    </p>
                </div>

                {/* Repository selector if multiple processing repos */}
                {processingRepos.length > 1 && (
                    <div className="repo-selector-wrap">
                        <select
                            className="repo-selector"
                            value={selectedRepoId || displayRepo?.id || ""}
                            onChange={(e) => setSelectedRepoId(e.target.value)}
                        >
                            {processingRepos.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name} — {r.status}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </header>

            {/* ─── Current Repository Card ────────────────────────────────── */}
            <Card className="ing-repo-card">
                <div className="ing-repo-top">
                    <div className="ing-repo-identity">
                        <div className="ing-repo-icon">
                            <FolderGit2 size={20} />
                        </div>
                        <div className="ing-repo-text">
                            <div className="ing-repo-name-row">
                                <span className="ing-repo-name">{displayRepo.name}</span>
                                <Badge variant={statusBadge.variant}>
                                    <StatusBadgeIcon
                                        size={12}
                                        className={statusBadge.spin ? "ing-spin" : ""}
                                    />
                                    {statusBadge.label}
                                </Badge>
                            </div>
                            {displayRepo.url && (
                                <span className="ing-repo-url">{displayRepo.url}</span>
                            )}
                        </div>
                    </div>

                    <div className="ing-repo-meta-row">
                        {displayRepo.branch && (
                            <div className="ing-meta-pill">
                                <GitBranch size={12} />
                                <span>{displayRepo.branch}</span>
                            </div>
                        )}
                        {displayRepo.language && (
                            <div className="ing-meta-pill">
                                <Code2 size={12} />
                                <span>{displayRepo.language}</span>
                            </div>
                        )}
                        {displayRepo.size && (
                            <div className="ing-meta-pill">
                                <HardDrive size={12} />
                                <span>{displayRepo.size}</span>
                            </div>
                        )}
                        {displayRepo.metrics?.files > 0 && (
                            <div className="ing-meta-pill">
                                <Files size={12} />
                                <span>{displayRepo.metrics.files.toLocaleString()} files</span>
                            </div>
                        )}
                        {displayRepo.metrics?.services > 0 && (
                            <div className="ing-meta-pill">
                                <Server size={12} />
                                <span>{displayRepo.metrics.services} services</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* ─── Processing Pipeline ────────────────────────────────────── */}
            <Card className="ing-pipeline-card">
                <div className="ing-pipeline-header">
                    <h2 className="ing-pipeline-title">Processing Pipeline</h2>
                    <span className="ing-pipeline-sub">
                        {overallStatus === "completed" && "All stages completed successfully"}
                        {overallStatus === "processing" && "Analysis in progress..."}
                        {overallStatus === "pending" && "Queued — waiting to begin"}
                        {overallStatus === "failed" && "Pipeline encountered an error"}
                    </span>
                </div>

                <div className="ing-stages">
                    {PIPELINE_STAGES.map((stage, idx) => {
                        const StageIcon = stage.icon;

                        let stageState = "pending"; // pending | active | completed | failed
                        if (overallStatus === "completed") {
                            stageState = "completed";
                        } else if (overallStatus === "failed") {
                            if (idx < activeStageIndex) stageState = "completed";
                            else if (idx === activeStageIndex) stageState = "failed";
                            else stageState = "pending";
                        } else if (overallStatus === "processing") {
                            if (idx < activeStageIndex) stageState = "completed";
                            else if (idx === activeStageIndex) stageState = "active";
                            else stageState = "pending";
                        } else if (overallStatus === "pending") {
                            if (idx === 0) stageState = "active";
                            else stageState = "pending";
                        }

                        return (
                            <div key={stage.id} className="ing-stage-row">
                                {/* Connector line */}
                                {idx > 0 && (
                                    <div className={`ing-connector ing-connector-${stageState === "pending" ? "pending" : "done"}`} />
                                )}
                                <div className={`ing-stage ing-stage-${stageState}`}>
                                    <div className={`ing-stage-indicator ing-indicator-${stageState}`}>
                                        {stageState === "completed" && <CheckCircle2 size={16} />}
                                        {stageState === "active" && <Loader2 size={16} className="ing-spin" />}
                                        {stageState === "failed" && <XCircle size={16} />}
                                        {stageState === "pending" && <div className="ing-dot-pending" />}
                                    </div>

                                    <div className="ing-stage-body">
                                        <div className="ing-stage-label-row">
                                            <StageIcon size={14} className="ing-stage-icon" />
                                            <span className="ing-stage-label">{stage.label}</span>
                                            {stageState === "active" && (
                                                <Badge variant="warning" className="ing-stage-badge">Active</Badge>
                                            )}
                                            {stageState === "failed" && (
                                                <Badge variant="danger" className="ing-stage-badge">Failed</Badge>
                                            )}
                                            {stageState === "completed" && (
                                                <Badge variant="success" className="ing-stage-badge">Done</Badge>
                                            )}
                                        </div>
                                        <span className="ing-stage-desc">{stage.description}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* ─── Status Detail / Processing Information ─────────────────── */}
            <Card className="ing-detail-card">
                <div className="ing-detail-header">
                    <h2 className="ing-detail-title">Processing Information</h2>
                </div>

                <div className="ing-detail-grid">
                    <div className="ing-detail-item">
                        <span className="ing-detail-label">Status</span>
                        <span className={`ing-detail-value ing-detail-status-${overallStatus}`}>
                            {statusBadge.label}
                        </span>
                    </div>
                    <div className="ing-detail-item">
                        <span className="ing-detail-label">Current Stage</span>
                        <span className="ing-detail-value">
                            {activeStageIndex >= 0 && activeStageIndex < PIPELINE_STAGES.length
                                ? PIPELINE_STAGES[activeStageIndex].label
                                : "—"}
                        </span>
                    </div>
                    {displayRepo.metrics?.files > 0 && (
                        <div className="ing-detail-item">
                            <span className="ing-detail-label">Files Discovered</span>
                            <span className="ing-detail-value">{displayRepo.metrics.files.toLocaleString()}</span>
                        </div>
                    )}
                    {displayRepo.metrics?.functions > 0 && (
                        <div className="ing-detail-item">
                            <span className="ing-detail-label">Functions Extracted</span>
                            <span className="ing-detail-value">{displayRepo.metrics.functions.toLocaleString()}</span>
                        </div>
                    )}
                    {displayRepo.metrics?.dependencies > 0 && (
                        <div className="ing-detail-item">
                            <span className="ing-detail-label">Dependencies</span>
                            <span className="ing-detail-value">{displayRepo.metrics.dependencies}</span>
                        </div>
                    )}
                    {displayRepo.lastIndexed && (
                        <div className="ing-detail-item ing-detail-full">
                            <span className="ing-detail-label">Last Activity</span>
                            <span className="ing-detail-value">{displayRepo.lastIndexed}</span>
                        </div>
                    )}
                </div>

                {/* ─── Error detail for failed state ──────────────────────── */}
                {overallStatus === "failed" && (
                    <div className="ing-error-box">
                        <AlertTriangle size={16} />
                        <div className="ing-error-text">
                            <span className="ing-error-title">Processing Failed</span>
                            <span className="ing-error-msg">
                                {displayRepo.lastIndexed || "An error occurred during repository analysis. Check the repository configuration and try again."}
                            </span>
                        </div>
                    </div>
                )}
            </Card>

            {/* ─── Completed / Next Action ────────────────────────────────── */}
            {overallStatus === "completed" && (
                <Card className="ing-completed-card">
                    <div className="ing-completed-inner">
                        <div className="ing-completed-icon-wrap">
                            <CheckCircle2 size={28} />
                        </div>
                        <div className="ing-completed-text">
                            <span className="ing-completed-title">Repository analysis completed</span>
                            <span className="ing-completed-sub">
                                All pipeline stages finished successfully. The codebase knowledge graph is ready for exploration.
                            </span>
                        </div>
                        <div className="ing-completed-actions">
                            <Button
                                variant="primary"
                                icon={Network}
                                onClick={() => navigate("/architecture")}
                            >
                                View Architecture
                            </Button>
                            <Button
                                variant="default"
                                icon={FolderGit2}
                                onClick={() => navigate("/repository")}
                            >
                                Repositories
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* ─── Pending — navigate to repo ────────────────────────────── */}
            {overallStatus === "pending" && (
                <Card className="ing-pending-card">
                    <div className="ing-pending-inner">
                        <Clock size={22} className="ing-pending-icon" />
                        <div className="ing-pending-text">
                            <span className="ing-pending-title">Queued for processing</span>
                            <span className="ing-pending-sub">
                                This repository is in the ingestion queue and will begin processing shortly.
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            <style>{ingestionStyles}</style>
        </div>
    );
}

// ─── Styles (scoped via JSX <style>) ──────────────────────────────────────
const ingestionStyles = `
    .ingestion-page-container {
        display: flex;
        flex-direction: column;
        gap: var(--card-gap);
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
    }

    /* Header */
    .ing-page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 14px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--card-border);
    }
    .header-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .header-icon-wrap {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--active-background);
        border: 1px solid var(--card-border);
        border-radius: var(--border-radius);
        color: var(--primary);
    }
    .header-title {
        font-size: 17px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.2px;
        margin: 0;
    }
    .header-desc {
        font-size: 12px;
        color: var(--text-muted);
        margin: 0;
        line-height: 1.4;
    }

    /* Repo selector */
    .repo-selector-wrap {
        flex-shrink: 0;
    }
    .repo-selector {
        height: 34px;
        padding: 0 10px;
        background: var(--card-background);
        border: 1px solid var(--card-border);
        border-radius: var(--border-radius);
        color: var(--text-primary);
        font-size: 12px;
        outline: none;
        cursor: pointer;
    }
    .repo-selector:focus {
        border-color: var(--primary);
    }

    /* Repo card */
    .ing-repo-card {
        padding: 16px 18px;
    }
    .ing-repo-top {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .ing-repo-identity {
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }
    .ing-repo-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--active-background);
        border: 1px solid var(--card-border);
        border-radius: var(--border-radius);
        color: var(--primary);
        flex-shrink: 0;
    }
    .ing-repo-text {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
    }
    .ing-repo-name-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }
    .ing-repo-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.1px;
    }
    .ing-repo-url {
        font-size: 11px;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 500px;
    }
    .ing-repo-meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    .ing-meta-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        background: var(--sidebar-background);
        border: 1px solid var(--card-border);
        border-radius: var(--radius-sm);
        font-size: 11px;
        color: var(--text-secondary);
    }
    .ing-meta-pill svg {
        color: var(--text-muted);
    }

    /* Pipeline card */
    .ing-pipeline-card {
        padding: 18px;
    }
    .ing-pipeline-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--card-border);
        flex-wrap: wrap;
    }
    .ing-pipeline-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }
    .ing-pipeline-sub {
        font-size: 11px;
        color: var(--text-muted);
    }

    /* Stages */
    .ing-stages {
        display: flex;
        flex-direction: column;
        gap: 0;
    }
    .ing-stage-row {
        display: flex;
        flex-direction: column;
        position: relative;
    }
    .ing-connector {
        width: 2px;
        height: 10px;
        margin-left: 15px;
        border-radius: 1px;
    }
    .ing-connector-done {
        background: var(--success);
        opacity: 0.5;
    }
    .ing-connector-pending {
        background: var(--card-border);
    }

    .ing-stage {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        transition: background 0.12s ease;
    }
    .ing-stage-active {
        background: rgba(182, 154, 103, 0.06);
    }
    .ing-stage-failed {
        background: rgba(184, 120, 112, 0.06);
    }
    .ing-stage-completed {
        opacity: 1;
    }
    .ing-stage-pending {
        opacity: 0.5;
    }

    .ing-stage-indicator {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        flex-shrink: 0;
        border: 1.5px solid var(--card-border);
        background: var(--sidebar-background);
    }
    .ing-indicator-completed {
        border-color: rgba(145, 167, 138, 0.5);
        color: var(--success);
        background: rgba(145, 167, 138, 0.1);
    }
    .ing-indicator-active {
        border-color: rgba(182, 154, 103, 0.5);
        color: var(--warning);
        background: rgba(182, 154, 103, 0.1);
    }
    .ing-indicator-failed {
        border-color: rgba(184, 120, 112, 0.5);
        color: var(--danger);
        background: rgba(184, 120, 112, 0.1);
    }
    .ing-indicator-pending {
        border-color: var(--card-border);
        color: var(--text-muted);
    }
    .ing-dot-pending {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--card-border);
    }

    .ing-stage-body {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 5px;
    }
    .ing-stage-label-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ing-stage-icon {
        color: var(--text-muted);
    }
    .ing-stage-completed .ing-stage-icon {
        color: var(--success);
    }
    .ing-stage-active .ing-stage-icon {
        color: var(--warning);
    }
    .ing-stage-failed .ing-stage-icon {
        color: var(--danger);
    }
    .ing-stage-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
    }
    .ing-stage-pending .ing-stage-label {
        color: var(--text-muted);
    }
    .ing-stage-badge {
        font-size: 10px;
        padding: 1px 6px;
    }
    .ing-stage-desc {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.3;
    }

    /* Detail card */
    .ing-detail-card {
        padding: 18px;
    }
    .ing-detail-header {
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--card-border);
    }
    .ing-detail-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }
    .ing-detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 14px;
    }
    .ing-detail-full {
        grid-column: 1 / -1;
    }
    .ing-detail-item {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 10px 12px;
        background: var(--sidebar-background);
        border: 1px solid var(--border-soft);
        border-radius: var(--radius-sm);
    }
    .ing-detail-label {
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    .ing-detail-value {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
    }
    .ing-detail-status-completed { color: var(--success); }
    .ing-detail-status-processing { color: var(--warning); }
    .ing-detail-status-failed { color: var(--danger); }
    .ing-detail-status-pending { color: var(--text-muted); }

    /* Error box */
    .ing-error-box {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 14px;
        padding: 12px 14px;
        background: rgba(184, 120, 112, 0.08);
        border: 1px solid rgba(184, 120, 112, 0.25);
        border-radius: var(--radius-sm);
        color: var(--danger);
    }
    .ing-error-box svg {
        flex-shrink: 0;
        margin-top: 1px;
    }
    .ing-error-text {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .ing-error-title {
        font-size: 12px;
        font-weight: 600;
    }
    .ing-error-msg {
        font-size: 11px;
        color: var(--text-secondary);
        line-height: 1.4;
    }

    /* Completed card */
    .ing-completed-card {
        padding: 20px;
        border-color: rgba(145, 167, 138, 0.3);
    }
    .ing-completed-inner {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }
    .ing-completed-icon-wrap {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(145, 167, 138, 0.1);
        border: 1px solid rgba(145, 167, 138, 0.3);
        border-radius: 50%;
        color: var(--success);
        flex-shrink: 0;
    }
    .ing-completed-text {
        flex: 1;
        min-width: 180px;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .ing-completed-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
    }
    .ing-completed-sub {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.4;
    }
    .ing-completed-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }

    /* Pending card */
    .ing-pending-card {
        padding: 18px;
    }
    .ing-pending-inner {
        display: flex;
        align-items: center;
        gap: 14px;
    }
    .ing-pending-icon {
        color: var(--text-muted);
        flex-shrink: 0;
    }
    .ing-pending-text {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .ing-pending-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }
    .ing-pending-sub {
        font-size: 12px;
        color: var(--text-muted);
    }

    /* Spin animation */
    .ing-spin {
        animation: ingSpin 0.8s linear infinite;
    }
    @keyframes ingSpin {
        to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 700px) {
        .ing-completed-inner {
            flex-direction: column;
            align-items: flex-start;
        }
        .ing-completed-actions {
            width: 100%;
        }
        .ing-completed-actions button {
            flex: 1;
        }
        .ing-page-header {
            flex-direction: column;
            align-items: stretch;
        }
        .ing-detail-grid {
            grid-template-columns: 1fr;
        }
    }
`;

export default Ingestion;