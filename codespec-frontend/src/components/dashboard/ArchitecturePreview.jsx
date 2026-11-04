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
    frontend: { color: "#FF5A6E", label: "Frontend", border: "#FF3548" },
    service: { color: "#FF3548", label: "Service", border: "#E32636" },
    database: { color: "#10B981", label: "Database", border: "#10B981" },
    cache: { color: "#F59E0B", label: "Cache", border: "#F59E0B" },
    external: { color: "#94A3B8", label: "External", border: "#94A3B8" },
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
        <Card className="arch-preview-card">
            <div className="arch-header">
                <div className="arch-header-left">
                    <div className="arch-title-group">
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div className="icon-accent">
                                <Network size={16} strokeWidth={2.2} />
                            </div>
                            <span className="arch-title">Architecture Preview</span>
                        </div>
                        <Badge variant="primary" className="arch-badge font-mono">
                            {displayNodeCount} NODES â€¢ {displayServiceCount} SERVICES
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
                        <span>Open in Workspace</span>
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
                            width="24"
                            height="24"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.05)" />
                        </pattern>
                        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#E32636" stopOpacity="0.8" />
                        </linearGradient>
                        <marker
                            id="arrowhead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 6 3, 0 6" fill="#FF3548" />
                        </marker>
                        <filter id="node-red-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Dark ethereal canvas background */}
                    <rect width="100%" height="100%" fill="#090A0D" />
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
                                    stroke={isHighlighted ? "#FF3548" : "rgba(255, 255, 255, 0.12)"}
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
                                filter={isHovered ? "url(#node-red-glow)" : "none"}
                            >
                                {/* Node Card Background */}
                                <rect
                                    width={NODE_WIDTH}
                                    height={NODE_HEIGHT}
                                    rx="8"
                                    fill={isHovered ? "#1B1B22" : "#15161B"}
                                    stroke={isHovered ? "#FF3548" : "rgba(255, 255, 255, 0.08)"}
                                    strokeWidth={isHovered ? 1.5 : 1}
                                />

                                {/* Left Category Accent Line */}
                                <rect
                                    x="0"
                                    y="4"
                                    width="3"
                                    height={NODE_HEIGHT - 8}
                                    rx="1.5"
                                    fill={config.color}
                                />

                                {/* Node Title */}
                                <text
                                    x="12"
                                    y="19"
                                    fill="#F5F5F7"
                                    fontSize="11"
                                    fontWeight="700"
                                    fontFamily="inherit"
                                >
                                    {node.name}
                                </text>

                                {/* Tech / Subtitle */}
                                <text
                                    x="12"
                                    y="34"
                                    fill="#A1A1AC"
                                    fontSize="9.5"
                                    fontFamily="JetBrains Mono, monospace"
                                >
                                    {node.tech}
                                </text>

                                {/* Category Tag Pill */}
                                <rect
                                    x={NODE_WIDTH - 52}
                                    y="7"
                                    width="46"
                                    height="14"
                                    rx="4"
                                    fill="rgba(255, 255, 255, 0.04)"
                                    stroke="rgba(255, 255, 255, 0.08)"
                                    strokeWidth="0.8"
                                />
                                <text
                                    x={NODE_WIDTH - 29}
                                    y="17"
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
                    padding: 16px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    height: 100%;
                    border-radius: var(--border-radius);
                }
                .arch-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .arch-header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .arch-header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .arch-canvas-container {
                    flex: 1;
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                }
                .arch-svg-canvas {
                    width: 100%;
                    height: 100%;
                    min-height: 300px;
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
                    font-size: 11px;
                }
                .legend-label-wrap {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: var(--secondary-text);
                    font-weight: 700;
                }
                .legend-icon {
                    color: var(--secondary-text);
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
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .legend-item-text {
                    color: var(--secondary-text);
                    font-size: 11px;
                }
            `}</style>
        </Card>
    );
}

export default ArchitecturePreview;
