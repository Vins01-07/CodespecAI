import { useEffect } from "react";
import {
    Network,
    FolderGit2,
    RefreshCw,
    Layers,
    Server,
    Database,
    Share2,
    GitBranch,
} from "lucide-react";
import useArchitectureStore from "../store/architectureStore";
import useRepositoryStore from "../store/repositoryStore";
import ArchitectureGraph from "../components/architecture/ArchitectureGraph";
import Badge from "../components/common/Badge";

function Architecture() {
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

    // Calculate quick high-level summary metrics
    const totalNodes = graphData?.nodes?.length || 0;
    const totalEdges = graphData?.edges?.length || 0;
    const serviceCount = graphData?.nodes?.filter((n) => n.type === "service").length || 0;
    const storageCount = graphData?.nodes?.filter((n) => n.type === "database" || n.type === "cache").length || 0;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
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
                    gap: "14px",
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
                        <Network size={20} color="var(--primary)" />
                        System Architecture
                    </h1>
                    <p
                        style={{
                            fontSize: "12.5px",
                            color: "var(--text-secondary)",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Interactive topology graph, component relationships, data flow, and runtime dependencies.
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
                        title="Reload graph data"
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

            {/* Quick Metrics Bar */}
            {graphData && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        flexWrap: "wrap",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        padding: "0 2px",
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Layers size={13} color="var(--primary)" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{totalNodes}</span>
                        <span>Nodes</span>
                    </div>

                    <span style={{ color: "var(--card-border)" }}>•</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Server size={13} color="#91A78A" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{serviceCount}</span>
                        <span>Services</span>
                    </div>

                    <span style={{ color: "var(--card-border)" }}>•</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Database size={13} color="#A49A82" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{storageCount}</span>
                        <span>Storage & Caches</span>
                    </div>

                    <span style={{ color: "var(--card-border)" }}>•</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Share2 size={13} color="var(--secondary)" />
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{totalEdges}</span>
                        <span>Dependency Edges</span>
                    </div>
                </div>
            )}

            {/* Interactive Graph Canvas Area */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    position: "relative",
                    width: "100%",
                }}
            >
                <ArchitectureGraph
                    graphData={graphData}
                    selectedNode={selectedNodeDetails || selectedNode}
                    onSelectNode={(node) => selectNode(node, currentRepo?.id)}
                    onClearSelection={clearSelection}
                    isLoading={isLoading}
                    error={error}
                    onRetry={handleRefresh}
                />
            </div>
        </div>
    );
}

export default Architecture;