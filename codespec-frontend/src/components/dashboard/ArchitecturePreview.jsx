import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Network,
    ArrowUpRight,
    Layers,
    Server,
    Database,
    Cpu,
    Globe,
    HardDrive,
    Shield,
    Boxes,
    Filter,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const defaultNodes = [
    // Tier 1: Frontend Client
    {
        id: "fe-app",
        name: "React Web Client",
        type: "frontend",
        tech: "React / Vite UI",
        status: "healthy",
        x: 35,
        y: 110,
        icon: Globe,
    },
    // Tier 2: Services / Gateway
    {
        id: "gw-api",
        name: "API Gateway",
        type: "service",
        tech: "FastAPI Routing",
        status: "healthy",
        x: 245,
        y: 60,
        icon: Server,
    },
    {
        id: "svc-auth",
        name: "Auth Service",
        type: "service",
        tech: "OAuth2 / JWT",
        status: "healthy",
        x: 245,
        y: 160,
        icon: Shield,
    },
    // Tier 3: Core Engines
    {
        id: "svc-graph",
        name: "Graph Engine",
        type: "service",
        tech: "AST Parser / PyTree",
        status: "healthy",
        x: 455,
        y: 60,
        icon: Cpu,
    },
    {
        id: "svc-ingest",
        name: "Ingest Worker",
        type: "service",
        tech: "Celery / Async",
        status: "healthy",
        x: 455,
        y: 160,
        icon: Boxes,
    },
    // Tier 4: Storage & External
    {
        id: "db-main",
        name: "Postgres Graph DB",
        type: "database",
        tech: "PostgreSQL 16",
        status: "healthy",
        x: 665,
        y: 35,
        icon: Database,
    },
    {
        id: "cache-redis",
        name: "Redis Cache",
        type: "cache",
        tech: "State & L2 Cache",
        status: "healthy",
        x: 665,
        y: 115,
        icon: HardDrive,
    },
    {
        id: "ext-git",
        name: "GitHub API",
        type: "external",
        tech: "VCS / Webhooks",
        status: "healthy",
        x: 665,
        y: 195,
        icon: Network,
    },
];

const defaultEdges = [
    { from: "fe-app", to: "gw-api", label: "HTTPS / REST" },
    { from: "gw-api", to: "svc-auth", label: "Verify Token" },
    { from: "gw-api", to: "svc-graph", label: "Graph Queries" },
    { from: "gw-api", to: "svc-ingest", label: "Ingest Trigger" },
    { from: "svc-graph", to: "db-main", label: "Cypher / SQL" },
    { from: "svc-graph", to: "cache-redis", label: "L2 Cache" },
    { from: "svc-ingest", to: "cache-redis", label: "Job Queue" },
    { from: "svc-ingest", to: "ext-git", label: "Clone / Diff" },
];

const categoryConfig = {
    frontend: { color: "#8b5cf6", label: "Frontend", border: "#8b5cf6" },
    service: { color: "#a78bfa", label: "Service", border: "#a78bfa" },
    database: { color: "#38bdf8", label: "Database", border: "#38bdf8" },
    cache: { color: "#f472b6", label: "Cache", border: "#f472b6" },
    external: { color: "#34d399", label: "External", border: "#34d399" },
};

