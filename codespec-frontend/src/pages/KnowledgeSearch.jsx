import { useState } from "react";
import { Search, FolderGit2, AlertCircle, RefreshCw, Terminal, BookOpen, Compass } from "lucide-react";
import useRepositoryStore from "../store/repositoryStore";
import searchApi from "../services/searchApi";
import SearchBar from "../components/search/SearchBar";
import SearchResults from "../components/search/SearchResults";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";

function KnowledgeSearch() {
    const { activeRepository, repositories } = useRepositoryStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState("all");

    const readyRepositories = repositories.filter((r) => r.status === "Ready");
    const currentRepo = activeRepository?.status === "Ready" ? activeRepository : readyRepositories[0] || activeRepository;

    const handleSearch = async (searchQuery) => {
        const trimmed = searchQuery?.trim() || "";
        setQuery(trimmed);

        if (!trimmed) {
            setResults([]);
            setHasSearched(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setActiveFilter("all");

        try {
            const data = await searchApi.search(trimmed, currentRepo?.id);
            setResults(data?.results || []);
        } catch (err) {
            console.error("Search failed:", err);
            setError("Unable to search the codebase. Please check network connectivity and try again.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        if (query) {
            handleSearch(query);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                width: "100%",
                maxWidth: "1600px",
                margin: "0 auto",
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
                    paddingBottom: "14px",
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
                        <Search size={18} color="var(--primary)" />
                        Knowledge Search
                    </h1>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Query indexed AST symbols, functions, classes, and code context across your analyzed repositories.
                    </p>
                </div>

                {currentRepo && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "var(--card-background)",
                            padding: "6px 12px",
                            borderRadius: "var(--border-radius)",
                            border: "1px solid var(--card-border)",
                            fontSize: "12px",
                        }}
                    >
                        <FolderGit2 size={14} color="var(--secondary)" />
                        <span style={{ color: "var(--text-muted)" }}>Target Workspace:</span>
                        <strong style={{ color: "var(--text-primary)" }}>{currentRepo.name}</strong>
                        <Badge variant="success">{currentRepo.branch || "main"}</Badge>
                    </div>
                )}
            </div>

            {/* Search Input Area */}
            <SearchBar
                query={query}
                onSearch={handleSearch}
                isLoading={isLoading}
                placeholder="Search codebase (e.g. authenticateUser, UserService, database connection, cyclomatic)..."
                suggestions={[
                    "authenticateUser",
                    "UserService",
                    "connectDatabase",
                    "calculateComplexityScore",
                    "token_manager",
                    "ProcessPayment",
                ]}
            />

            {/* Content Display Area */}
            {isLoading && (
                <Card style={{ padding: "40px" }}>
                    <Loading text="Searching codebase knowledge index..." />
                </Card>
            )}

            {error && !isLoading && (
                <Card
                    style={{
                        padding: "18px 20px",
                        border: "1px solid var(--danger)",
                        background: "rgba(184, 120, 112, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "14px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <AlertCircle size={18} color="var(--danger)" />
                        <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>
                            {error}
                        </span>
                    </div>
                    <Button variant="default" size="sm" onClick={handleRetry} icon={RefreshCw}>
                        Retry
                    </Button>
                </Card>
            )}

            {!isLoading && !error && hasSearched && results.length > 0 && (
                <SearchResults
                    results={results}
                    query={query}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
            )}

            {!isLoading && !error && hasSearched && results.length === 0 && (
                <Card style={{ padding: "30px" }}>
                    <EmptyState
                        icon={Search}
                        title="No results found"
                        description={`No matching code symbols, functions, or files found for "${query}". Try searching for broader terms or alternative symbol names.`}
                        action={
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSearch("authenticateUser")}
                                >
                                    Try "authenticateUser"
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSearch("UserService")}
                                >
                                    Try "UserService"
                                </Button>
                            </div>
                        }
                    />
                </Card>
            )}

            {!isLoading && !error && !hasSearched && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                    <Card style={{ padding: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <Terminal size={16} color="var(--primary)" />
                            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                                Symbol & Function Search
                            </h3>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                            Quickly locate function declarations, class definitions, and method signatures across all parsed modules.
                        </p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {["authenticateUser", "connectDatabase"].map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    onClick={() => handleSearch(term)}
                                    style={{
                                        background: "var(--app-background)",
                                        border: "1px solid var(--card-border)",
                                        borderRadius: "4px",
                                        padding: "3px 8px",
                                        color: "var(--secondary)",
                                        fontSize: "11px",
                                        fontFamily: "monospace",
                                        cursor: "pointer",
                                    }}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card style={{ padding: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <BookOpen size={16} color="var(--secondary)" />
                            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                                Architectural Domains
                            </h3>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                            Explore specific domain services, authentication managers, and payment pipelines.
                        </p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {["UserService", "ProcessPayment"].map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    onClick={() => handleSearch(term)}
                                    style={{
                                        background: "var(--app-background)",
                                        border: "1px solid var(--card-border)",
                                        borderRadius: "4px",
                                        padding: "3px 8px",
                                        color: "var(--secondary)",
                                        fontSize: "11px",
                                        fontFamily: "monospace",
                                        cursor: "pointer",
                                    }}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card style={{ padding: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <Compass size={16} color="var(--success)" />
                            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                                Natural Queries
                            </h3>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                            Search using natural language expressions or concept keywords like cyclomatic metrics.
                        </p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {["calculateComplexityScore", "token_manager"].map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    onClick={() => handleSearch(term)}
                                    style={{
                                        background: "var(--app-background)",
                                        border: "1px solid var(--card-border)",
                                        borderRadius: "4px",
                                        padding: "3px 8px",
                                        color: "var(--secondary)",
                                        fontSize: "11px",
                                        fontFamily: "monospace",
                                        cursor: "pointer",
                                    }}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default KnowledgeSearch;