import { useState, useMemo } from "react";
import {
    Search,
    FolderGit2,
    Plus,
    Filter,
    Layers,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Clock,
} from "lucide-react";
import RepositoryCard from "./RepositoryCard";
import Loading from "../common/Loading";
import EmptyState from "../common/EmptyState";
import Button from "../common/Button";
import useRepositoryStore from "../../store/repositoryStore";

function RepositoryList({ onOpenAddModal }) {
    const { repositories, activeRepository, setActiveRepository, isLoading } =
        useRepositoryStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'ready' | 'processing' | 'failed' | 'pending'

    // Status filter options
    const filterTabs = [
        { id: "all", label: "All Repositories", count: repositories.length },
        {
            id: "ready",
            label: "Ready",
            count: repositories.filter(
                (r) => (r.status || "").toLowerCase() === "ready" || (r.status || "").toLowerCase() === "analyzed"
            ).length,
            icon: CheckCircle2,
            iconColor: "var(--success)",
        },
        {
            id: "processing",
            label: "Processing",
            count: repositories.filter(
                (r) => (r.status || "").toLowerCase() === "processing" || (r.status || "").toLowerCase() === "indexing"
            ).length,
            icon: Loader2,
            iconColor: "var(--warning)",
        },
        {
            id: "failed",
            label: "Failed",
            count: repositories.filter(
                (r) => (r.status || "").toLowerCase() === "failed" || (r.status || "").toLowerCase() === "error"
            ).length,
            icon: AlertTriangle,
            iconColor: "var(--danger)",
        },
        {
            id: "pending",
            label: "Pending",
            count: repositories.filter(
                (r) => (r.status || "").toLowerCase() === "pending"
            ).length,
            icon: Clock,
            iconColor: "var(--text-muted)",
        },
    ];

    // Filtered repositories based on search and status
    const filteredRepositories = useMemo(() => {
        return repositories.filter((repo) => {
            const matchesSearch =
                !searchQuery.trim() ||
                repo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                repo.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                repo.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                repo.url?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            const normalizedStatus = (repo.status || "").toLowerCase();
            if (statusFilter === "all") return true;
            if (statusFilter === "ready") return normalizedStatus === "ready" || normalizedStatus === "analyzed";
            if (statusFilter === "processing") return normalizedStatus === "processing" || normalizedStatus === "indexing";
            if (statusFilter === "failed") return normalizedStatus === "failed" || normalizedStatus === "error";
            if (statusFilter === "pending") return normalizedStatus === "pending";

            return true;
        });
    }, [repositories, searchQuery, statusFilter]);

    if (isLoading) {
        return (
            <div className="repo-loading-card cs-card">
                <Loading text="Loading repository catalog..." size={22} />
            </div>
        );
    }

    return (
        <div className="repo-list-container">
            {/* Search and Filter Controls Toolbar */}
            <div className="repo-toolbar">
                <div className="search-filter-group">
                    <div className="repo-search-box">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, branch, stack, or URL..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search repositories"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="clear-search-btn"
                                onClick={() => setSearchQuery("")}
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className="filter-pill-group" role="tablist">
                        {filterTabs.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={statusFilter === tab.id}
                                    className={`filter-pill ${statusFilter === tab.id ? "filter-pill-active" : ""}`}
                                    onClick={() => setStatusFilter(tab.id)}
                                >
                                    {TabIcon && (
                                        <TabIcon
                                            size={12}
                                            style={{ color: tab.iconColor }}
                                        />
                                    )}
                                    <span>{tab.label}</span>
                                    <span className="filter-count">{tab.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Repositories Grid or Empty State */}
            {filteredRepositories.length > 0 ? (
                <div className="repo-grid">
                    {filteredRepositories.map((repo) => (
                        <RepositoryCard
                            key={repo.id}
                            repository={repo}
                            isActive={activeRepository?.id === repo.id}
                            onSelectActive={setActiveRepository}
                        />
                    ))}
                </div>
            ) : (
                <div className="repo-empty-wrapper cs-card">
                    <EmptyState
                        icon={FolderGit2}
                        title={
                            searchQuery || statusFilter !== "all"
                                ? "No matching repositories found"
                                : "No repositories yet"
                        }
                        description={
                            searchQuery || statusFilter !== "all"
                                ? "Try adjusting your search terms or filter selection to view repositories."
                                : "Add a Git repository URL or upload a ZIP archive to begin analyzing your codebase with CodeSpec AI."
                        }
                        action={
                            searchQuery || statusFilter !== "all" ? (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={Plus}
                                    onClick={onOpenAddModal}
                                >
                                    Add Repository
                                </Button>
                            )
                        }
                    />
                </div>
            )}

            <style>{`
                .repo-list-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    width: 100%;
                }
                .repo-toolbar {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .search-filter-group {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .repo-search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    height: 36px;
                    width: min(380px, 100%);
                    padding: 0 10px;
                    background: var(--card-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                }
                .search-icon {
                    color: var(--text-muted);
                    flex-shrink: 0;
                }
                .repo-search-box input {
                    flex: 1;
                    min-width: 0;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 12px;
                }
                .repo-search-box input::placeholder {
                    color: var(--text-muted);
                }
                .clear-search-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                    padding: 0 4px;
                }
                .clear-search-btn:hover {
                    color: var(--text-primary);
                }

                .filter-pill-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .filter-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    background: var(--card-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .filter-pill:hover {
                    color: var(--text-primary);
                    background: var(--card-background-hover);
                }
                .filter-pill-active {
                    background: var(--active-background);
                    border-color: var(--active-border);
                    color: var(--text-primary);
                    font-weight: 600;
                }
                .filter-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1px 5px;
                    border-radius: 10px;
                    background: rgba(0, 0, 0, 0.25);
                    font-size: 10px;
                    font-weight: 600;
                }

                .repo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                    gap: var(--card-gap);
                }

                .repo-empty-wrapper {
                    padding: 24px;
                }
                .repo-loading-card {
                    padding: 40px;
                }

                @media (max-width: 768px) {
                    .repo-grid {
                        grid-template-columns: 1fr;
                    }
                    .search-filter-group {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .repo-search-box {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

export default RepositoryList;
