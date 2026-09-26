import { X, ExternalLink, ArrowRight, ArrowLeft, Activity, FileText, Code, Layers } from "lucide-react";
import Badge from "../common/Badge";
import { CATEGORY_CONFIG } from "./GraphLegend";

function NodeDetails({
    node,
    edges = [],
    allNodes = [],
    onClose,
    onSelectNode,
    isLoading = false,
}) {
    if (!node) return null;

    const config = CATEGORY_CONFIG[node.type] || CATEGORY_CONFIG.service;
    const Icon = config.icon;

    // Derive actual relationship dependencies from existing graph edges
    const inboundEdges = edges.filter((e) => e.target === node.id);
    const outboundEdges = edges.filter((e) => e.source === node.id);

    const inboundNodes = inboundEdges
        .map((edge) => {
            const sourceNode = allNodes.find((n) => n.id === edge.source);
            return sourceNode ? { node: sourceNode, label: edge.label } : null;
        })
        .filter(Boolean);

    const outboundNodes = outboundEdges
        .map((edge) => {
            const targetNode = allNodes.find((n) => n.id === edge.target);
            return targetNode ? { node: targetNode, label: edge.label } : null;
        })
        .filter(Boolean);

    return (
        <div
            className="node-details-drawer"
            style={{
                width: "360px",
                maxHeight: "calc(100% - 32px)",
                background: "var(--card-background)",
                border: "1px solid var(--card-border)",
                borderRadius: "var(--border-radius)",
                boxShadow: "0 8px 28px rgba(0, 0, 0, 0.45)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 10,
                fontSize: "12px",
            }}
        >
            {/* Header with Type Accent Top Border */}
            <div
                style={{
                    height: "3px",
                    width: "100%",
                    background: config.color,
                }}
            />

            <div
                style={{
                    padding: "14px 16px 12px 16px",
                    borderBottom: "1px solid var(--card-border)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "10px",
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                    <div
                        style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            background: "var(--sidebar-background)",
                            border: `1px solid ${config.color}40`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: config.color,
                            flexShrink: 0,
                            marginTop: "2px",
                        }}
                    >
                        <Icon size={16} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    lineHeight: 1.3,
                                }}
                            >
                                {node.label || node.name || node.id}
                            </span>
                            <span
                                style={{
                                    fontSize: "9.5px",
                                    fontWeight: 600,
                                    padding: "1px 6px",
                                    borderRadius: "3px",
                                    background: `${config.color}20`,
                                    color: config.color,
                                    border: `1px solid ${config.color}50`,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.4px",
                                }}
                            >
                                {config.label}
                            </span>
                        </div>
                        {node.id && (
                            <span
                                style={{
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                    fontFamily: "monospace",
                                    display: "block",
                                    marginTop: "2px",
                                }}
                            >
                                id: {node.id}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    title="Close details"
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Scrollable Content Body */}
            <div
                style={{
                    padding: "14px 16px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                }}
            >
                {/* Description (only if available) */}
                {node.description && (
                    <div>
                        <span
                            style={{
                                fontSize: "10.5px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                color: "var(--text-muted)",
                                fontWeight: 600,
                                display: "block",
                                marginBottom: "4px",
                            }}
                        >
                            Description
                        </span>
                        <p
                            style={{
                                margin: 0,
                                color: "var(--text-secondary)",
                                fontSize: "12px",
                                lineHeight: 1.5,
                            }}
                        >
                            {node.description}
                        </p>
                    </div>
                )}

                {/* Metadata Fields (only fields that exist) */}
                {(node.module || node.language || node.file) && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            padding: "10px 12px",
                            background: "var(--sidebar-background)",
                            borderRadius: "var(--border-radius)",
                            border: "1px solid var(--card-border)",
                        }}
                    >
                        {node.module && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}>
                                    <Layers size={12} /> Module:
                                </span>
                                <span style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: "11px", fontWeight: 500 }}>
                                    {node.module}
                                </span>
                            </div>
                        )}

                        {node.language && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}>
                                    <Code size={12} /> Tech / Language:
                                </span>
                                <span style={{ color: "var(--text-secondary)", fontSize: "11.5px" }}>
                                    {node.language}
                                </span>
                            </div>
                        )}

                        {node.file && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}>
                                    <FileText size={12} /> File Source:
                                </span>
                                <span style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: "11px" }} title={node.file}>
                                    {node.file}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Real Metrics from Backend (only if present) */}
                {node.metrics && typeof node.metrics === "object" && Object.keys(node.metrics).length > 0 && (
                    <div>
                        <span
                            style={{
                                fontSize: "10.5px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                color: "var(--text-muted)",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                marginBottom: "8px",
                            }}
                        >
                            <Activity size={12} color="var(--primary)" /> Available Metrics
                        </span>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "8px",
                            }}
                        >
                            {Object.entries(node.metrics).map(([key, val]) => (
                                <div
                                    key={key}
                                    style={{
                                        padding: "8px 10px",
                                        background: "var(--sidebar-background)",
                                        borderRadius: "var(--border-radius)",
                                        border: "1px solid var(--card-border)",
                                    }}
                                >
                                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "capitalize" }}>
                                        {key.replace(/([A-Z])/g, " $1")}
                                    </span>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px", display: "block" }}>
                                        {String(val)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Outbound Relationships (Calls) */}
                <div>
                    <span
                        style={{
                            fontSize: "10.5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            marginBottom: "6px",
                        }}
                    >
                        <ArrowRight size={12} color="var(--primary)" /> Calls Outbound ({outboundNodes.length})
                    </span>

                    {outboundNodes.length === 0 ? (
                        <span style={{ color: "var(--text-muted)", fontSize: "11px", fontStyle: "italic" }}>
                            No downstream dependencies
                        </span>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {outboundNodes.map(({ node: target, label }, idx) => {
                                const targetConfig = CATEGORY_CONFIG[target.type] || CATEGORY_CONFIG.service;
                                return (
                                    <div
                                        key={`out-${target.id}-${idx}`}
                                        onClick={() => onSelectNode?.(target)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "6px 8px",
                                            background: "var(--sidebar-background)",
                                            border: "1px solid var(--card-border)",
                                            borderRadius: "var(--border-radius)",
                                            cursor: "pointer",
                                            transition: "border-color 0.12s ease",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = targetConfig.color)}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                            <span
                                                style={{
                                                    width: "6px",
                                                    height: "6px",
                                                    borderRadius: "2px",
                                                    backgroundColor: targetConfig.color,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span style={{ color: "var(--text-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {target.label || target.name || target.id}
                                            </span>
                                        </div>
                                        {label && (
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    color: "var(--text-muted)",
                                                    fontFamily: "monospace",
                                                    padding: "1px 5px",
                                                    background: "var(--card-background)",
                                                    borderRadius: "3px",
                                                }}
                                            >
                                                {label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Inbound Relationships (Called By) */}
                <div>
                    <span
                        style={{
                            fontSize: "10.5px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            marginBottom: "6px",
                        }}
                    >
                        <ArrowLeft size={12} color="var(--secondary)" /> Inbound From ({inboundNodes.length})
                    </span>

                    {inboundNodes.length === 0 ? (
                        <span style={{ color: "var(--text-muted)", fontSize: "11px", fontStyle: "italic" }}>
                            No inbound callers recorded
                        </span>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {inboundNodes.map(({ node: source, label }, idx) => {
                                const sourceConfig = CATEGORY_CONFIG[source.type] || CATEGORY_CONFIG.service;
                                return (
                                    <div
                                        key={`in-${source.id}-${idx}`}
                                        onClick={() => onSelectNode?.(source)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "6px 8px",
                                            background: "var(--sidebar-background)",
                                            border: "1px solid var(--card-border)",
                                            borderRadius: "var(--border-radius)",
                                            cursor: "pointer",
                                            transition: "border-color 0.12s ease",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = sourceConfig.color)}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                            <span
                                                style={{
                                                    width: "6px",
                                                    height: "6px",
                                                    borderRadius: "2px",
                                                    backgroundColor: sourceConfig.color,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span style={{ color: "var(--text-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {source.label || source.name || source.id}
                                            </span>
                                        </div>
                                        {label && (
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    color: "var(--text-muted)",
                                                    fontFamily: "monospace",
                                                    padding: "1px 5px",
                                                    background: "var(--card-background)",
                                                    borderRadius: "3px",
                                                }}
                                            >
                                                {label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NodeDetails;
