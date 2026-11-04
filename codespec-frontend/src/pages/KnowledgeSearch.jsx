import { useState } from "react";
import { Search, FolderGit2, AlertCircle, RefreshCw, Terminal, BookOpen, Compass } from "lucide-react";
import useRepositoryStore from "../store/repositoryStore";
import searchApi from "../services/searchApi";
import SearchBar from "../components/search/SearchBar";
import SearchResults from "../components/search/SearchResults";
import ArchitecturalResultsPanel from "../components/search/ImpactGraph";
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
        <div className="search-page-container">
            {/* Header matching reference "Codebase Search" */}
            <div className="search-page-header">
                <div>
                    <h1 className="page-header-title">Codebase <span className="route-title-accent">Search</span></h1>
                    <p className="page-header-subtitle">
                        Codebase health, architectural topology & continuous insights
                    </p>
                </div>

                {currentRepo && (
                    <div className="active-repo-pill font-mono">
                        <FolderGit2 size={13} style={{ color: "var(--bright-red)" }} />
                        <span>{currentRepo.name}</span>
                        <Badge variant="primary">{currentRepo.branch || "main"}</Badge>
                    </div>
                )}
            </div>

            {/* Search Input Bar */}
            <SearchBar
                query={query}
                onSearch={handleSearch}
                isLoading={isLoading}
                placeholder="Search anything in your codebase (e.g. authenticateUser, UserService, JWT)..."
            />

            {/* Loading Indicator */}
            {isLoading && (
                <div className="search-loading-card cs-card">
                    <Loading text={`Searching AST & symbols for "${query}"...`} size={24} />
                </div>
            )}

            {/* Error Message */}
            {!isLoading && error && (
                <div className="search-error-card cs-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <AlertCircle size={18} style={{ color: "var(--bright-red)" }} />
                        <span>{error}</span>
                    </div>
                    <Button variant="default" size="sm" onClick={handleRetry} icon={RefreshCw}>
                        Retry Search
                    </Button>
                </div>
            )}

            {/* Search Results & Architectural Results Diagram */}
            {!isLoading && !error && hasSearched && (
                <div className="search-results-wrapper">
                    {results.length > 0 ? (
                        <>
                            <SearchResults
                                results={results}
                                query={query}
                                activeFilter={activeFilter}
                                onFilterChange={setActiveFilter}
                            />
                            {/* Architectural Results Flow Panel matching screenshot */}
                            <ArchitecturalResultsPanel query={query} />
                        </>
                    ) : (
                        <div className="search-empty-card cs-card">
                            <EmptyState
                                icon={Search}
                                title="No symbols or context found"
                                description={`No indexed AST symbols, functions, or files matched "${query}".`}
                                action={
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                            setQuery("");
                                            setHasSearched(false);
                                        }}
                                    >
                                        Clear Search
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Quick Explore / Starter Queries */}
            {!hasSearched && !isLoading && (
                <div className="search-starters-grid">
                    <Card className="starter-card">
                        <div className="starter-header">
                            <div className="icon-accent">
                                <Terminal size={15} />
                            </div>
                            <span className="starter-title">Common Symbols</span>
                        </div>
                        <p className="starter-desc">
                            Quickly search core functions, decorators, and authentication handlers.
                        </p>
                        <div className="starter-pills">
                            {["authenticateUser", "create_jwt", "validate_token"].map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    onClick={() => handleSearch(term)}
                                    className="starter-pill font-mono"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card className="starter-card">
                        <div className="starter-header">
                            <div className="icon-accent">
                                <BookOpen size={15} />
                            </div>
                            <span className="starter-title">Architectural Domains</span>
                        </div>
                        <p className="starter-desc">
                            Explore specific domain services, authentication managers, and payment pipelines.
                        </p>
                        <div className="starter-pills">
                            {["UserService", "ProcessPayment", "GraphParser"].map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    onClick={() => handleSearch(term)}
                                    className="starter-pill font-mono"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card className="starter-card">
                        <div className="starter-header">
                            <div className="icon-accent">
                                <Compass size={15} />
                            </div>
                            <span className="starter-title">Natural Queries</span>
                        </div>
                        <p className="starter-desc">
                            Search using natural language expressions or concept keywords like AST metrics.
                        </p>
                        <div className="starter-pills">
                            {["calculateComplexityScore", "token_manager"].map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    onClick={() => handleSearch(term)}
                                    className="starter-pill font-mono"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            <style>{`
                .search-page-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                .search-page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .active-repo-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 9999px;
                    padding: 4px 12px;
                    font-size: 11.5px;
                    color: #F5F5F7;
                }
                .search-loading-card {
                    padding: 30px;
                }
                .search-error-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 18px;
                }
                .search-empty-card {
                    padding: 36px;
                }
                .search-starters-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 14px;
                    margin-top: 10px;
                }
                @media (max-width: 900px) {
                    .search-starters-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .starter-card {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .starter-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .starter-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #F5F5F7;
                }
                .starter-desc {
                    font-size: 11.5px;
                    color: var(--secondary-text);
                    margin: 0;
                    line-height: 1.4;
                }
                .starter-pills {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .starter-pill {
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                    padding: 3px 8px;
                    color: var(--bright-red);
                    font-size: 10.5px;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }
                .starter-pill:hover {
                    border-color: rgba(227, 38, 54, 0.4);
                    background: rgba(227, 38, 54, 0.12);
                }
            `}</style>
        </div>
    );
}

export default KnowledgeSearch;
