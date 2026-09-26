import { useState } from "react";
import {
    Plus,
    FolderGit2,
    CheckCircle2,
    Loader2,
    HardDrive,
    Layers,
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
            {/* Header Area */}
            <header className="repo-page-header">
                <div className="header-info">
                    <div className="title-row">
                        <div className="header-icon-wrap">
                            <FolderGit2 size={20} />
                        </div>
                        <h1 className="header-title">Repository Management</h1>
                    </div>
                    <p className="header-desc">
                        Manage codebases analyzed by CodeSpec AI for architectural intelligence, AST indexing, and dependency tracking.
                    </p>
                </div>

                <div className="header-actions">
                    <Button
                        variant="primary"
                        icon={Plus}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Add Repository
                    </Button>
                </div>
            </header>

            {/* Stats Summary Bar */}
            <section className="repo-stats-bar" aria-label="Repository Summary Stats">
                <div className="stat-pill-card cs-card">
                    <div className="stat-pill-icon">
                        <Layers size={16} />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Total Repositories</span>
                        <span className="stat-pill-val">{totalRepos}</span>
                    </div>
                </div>

                <div className="stat-pill-card cs-card">
                    <div className="stat-pill-icon active-icon">
                        <FolderGit2 size={16} />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Active Workspace</span>
                        <span className="stat-pill-val stat-pill-active-name" title={activeRepository?.name}>
                            {activeRepository?.name || "None Selected"}
                        </span>
                    </div>
                </div>

                <div className="stat-pill-card cs-card">
                    <div className="stat-pill-icon ready-icon">
                        <CheckCircle2 size={16} />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Ready / Analyzed</span>
                        <span className="stat-pill-val">{readyRepos}</span>
                    </div>
                </div>

                <div className="stat-pill-card cs-card">
                    <div className="stat-pill-icon processing-icon">
                        <Loader2 size={16} />
                    </div>
                    <div className="stat-pill-content">
                        <span className="stat-pill-label">Processing / Queued</span>
                        <span className="stat-pill-val">{processingRepos}</span>
                    </div>
                </div>
            </section>

            {/* Main Repository List Component */}
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
                    gap: var(--card-gap);
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                .repo-page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 14px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--card-border);
                }
                .header-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .title-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .header-icon-wrap {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--active-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                    color: var(--primary);
                }
                .header-title {
                    font-size: 17px;
                    font-weight: 600;
                    color: var(--text-primary);
                    letter-spacing: -0.2px;
                    margin: 0;
                }
                .header-desc {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin: 0;
                    line-height: 1.4;
                }

                .repo-stats-bar {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--card-gap);
                }
                .stat-pill-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px;
                }
                .stat-pill-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--sidebar-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    flex-shrink: 0;
                }
                .stat-pill-icon.active-icon {
                    color: var(--primary);
                }
                .stat-pill-icon.ready-icon {
                    color: var(--success);
                }
                .stat-pill-icon.processing-icon {
                    color: var(--warning);
                }

                .stat-pill-content {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .stat-pill-label {
                    font-size: 11px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .stat-pill-val {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .stat-pill-active-name {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 13px;
                    color: var(--primary);
                }

                .repo-page-main {
                    display: flex;
                    flex-direction: column;
                    gap: var(--card-gap);
                }

                @media (max-width: 600px) {
                    .repo-page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .header-actions {
                        width: 100%;
                    }
                    .header-actions button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

export default Repository;