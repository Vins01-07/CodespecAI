import {
    GitBranch,
    GitCommit,
    Clock,
    Layers,
} from "lucide-react";
import Card from "../common/Card";

// Clean GitHub Cat Logo SVG matching img2
function GitHubMarkIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
        </svg>
    );
}

function RepositoryCard({
    repository = {
        name: "CodeSpec-Core-Engine",
        status: "Ready",
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
                    <div className="repo-github-wrap">
                        <GitHubMarkIcon size={20} />
                    </div>
                    <div className="repo-title-wrap">
                        <div className="repo-title-row">
                            <span className="repo-title-name">
                                {repository?.name || "CodeSpec-Core-Engine"}
                            </span>
                            <span className="repo-ready-pill font-mono">
                                <span className="status-dot-green" />
                                {repository?.status || "Ready"}
                            </span>
                        </div>
                        <span className="repo-desc-sub">
                            Active architectural workspace &bull; Real-time AST &amp; graph indexing
                        </span>
                    </div>
                </div>

                <div className="repo-header-meta">
                    <div className="meta-item">
                        <GitBranch size={13} className="meta-icon-red" />
                        <span className="meta-label">Branch:</span>
                        <span className="meta-value branch-tag-red">{repository?.branch || "main"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <GitCommit size={13} className="meta-icon-red" />
                        <span className="meta-label">Commit:</span>
                        <span className="meta-value font-mono">{repository?.commit || "8f4a21d"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <Layers size={13} className="meta-icon-red" />
                        <span className="meta-label">Stack:</span>
                        <span className="meta-value">{repository?.language || "TypeScript / Python"}</span>
                    </div>

                    <div className="meta-divider" />

                    <div className="meta-item">
                        <Clock size={13} className="meta-icon-red" />
                        <span className="meta-label">Indexed:</span>
                        <span className="meta-value">{repository?.lastIndexed || "2 mins ago"}</span>
                    </div>
                </div>
            </div>

            <style>{`
                .repo-header-card {
                    padding: 14px 18px;
                    border-radius: 16px;
                    background: #15161B !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    margin-bottom: 16px;
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
                .repo-github-wrap {
                    width: 38px;
                    height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #1A1B22;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: #F5F5F7;
                    flex-shrink: 0;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
                }
                .repo-title-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .repo-title-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .repo-title-name {
                    font-size: 15.5px;
                    font-weight: 800;
                    color: #F5F5F7;
                    letter-spacing: -0.3px;
                }
                .repo-ready-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 10.5px;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    background: rgba(16, 185, 129, 0.14);
                    color: #10B981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                .status-dot-green {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #10B981;
                    box-shadow: 0 0 6px #10B981;
                }
                .repo-desc-sub {
                    font-size: 11.5px;
                    color: #A1A1AC;
                }
                .repo-header-meta {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    flex-wrap: wrap;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    padding: 7px 16px;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11.5px;
                }
                .meta-icon-red {
                    color: #FF3548;
                    flex-shrink: 0;
                }
                .meta-label {
                    color: #8E8E98;
                    font-weight: 500;
                }
                .meta-value {
                    color: #F5F5F7;
                    font-weight: 600;
                }
                .branch-tag-red {
                    color: #FF3548;
                    font-family: "JetBrains Mono", monospace;
                    font-weight: 700;
                }
                .font-mono {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 11.5px;
                }
                .meta-divider {
                    width: 1px;
                    height: 14px;
                    background: rgba(255, 255, 255, 0.08);
                }
                @media (max-width: 900px) {
                    .repo-header-meta {
                        width: 100%;
                        justify-content: flex-start;
                        gap: 10px;
                        padding: 8px 12px;
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
