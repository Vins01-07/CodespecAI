import { useState, useMemo, useCallback } from "react";
import {
    ReactFlow,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType,
    ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    Zap,
    Layers,
    Server,
    Database,
    Cpu,
    ExternalLink,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCcw,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Info,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const SEVERITY_COLORS = {
    CRITICAL: "#E06C75", // Red
    HIGH: "#E5C07B",     // Amber/Yellow
    MEDIUM: "#91A78A",   // Sage/Primary
    LOW: "#7A8274",      // Muted Sage
};

/**
 * Custom Impact Node
 */
function ImpactCustomNode({ id, data, selected }) {
    const isTarget = data.isTarget;
    const severity = data.severity || (isTarget ? "CRITICAL" : "MEDIUM");
    const accentColor = SEVERITY_COLORS[severity] || "#91A78A";

    return (
        <div
            style={{
                width: "200px",
                borderRadius: "6px",
                background: isTarget ? "rgba(35, 25, 25, 0.95)" : "var(--card-background)",
                border: `1.5px solid ${isTarget ? "var(--danger)" : selected ? "var(--primary)" : "var(--card-border)"}`,
                boxShadow: isTarget
                    ? "0 0 12px rgba(184, 120, 112, 0.4), 0 4px 12px rgba(0,0,0,0.5)"
                    : selected
                    ? "0 0 0 1px var(--primary), 0 4px 12px rgba(0,0,0,0.4)"
                    : "0 2px 8px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.15s ease",
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: "#282C26",
                    border: `2px solid ${accentColor}`,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                }}
            />

            {/* Accent strip */}
            <div
                style={{
                    height: "3px",
                    width: "100%",
                    background: isTarget ? "var(--danger)" : accentColor,
                }}
            />

            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        {isTarget ? (
                            <Zap size={13} color="var(--danger)" style={{ flexShrink: 0 }} />
                        ) : (
                            <Layers size={13} color={accentColor} style={{ flexShrink: 0 }} />
                        )}
                        <span
                            style={{
                                fontSize: "11.5px",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                            title={data.label}
                        >
                            {data.label}
                        </span>
                    </div>

                    <span
                        style={{
                            fontSize: "8.5px",
                            fontWeight: 700,
                            padding: "1px 4px",
                            borderRadius: "3px",
                            background: isTarget ? "rgba(184, 120, 112, 0.2)" : "rgba(168, 179, 154, 0.1)",
                            color: isTarget ? "var(--danger)" : accentColor,
                            textTransform: "uppercase",
                            flexShrink: 0,
                        }}
                    >
                        {isTarget ? "TARGET" : data.impact_type || severity}
                    </span>
                </div>

                {data.type && (
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                        Type: {data.type}
                    </span>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: "#282C26",
                    border: `2px solid ${accentColor}`,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                }}
            />
        </div>
    );
}

const nodeTypes = {
    impactNode: ImpactCustomNode,
};

function computeImpactLayout(rawNodes = [], rawEdges = []) {
    if (!rawNodes.length) return [];

    // Target node on left/center, downstream to right, upstream to left
    const targetNode = rawNodes.find((n) => n.isTarget || n.id === "target-node") || rawNodes[0];
    const otherNodes = rawNodes.filter((n) => n.id !== targetNode.id);

    const laidOut = [];

    // Target node position
    laidOut.push({
        id: targetNode.id,
        type: "impactNode",
        position: { x: 300, y: 180 },
        data: targetNode,
    });

    // Place other nodes in tiers around target
    const directNodes = otherNodes.filter((n) => n.impact_type === "direct" || n.severity === "HIGH");
    const indirectNodes = otherNodes.filter((n) => !directNodes.includes(n));

    directNodes.forEach((node, idx) => {
        const total = directNodes.length;
        const spacing = 100;
        const startY = 180 - ((total - 1) * spacing) / 2;
        laidOut.push({
            id: node.id,
            type: "impactNode",
            position: { x: 620, y: startY + idx * spacing },
            data: node,
        });
    });

    indirectNodes.forEach((node, idx) => {
        const total = indirectNodes.length;
        const spacing = 100;
        const startY = 180 - ((total - 1) * spacing) / 2;
        laidOut.push({
            id: node.id,
            type: "impactNode",
            position: { x: idx % 2 === 0 ? 940 : 40, y: startY + idx * spacing },
            data: node,
        });
    });

    return laidOut;
}

function ImpactGraphInner({ graphData, onSelectNode }) {
    const initialNodes = useMemo(() => {
        if (!graphData?.nodes) return [];
        return computeImpactLayout(graphData.nodes, graphData.edges || []);
    }, [graphData]);

    const initialEdges = useMemo(() => {
        if (!graphData?.edges) return [];
        return graphData.edges.map((edge, idx) => {
            const isHigh = edge.severity === "HIGH" || edge.severity === "CRITICAL";
            return {
                id: edge.id || `e-${idx}`,
                source: edge.source,
                target: edge.target,
                label: edge.label || null,
                animated: isHigh,
                style: {
                    stroke: isHigh ? "var(--danger)" : "#5C6356",
                    strokeWidth: isHigh ? 2 : 1.5,
                },
                labelStyle: {
                    fill: "var(--text-muted)",
                    fontSize: 10,
                    fontFamily: "monospace",
                },
                labelBgStyle: {
                    fill: "#171A17",
                    fillOpacity: 0.9,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 14,
                    height: 14,
                    color: isHigh ? "var(--danger)" : "#5C6356",
                },
            };
        });
    }, [graphData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);

    const handleNodeClick = useCallback(
        (event, node) => {
            setSelectedNode(node.data);
            if (onSelectNode) onSelectNode(node.data);
        },
        [onSelectNode]
    );

    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "480px",
                borderRadius: "var(--border-radius)",
                overflow: "hidden",
                border: "1px solid var(--card-border)",
                background: "var(--graph-background)",
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                style={{ background: "#171A17" }}
            >
                <Background color="#282C26" gap={20} size={1} />
            </ReactFlow>

            {/* Impact Legend (Bottom Left) */}
            <div
                style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    background: "rgba(23, 26, 23, 0.9)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    zIndex: 4,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)" }} />
                    <span style={{ color: "var(--text-primary)" }}>Target / Critical</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E5C07B" }} />
                    <span>Direct Impact</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#91A78A" }} />
                    <span>Indirect Impact</span>
                </div>
            </div>
        </div>
    );
}

export function ImpactGraph({ graphData, onSelectNode }) {
    return (
        <ReactFlowProvider>
            <ImpactGraphInner graphData={graphData} onSelectNode={onSelectNode} />
        </ReactFlowProvider>
    );
}

export default ImpactGraph;
