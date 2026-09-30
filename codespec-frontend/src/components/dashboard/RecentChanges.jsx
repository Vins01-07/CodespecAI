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
                        <GitCommit size={16} strokeWidth={2} />
                    </div>
                    <div className="changes-header-text">
                        <span className="changes-title">Recent Code Changes</span>
                        <span className="changes-subtitle">Latest repository commit & parse events</span>
                    </div>
                </div>

                <div className="changes-header-actions">
                    <div className="filter-pill-select">
                        <Calendar size={12} />
                        <span>Last 7 Days</span>
                        <ChevronDown size={12} />
                    </div>

                    <button className="filter-pill-btn" type="button">
                        <Filter size={12} />
                        <span>Filter</span>
                    </button>

                    <Badge variant="primary" className="changes-count-badge">
                        {changes.length} events
                    </Badge>
                </div>
            </div>

            {asTable ? (
                <div className="changes-table-container">
                    <table className="changes-table">
                        <thead>
                            <tr>
                                <th>Name / Event</th>
                                <th>Module / File</th>
                                <th>Author</th>
                                <th style={{ textAlign: "right" }}>Timestamp</th>
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
                                                    <Icon size={14} />
                                                </div>
                                                <span className="change-title-text" title={item.title}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="change-file" title={item.file}>
                                                {item.file}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="change-author-badge">
                                                {item.author}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <span className="change-time">{item.time}</span>
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
                                    <Icon size={14} />
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
            )}

            <style>{`
                .recent-changes-card {
                    padding: 18px 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
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
                    gap: 12px;
                }
                .changes-icon-badge {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: rgba(167, 139, 250, 0.15);
                    border: 1px solid rgba(167, 139, 250, 0.3);
                    color: var(--primary);
                }
                .changes-header-text {
                    display: flex;
                    flex-direction: column;
                }
                .changes-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.2px;
                }
                .changes-subtitle {
                    font-size: 11.5px;
                    color: var(--text-muted);
                }
                .changes-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .filter-pill-select {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    color: var(--text-secondary);
                    font-size: 11.5px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .filter-pill-select:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.09);
                }
                .changes-count-badge {
                    font-size: 11px;
                    padding: 3px 8px;
                }
                .changes-table-container {
                    width: 100%;
                    overflow-x: auto;
                }
                .changes-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                .changes-table th {
                    text-align: left;
                    padding: 8px 12px;
                    color: var(--text-muted);
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .change-row {
                    transition: background 0.15s ease;
                }
                .change-row:hover {
                    background: rgba(255, 255, 255, 0.04);
                }
                .change-row td {
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    vertical-align: middle;
                }
                .table-item-name {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .change-icon-wrap {
                    width: 28px;
                    height: 28px;
                    border-radius: 9px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .change-title-text {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #ffffff;
                }
                .change-file {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 11px;
                    color: var(--text-secondary);
                }
                .change-author-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    background: rgba(167, 139, 250, 0.1);
                    border: 1px solid rgba(167, 139, 250, 0.2);
                    color: var(--primary);
                    font-size: 11px;
                    font-weight: 600;
                }
                .change-time {
                    font-size: 11px;
                    color: var(--text-muted);
                    font-weight: 500;
                }

                /* List layout fallback */
                .changes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .change-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    transition: background 0.15s ease, border-color 0.15s ease;
                }
                .change-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(167, 139, 250, 0.3);
                }
                .change-content {
                    flex: 1;
                    min-width: 0;
                }
                .change-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .change-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 2px;
                }
            `}</style>
        </Card>
    );
}

export default RecentChanges;
