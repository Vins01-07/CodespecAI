import { useState, useMemo, useCallback, useEffect } from "react";
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

import GraphControls from "./GraphControls";
import GraphLegend, { CATEGORY_CONFIG } from "./GraphLegend";
import NodeDetails from "./NodeDetails";
import Loading from "../common/Loading";
import EmptyState from "../common/EmptyState";
import { Network, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Custom React Flow Node Component
 */
function ArchitectureNode({ id, data, selected }) {
    const type = data.type || "service";
    const config = CATEGORY_CONFIG[type] || CATEGORY_CONFIG.service;
    const Icon = config.icon;

    const isDimmed = data.isDimmed;
    const isHighlighted = data.isHighlighted;

    const borderColor = selected || isHighlighted
        ? config.color
        : "var(--card-border)";

    const backgroundColor = selected
        ? "rgba(37, 41, 33, 0.95)"
        : isHighlighted
        ? "rgba(32, 35, 29, 0.9)"
        : "var(--card-background)";

    const opacity = isDimmed ? 0.3 : 1;

    // Extract quick metric snippet if available
    let metricSnippet = null;
    if (data.metrics && typeof data.metrics === "object") {
        const entries = Object.entries(data.metrics);
        if (entries.length > 0) {
            const [firstKey, firstVal] = entries[0];
            metricSnippet = `${firstVal} ${firstKey}`;
        }
    }

    return (
        <div
            className={`arch-node-card ${selected ? "selected" : ""}`}
            style={{
                width: "190px",
                borderRadius: "6px",
                background: backgroundColor,
                border: `1px solid ${borderColor}`,
                boxShadow: selected
                    ? `0 0 0 1px ${config.color}, 0 6px 20px rgba(0, 0, 0, 0.5)`
                    : "0 4px 12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                cursor: "pointer",
                opacity,
                transition: "opacity 0.2s ease, border-color 0.15s ease, box-shadow 0.15s ease",
            }}
        >
            {/* Input Target Handle (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: "#282C26",
                    border: `2px solid ${config.color}`,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                }}
            />

            {/* Top Color Accent Strip */}
            <div
                style={{
                    height: "3px",
                    width: "100%",
                    background: config.color,
                }}
            />

            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {/* Header row: Icon, Label, Tag */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        <Icon size={13} color={config.color} style={{ flexShrink: 0 }} />
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
                            fontSize: "8px",
                            fontWeight: 700,
                            padding: "1px 4px",
                            borderRadius: "2px",
                            background: "var(--sidebar-background)",
                            color: config.color,
                            border: `0.5px solid ${config.color}60`,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            flexShrink: 0,
                        }}
                    >
                        {config.label}
                    </span>
                </div>

                {/* Subtitle row: module, language, or file */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "9.5px",
                        color: "var(--text-muted)",
                    }}
                >
                    <span
                        style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontFamily: data.module ? "monospace" : "inherit",
                        }}
                    >
                        {data.module || data.language || data.file || type}
                    </span>

                    {metricSnippet && (
                        <span
                            style={{
                                color: "var(--text-secondary)",
                                background: "rgba(23, 25, 22, 0.8)",
                                padding: "0 4px",
                                borderRadius: "2px",
                                fontSize: "8.5px",
                                flexShrink: 0,
                                marginLeft: "4px",
                            }}
                        >
                            {metricSnippet}
                        </span>
                    )}
                </div>
            </div>

            {/* Output Source Handle (Right) */}
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: "#282C26",
                    border: `2px solid ${config.color}`,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                }}
            />
        </div>
    );
}

const nodeTypes = {
    custom: ArchitectureNode,
};

/**
 * Automatically calculates tiered layout coordinates when nodes don't supply positions.
 */
