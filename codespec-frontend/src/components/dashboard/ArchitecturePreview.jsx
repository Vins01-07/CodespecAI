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
    frontend: { color: "#9BA8B0", label: "Frontend", border: "#9BA8B0" },
    service: { color: "#91A78A", label: "Service", border: "#91A78A" },
    database: { color: "#A49A82", label: "Database", border: "#A49A82" },
    cache: { color: "#B87870", label: "Cache", border: "#B87870" },
    external: { color: "#8F9A8C", label: "External", border: "#8F9A8C" },
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
    const NODE_HEIGHT = 48;

    return (
        <Card className="arch-preview-card">
            <div className="arch-header">
                <div className="arch-header-left">
                    <div className="arch-title-group">
                        <span className="arch-title">System Architecture Preview</span>
                        <Badge variant="default" className="arch-badge">
                            {displayNodeCount} Nodes • {displayServiceCount} Services
                        </Badge>
                    </div>
                    <span className="arch-subtitle">
                        Interactive component relationships, data flow & service dependencies
                    </span>
                </div>

                <div className="arch-header-right">
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
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="10" cy="10" r="1" fill="#282C26" />
                        </pattern>
                        <marker
                            id="arrowhead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 6 3, 0 6" fill="#363A32" />
                        </marker>
                    </defs>

                    {/* Grid Background */}
                    <rect width="100%" height="100%" fill="#171A17" />
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
                                    stroke={isHighlighted ? "var(--primary)" : "#363A32"}
                                    strokeWidth={isHighlighted ? 2 : 1.2}
                                    strokeDasharray={edge.label?.includes("Trigger") ? "3,3" : "none"}
                                    markerEnd="url(#arrowhead)"
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
                                {/* Node Card Background */}
                                <rect
                                    width={NODE_WIDTH}
                                    height={NODE_HEIGHT}
                                    rx="6"
                                    fill={isHovered ? "#252921" : "#1D201B"}
                                    stroke={isHovered ? config.color : "#363A32"}
                                    strokeWidth={isHovered ? 1.5 : 1}
                                />

                                {/* Left Category Accent Bar */}
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
                                    fill="#E7E8DF"
                                    fontSize="11"
                                    fontWeight="600"
                                    fontFamily="inherit"
                                >
                                    {node.name}
                                </text>

                                {/* Tech / Subtitle */}
                                <text
                                    x="10"
                                    y="34"
                                    fill="#70756C"
                                    fontSize="9.5"
                                    fontFamily="inherit"
                                >
                                    {node.tech}
                                </text>

                                {/* Category Tag Pill */}
                                <rect
                                    x={NODE_WIDTH - 48}
                                    y="7"
                                    width="42"
                                    height="12"
                                    rx="3"
                                    fill="#171916"
                                    stroke={config.color}
                                    strokeWidth="0.6"
                                />
                                <text
                                    x={NODE_WIDTH - 27}
                                    y="16"
                                    fill={config.color}
                                    fontSize="7"
                                    fontWeight="600"
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
                    padding: 16px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    height: 100%;
                }
                .arch-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .arch-title-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .arch-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .arch-badge {
                    font-size: 10px;
                    padding: 1px 6px;
                }
                .arch-subtitle {
                    display: block;
                    font-size: 11px;
                    color: var(--text-muted);
                    margin-top: 2px;
                }
                .open-arch-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--primary);
                    padding: 5px 10px;
                    border-radius: var(--border-radius);
                    border: 1px solid var(--card-border);
                    background: #171916;
                    transition: all 0.15s ease;
                }
                .open-arch-btn:hover {
                    background: var(--card-background-hover);
                    border-color: var(--primary);
                    color: var(--text-primary);
                }
                .arch-canvas-container {
                    position: relative;
                    width: 100%;
                    min-height: 290px;
                    flex: 1;
                    border: 1px solid var(--card-border);
                    border-radius: 6px;
                    overflow: hidden;
                    background: #171A17;
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
                    gap: 8px;
                    padding-top: 4px;
                    border-top: 1px solid var(--card-border);
                    font-size: 11px;
                }
                .legend-label-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
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
                    border-radius: 2px;
                }
                .legend-item-text {
                    color: var(--text-secondary);
                    font-size: 11px;
                }
            `}</style>
        </Card>
    );
}

export default ArchitecturePreview;
