import {
    FolderGit2,
    GitBranch,
    GitCommit,
    Clock,
    Code2,
    Layers,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

function RepositoryCard({
    repository = {
        name: "CodeSpec-Core-Engine",
        status: "Analyzed",
        branch: "main",
        commit: "8f4a21d",
        language: "TypeScript / Python",
        lastIndexed: "2 mins ago",
    },
}) {
    return (
        <Card className="repo-header-card cs-card--gold">
            <div className="repo-header-main">
                <div className="repo-header-identity">
                    <div className="repo-icon-wrap">
                        <FolderGit2 size={20} strokeWidth={2} />
                    </div>
                    <div className="repo-title-wrap">
                        <div className="repo-title-row">
                            <span className="repo-title-name">
                                {repository?.name || "CodeSpec-Core-Engine"}
                            </span>
                            <Badge variant="success" className="repo-status-badge">
                                <span className="status-dot" />
                                {repository?.status || "Analyzed"}
                            </Badge>
                        </div>
                        <span className="repo-desc-sub">
                            Active architectural workspace • Real-time AST & graph indexing
                        </span>
                    </div>
                </div>

                <div className="repo-header-meta">
                    <div className="meta-item">
                        <GitBranch size={13} className="meta-icon" />
                        <span className="meta-label">Branch:</span>
                        <span className="meta-value branch-tag">{repository?.branch || "main"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <GitCommit size={13} className="meta-icon" />
                        <span className="meta-label">Commit:</span>
                        <span className="meta-value font-mono">{repository?.commit || "8f4a21d"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <Code2 size={13} className="meta-icon" />
                        <span className="meta-label">Stack:</span>
                        <span className="meta-value">{repository?.language || "TypeScript / Python"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <Clock size={13} className="meta-icon" />
                        <span className="meta-label">Indexed:</span>
                        <span className="meta-value">{repository?.lastIndexed || "2 mins ago"}</span>
                    </div>
                </div>
            </div>

            <style>{`
                .repo-header-card {
                    padding: 16px 22px;
                    border-radius: var(--border-radius);
                }
                .repo-header-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .repo-header-identity {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .repo-icon-wrap {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(124, 58, 237, 0.22) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.28);
                    border-radius: 12px;
                    color: #c4b5fd;
                    flex-shrink: 0;
                }
                .repo-title-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .repo-title-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .repo-title-name {
                    font-size: 17px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.3px;
                }
                .repo-status-badge {
                    font-size: 11px;
                    padding: 3px 9px;
                }
                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #34d399;
                    display: inline-block;
                }
                .repo-desc-sub {
                    font-size: 12px;
                    color: var(--text-muted);
                }
                .repo-header-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    background: rgba(20, 17, 34, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 9999px;
                    padding: 8px 16px;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                .meta-icon {
                    color: var(--text-muted);
                }
                .meta-label {
                    color: var(--text-muted);
                    font-weight: 500;
                }
                .meta-value {
                    color: #ffffff;
                    font-weight: 600;
                }
                .branch-tag {
                    color: var(--primary);
                }
                .font-mono {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 11.5px;
                }
                .meta-divider {
                    width: 1px;
                    height: 14px;
                    background: rgba(255, 255, 255, 0.1);
                }
                @media (max-width: 860px) {
                    .repo-header-meta {
                        width: 100%;
                        justify-content: flex-start;
                        gap: 10px;
                        border-radius: 16px;
                        padding: 10px 14px;
                    }
                    .meta-divider {
                        display: none;
                    }
                }
            `}</style>
        </Card>
    );
}

export default RepositoryCard;
