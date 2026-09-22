import { GitCommit, FileCode, PlusCircle, RefreshCw, GitPullRequest } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const defaultChanges = [
    {
        id: "c1",
        title: "Updated auth token validator",
        file: "src/auth/token_validator.py",
        type: "update",
        time: "5 min ago",
        author: "vin01",
        badgeVariant: "primary",
    },
    {
        id: "c2",
        title: "Modified user controller endpoints",
        file: "src/controllers/user_controller.ts",
        type: "modify",
        time: "18 min ago",
        author: "alex.k",
        badgeVariant: "warning",
    },
    {
        id: "c3",
        title: "Added /api/graph/export endpoint",
        file: "api/v1/endpoints/graph.py",
        type: "add",
        time: "42 min ago",
        author: "vin01",
        badgeVariant: "success",
    },
    {
        id: "c4",
        title: "Refactored AST dependency extractor",
        file: "core/parser/ast_engine.py",
        type: "refactor",
        time: "1 hour ago",
        author: "sarah.m",
        badgeVariant: "default",
    },
    {
        id: "c5",
        title: "Updated Redis cluster config",
        file: "config/redis_cluster.conf",
        type: "update",
        time: "3 hours ago",
        author: "devops",
        badgeVariant: "primary",
    },
];

function getChangeIcon(type) {
    switch (type) {
        case "add":
            return PlusCircle;
        case "update":
            return RefreshCw;
        case "refactor":
            return GitPullRequest;
        default:
            return FileCode;
    }
}

function RecentChanges({ changes = defaultChanges, limit = 5 }) {
    const displayedChanges = changes.slice(0, limit);

    return (
        <Card className="recent-changes-card">
            <div className="changes-header">
                <div className="changes-title-wrap">
                    <GitCommit size={15} className="changes-header-icon" />
                    <span className="changes-title">Recent Changes</span>
                </div>
                <Badge variant="default" className="changes-count-badge">
                    {changes.length} events
                </Badge>
            </div>

            <div className="changes-list">
                {displayedChanges.map((item) => {
                    const Icon = getChangeIcon(item.type);
                    return (
                        <div key={item.id} className="change-item">
                            <div className="change-icon-wrap">
                                <Icon size={13} />
                            </div>
                            <div className="change-content">
                                <div className="change-title-row">
                                    <span className="change-title-text" title={item.title}>
                                        {item.title}
                                    </span>
                                    <span className="change-time">{item.time}</span>
                                </div>
                                <div className="change-meta-row">
                                    <span className="change-file" title={item.file}>
                                        {item.file}
                                    </span>
                                    <span className="change-author">• {item.author}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .recent-changes-card {
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .changes-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .changes-title-wrap {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }
                .changes-header-icon {
                    color: var(--primary);
                }
                .changes-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .changes-count-badge {
                    font-size: 10px;
                    padding: 1px 6px;
                }
                .changes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .change-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    padding: 7px 8px;
                    border-radius: 5px;
                    border: 1px solid transparent;
                    transition: background 0.12s ease, border-color 0.12s ease;
                    cursor: pointer;
                }
                .change-item:hover {
                    background: var(--card-background-hover);
                    border-color: var(--card-border);
                }
                .change-icon-wrap {
                    margin-top: 2px;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .change-item:hover .change-icon-wrap {
                    color: var(--primary);
                }
                .change-content {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .change-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .change-title-text {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .change-time {
                    font-size: 10px;
                    color: var(--text-muted);
                    flex-shrink: 0;
                }
                .change-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 10.5px;
                    color: var(--text-muted);
                }
                .change-file {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: monospace;
                    color: var(--text-secondary);
                    font-size: 10px;
                }
                .change-author {
                    flex-shrink: 0;
                    color: var(--text-muted);
                    font-size: 10px;
                }
            `}</style>
        </Card>
    );
}

export default RecentChanges;
