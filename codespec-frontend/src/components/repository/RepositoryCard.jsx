import {
    GitBranch,
    GitCommit,
    FolderGit2,
    FileArchive,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Clock,
    Code2,
    HardDrive,
    Files,
    Server,
    ExternalLink,
    Check,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";

function RepositoryCard({
    repository,
    isActive = false,
    onSelectActive,
}) {
    if (!repository) return null;

    // Resolve status badge styling & icon
    const getStatusConfig = (status) => {
        const normalized = (status || "").toLowerCase();
        if (normalized === "ready" || normalized === "analyzed") {
            return {
                variant: "success",
                icon: CheckCircle2,
                label: "Ready",
                indicatorClass: "status-ready",
            };
        }
        if (normalized === "processing" || normalized === "indexing") {
            return {
                variant: "warning",
                icon: Loader2,
                label: "Processing",
                indicatorClass: "status-processing",
                isSpinning: true,
            };
        }
        if (normalized === "failed" || normalized === "error") {
            return {
                variant: "danger",
                icon: AlertTriangle,
                label: "Failed",
                indicatorClass: "status-failed",
            };
        }
        return {
            variant: "default",
            icon: Clock,
            label: "Pending",
            indicatorClass: "status-pending",
        };
    };

    const statusConfig = getStatusConfig(repository.status);
    const StatusIcon = statusConfig.icon;
    const isZip = repository.provider === "zip" || repository.name?.endsWith(".zip");

    return (
        <Card className={`repo-card ${isActive ? "repo-card-active" : ""}`}>
            <div className="repo-card-header">
                <div className="repo-card-title-group">
                    <div className="repo-provider-icon">
                        {isZip ? <FileArchive size={18} /> : <FolderGit2 size={18} />}
                    </div>
                    <div className="repo-title-meta">
                        <div className="repo-title-row">
                            <span className="repo-name">{repository.name}</span>
                            {isActive && (
                                <Badge variant="primary" className="active-workspace-badge">
                                    <Check size={10} />
                                    Active Workspace
                                </Badge>
                            )}
                        </div>
                        {repository.url && (
                            <span className="repo-url-link">
                                {repository.url}
                            </span>
                        )}
                    </div>
                </div>

                <div className="repo-status-wrap">
                    <Badge variant={statusConfig.variant} className="repo-status-badge">
                        <StatusIcon
                            size={12}
                            className={statusConfig.isSpinning ? "spin-icon" : ""}
                        />
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            {/* Metrics and metadata */}
            <div className="repo-card-body">
                <div className="repo-meta-grid">
                    <div className="meta-pill">
                        <GitBranch size={13} className="meta-icon" />
                        <span className="meta-label">Branch:</span>
                        <span className="meta-val branch-name">{repository.branch || "main"}</span>
                    </div>

                    {repository.commit && (
                        <div className="meta-pill">
                            <GitCommit size={13} className="meta-icon" />
                            <span className="meta-label">Commit:</span>
                            <span className="meta-val font-mono">{repository.commit}</span>
                        </div>
                    )}

                    <div className="meta-pill">
                        <Code2 size={13} className="meta-icon" />
                        <span className="meta-label">Stack:</span>
                        <span className="meta-val">{repository.language || "Multi-language"}</span>
                    </div>

                    {repository.size && (
                        <div className="meta-pill">
                            <HardDrive size={13} className="meta-icon" />
                            <span className="meta-label">Size:</span>
                            <span className="meta-val">{repository.size}</span>
                        </div>
                    )}
                </div>

                {repository.metrics && (
                    <div className="repo-stats-row">
                        <div className="stat-item">
                            <Files size={12} className="stat-icon" />
                            <span className="stat-count">
                                {repository.metrics.files?.toLocaleString() || "—"}
                            </span>
                            <span className="stat-label">files</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <Server size={12} className="stat-icon" />
                            <span className="stat-count">
                                {repository.metrics.services || "—"}
                            </span>
                            <span className="stat-label">services</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <span className="stat-count">
                                {repository.metrics.apis || "—"}
                            </span>
                            <span className="stat-label">APIs</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <span className="stat-count">
                                {repository.metrics.functions?.toLocaleString() || "—"}
                            </span>
                            <span className="stat-label">functions</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with updated info and action */}
            <div className="repo-card-footer">
                <div className="repo-last-indexed">
                    <Clock size={12} />
                    <span>{repository.lastIndexed || "Recently updated"}</span>
                </div>

                <div className="repo-card-actions">
                    {!isActive ? (
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => onSelectActive && onSelectActive(repository)}
                        >
                            Set as Active
                        </Button>
                    ) : (
                        <span className="current-active-text">Active Selection</span>
                    )}
                </div>
            </div>

            <style>{`
                .repo-card {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: var(--card-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                    transition: border-color 0.15s ease, background 0.15s ease;
                }
                .repo-card:hover {
                    border-color: #484e44;
                }
                .repo-card-active {
                    border-color: var(--active-border);
                    background: #1f231d;
                }
                .repo-card-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                }
                .repo-card-title-group {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    min-width: 0;
                }
                .repo-provider-icon {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--active-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                    color: var(--primary);
                    flex-shrink: 0;
                }
                .repo-title-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    min-width: 0;
                }
                .repo-title-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .repo-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    letter-spacing: -0.1px;
                    word-break: break-word;
                }
                .active-workspace-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                }
                .repo-url-link {
                    font-size: 11px;
                    color: var(--text-muted);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 400px;
                }
                .repo-status-wrap {
                    flex-shrink: 0;
                }
                .repo-status-badge {
                    font-size: 11px;
                    padding: 3px 8px;
                }
                .spin-icon {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .repo-card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .repo-meta-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .meta-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 3px 8px;
                    background: var(--sidebar-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    font-size: 11px;
                }
                .meta-icon {
                    color: var(--text-muted);
                }
                .meta-label {
                    color: var(--text-muted);
                }
                .meta-val {
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                .branch-name {
                    color: var(--primary);
                }
                .font-mono {
                    font-family: monospace;
                    font-size: 10px;
                }

                .repo-stats-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 10px;
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--border-soft);
                    font-size: 11px;
                    flex-wrap: wrap;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .stat-icon {
                    color: var(--text-muted);
                }
                .stat-count {
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .stat-label {
                    color: var(--text-muted);
                }
                .stat-divider {
                    width: 1px;
                    height: 10px;
                    background: var(--card-border);
                }

                .repo-card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 8px;
                    border-top: 1px solid var(--card-border);
                    font-size: 11px;
                }
                .repo-last-indexed {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: var(--text-muted);
                    font-size: 11px;
                }
                .repo-card-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .current-active-text {
                    font-size: 11px;
                    color: var(--primary);
                    font-weight: 500;
                }
            `}</style>
        </Card>
    );
}

export default RepositoryCard;