function computeTieredLayout(rawNodes, rawEdges) {
    if (!rawNodes || rawNodes.length === 0) return [];

    // Check if positions are already defined
    const hasPresetPositions = rawNodes.every(
        (n) => n.position && typeof n.position.x === "number" && typeof n.position.y === "number"
    );

    if (hasPresetPositions) {
        return rawNodes.map((n) => ({
            id: n.id,
            type: "custom",
            position: n.position,
            data: { ...n },
        }));
    }

    // Determine tiers
    const colFrontend = [];
    const colGateway = [];
    const colServices = [];
    const colPersistence = [];

    // Find frontend node ids to identify direct downstream services (gateways)
    const frontendIds = new Set(rawNodes.filter((n) => n.type === "frontend").map((n) => n.id));
    const gatewayIds = new Set();

    rawEdges.forEach((e) => {
        const source = e.source || e.from;
        const target = e.target || e.to;
        if (frontendIds.has(source)) {
            gatewayIds.add(target);
        }
    });

    rawNodes.forEach((node) => {
        const type = (node.type || "service").toLowerCase();
        if (type === "frontend") {
            colFrontend.push(node);
        } else if (gatewayIds.has(node.id) || node.id.includes("gateway")) {
            colGateway.push(node);
        } else if (type === "service") {
            colServices.push(node);
        } else {
            // database, cache, external
            colPersistence.push(node);
        }
    });

    // If colGateway is empty, redistribute some services or handle fallback
    if (colGateway.length === 0 && colServices.length > 3) {
        colGateway.push(...colServices.splice(0, 2));
    }

    const columns = [
        { nodes: colFrontend, x: 50 },
        { nodes: colGateway, x: 310 },
        { nodes: colServices, x: 570 },
        { nodes: colPersistence, x: 840 },
    ];

    const positionedNodes = [];
    const ROW_HEIGHT = 100;
    const START_Y = 50;

    columns.forEach(({ nodes, x }) => {
        // Center column vertically relative to max height
        const totalHeight = nodes.length * ROW_HEIGHT;
        const offset = Math.max(0, (500 - totalHeight) / 2);

        nodes.forEach((node, idx) => {
            positionedNodes.push({
                id: node.id,
                type: "custom",
                position: {
                    x,
                    y: START_Y + offset + idx * ROW_HEIGHT,
                },
                data: { ...node },
            });
        });
    });

    return positionedNodes;
}

/**
 * Prepares edge definitions with styling, arrowheads, and labels.
 */
function buildEdges(rawEdges, selectedNodeId) {
    if (!rawEdges) return [];

    return rawEdges.map((edge, idx) => {
        const source = edge.source || edge.from;
        const target = edge.target || edge.to;
        const isConnected = selectedNodeId && (source === selectedNodeId || target === selectedNodeId);
        const isOutbound = selectedNodeId && source === selectedNodeId;

        return {
            id: edge.id || `e-${idx}`,
            source,
            target,
            label: edge.label || null,
            type: "smoothstep",
            animated: isConnected,
            style: {
                stroke: isConnected
                    ? isOutbound
                        ? "var(--primary)"
                        : "var(--secondary)"
                    : "#3E4338",
                strokeWidth: isConnected ? 2 : 1.2,
                opacity: selectedNodeId ? (isConnected ? 1 : 0.25) : 0.85,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 12,
                height: 12,
                color: isConnected
                    ? isOutbound
                        ? "var(--primary)"
                        : "var(--secondary)"
                    : "#4A5044",
            },
            labelStyle: {
                fill: "#A8ACA0",
                fontSize: 9.5,
                fontWeight: 500,
                fontFamily: "monospace",
            },
            labelBgStyle: {
                fill: "#171916",
                stroke: isConnected ? "var(--primary)" : "#363A32",
                strokeWidth: 0.8,
                rx: 3,
                ry: 3,
            },
            labelBgPadding: [4, 2],
        };
    });
}

