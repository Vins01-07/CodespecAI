import { useState } from "react";
import { Layers, ChevronDown, ChevronUp, Globe, Server, Database, HardDrive, Network, Filter } from "lucide-react";

export const CATEGORY_CONFIG = {
    frontend: {
        label: "Frontend",
        color: "#818cf8",
        description: "Web client & user interface",
        icon: Globe,
    },
    service: {
        label: "Service",
        color: "#a78bfa",
        description: "APIs, microservices & workers",
        icon: Server,
    },
    database: {
        label: "Database",
        color: "#c084fc",
        description: "Relational & graph data stores",
        icon: Database,
    },
    cache: {
        label: "Cache",
        color: "#f472b6",
        description: "In-memory caches & queues",
        icon: HardDrive,
    },
    external: {
        label: "External",
        color: "#38bdf8",
        description: "Third-party APIs & cloud storage",
        icon: Network,
    },
};

function GraphLegend({ activeFilter = "all", onFilterChange, nodeCounts = {} }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className="graph-legend-container"
            style={{
                background: "rgba(20, 16, 32, 0.88)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--card-border)",
                borderRadius: "var(--border-radius)",
                padding: "10px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxWidth: "600px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                fontSize: "12px",
                userSelect: "none",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
                    <Layers size={13} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "11px", letterSpacing: "0.4px", textTransform: "uppercase" }}>
                        Node Types
                    </span>
                    {activeFilter !== "all" && (
                        <span
                            style={{
                                background: "rgba(168, 179, 154, 0.15)",
                                color: "var(--primary)",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                fontSize: "10px",
                                fontWeight: 500,
                            }}
                        >
                            Filtered: {CATEGORY_CONFIG[activeFilter]?.label || activeFilter}
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {activeFilter !== "all" && (
                        <button
                            type="button"
                            onClick={() => onFilterChange?.("all")}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--primary)",
                                fontSize: "11px",
                                cursor: "pointer",
                                padding: "2px 4px",
                                textDecoration: "underline",
                            }}
                        >
                            Reset filter
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        title={isExpanded ? "Collapse legend" : "Expand legend"}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            padding: "2px",
                        }}
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Compact Legend Chips (Always Visible) */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                }}
            >
                <button
                    type="button"
                    onClick={() => onFilterChange?.("all")}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        cursor: "pointer",
                        border: activeFilter === "all" ? "1px solid var(--primary)" : "1px solid transparent",
                        background: activeFilter === "all" ? "var(--active-background)" : "transparent",
                        color: activeFilter === "all" ? "var(--primary)" : "var(--text-secondary)",
                        transition: "all 0.12s ease",
                    }}
                >
                    <Filter size={11} />
                    <span>All</span>
                    {nodeCounts.total ? <span style={{ opacity: 0.65, fontSize: "10px" }}>({nodeCounts.total})</span> : null}
                </button>

                {Object.entries(CATEGORY_CONFIG).map(([key, item]) => {
                    const count = nodeCounts[key];
                    const isActive = activeFilter === key;
                    const Icon = item.icon;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onFilterChange?.(isActive ? "all" : key)}
                            title={`Filter ${item.label} nodes: ${item.description}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                                border: isActive ? `1px solid ${item.color}` : "1px solid rgba(54, 58, 50, 0.5)",
                                background: isActive ? "rgba(37, 41, 33, 0.9)" : "rgba(29, 32, 27, 0.6)",
                                color: isActive ? "#E7E8DF" : "var(--text-secondary)",
                                transition: "all 0.12s ease",
                            }}
                        >
                            <span
                                style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "2px",
                                    backgroundColor: item.color,
                                    flexShrink: 0,
                                }}
                            />
                            <span>{item.label}</span>
                            {count !== undefined && (
                                <span style={{ opacity: 0.65, fontSize: "10px" }}>({count})</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Expanded Explanations */}
            {isExpanded && (
                <div
                    style={{
                        paddingTop: "8px",
                        borderTop: "1px solid var(--card-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                    }}
                >
                    {Object.entries(CATEGORY_CONFIG).map(([key, item]) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={key}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "10px",
                                    fontSize: "11px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Icon size={12} color={item.color} />
                                    <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
                                </div>
                                <span style={{ color: "var(--text-muted)", fontSize: "10.5px" }}>{item.description}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default GraphLegend;
