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
    Cpu,
    Globe,
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

    const statCards = [
        { label: "Nodes", value: totalNodes, Icon: Layers, accent: "violet" },
        { label: "Services", value: serviceCount, Icon: Server, accent: "blue" },
        { label: "Storage & Cache", value: storageCount, Icon: Database, accent: "teal" },
        { label: "Dependency Edges", value: totalEdges, Icon: Share2, accent: "pink" },
    ];

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
                    paddingBottom: "14px",
                    flexShrink: 0,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="icon-accent icon-accent--violet">
                        <Network size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h1
                            style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                margin: 0,
                                letterSpacing: "-0.3px",
                            }}
                        >
                            System Architecture
                        </h1>
                        <p
                            style={{
                                fontSize: "12.5px",
                                color: "var(--text-secondary)",
                                margin: "3px 0 0 0",
                            }}
                        >
                            Interactive topology graph, component relationships, data flow, and runtime dependencies.
                        </p>
                    </div>
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
                            height: "34px",
                            padding: "0 14px",
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

            {/* Premium Quick Metrics Bar */}
            {graphData && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "12px",
                        flexShrink: 0,
                    }}
                >
                    {statCards.map(({ label, value, Icon, accent }) => (
                        <div
                            key={label}
                            className={`cs-card cs-card--${accent}`}
                            style={{
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <div className={`icon-accent icon-accent--${accent}`}>
                                <Icon size={16} strokeWidth={2} />
                            </div>
                            <div>
                                <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>
                                    {value}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>
                                    {label}
                                </div>
                            </div>
                        </div>
                    ))}
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