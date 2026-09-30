import { useState } from "react";
import { Server, Database, Cloud, Shield, Cpu, MoreHorizontal, ArrowUpDown } from "lucide-react";
import Card from "../common/Card";

export default function NodesTableCard() {
    const [toggledNodes, setToggledNodes] = useState({ 1: true, 2: true, 3: false, 4: true });

    const nodesData = [
        {
            id: 1,
            name: "Core-Engine AST Node",
            type: "Parser / AST",
            health: "99.9%",
            latency: "4.2 ms",
            status: "Optimal",
            icon: Cpu,
        },
        {
            id: 2,
            name: "PostgreSQL Symbol Catalog",
            type: "Database / Store",
            health: "100%",
            latency: "1.8 ms",
            status: "Synced",
            icon: Database,
        },
        {
            id: 3,
            name: "Redis Cache Highway",
            type: "Cache / Memory",
            health: "98.4%",
            latency: "0.6 ms",
            status: "Healthy",
            icon: Cloud,
        },
        {
            id: 4,
            name: "Auth & Identity Gateway",
            type: "Security / OIDC",
            health: "100%",
            latency: "3.1 ms",
            status: "Protected",
            icon: Shield,
        },
    ];

    const toggleNode = (id) => {
        setToggledNodes((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <Card className="nodes-table-card cs-card--gold">
            <div className="nodes-header">
                <div className="nodes-title-row">
                    <span className="nodes-badge-dot" />
                    <h3 className="nodes-title">Nodes</h3>
                    <span className="nodes-count-tag">{nodesData.length} Active</span>
                </div>

                <div className="nodes-actions">
                    <button className="nodes-sort-btn" type="button">
                        <ArrowUpDown size={12} />
                        <span>Sort</span>
                    </button>
                    <button className="nodes-more-btn" type="button" aria-label="More">
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="nodes-table-wrap">
                <table className="nodes-table">
                    <thead>
                        <tr>
                            <th>NODE IDENTIFIER</th>
                            <th>TYPE & SUBSYSTEM</th>
                            <th>UPTIME</th>
                            <th>LATENCY</th>
                            <th style={{ textAlign: "right" }}>STATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nodesData.map((node) => {
                            const Icon = node.icon;
                            const isToggled = toggledNodes[node.id];

                            return (
                                <tr key={node.id} className="node-row">
                                    {/* Name & Icon */}
                                    <td>
                                        <div className="node-ident-cell">
                                            <div className="node-icon-box">
                                                <Icon size={13} />
                                            </div>
                                            <span className="node-name-text">{node.name}</span>
                                        </div>
                                    </td>

                                    {/* Type */}
                                    <td>
                                        <span className="node-type-pill">{node.type}</span>
                                    </td>

                                    {/* Uptime */}
                                    <td>
                                        <span className="node-health-val">{node.health}</span>
                                    </td>

                                    {/* Latency */}
                                    <td>
                                        <span className="node-latency-val">{node.latency}</span>
                                    </td>

                                    {/* Quick Toggle Switch */}
                                    <td style={{ textAlign: "right" }}>
                                        <button
                                            type="button"
                                            onClick={() => toggleNode(node.id)}
                                            className={`node-toggle-switch ${isToggled ? "active" : ""}`}
                                            aria-label={`Toggle ${node.name}`}
                                        >
                                            <span className="toggle-thumb" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <style>{`
                .nodes-table-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    border-radius: var(--border-radius);
                }

                .nodes-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .nodes-title-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .nodes-badge-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #c4b5fd;
                }

                .nodes-title {
                    font-size: 14.5px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }

                .nodes-count-tag {
                    padding: 2px 7px;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    border-radius: 9999px;
                    font-size: 10px;
                    font-weight: 700;
                    color: #c4b5fd;
                }

                .nodes-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .nodes-sort-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--text-secondary);
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .nodes-sort-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.08);
                }

                .nodes-more-btn {
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    color: var(--text-muted);
                    cursor: pointer;
                }

                .nodes-table-wrap {
                    width: 100%;
                    overflow-x: auto;
                }

                .nodes-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    text-align: left;
                }

                .nodes-table th {
                    padding: 8px 10px;
                    font-size: 9.5px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    color: var(--text-muted);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    white-space: nowrap;
                }

                .nodes-table td {
                    padding: 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                    white-space: nowrap;
                }

                .node-row:hover {
                    background: rgba(139, 92, 246, 0.06);
                }

                .node-ident-cell {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .node-icon-box {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #c4b5fd;
                }

                .node-name-text {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .node-type-pill {
                    font-size: 10.5px;
                    color: var(--text-secondary);
                }

                .node-health-val {
                    font-weight: 700;
                    color: #6ee7b7;
                }

                .node-latency-val {
                    color: var(--text-muted);
                    font-family: inherit;
                }

                .node-toggle-switch {
                    width: 32px;
                    height: 18px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    position: relative;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-block;
                }

                .node-toggle-switch.active {
                    background: #8b5cf6;
                    border-color: #a78bfa;
                }

                .toggle-thumb {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #ffffff;
                    transition: transform 0.2s ease;
                }

                .node-toggle-switch.active .toggle-thumb {
                    transform: translateX(14px);
                    background: #0c0d12;
                }
            `}</style>
        </Card>
    );
}