function ArchitecturePreview({
    nodes = defaultNodes,
    edges = defaultEdges,
    totalNodesCount,
    totalServicesCount,
}) {
    const [hoveredNode, setHoveredNode] = useState(null);
    const displayNodeCount = totalNodesCount || nodes.length;
    const displayServiceCount =
        totalServicesCount || nodes.filter((n) => n.type === "service").length;

    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 48;

    return (
        <Card className="arch-preview-card cs-card--violet">
            <div className="arch-header">
                <div className="arch-header-left">
                    <div className="arch-title-group">
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div className="icon-accent icon-accent--violet">
                                <Network size={16} strokeWidth={2.2} />
                            </div>
                            <span className="arch-title">Architecture Preview</span>
                        </div>
                        <Badge variant="primary" className="arch-badge font-mono">
                            {displayNodeCount} NODES • {displayServiceCount} SERVICES
                        </Badge>
                    </div>
                    <span className="arch-subtitle">
                        Interactive component relationships, data flow & service dependencies
                    </span>
                </div>

                <div className="arch-header-right">
                    <button className="filter-pill-btn" type="button">
                        <Filter size={12} />
                        <span>Filter</span>
                    </button>

                    <Link to="/architecture" className="open-arch-btn">
                        <span>Open Architecture</span>
                        <ArrowUpRight size={13} />
                    </Link>
                </div>
            </div>

            <div className="arch-canvas-container">
                <svg
                    className="arch-svg-canvas"
                    viewBox="0 0 850 265"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <pattern
                            id="preview-grid"
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="10" cy="10" r="1" fill="rgba(139, 92, 246, 0.08)" />
                        </pattern>
                        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
                        </linearGradient>
                        <marker
                            id="arrowhead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 6 3, 0 6" fill="rgba(167, 139, 250, 0.6)" />
                        </marker>
                    </defs>

                    {/* Dark ethereal canvas background */}
                    <rect width="100%" height="100%" fill="#08090e" />
                    <rect width="100%" height="100%" fill="url(#preview-grid)" />

                    {/* Connectors / Edges */}
                    {edges.map((edge, idx) => {
                        const source = nodes.find((n) => n.id === edge.from);
                        const target = nodes.find((n) => n.id === edge.to);
                        if (!source || !target) return null;

                        const isHighlighted =
                            hoveredNode === source.id || hoveredNode === target.id;

                        const x1 = source.x + NODE_WIDTH;
                        const y1 = source.y + NODE_HEIGHT / 2;
                        const x2 = target.x;
                        const y2 = target.y + NODE_HEIGHT / 2;
                        const midX = (x1 + x2) / 2;

                        const pathData = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                        return (
                            <g key={`edge-${idx}`}>
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke={isHighlighted ? "url(#edge-gradient)" : "rgba(255, 255, 255, 0.12)"}
                                    strokeWidth={isHighlighted ? 2 : 1.2}
                                    strokeDasharray={edge.label?.includes("Trigger") ? "3 3" : "none"}
                                    markerEnd="url(#arrowhead)"
                                    style={{
                                        transition: "all 0.15s ease",
                                        opacity: isHighlighted ? 1 : 0.65,
                                    }}
                                />
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const config = categoryConfig[node.type] || categoryConfig.service;
                        const isHovered = hoveredNode === node.id;

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Sharp Node Card Background */}
                                <rect
                                    width={NODE_WIDTH}
                                    height={NODE_HEIGHT}
                                    rx="2"
                                    fill={isHovered ? "#161824" : "#0d0e15"}
                                    stroke={isHovered ? config.color : "rgba(255, 255, 255, 0.1)"}
                                    strokeWidth={isHovered ? 1.5 : 1}
                                />

                                {/* Left Category Accent Line */}
                                <rect
                                    width="3"
                                    height={NODE_HEIGHT}
                                    rx="1"
                                    fill={config.color}
                                />

                                {/* Node Title */}
                                <text
                                    x="10"
                                    y="19"
                                    fill="#ffffff"
                                    fontSize="11"
                                    fontWeight="700"
                                    fontFamily="inherit"
                                >
                                    {node.name}
                                </text>

                                {/* Tech / Subtitle */}
                                <text
                                    x="10"
                                    y="34"
                                    fill="rgba(148, 163, 184, 0.6)"
                                    fontSize="9"
                                    fontFamily="JetBrains Mono, monospace"
                                >
                                    {node.tech}
                                </text>

                                {/* Category Tag Pill */}
                                <rect
                                    x={NODE_WIDTH - 48}
                                    y="7"
                                    width="42"
                                    height="13"
                                    rx="2"
                                    fill="#090a0f"
                                    stroke={config.color}
                                    strokeWidth="0.8"
                                />
                                <text
                                    x={NODE_WIDTH - 27}
                                    y="16.5"
                                    fill={config.color}
                                    fontSize="7.5"
                                    fontWeight="700"
                                    textAnchor="middle"
                                    fontFamily="JetBrains Mono, monospace"
                                >
                                    {config.label.toUpperCase()}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Bottom Legend */}
            <div className="arch-legend-row">
                <div className="legend-label-wrap">
                    <Layers size={12} className="legend-icon" />
                    <span className="font-mono">TIERS:</span>
                </div>
                <div className="legend-items">
                    {Object.entries(categoryConfig).map(([key, item]) => (
                        <div key={key} className="legend-item">
                            <span
                                className="legend-color-dot"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="legend-item-text">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .arch-preview-card {
                    padding: 14px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    height: 100%;
                    border-radius: var(--border-radius);
                }
                .arch-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .arch-header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .arch-title-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .arch-title {
                    font-size: 14px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.2px;
                }
                .arch-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                }
                .arch-subtitle {
                    display: block;
                    font-size: 11.5px;
                    color: var(--text-muted);
                    margin-top: 2px;
                }
                .open-arch-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #c4b5fd;
                    padding: 5px 11px;
                    border-radius: var(--radius-sm);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    background: rgba(124, 58, 237, 0.12);
                    transition: all 0.15s ease;
                }
                .open-arch-btn:hover {
                    background: rgba(124, 58, 237, 0.25);
                    border-color: rgba(139, 92, 246, 0.5);
                    color: #ffffff;
                }
                .arch-canvas-container {
                    position: relative;
                    width: 100%;
                    min-height: 270px;
                    flex: 1;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                    background: #08090e;
                }
                .arch-svg-canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                .arch-legend-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding-top: 8px;
                    border-top: 1px solid var(--card-border);
                    font-size: 11px;
                }
                .legend-label-wrap {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: var(--text-muted);
                    font-weight: 700;
                    font-size: 10px;
                }
                .legend-items {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    flex-wrap: wrap;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .legend-color-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 1px;
                }
                .legend-item-text {
                    color: var(--text-secondary);
                    font-size: 11px;
                    font-weight: 500;
                }
            `}</style>
        </Card>
    );
}

export default ArchitecturePreview;
