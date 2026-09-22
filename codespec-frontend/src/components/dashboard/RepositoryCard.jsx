import {
    FolderGit2,
    GitBranch,
    GitCommit,
    Clock,
    Code2,
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
        <Card className="repo-header-card">
            <div className="repo-header-main">
                <div className="repo-header-identity">
                    <div className="repo-icon-wrap">
                        <FolderGit2 size={20} />
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
                        <GitBranch size={14} className="meta-icon" />
                        <span className="meta-label">Branch:</span>
                        <span className="meta-value branch-tag">{repository?.branch || "main"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <GitCommit size={14} className="meta-icon" />
                        <span className="meta-label">Commit:</span>
                        <span className="meta-value font-mono">{repository?.commit || "8f4a21d"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <Code2 size={14} className="meta-icon" />
                        <span className="meta-label">Stack:</span>
                        <span className="meta-value">{repository?.language || "TypeScript / Python"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <Clock size={14} className="meta-icon" />
                        <span className="meta-label">Indexed:</span>
                        <span className="meta-value">{repository?.lastIndexed || "2 mins ago"}</span>
                    </div>
                </div>
            </div>

            <style>{`
                .repo-header-card {
                    padding: 14px 18px;
                }
                .repo-header-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 14px;
                }
                .repo-header-identity {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .repo-icon-wrap {
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
                .repo-title-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .repo-title-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .repo-title-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary);
                    letter-spacing: -0.2px;
                }
                .repo-status-badge {
                    font-size: 11px;
                    padding: 2px 7px;
                }
                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--success);
                    display: inline-block;
                }
                .repo-desc-sub {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .repo-header-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    background: #171916;
                    border: 1px solid var(--card-border);
                    border-radius: 6px;
                    padding: 6px 12px;
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
                }
                .meta-value {
                    color: var(--text-primary);
                    font-weight: 500;
                }
                .branch-tag {
                    color: var(--primary);
                }
                .font-mono {
                    font-family: monospace;
                    font-size: 11px;
                }
                .meta-divider {
                    width: 1px;
                    height: 14px;
                    background: var(--card-border);
                }
                @media (max-width: 860px) {
                    .repo-header-meta {
                        width: 100%;
                        justify-content: flex-start;
                        gap: 10px;
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
