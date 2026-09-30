import { useState } from "react";
import { GitCommit, FileCode, PlusCircle, RefreshCw, GitPullRequest, Filter, ChevronDown, Calendar } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const defaultChanges = [
    {
        id: "c1",
        title: "Updated auth token validator",
        file: "src/auth/token_validator.py",
        category: "Security / Auth",
        type: "update",
        time: "5 min ago",
        author: "vin01",
        badgeVariant: "primary",
    },
    {
        id: "c2",
        title: "Modified user controller endpoints",
        file: "src/controllers/user_controller.ts",
        category: "API Controller",
        type: "modify",
        time: "18 min ago",
        author: "alex.k",
        badgeVariant: "warning",
    },
    {
        id: "c3",
        title: "Added /api/graph/export endpoint",
        file: "api/v1/endpoints/graph.py",
        category: "Graph Engine",
        type: "add",
        time: "42 min ago",
        author: "vin01",
        badgeVariant: "success",
    },
    {
        id: "c4",
        title: "Refactored AST dependency extractor",
        file: "core/parser/ast_engine.py",
        category: "Parser Core",
        type: "refactor",
        time: "1 hour ago",
        author: "sarah.m",
        badgeVariant: "default",
    },
    {
        id: "c5",
        title: "Updated Redis cluster config",
        file: "config/redis_cluster.conf",
        category: "Infrastructure",
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

function RecentChanges({ changes = defaultChanges, limit = 5, asTable = true }) {
    const displayedChanges = changes.slice(0, limit);

    return (
        <Card className="recent-changes-card cs-card--indigo">
            <div className="changes-header">
                <div className="changes-title-wrap">
                    <div className="icon-accent icon-accent--indigo">
                        <GitCommit size={15} strokeWidth={2.2} />
                    </div>
                    <div className="changes-header-text">
                        <span className="changes-title">Recent Code Changes</span>
                        <span className="changes-subtitle">Latest repository commit & parse events</span>
                    </div>
                </div>

                <div className="changes-header-actions">
                    <div className="filter-pill-select font-mono">
                        <Calendar size={11} />
                        <span>Last 7 Days</span>
                        <ChevronDown size={11} />
                    </div>

                    <button className="filter-pill-btn" type="button">
                        <Filter size={11} />
                        <span>Filter</span>
                    </button>

                    <Badge variant="primary" className="changes-count-badge font-mono">
                        {changes.length} EVENTS
                    </Badge>
                </div>
            </div>

            {asTable ? (
                <div className="changes-table-container">
                    <table className="changes-table">
                        <thead>
                            <tr>
                                <th>EVENT / DESCRIPTION</th>
                                <th>FILE PATH</th>
                                <th>AUTHOR</th>
                                <th style={{ textAlign: "right" }}>TIMESTAMP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedChanges.map((item) => {
                                const Icon = getChangeIcon(item.type);
                                return (
                                    <tr key={item.id} className="change-row">
                                        <td>
                                            <div className="table-item-name">
                                                <div className="change-icon-wrap">
                                                    <Icon size={13} />
                                                </div>
                                                <span className="change-title-text" title={item.title}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="change-file font-mono" title={item.file}>
                                                {item.file}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="change-author-badge font-mono">
                                                {item.author}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <span className="change-time font-mono">{item.time}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
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
                                        <span className="change-time font-mono">{item.time}</span>
                                    </div>
                                    <div className="change-meta-row">
                                        <span className="change-file font-mono" title={item.file}>
                                            {item.file}
                                        </span>
                                        <span className="change-author font-mono">• {item.author}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .recent-changes-card {
                    padding: 14px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    border-radius: var(--border-radius);
                }
                .changes-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .changes-title-wrap {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                }
                .changes-header-text {
                    display: flex;
                    flex-direction: column;
                }
                .changes-title {
                    font-size: 14px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.2px;
                }
                .changes-subtitle {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .changes-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .filter-pill-select {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    border-radius: var(--radius-sm);
                    background: #090a0f;
                    border: 1px solid var(--card-border);
                    color: var(--text-secondary);
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .filter-pill-select:hover {
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .changes-count-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                }
                .changes-table-container {
                    overflow-x: auto;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    background: #090a0f;
                }
                .changes-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11.5px;
                    text-align: left;
                }
                .changes-table th {
                    padding: 8px 12px;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                    background: #0d0e14;
                    border-bottom: 1px solid var(--card-border);
                    font-family: "JetBrains Mono", monospace;
                }
                .changes-table td {
                    padding: 9px 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    color: var(--text-secondary);
                }
                .change-row:hover td {
                    background: rgba(124, 58, 237, 0.06);
                    color: var(--text-primary);
                }
                .table-item-name {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .change-icon-wrap {
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                    background: rgba(124, 58, 237, 0.15);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    color: #c4b5fd;
                    flex-shrink: 0;
                }
                .change-title-text {
                    font-weight: 600;
                    color: #ffffff;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 180px;
                }
                .change-file {
                    color: #949db0;
                    font-size: 11px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 160px;
                    display: inline-block;
                }
                .change-author-badge {
                    padding: 1px 5px;
                    background: #141620;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    font-size: 10px;
                    font-weight: 600;
                }
                .change-time {
                    color: var(--text-muted);
                    font-size: 10.5px;
                }
                .changes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .change-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px;
                    background: #090a0f;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                }
                .change-content {
                    flex: 1;
                    min-width: 0;
                }
                .change-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .change-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 2px;
                }
                .change-author {
                    font-size: 10.5px;
                    color: var(--text-muted);
                }
            `}</style>
        </Card>
    );
}

export default RecentChanges;
