import {
    FolderGit2,
    FileArchive,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Clock,
    Check,
    ArrowUpRight,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

function RepositoryCard({
    repository,
    isActive = false,
    onSelectActive,
}) {
    if (!repository) return null;

    const getStatusConfig = (status) => {
        const normalized = (status || "").toLowerCase();
        if (normalized === "ready" || normalized === "analyzed") {
            return {
                variant: "success",
                icon: CheckCircle2,
                label: "Healthy",
                color: "#10B981",
            };
        }
        if (normalized === "processing" || normalized === "indexing") {
            return {
                variant: "warning",
                icon: Loader2,
                label: "Indexing",
                color: "#F59E0B",
                isSpinning: true,
            };
        }
        if (normalized === "failed" || normalized === "error") {
            return {
                variant: "danger",
                icon: AlertTriangle,
                label: "Failed",
                color: "#FF3548",
            };
        }
        return {
            variant: "default",
            icon: Clock,
            label: "Pending",
            color: "#A1A1AC",
        };
    };

    const statusConfig = getStatusConfig(repository.status);
    const StatusIcon = statusConfig.icon;
    const isZip = repository.provider === "zip" || repository.name?.endsWith(".zip");

    // Extract tags from language string
    const tags = repository.language
        ? repository.language.split("/").map((t) => t.trim())
        : ["TypeScript"];

    // Generate unique seed for sparkline variation
    const seed = (repository.id || repository.name).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const y1 = 20 + (seed % 12);
    const y2 = 12 + ((seed * 3) % 16);
    const y3 = 24 + ((seed * 7) % 12);
    const y4 = 8 + ((seed * 2) % 14);

    return (
        <Card className={`repo-card ${isActive ? "repo-card-active" : ""}`}>
            <div className="repo-card-header">
                <div className="repo-card-title-group">
                    <div className="repo-provider-icon">
                        {isZip ? <FileArchive size={16} /> : <FolderGit2 size={16} />}
                    </div>
                    <div className="repo-title-meta">
                        <div className="repo-title-row">
                            <span className="repo-name" title={repository.name}>
                                {repository.name}
                            </span>
                        </div>
                        <div className="repo-tags-row">
                            {tags.map((tag) => (
                                <span key={tag} className="repo-lang-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="repo-status-wrap">
                    <Badge variant={statusConfig.variant} className="repo-status-badge">
                        <StatusIcon
                            size={11}
                            className={statusConfig.isSpinning ? "spin-icon" : ""}
                        />
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            {/* Metrics and Metadata Row */}
            <div className="repo-metrics-row">
                <div className="metric-mini-item">
                    <span className="metric-mini-label">Files</span>
                    <span className="metric-mini-val font-mono">
                        {repository.metrics?.files?.toLocaleString() || "1,248"}
                    </span>
                </div>
                <div className="metric-mini-divider" />
                <div className="metric-mini-item">
                    <span className="metric-mini-label">Services</span>
                    <span className="metric-mini-val font-mono">
                        {repository.metrics?.services || "12"}
                    </span>
                </div>
                <div className="metric-mini-divider" />
                <div className="metric-mini-item">
                    <span className="metric-mini-label">Branch</span>
                    <span className="metric-mini-val font-mono" style={{ color: "var(--bright-red)" }}>
                        {repository.branch || "main"}
                    </span>
                </div>
            </div>

            {/* Signature Crimson Activity Sparkline matching reference */}
            <div className="repo-sparkline-wrap">
                <svg viewBox="0 0 280 44" preserveAspectRatio="none" className="repo-sparkline-svg">
                    <defs>
                        <linearGradient id={`spark-grad-${repository.id || repository.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#E32636" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`M 0,${y1} Q 40,${y2} 80,${y3} T 160,${y4} T 220,${y2} T 280,${y1} L 280,44 L 0,44 Z`}
                        fill={`url(#spark-grad-${repository.id || repository.name})`}
                    />
                    <path
                        d={`M 0,${y1} Q 40,${y2} 80,${y3} T 160,${y4} T 220,${y2} T 280,${y1}`}
                        fill="none"
                        stroke="#FF3548"
                        strokeWidth="1.8"
                    />
                </svg>
            </div>

            {/* Footer with updated info and action */}
            <div className="repo-card-footer">
                <div className="repo-last-indexed font-mono">
                    <Clock size={11} />
                    <span>{repository.lastIndexed || "5 mins ago"}</span>
                </div>

                <div className="repo-card-actions">
                    {!isActive ? (
                        <button
                            type="button"
                            className="select-active-btn font-mono"
                            onClick={() => onSelectActive && onSelectActive(repository)}
                        >
                            <span>Open</span>
                            <ArrowUpRight size={11} />
                        </button>
                    ) : (
                        <span className="active-tag-pill font-mono">
                            <Check size={10} />
                            Active
                        </span>
                    )}
                </div>
            </div>

            <style>{`
                .repo-card {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background: #15161B !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 16px !important;
                    min-height: 180px;
                    transition: all var(--duration-fast) ease;
                }
                .repo-card:hover {
                    border-color: rgba(227, 38, 54, 0.4) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(227, 38, 54, 0.15) !important;
                }
                .repo-card-active {
                    border-color: rgba(227, 38, 54, 0.55) !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 24px rgba(227, 38, 54, 0.22) !important;
                }
                .repo-card-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .repo-card-title-group {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    min-width: 0;
                }
                .repo-provider-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(227, 38, 54, 0.12);
                    border: 1px solid rgba(227, 38, 54, 0.3);
                    border-radius: 8px;
                    color: var(--bright-red);
                    flex-shrink: 0;
                }
                .repo-title-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                }
                .repo-name {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #F5F5F7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .repo-tags-row {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                .repo-lang-tag {
                    font-size: 10px;
                    padding: 1px 6px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    color: var(--secondary-text);
                    font-family: "JetBrains Mono", monospace;
                }
                .repo-metrics-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                }
                .metric-mini-item {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
                .metric-mini-label {
                    font-size: 9.5px;
                    color: var(--secondary-text);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .metric-mini-val {
                    font-size: 12px;
                    font-weight: 700;
                    color: #F5F5F7;
                }
                .metric-mini-divider {
                    width: 1px;
                    height: 16px;
                    background: rgba(255, 255, 255, 0.06);
                }
                .repo-sparkline-wrap {
                    height: 44px;
                    overflow: hidden;
                    margin: 2px 0 8px 0;
                    border-radius: 6px;
                    background: rgba(9, 10, 13, 0.4);
                }
                .repo-sparkline-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                .repo-card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .repo-last-indexed {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 10.5px;
                    color: var(--secondary-text);
                }
                .select-active-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    height: 24px;
                    padding: 0 10px;
                    background: rgba(227, 38, 54, 0.14);
                    border: 1px solid rgba(227, 38, 54, 0.35);
                    border-radius: 6px;
                    color: var(--bright-red);
                    font-size: 10.5px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }
                .select-active-btn:hover {
                    background: linear-gradient(135deg, #FF3548 0%, #E32636 100%);
                    color: #FFFFFF;
                    border-color: transparent;
                }
                .active-tag-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 10px;
                    font-weight: 700;
                    color: #10B981;
                    background: rgba(16, 185, 129, 0.12);
                    padding: 2px 7px;
                    border-radius: 4px;
                    border: 1px solid rgba(16, 185, 129, 0.25);
                }
                .spin-icon {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </Card>
    );
}

export default RepositoryCard;
