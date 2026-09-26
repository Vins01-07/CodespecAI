import { useState, useEffect } from "react";
import {
    Activity,
    Zap,
    FolderGit2,
    GitBranch,
    Layers,
    Share2,
    RotateCcw,
    AlertCircle,
    Sliders,
    Sparkles,
    LayoutGrid,
} from "lucide-react";
import useRepositoryStore from "../store/repositoryStore";
import impactApi from "../services/impactApi";
import ImpactInput from "../components/impact/ImpactInput";
import ImpactResult from "../components/impact/ImpactResult";
import ImpactGraph from "../components/impact/ImpactGraph";
import Card from "../components/common/Card";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";

export function ChangeImpact() {
    const { activeRepository, repositories, setActiveRepository } = useRepositoryStore();
    const readyRepositories = repositories.filter((r) => r.status === "Ready");
    const currentRepo = activeRepository?.status === "Ready" ? activeRepository : readyRepositories[0] || activeRepository;

    const [target, setTarget] = useState("");
    const [changeType, setChangeType] = useState("modify");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [viewMode, setViewMode] = useState("split"); // "split" | "graph" | "details"

    const suggestedTargets = impactApi.getSuggestedTargets();

    const handleRepoChange = (e) => {
        const repoId = e.target.value;
        const found = repositories.find((r) => r.id === repoId);
        if (found) {
            setActiveRepository(found);
        }
    };

    const handleAnalyze = async () => {
        if (!target.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await impactApi.analyzeImpact({
                target: target.trim(),
                repoId: currentRepo?.id,
                changeType,
            });
            setResult(data);
        } catch (err) {
            console.error("Impact analysis failed:", err);
            setError(err.message || "Failed to compute change impact analysis. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-select first preset on mount if target is empty for instant exploration
    useEffect(() => {
        if (!target && suggestedTargets.length > 0) {
            setTarget(suggestedTargets[0].target);
        }
    }, []);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: "1600px",
                margin: "0 auto",
                gap: "16px",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid var(--card-border)",
                    paddingBottom: "12px",
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
                        <Zap size={20} color="var(--primary)" />
                        Change Impact Analysis
                    </h1>
                    <p
                        style={{
                            fontSize: "12.5px",
                            color: "var(--text-secondary)",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Predict blast radius, dependent services, breaking changes, and testing requirements before modifying code.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* Repository selector */}
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

                    {/* View Mode Switcher (only shown when result is available) */}
                    {result && (
                        <div
                            style={{
                                display: "flex",
                                background: "var(--sidebar-background)",
                                border: "1px solid var(--card-border)",
                                borderRadius: "var(--border-radius)",
                                padding: "2px",
                            }}
                        >
                            {[
                                { id: "split", label: "Split View" },
                                { id: "graph", label: "Graph" },
                                { id: "details", label: "Analysis" },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setViewMode(mode.id)}
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: "4px",
                                        fontSize: "11.5px",
                                        fontWeight: viewMode === mode.id ? 600 : 400,
                                        background: viewMode === mode.id ? "var(--active-background)" : "transparent",
                                        border: `1px solid ${viewMode === mode.id ? "var(--primary)" : "transparent"}`,
                                        color: viewMode === mode.id ? "var(--primary)" : "var(--text-muted)",
                                        cursor: "pointer",
                                        transition: "all 0.12s ease",
                                    }}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Target Input Section */}
            <ImpactInput
                target={target}
                setTarget={setTarget}
                changeType={changeType}
                setChangeType={setChangeType}
                onSubmit={handleAnalyze}
                isLoading={isLoading}
                suggestedTargets={suggestedTargets}
            />

            {/* Error Banner */}
            {error && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        background: "rgba(184, 120, 112, 0.1)",
                        border: "1px solid rgba(184, 120, 112, 0.3)",
                        borderRadius: "var(--border-radius)",
                        color: "var(--danger)",
                        fontSize: "12.5px",
                    }}
                >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button
                        type="button"
                        onClick={handleAnalyze}
                        className="cs-btn cs-btn-ghost"
                        style={{ fontSize: "11.5px", height: "26px" }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div
                    style={{
                        height: "400px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--card-background)",
                        borderRadius: "var(--border-radius)",
                        border: "1px solid var(--card-border)",
                    }}
                >
                    <Loading text="Computing dependency blast radius & risk scoring..." size={28} />
                </div>
            )}

            {/* Empty State when no analysis has run */}
            {!isLoading && !result && !error && (
                <div
                    style={{
                        padding: "60px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--card-background)",
                        borderRadius: "var(--border-radius)",
                        border: "1px solid var(--card-border)",
                    }}
                >
                    <EmptyState
                        icon={Activity}
                        title="No Change Impact Analysis Run"
                        description="Enter a file path or symbol above, or click one of the quick presets, then click 'Analyze Impact' to view dependent services, risk scoring, and blast radius topology."
                    />
                </div>
            )}

            {/* Results Display */}
            {!isLoading && result && (
                <div style={{ width: "100%" }}>
                    {viewMode === "split" && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
                                gap: "16px",
                                alignItems: "start",
                            }}
                        >
                            {/* Left: Interactive Graph */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                                    <Layers size={13} color="var(--primary)" />
                                    <span>Blast Radius Topology</span>
                                </div>
                                <div style={{ height: "520px", width: "100%" }}>
                                    <ImpactGraph graphData={result.graph} />
                                </div>
                            </div>

                            {/* Right: Detailed Impact Results */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                                    <Activity size={13} color="var(--primary)" />
                                    <span>Risk Assessment & Dependents</span>
                                </div>
                                <ImpactResult result={result} />
                            </div>
                        </div>
                    )}

                    {viewMode === "graph" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ height: "600px", width: "100%" }}>
                                <ImpactGraph graphData={result.graph} />
                            </div>
                        </div>
                    )}

                    {viewMode === "details" && (
                        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                            <ImpactResult result={result} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ChangeImpact;