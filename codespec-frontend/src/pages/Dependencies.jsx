import { useState, useMemo, useEffect } from "react";
import {
    Share2,
    FolderGit2,
    GitBranch,
    RefreshCw,
    Filter,
    ArrowRight,
    ArrowLeft,
    Layers,
    Server,
    Database,
    Network,
    Table,
    Maximize2,
    Columns,
    Search,
    X,
    Info,
    CheckCircle2,
    Cpu,
    Radio,
} from "lucide-react";
import useArchitectureStore from "../store/architectureStore";
import useRepositoryStore from "../store/repositoryStore";
import ArchitectureGraph from "../components/architecture/ArchitectureGraph";
import { CATEGORY_CONFIG } from "../components/architecture/GraphLegend";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";

function Dependencies() {
    const { activeRepository, repositories, setActiveRepository } = useRepositoryStore();
    const {
        graphData,
        selectedNode,
        selectedNodeDetails,
        isLoading,
        error,
        fetchGraph,
        selectNode,
        clearSelection,
    } = useArchitectureStore();

    const [directionFilter, setDirectionFilter] = useState("all"); // "all", "1-hop", "outbound", "inbound"
    const [protocolFilter, setProtocolFilter] = useState("all");
    const [viewMode, setViewMode] = useState("graph"); // "graph", "matrix", "split"
    const [searchQuery, setSearchQuery] = useState("");

    const readyRepositories = repositories.filter((r) => r.status === "Ready");
    const currentRepo = activeRepository?.status === "Ready" ? activeRepository : readyRepositories[0] || activeRepository;

    useEffect(() => {
        if (currentRepo?.id) {
            fetchGraph(currentRepo.id);
        } else {
            fetchGraph();
        }
    }, [currentRepo?.id, fetchGraph]);

    const handleRefresh = () => {
        fetchGraph(currentRepo?.id);
    };

    const handleRepoChange = (e) => {
        const repoId = e.target.value;
        const found = repositories.find((r) => r.id === repoId);
        if (found) {
            setActiveRepository(found);
            clearSelection();
        }
    };

    // Extract all unique protocols/labels from existing edges
    const availableProtocols = useMemo(() => {
        if (!graphData?.edges) return [];
        const protos = new Set();
        graphData.edges.forEach((e) => {
            if (e.label) protos.add(e.label);
        });
        return Array.from(protos).sort();
    }, [graphData?.edges]);

    // Active selected node reference (detailed or basic)
    const activeNode = selectedNodeDetails || selectedNode;

    // Filtered Graph Data based on direction filter, protocol filter, and search query
    const focusedGraphData = useMemo(() => {
        if (!graphData?.nodes || !graphData?.edges) {
            return { nodes: [], edges: [] };
        }

        let edges = [...graphData.edges];
        let nodes = [...graphData.nodes];

        // 1. Filter edges by protocol if selected
        if (protocolFilter !== "all") {
            edges = edges.filter((e) => e.label === protocolFilter);
        }

        // 2. Filter by direction if a node is selected
        if (activeNode) {
            const selectedId = activeNode.id;

            if (directionFilter === "1-hop") {
                edges = edges.filter((e) => e.source === selectedId || e.target === selectedId);
                const connectedNodeIds = new Set([selectedId]);
                edges.forEach((e) => {
                    connectedNodeIds.add(e.source);
                    connectedNodeIds.add(e.target);
                });
                nodes = nodes.filter((n) => connectedNodeIds.has(n.id));
            } else if (directionFilter === "outbound") {
                edges = edges.filter((e) => e.source === selectedId);
                const connectedNodeIds = new Set([selectedId]);
                edges.forEach((e) => connectedNodeIds.add(e.target));
                nodes = nodes.filter((n) => connectedNodeIds.has(n.id));
            } else if (directionFilter === "inbound") {
                edges = edges.filter((e) => e.target === selectedId);
                const connectedNodeIds = new Set([selectedId]);
                edges.forEach((e) => connectedNodeIds.add(e.source));
                nodes = nodes.filter((n) => connectedNodeIds.has(n.id));
            }
        }

        // 3. Optional search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchingNodeIds = new Set(
                nodes
                    .filter(
                        (n) =>
                            n.label?.toLowerCase().includes(q) ||
                            n.id?.toLowerCase().includes(q) ||
                            n.module?.toLowerCase().includes(q)
                    )
                    .map((n) => n.id)
            );

            // Keep matching nodes and edges connecting them
            edges = edges.filter(
                (e) => matchingNodeIds.has(e.source) || matchingNodeIds.has(e.target)
            );
            const connectedIds = new Set();
            edges.forEach((e) => {
                connectedIds.add(e.source);
                connectedIds.add(e.target);
            });
            nodes = nodes.filter((n) => matchingNodeIds.has(n.id) || connectedIds.has(n.id));
        }

        return { nodes, edges };
    }, [graphData, activeNode, directionFilter, protocolFilter, searchQuery]);

    // Calculate node dependency metrics
    const dependencyStats = useMemo(() => {
        if (!graphData?.nodes || !graphData?.edges) {
            return {
                totalNodes: 0,
                totalEdges: 0,
                topProducers: [],
                topConsumers: [],
                activeInbound: 0,
                activeOutbound: 0,
            };
        }

        const outDegree = {};
        const inDegree = {};

        graphData.nodes.forEach((n) => {
            outDegree[n.id] = 0;
            inDegree[n.id] = 0;
        });

        graphData.edges.forEach((e) => {
            if (outDegree[e.source] !== undefined) outDegree[e.source] += 1;
            if (inDegree[e.target] !== undefined) inDegree[e.target] += 1;
        });

        const topProducers = Object.entries(outDegree)
            .map(([id, count]) => ({ node: graphData.nodes.find((n) => n.id === id), count }))
            .filter((item) => item.node && item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        const topConsumers = Object.entries(inDegree)
            .map(([id, count]) => ({ node: graphData.nodes.find((n) => n.id === id), count }))
            .filter((item) => item.node && item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        let activeInbound = 0;
        let activeOutbound = 0;
        if (activeNode) {
            activeInbound = inDegree[activeNode.id] || 0;
            activeOutbound = outDegree[activeNode.id] || 0;
        }

        return {
            totalNodes: graphData.nodes.length,
            totalEdges: graphData.edges.length,
            topProducers,
            topConsumers,
            activeInbound,
            activeOutbound,
        };
    }, [graphData, activeNode]);

    // Handle node jump from dropdown or quick-pick
    const handleNodeSelectChange = (e) => {
        const nodeId = e.target.value;
        if (!nodeId) {
            clearSelection();
            setDirectionFilter("all");
            return;
        }
        const target = graphData?.nodes?.find((n) => n.id === nodeId);
        if (target) {
            selectNode(target, currentRepo?.id);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                width: "100%",
                maxWidth: "1600px",
                margin: "0 auto",
                height: "calc(100vh - var(--topbar-height) - (var(--content-padding) * 2))",
            }}
        >
            {/* Header Section */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid var(--card-border)",
                    paddingBottom: "12px",
                    flexShrink: 0,
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <Share2 size={20} color="var(--primary)" />
                        Codebase Dependencies
                    </h1>
                    <p
                        style={{
                            fontSize: "12.5px",
                            color: "var(--text-secondary)",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Inspect dependency relationships, inter-service call hierarchies, communication protocols, and architectural coupling.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* Repository Selector */}
                    {repositories.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "var(--card-background)",
                                padding: "4px 8px 4px 10px",
                                borderRadius: "var(--border-radius)",
                                border: "1px solid var(--card-border)",
                                fontSize: "12px",
                            }}
                        >
                            <FolderGit2 size={14} color="var(--secondary)" />
                            <select
                                value={currentRepo?.id || ""}
                                onChange={handleRepoChange}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    outline: "none",
                                    paddingRight: "4px",
                                }}
                            >
                                {repositories.map((repo) => (
                                    <option
                                        key={repo.id}
                                        value={repo.id}
                                        style={{ background: "var(--sidebar-background)", color: "var(--text-primary)" }}
                                    >
                                        {repo.name} ({repo.status})
                                    </option>
                                ))}
                            </select>

                            {currentRepo?.branch && (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px",
                                        color: "var(--text-muted)",
                                        fontSize: "11px",
                                        borderLeft: "1px solid var(--card-border)",
                                        paddingLeft: "6px",
                                    }}
                                >
                                    <GitBranch size={11} /> {currentRepo.branch}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Refresh Button */}
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="cs-btn"
                        title="Reload dependency data"
                        disabled={isLoading}
                        style={{
                            height: "30px",
                            padding: "0 10px",
                            fontSize: "12px",
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        <RefreshCw
                            size={13}
                            className={isLoading ? "animate-spin" : ""}
                            style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }}
                        />
                        <span>Sync</span>
                    </button>
                </div>
            </div>

            {/* Quick Dependency Metrics & Selected Scope Strip */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    background: "var(--card-background)",
                    padding: "8px 14px",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--card-border)",
                    fontSize: "12px",
                    flexShrink: 0,
                }}
            >
                {/* Global Metrics */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Layers size={13} color="var(--primary)" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                            {dependencyStats.totalNodes}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>Components</span>
                    </div>

                    <span style={{ color: "var(--card-border)" }}>•</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Share2 size={13} color="var(--secondary)" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                            {dependencyStats.totalEdges}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>Relationships</span>
                    </div>

                    <span style={{ color: "var(--card-border)" }}>•</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Active Edge Scope:</span>
                        <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                            {focusedGraphData.edges.length} edges
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>({focusedGraphData.nodes.length} nodes)</span>
                    </div>
                </div>

                {/* Selected Node Status Indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {activeNode ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "var(--sidebar-background)",
                                padding: "3px 8px 3px 10px",
                                borderRadius: "4px",
                                border: "1px solid var(--primary)",
                            }}
                        >
                            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Focusing:</span>
                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "11.5px" }}>
                                {activeNode.label || activeNode.name || activeNode.id}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
                                <span
                                    title="Outbound dependencies"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px",
                                        color: "var(--primary)",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                    }}
                                >
                                    <ArrowRight size={11} /> {dependencyStats.activeOutbound} Calls
                                </span>
                                <span
                                    title="Inbound callers"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px",
                                        color: "var(--secondary)",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                    }}
                                >
                                    <ArrowLeft size={11} /> {dependencyStats.activeInbound} Callers
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    clearSelection();
                                    setDirectionFilter("all");
                                }}
                                title="Clear node focus"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "2px",
                                    marginLeft: "2px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "11.5px", fontStyle: "italic" }}>
                            Select any node to inspect directional call trees & upstream/downstream dependencies
                        </span>
                    )}
                </div>
            </div>

            {/* Filter and Control Toolbar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    flexShrink: 0,
                }}
            >
                {/* Left Controls: Node Select & Direction Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {/* Node Selector Dropdown */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "var(--card-background)",
                            padding: "4px 10px",
                            borderRadius: "var(--border-radius)",
                            border: "1px solid var(--card-border)",
                            fontSize: "12px",
                        }}
                    >
                        <Search size={13} color="var(--text-muted)" />
                        <select
                            value={activeNode?.id || ""}
                            onChange={handleNodeSelectChange}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-primary)",
                                fontSize: "12px",
                                cursor: "pointer",
                                outline: "none",
                                maxWidth: "180px",
                            }}
                        >
                            <option value="" style={{ background: "var(--sidebar-background)", color: "var(--text-muted)" }}>
                                -- Focus Component --
                            </option>
                            {graphData?.nodes?.map((n) => (
                                <option
                                    key={n.id}
                                    value={n.id}
                                    style={{ background: "var(--sidebar-background)", color: "var(--text-primary)" }}
                                >
                                    {n.label} ({(n.type || "service").toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Directional Scope Focus Buttons */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "var(--card-background)",
                            borderRadius: "var(--border-radius)",
                            border: "1px solid var(--card-border)",
                            padding: "2px",
                            fontSize: "11px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setDirectionFilter("all")}
                            style={{
                                padding: "4px 8px",
                                border: "none",
                                borderRadius: "4px",
                                background: directionFilter === "all" ? "var(--active-background)" : "transparent",
                                color: directionFilter === "all" ? "var(--primary)" : "var(--text-secondary)",
                                fontWeight: directionFilter === "all" ? 600 : 400,
                                cursor: "pointer",
                                transition: "all 0.12s ease",
                            }}
                        >
                            All Relations
                        </button>

                        <button
                            type="button"
                            onClick={() => setDirectionFilter("1-hop")}
                            disabled={!activeNode}
                            title={!activeNode ? "Select a node first to focus on 1-hop neighborhood" : "Show 1-hop upstream and downstream nodes"}
                            style={{
                                padding: "4px 8px",
                                border: "none",
                                borderRadius: "4px",
                                background: directionFilter === "1-hop" ? "var(--active-background)" : "transparent",
                                color: directionFilter === "1-hop" ? "var(--primary)" : "var(--text-secondary)",
                                fontWeight: directionFilter === "1-hop" ? 600 : 400,
                                cursor: activeNode ? "pointer" : "not-allowed",
                                opacity: activeNode ? 1 : 0.5,
                                transition: "all 0.12s ease",
                            }}
                        >
                            1-Hop Tree
                        </button>

                        <button
                            type="button"
                            onClick={() => setDirectionFilter("outbound")}
                            disabled={!activeNode}
                            title={!activeNode ? "Select a node first to isolate outbound calls" : "Isolate components called by this node (Callees)"}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                border: "none",
                                borderRadius: "4px",
                                background: directionFilter === "outbound" ? "rgba(168, 179, 154, 0.2)" : "transparent",
                                color: directionFilter === "outbound" ? "var(--primary)" : "var(--text-secondary)",
                                fontWeight: directionFilter === "outbound" ? 600 : 400,
                                cursor: activeNode ? "pointer" : "not-allowed",
                                opacity: activeNode ? 1 : 0.5,
                                transition: "all 0.12s ease",
                            }}
                        >
                            <ArrowRight size={11} /> Outbound (Calls)
                        </button>

                        <button
                            type="button"
                            onClick={() => setDirectionFilter("inbound")}
                            disabled={!activeNode}
                            title={!activeNode ? "Select a node first to isolate inbound callers" : "Isolate components that call this node (Callers)"}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                border: "none",
                                borderRadius: "4px",
                                background: directionFilter === "inbound" ? "rgba(156, 146, 123, 0.2)" : "transparent",
                                color: directionFilter === "inbound" ? "var(--secondary)" : "var(--text-secondary)",
                                fontWeight: directionFilter === "inbound" ? 600 : 400,
                                cursor: activeNode ? "pointer" : "not-allowed",
                                opacity: activeNode ? 1 : 0.5,
                                transition: "all 0.12s ease",
                            }}
                        >
                            <ArrowLeft size={11} /> Inbound (Called by)
                        </button>
                    </div>

                    {/* Protocol Filter Dropdown */}
                    {availableProtocols.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "var(--card-background)",
                                padding: "4px 10px",
                                borderRadius: "var(--border-radius)",
                                border: "1px solid var(--card-border)",
                                fontSize: "12px",
                            }}
                        >
                            <Filter size={12} color="var(--text-muted)" />
                            <select
                                value={protocolFilter}
                                onChange={(e) => setProtocolFilter(e.target.value)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    outline: "none",
                                }}
                            >
                                <option value="all" style={{ background: "var(--sidebar-background)" }}>
                                    All Protocols ({graphData?.edges?.length || 0})
                                </option>
                                {availableProtocols.map((proto) => (
                                    <option
                                        key={proto}
                                        value={proto}
                                        style={{ background: "var(--sidebar-background)" }}
                                    >
                                        {proto} ({graphData?.edges?.filter((e) => e.label === proto).length || 0})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Right Controls: View Switcher (Graph vs Matrix vs Split) */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        background: "var(--card-background)",
                        borderRadius: "var(--border-radius)",
                        border: "1px solid var(--card-border)",
                        padding: "2px",
                        fontSize: "12px",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setViewMode("graph")}
                        title="Interactive React Flow Graph View"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            border: "none",
                            borderRadius: "4px",
                            background: viewMode === "graph" ? "var(--active-background)" : "transparent",
                            color: viewMode === "graph" ? "var(--primary)" : "var(--text-secondary)",
                            fontWeight: viewMode === "graph" ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.12s ease",
                        }}
                    >
                        <Network size={13} />
                        <span>Graph</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewMode("matrix")}
                        title="Structured Dependency Table View"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            border: "none",
                            borderRadius: "4px",
                            background: viewMode === "matrix" ? "var(--active-background)" : "transparent",
                            color: viewMode === "matrix" ? "var(--primary)" : "var(--text-secondary)",
                            fontWeight: viewMode === "matrix" ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.12s ease",
                        }}
                    >
                        <Table size={13} />
                        <span>Matrix</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setViewMode("split")}
                        title="Split Graph & Dependency Matrix"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            border: "none",
                            borderRadius: "4px",
                            background: viewMode === "split" ? "var(--active-background)" : "transparent",
                            color: viewMode === "split" ? "var(--primary)" : "var(--text-secondary)",
                            fontWeight: viewMode === "split" ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.12s ease",
                        }}
                    >
                        <Columns size={13} />
                        <span>Split</span>
                    </button>
                </div>
            </div>

            {/* Main Interactive Workspace Area */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    gap: "14px",
                }}
            >
                {/* 1. Interactive Graph View */}
                {(viewMode === "graph" || viewMode === "split") && (
                    <div
                        style={{
                            flex: viewMode === "split" ? "1 1 60%" : "1 1 100%",
                            height: "100%",
                            position: "relative",
                            minWidth: 0,
                        }}
                    >
                        <ArchitectureGraph
                            graphData={focusedGraphData}
                            selectedNode={activeNode}
                            onSelectNode={(node) => selectNode(node, currentRepo?.id)}
                            onClearSelection={clearSelection}
                            isLoading={isLoading}
                            error={error}
                            onRetry={handleRefresh}
                            emptyTitle="No Dependencies Match Current Scope"
                            emptyDescription="Try clearing filters or selecting another component to view its connection graph."
                        />
                    </div>
                )}

                {/* 2. Structured Dependency Matrix / List View */}
                {(viewMode === "matrix" || viewMode === "split") && (
                    <div
                        style={{
                            flex: viewMode === "split" ? "1 1 40%" : "1 1 100%",
                            height: "100%",
                            background: "var(--card-background)",
                            border: "1px solid var(--card-border)",
                            borderRadius: "var(--border-radius)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            fontSize: "12px",
                        }}
                    >
                        {/* Matrix Header */}
                        <div
                            style={{
                                padding: "10px 14px",
                                borderBottom: "1px solid var(--card-border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "var(--sidebar-background)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                <Table size={14} color="var(--primary)" />
                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                    Dependency Matrix
                                </span>
                                <Badge variant="default" style={{ fontSize: "10px", padding: "1px 6px" }}>
                                    {focusedGraphData.edges.length} relations
                                </Badge>
                            </div>

                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                Source Component → Dependency Target
                            </span>
                        </div>

                        {/* Top Hubs Quick Inspection Strip (If viewing matrix or no node selected) */}
                        {!activeNode && dependencyStats.topProducers.length > 0 && (
                            <div
                                style={{
                                    padding: "8px 14px",
                                    borderBottom: "1px solid var(--card-border)",
                                    background: "rgba(23, 25, 22, 0.4)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                }}
                            >
                                <span style={{ fontSize: "10.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: "var(--text-muted)" }}>
                                    Top Dependency Hubs (Quick Select)
                                </span>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                    {dependencyStats.topProducers.map(({ node, count }) => {
                                        const config = CATEGORY_CONFIG[node.type] || CATEGORY_CONFIG.service;
                                        return (
                                            <button
                                                key={node.id}
                                                type="button"
                                                onClick={() => selectNode(node, currentRepo?.id)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "5px",
                                                    padding: "2px 7px",
                                                    borderRadius: "4px",
                                                    border: "1px solid var(--card-border)",
                                                    background: "var(--card-background)",
                                                    color: "var(--text-secondary)",
                                                    fontSize: "11px",
                                                    cursor: "pointer",
                                                    transition: "border-color 0.12s ease",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = config.color)}
                                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
                                            >
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.color }} />
                                                <span>{node.label}</span>
                                                <span style={{ color: "var(--primary)", fontWeight: 600 }}>({count} calls)</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Matrix Table List */}
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            {focusedGraphData.edges.length === 0 ? (
                                <div style={{ padding: "40px 20px" }}>
                                    <EmptyState
                                        icon={Share2}
                                        title="No Relationship Rows"
                                        description="No dependencies match the current direction, protocol, or component filters."
                                    />
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                    <thead>
                                        <tr
                                            style={{
                                                borderBottom: "1px solid var(--card-border)",
                                                color: "var(--text-muted)",
                                                fontSize: "11px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.4px",
                                                background: "rgba(23, 25, 22, 0.7)",
                                            }}
                                        >
                                            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Source Component</th>
                                            <th style={{ padding: "8px 10px", fontWeight: 600, width: "120px" }}>Direction & Protocol</th>
                                            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Target Dependency</th>
                                            <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right", width: "80px" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {focusedGraphData.edges.map((edge) => {
                                            const sourceNode = graphData.nodes.find((n) => n.id === edge.source);
                                            const targetNode = graphData.nodes.find((n) => n.id === edge.target);

                                            const sourceConfig = CATEGORY_CONFIG[sourceNode?.type] || CATEGORY_CONFIG.service;
                                            const targetConfig = CATEGORY_CONFIG[targetNode?.type] || CATEGORY_CONFIG.service;

                                            const isSourceActive = activeNode?.id === edge.source;
                                            const isTargetActive = activeNode?.id === edge.target;

                                            return (
                                                <tr
                                                    key={edge.id}
                                                    style={{
                                                        borderBottom: "1px solid rgba(54, 58, 50, 0.4)",
                                                        background: isSourceActive || isTargetActive ? "rgba(43, 48, 40, 0.4)" : "transparent",
                                                        transition: "background 0.12s ease",
                                                    }}
                                                >
                                                    {/* Source Component */}
                                                    <td style={{ padding: "10px 12px" }}>
                                                        <div
                                                            onClick={() => sourceNode && selectNode(sourceNode, currentRepo?.id)}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: 7,
                                                                    height: 7,
                                                                    borderRadius: "2px",
                                                                    background: sourceConfig.color,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span style={{ fontWeight: 500, color: isSourceActive ? "var(--primary)" : "var(--text-primary)" }}>
                                                                {sourceNode?.label || edge.source}
                                                            </span>
                                                        </div>
                                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace", display: "block", marginTop: "2px" }}>
                                                            {sourceNode?.module || sourceNode?.type || ""}
                                                        </span>
                                                    </td>

                                                    {/* Direction & Protocol */}
                                                    <td style={{ padding: "10px 10px" }}>
                                                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                            <span
                                                                style={{
                                                                    padding: "2px 6px",
                                                                    background: "var(--sidebar-background)",
                                                                    border: "1px solid var(--card-border)",
                                                                    borderRadius: "3px",
                                                                    fontSize: "10.5px",
                                                                    color: "var(--text-secondary)",
                                                                    fontFamily: "monospace",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                }}
                                                            >
                                                                <ArrowRight size={11} color="var(--primary)" />
                                                                {edge.label || "calls"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Target Dependency */}
                                                    <td style={{ padding: "10px 12px" }}>
                                                        <div
                                                            onClick={() => targetNode && selectNode(targetNode, currentRepo?.id)}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: 7,
                                                                    height: 7,
                                                                    borderRadius: "2px",
                                                                    background: targetConfig.color,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span style={{ fontWeight: 500, color: isTargetActive ? "var(--secondary)" : "var(--text-primary)" }}>
                                                                {targetNode?.label || edge.target}
                                                            </span>
                                                        </div>
                                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace", display: "block", marginTop: "2px" }}>
                                                            {targetNode?.module || targetNode?.type || ""}
                                                        </span>
                                                    </td>

                                                    {/* Action button */}
                                                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (sourceNode) selectNode(sourceNode, currentRepo?.id);
                                                                if (viewMode === "matrix") setViewMode("graph");
                                                            }}
                                                            className="cs-btn cs-btn-ghost"
                                                            style={{
                                                                fontSize: "11px",
                                                                padding: "3px 7px",
                                                            }}
                                                            title="Focus source node on graph"
                                                        >
                                                            Focus
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dependencies;