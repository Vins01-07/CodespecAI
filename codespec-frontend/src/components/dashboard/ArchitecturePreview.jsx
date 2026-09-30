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
        x: 40,
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
        x: 250,
        y: 60,
        icon: Server,
    },
    {
        id: "svc-auth",
        name: "Auth Service",
        type: "service",
        tech: "OAuth2 / JWT",
        status: "healthy",
        x: 250,
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
        x: 460,
        y: 60,
        icon: Cpu,
    },
    {
        id: "svc-ingest",
        name: "Ingest Worker",
        type: "service",
        tech: "Celery / Async",
        status: "healthy",
        x: 460,
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
        x: 670,
        y: 35,
        icon: Database,
    },
    {
        id: "cache-redis",
        name: "Redis Cache",
        type: "cache",
        tech: "State & L2 Cache",
        status: "healthy",
        x: 670,
        y: 115,
        icon: HardDrive,
    },
    {
        id: "ext-git",
        name: "GitHub API",
        type: "external",
        tech: "VCS / Webhooks",
        status: "healthy",
        x: 670,
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
    frontend: { color: "#818cf8", label: "Frontend", border: "#818cf8" },
    service: { color: "#a78bfa", label: "Service", border: "#a78bfa" },
    database: { color: "#c084fc", label: "Database", border: "#c084fc" },
    cache: { color: "#f472b6", label: "Cache", border: "#f472b6" },
    external: { color: "#38bdf8", label: "External", border: "#38bdf8" },
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

    const NODE_WIDTH = 148;
    const NODE_HEIGHT = 50;

    return (
        <Card className="arch-preview-card cs-card--violet">
            <div className="arch-header">
                <div className="arch-header-left">
                    <div className="arch-title-group">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="icon-accent icon-accent--violet">
                                <Network size={16} strokeWidth={2} />
                            </div>
                            <span className="arch-title">Architecture Preview</span>
                        </div>
                        <Badge variant="primary" className="arch-badge">
                            {displayNodeCount} Nodes • {displayServiceCount} Services
                        </Badge>
                    </div>
                    <span className="arch-subtitle">
                        Interactive component relationships, data flow & service dependencies
                    </span>
                </div>

                <div className="arch-header-right">
                    <button className="filter-pill-btn" type="button">
                        <Filter size={13} />
                        <span>Filter</span>
                    </button>

                    <Link to="/architecture" className="open-arch-btn">
                        <span>Open Architecture</span>
                        <ArrowUpRight size={14} />
                    </Link>
                </div>
            </div>

            <div className="arch-canvas-container">
                <svg
                    className="arch-svg-canvas"
                    viewBox="0 0 860 275"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <pattern
                            id="preview-grid"
                            width="24"
                            height="24"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="12" cy="12" r="1" fill="rgba(148, 163, 184, 0.08)" />
                        </pattern>
                        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
                        </linearGradient>
                        <marker
                            id="arrowhead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 6 3, 0 6" fill="rgba(148, 163, 184, 0.5)" />
                        </marker>
                    </defs>

                    {/* Dark ethereal canvas background */}
                    <rect width="100%" height="100%" fill="#0c0e14" />
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
                                    stroke={isHighlighted ? "url(#edge-gradient)" : "rgba(255, 255, 255, 0.14)"}
                                    strokeWidth={isHighlighted ? 2.5 : 1.4}
                                    strokeDasharray={edge.label?.includes("Trigger") ? "4,4" : "none"}
                                    markerEnd="url(#arrowhead)"
                                    style={{
                                        transition: "stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease",
                                        opacity: isHighlighted ? 1 : 0.7,
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
                                style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                            >
                                {/* Glow backdrop for hovered node */}
                                {isHovered && (
                                    <rect
                                        x="-4"
                                        y="-4"
                                        width={NODE_WIDTH + 8}
                                        height={NODE_HEIGHT + 8}
                                        rx="14"
                                        fill="none"
                                        stroke={config.color}
                                        strokeWidth="1.5"
                                        opacity="0.5"
                                        style={{ filter: "blur(4px)" }}
                                    />
                                )}

                                {/* Node Card Background */}
                                <rect
                                    width={NODE_WIDTH}
                                    height={NODE_HEIGHT}
                                    rx="10"
                                    fill={isHovered ? "rgba(38, 31, 62, 0.95)" : "rgba(22, 18, 36, 0.88)"}
                                    stroke={isHovered ? config.color : "rgba(255, 255, 255, 0.1)"}
                                    strokeWidth={isHovered ? 1.5 : 1}
                                />

                                {/* Left Category Accent Bar */}
                                <rect
                                    width="4"
                                    height={NODE_HEIGHT}
                                    rx="2"
                                    fill={config.color}
                                />

                                {/* Node Title */}
                                <text
                                    x="12"
                                    y="20"
                                    fill="#ffffff"
                                    fontSize="11.5"
                                    fontWeight="700"
                                    fontFamily="inherit"
                                >
                                    {node.name}
                                </text>

                                {/* Tech / Subtitle */}
                                <text
                                    x="12"
                                    y="36"
                                    fill="rgba(148, 163, 184, 0.5)"
                                    fontSize="9.5"
                                    fontFamily="inherit"
                                >
                                    {node.tech}
                                </text>

                                {/* Category Tag Pill */}
                                <rect
                                    x={NODE_WIDTH - 50}
                                    y="8"
                                    width="44"
                                    height="14"
                                    rx="7"
                                    fill="rgba(15, 12, 25, 0.8)"
                                    stroke={config.color}
                                    strokeWidth="0.8"
                                />
                                <text
                                    x={NODE_WIDTH - 28}
                                    y="18"
                                    fill={config.color}
                                    fontSize="7.5"
                                    fontWeight="700"
                                    textAnchor="middle"
                                    fontFamily="inherit"
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
                    <Layers size={13} className="legend-icon" />
                    <span>Tiers:</span>
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
                    padding: 18px 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
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
                    gap: 10px;
                }
                .arch-title-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .arch-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.2px;
                }
                .arch-badge {
                    font-size: 10.5px;
                    padding: 2px 8px;
                }
                .arch-subtitle {
                    display: block;
                    font-size: 11.5px;
                    color: var(--text-muted);
                    margin-top: 3px;
                }
                .open-arch-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--primary);
                    padding: 6px 14px;
                    border-radius: 9999px;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    background: rgba(148, 163, 184, 0.08);
                    transition: all 0.2s ease;
                }
                .open-arch-btn:hover {
                    background: rgba(148, 163, 184, 0.14);
                    border-color: rgba(148, 163, 184, 0.3);
                    color: var(--text-primary);
                }
                .arch-canvas-container {
                    position: relative;
                    width: 100%;
                    min-height: 290px;
                    flex: 1;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 18px;
                    overflow: hidden;
                    background: #0c0e14;
                    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
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
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    font-size: 11.5px;
                }
                .legend-label-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
                    font-weight: 600;
                }
                .legend-items {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .legend-color-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 3px;
                }
                .legend-item-text {
                    color: var(--text-secondary);
                    font-size: 11.5px;
                    font-weight: 500;
                }
            `}</style>
        </Card>
    );
}

export default ArchitecturePreview;