function ArchitectureGraphInner({
    graphData,
    selectedNode,
    onSelectNode,
    onClearSelection,
    isLoading = false,
    error = null,
    onRetry,
    emptyTitle = "No Architecture Graph Found",
    emptyDescription = "No nodes or services have been mapped for this repository yet. Run code ingestion to index system dependencies.",
    hideDrawer = false,
}) {
    const [showMinimap, setShowMinimap] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");

    // Compute nodes & edges
    const positionedNodes = useMemo(() => {
        return computeTieredLayout(graphData?.nodes || [], graphData?.edges || []);
    }, [graphData]);

    const formattedEdges = useMemo(() => {
        return buildEdges(graphData?.edges || [], selectedNode?.id);
    }, [graphData?.edges, selectedNode?.id]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Update nodes state when raw graph data, selection, or filter changes
    useEffect(() => {
        if (!positionedNodes || positionedNodes.length === 0) {
            setNodes([]);
            return;
        }

        const selectedId = selectedNode?.id;

        // Find neighbors of selected node
        const neighborIds = new Set();
        if (selectedId && graphData?.edges) {
            graphData.edges.forEach((e) => {
                const s = e.source || e.from;
                const t = e.target || e.to;
                if (s === selectedId) neighborIds.add(t);
                if (t === selectedId) neighborIds.add(s);
            });
        }

        const updatedNodes = positionedNodes.map((n) => {
            const isSelected = n.id === selectedId;
            const isNeighbor = neighborIds.has(n.id);
            const matchesFilter = typeFilter === "all" || n.data.type === typeFilter;

            let isDimmed = false;
            let isHighlighted = false;

            if (typeFilter !== "all" && !matchesFilter) {
                isDimmed = true;
            } else if (selectedId) {
                if (isSelected || isNeighbor) {
                    isHighlighted = true;
                } else {
                    isDimmed = true;
                }
            }

            return {
                ...n,
                selected: isSelected,
                data: {
                    ...n.data,
                    isDimmed,
                    isHighlighted,
                },
            };
        });

        setNodes(updatedNodes);
    }, [positionedNodes, selectedNode, typeFilter, graphData?.edges, setNodes]);

    // Update edges state
    useEffect(() => {
        setEdges(formattedEdges);
    }, [formattedEdges, setEdges]);

    // Node Counts for legend
    const nodeCounts = useMemo(() => {
        const counts = { total: graphData?.nodes?.length || 0 };
        if (graphData?.nodes) {
            graphData.nodes.forEach((n) => {
                const t = (n.type || "service").toLowerCase();
                counts[t] = (counts[t] || 0) + 1;
            });
        }
        return counts;
    }, [graphData?.nodes]);

    // Handle node click
    const handleNodeClick = useCallback(
        (event, node) => {
            event.stopPropagation();
            onSelectNode(node.data);
        },
        [onSelectNode]
    );

    // Handle clicking empty canvas to deselect
    const handlePaneClick = useCallback(() => {
        onClearSelection();
    }, [onClearSelection]);

    // Auto-layout reset
    const handleAutoLayout = useCallback(() => {
        const recomputed = computeTieredLayout(graphData?.nodes || [], graphData?.edges || []);
        setNodes(recomputed);
    }, [graphData, setNodes]);

    if (isLoading) {
        return (
            <div
                style={{
                    height: "100%",
                    minHeight: "560px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--graph-background)",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--card-border)",
                }}
            >
                <Loading text="Loading architecture topology and service graphs..." size={28} />
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    height: "100%",
                    minHeight: "560px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--graph-background)",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--card-border)",
                    padding: "32px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: "12px",
                        maxWidth: "420px",
                    }}
                >
                    <AlertCircle size={36} color="var(--danger)" />
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                        Architecture Graph Unavailable
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {error}
                    </span>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="cs-btn cs-btn-primary"
                            style={{ marginTop: "8px" }}
                        >
                            <RefreshCw size={13} />
                            <span>Retry Connection</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return (
            <div
                style={{
                    height: "100%",
                    minHeight: "560px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--graph-background)",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--card-border)",
                }}
            >
                <EmptyState
                    icon={Network}
                    title={emptyTitle}
                    description={emptyDescription}
                />
            </div>
        );
    }

    return (
        <div
            className="arch-graph-wrapper"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "620px",
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
                <Background color="#282C26" gap={22} size={1} />

                {showMinimap && (
                    <MiniMap
                        position="bottom-left"
                        nodeColor={(n) => {
                            const config = CATEGORY_CONFIG[n.data?.type];
                            return config ? config.color : "#91A78A";
                        }}
                        nodeStrokeColor="#363A32"
                        maskColor="rgba(18, 19, 18, 0.75)"
                        style={{
                            background: "#171A17",
                            border: "1px solid var(--card-border)",
                            borderRadius: "6px",
                            marginBottom: "12px",
                            marginLeft: "12px",
                            width: 140,
                            height: 90,
                        }}
                    />
                )}
            </ReactFlow>

            {/* Floating Controls (Top Right) */}
            <div
                style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    zIndex: 5,
                }}
            >
                <GraphControls
                    showMinimap={showMinimap}
                    onToggleMinimap={() => setShowMinimap((prev) => !prev)}
                    onAutoLayout={handleAutoLayout}
                    hasSelection={Boolean(selectedNode)}
                />
            </div>

            {/* Floating Legend & Filter (Bottom Right or Bottom Center) */}
            <div
                style={{
                    position: "absolute",
                    bottom: "14px",
                    right: "14px",
                    zIndex: 5,
                }}
            >
                <GraphLegend
                    activeFilter={typeFilter}
                    onFilterChange={setTypeFilter}
                    nodeCounts={nodeCounts}
                />
            </div>

            {/* Selected Node Details Side Drawer (Left Overlay) */}
            {selectedNode && !hideDrawer && (
                <div
                    style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        bottom: "14px",
                        zIndex: 10,
                        display: "flex",
                    }}
                >
                    <NodeDetails
                        node={selectedNode}
                        edges={graphData.edges}
                        allNodes={graphData.nodes}
                        onClose={onClearSelection}
                        onSelectNode={(targetNode) => onSelectNode(targetNode)}
                    />
                </div>
            )}
        </div>
    );
}

function ArchitectureGraph(props) {
    return (
        <ReactFlowProvider>
            <ArchitectureGraphInner {...props} />
        </ReactFlowProvider>
    );
}

export default ArchitectureGraph;
