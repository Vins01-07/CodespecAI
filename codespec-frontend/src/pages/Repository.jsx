import { useState } from "react";
import {
    Plus,
    FolderGit2,
    CheckCircle2,
    Loader2,
    Layers,
    Filter,
} from "lucide-react";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import RepositoryList from "../components/repository/RepositoryList";
import RepositoryUpload from "../components/repository/RepositoryUpload";
import useRepositoryStore from "../store/repositoryStore";

function Repository() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { repositories, activeRepository } = useRepositoryStore();

    // Quick stats calculations
    const totalRepos = repositories.length;
    const readyRepos = repositories.filter(
        (r) => (r.status || "").toLowerCase() === "ready" || (r.status || "").toLowerCase() === "analyzed"
    ).length;
    const processingRepos = repositories.filter(
        (r) => (r.status || "").toLowerCase() === "processing" || (r.status || "").toLowerCase() === "indexing"
    ).length;

    return (
        <div className="repository-page-container">
            {/* Header Area matching screenshot "Repo List" */}
            <header className="repo-page-header">
                <div className="header-info">
                    <h1 className="page-header-title">Repo List</h1>
                    <p className="page-header-subtitle">
                        Codebase health, architectural topology & continuous insights
                    </p>
                </div>

                <div className="header-actions">
                    <button className="filter-pill-btn" type="button">
                        <Filter size={13} />
                        <span>Filter</span>
                    </button>

                    <Button
                        variant="primary"
                        icon={Plus}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        New Repository
                    </Button>
                </div>
            </header>

            {/* Quick Stats Summary Bar */}
            <section className="repo-stats-bar" aria-label="Repository Summary Stats">
                <div className="stat-pill-card cs-card">
                    <div className="icon-accent">
                        <Layers size={16} strokeWidth={2.2} />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Total Repositories</span>
                        <span className="stat-pill-val font-mono">{totalRepos}</span>
                    </div>
                </div>

                <div className="stat-pill-card cs-card">
                    <div className="icon-accent">
                        <FolderGit2 size={16} strokeWidth={2.2} />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Active Workspace</span>
                        <span className="stat-pill-val font-mono stat-pill-active-name" title={activeRepository?.name}>
                            {activeRepository?.name || "CodeSpec-Core-Engine"}
                        </span>
                    </div>
                </div>

                <div className="stat-pill-card cs-card">
                    <div className="icon-accent" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                        <CheckCircle2 size={16} strokeWidth={2.2} />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Healthy / Ready</span>
                        <span className="stat-pill-val font-mono">{readyRepos}</span>
                    </div>
                </div>

                <div className="stat-pill-card cs-card">
                    <div className="icon-accent" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                        <Loader2 size={16} strokeWidth={2.2} className="animate-spin" />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Processing / Queued</span>
                        <span className="stat-pill-val font-mono">{processingRepos}</span>
                    </div>
                </div>
            </section>

            {/* Main Repository Grid List Component */}
            <main className="repo-page-main">
                <RepositoryList onOpenAddModal={() => setIsAddModalOpen(true)} />
            </main>

            {/* Add / Import Repository Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Import Codebase Repository"
            >
                <RepositoryUpload
                    onSuccess={() => setIsAddModalOpen(false)}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>

            <style>{`
                .repository-page-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                .repo-page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .repo-stats-bar {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                }
                @media (max-width: 900px) {
                    .repo-stats-bar {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 500px) {
                    .repo-stats-bar {
                        grid-template-columns: 1fr;
                    }
                }
                .stat-pill-card {
                    padding: 12px 14px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .stat-pill-content {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .stat-pill-label {
                    font-size: 10.5px;
                    color: var(--secondary-text);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .stat-pill-val {
                    font-size: 14px;
                    font-weight: 700;
                    color: #F5F5F7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .stat-pill-active-name {
                    color: var(--bright-red);
                }
            `}</style>
        </div>
    );
}

export default Repository;
