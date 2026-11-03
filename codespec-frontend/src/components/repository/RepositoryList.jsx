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
    const [statusFilter, setStatusFilter] = useState("all");

    // Status filter options
    const filterTabs = [
        { id: "all", label: "All Repositories", count: repositories.length },
        {
            id: "ready",
            label: "Healthy",
            count: repositories.filter(
                (r) => (r.status || "").toLowerCase() === "ready" || (r.status || "").toLowerCase() === "analyzed"
            ).length,
            icon: CheckCircle2,
            iconColor: "#10B981",
        },
        {
            id: "processing",
            label: "Indexing",
            count: repositories.filter(
                (r) => (r.status || "").toLowerCase() === "processing" || (r.status || "").toLowerCase() === "indexing"
            ).length,
            icon: Loader2,
            iconColor: "#F59E0B",
        },
        {
            id: "failed",
            label: "Failed",
            count: repositories.filter(
                (r) => (r.status || "").toLowerCase() === "failed" || (r.status || "").toLowerCase() === "error"
            ).length,
            icon: AlertTriangle,
            iconColor: "#FF3548",
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
                            placeholder="Filter repositories..."
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
                            const isActive = statusFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`filter-pill ${isActive ? "filter-pill-active" : ""}`}
                                    onClick={() => setStatusFilter(tab.id)}
                                >
                                    {TabIcon && (
                                        <TabIcon
                                            size={12}
                                            style={{ color: isActive ? "#FFFFFF" : tab.iconColor }}
                                        />
                                    )}
                                    <span>{tab.label}</span>
                                    <span className="filter-count font-mono">{tab.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Repositories 3-Column Grid or Empty State */}
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
                    width: min(340px, 100%);
                    padding: 0 12px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 9999px;
                    transition: all var(--duration-fast) ease;
                }
                .repo-search-box:focus-within {
                    border-color: rgba(227, 38, 54, 0.5);
                    box-shadow: 0 0 12px rgba(227, 38, 54, 0.2);
                }
                .search-icon {
                    color: var(--secondary-text);
                    flex-shrink: 0;
                }
                .repo-search-box input {
                    flex: 1;
                    min-width: 0;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: #F5F5F7;
                    font-size: 12px;
                }
                .clear-search-btn {
                    color: var(--secondary-text);
                    font-size: 14px;
                    cursor: pointer;
                }
                .filter-pill-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .filter-pill {
                    height: 30px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 10px;
                    background: #15161B;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    color: var(--secondary-text);
                    font-size: 11.5px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }
                .filter-pill:hover {
                    color: #FFFFFF;
                    border-color: rgba(227, 38, 54, 0.3);
                }
                .filter-pill-active {
                    background: linear-gradient(135deg, #FF3548 0%, #E32636 100%) !important;
                    border-color: rgba(255, 255, 255, 0.18) !important;
                    color: #FFFFFF !important;
                    font-weight: 600;
                    box-shadow: 0 2px 10px rgba(227, 38, 54, 0.35);
                }
                .filter-count {
                    font-size: 10px;
                    padding: 1px 5px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                }
                .repo-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }
                @media (max-width: 1140px) {
                    .repo-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 720px) {
                    .repo-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .repo-empty-wrapper {
                    padding: 30px;
                }
                .repo-loading-card {
                    padding: 40px;
                }
            `}</style>
        </div>
    );
}

export default RepositoryList;
