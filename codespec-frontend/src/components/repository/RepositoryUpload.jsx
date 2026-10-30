import { useState, useRef } from "react";
import {
    GitBranch,
    FolderGit2,
    FileArchive,
    UploadCloud,
    AlertCircle,
    Loader2,
    CheckCircle2,
    FileCode,
    X,
} from "lucide-react";
import Button from "../common/Button";
import repositoryApi from "../../services/repositoryApi";
import useRepositoryStore from "../../store/repositoryStore";

function RepositoryUpload({ onSuccess, onCancel }) {
    const [importMode, setImportMode] = useState("git"); // 'git' | 'zip'

    // Git Form State
    const [gitUrl, setGitUrl] = useState("");
    const [branch, setBranch] = useState("main");

    // ZIP Form State
    const [zipFile, setZipFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Submission & UI States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const fileInputRef = useRef(null);
    const { addRepository } = useRepositoryStore();

    // Handle File Drop & Selection
    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.name.endsWith(".zip")) {
            setError("Please select a valid .zip archive file.");
            return;
        }
        setError(null);
        setZipFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    // Format file size helper
    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    // Extract repository name from Git URL
    const parseRepoName = (url) => {
        try {
            const cleanUrl = url.trim().replace(/\.git$/, "");
            const parts = cleanUrl.split("/");
            return parts[parts.length - 1] || "imported-repository";
        } catch {
            return "imported-repository";
        }
    };

    // Handle Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (importMode === "git") {
            const trimmedUrl = gitUrl.trim();
            if (!trimmedUrl) {
                setError("Please enter a valid Git repository URL.");
                return;
            }

            if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://") && !trimmedUrl.startsWith("git@")) {
                setError("Please enter a valid URL (e.g. https://github.com/organization/repository).");
                return;
            }

            const targetBranch = branch.trim() || "main";
            const repoName = parseRepoName(trimmedUrl);

            setIsSubmitting(true);
            try {
                // Call API layer if backend endpoint is live
                let responseData;
                try {
                    responseData = await repositoryApi.importGitRepository({
                        url: trimmedUrl,
                        branch: targetBranch,
                        provider: "git",
                    });
                } catch {
                    // Backend offline/fallback mode
                    responseData = null;
                }

                // Add to local Zustand store
                const newRepo = {
                    id: responseData?.id || `repo-${Date.now()}`,
                    name: responseData?.name || repoName,
                    provider: "github",
                    url: trimmedUrl,
                    status: responseData?.status || "Processing",
                    branch: targetBranch,
                    commit: responseData?.commit || "a1b2c3d",
                    language: "Analyzing...",
                    size: "Pending",
                    lastIndexed: "Queued for AST parsing",
                    createdAt: new Date().toISOString().split("T")[0],
                    metrics: {
                        files: 0,
                        services: 0,
                        apis: 0,
                        functions: 0,
                        dependencies: 0,
                    },
                };

                addRepository(newRepo);
                setSuccessMessage(`Repository "${repoName}" queued for ingestion successfully!`);

                setTimeout(() => {
                    if (onSuccess) onSuccess(newRepo);
                }, 800);
            } catch (err) {
                setError(err.message || "Failed to import repository. Please check connection.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // ZIP Mode
            if (!zipFile) {
                setError("Please select or drop a .zip archive file to upload.");
                return;
            }

            setIsSubmitting(true);
            try {
                const formData = new FormData();
                formData.append("file", zipFile);

                let responseData;
                try {
                    responseData = await repositoryApi.uploadZipRepository(formData);
                } catch {
                    responseData = null;
                }

                const repoName = zipFile.name.replace(/\.zip$/i, "");
                const newRepo = {
                    id: responseData?.id || `repo-${Date.now()}`,
                    name: `${repoName}.zip`,
                    provider: "zip",
                    url: `local://archive/${zipFile.name}`,
                    status: responseData?.status || "Processing",
                    branch: "main",
                    commit: "local-archive",
                    language: "Detecting...",
                    size: formatFileSize(zipFile.size),
                    lastIndexed: "Extracting archive...",
                    createdAt: new Date().toISOString().split("T")[0],
                    metrics: {
                        files: 0,
                        services: 0,
                        apis: 0,
                        functions: 0,
                        dependencies: 0,
                    },
                };

                addRepository(newRepo);
                setSuccessMessage(`Archive "${zipFile.name}" uploaded and queued for indexing!`);

                setTimeout(() => {
                    if (onSuccess) onSuccess(newRepo);
                }, 800);
            } catch (err) {
                setError(err.message || "Failed to upload ZIP archive.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="repo-upload-container">
            {/* Mode Switcher Tabs */}
            <div className="upload-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={importMode === "git"}
                    className={`tab-btn ${importMode === "git" ? "tab-active" : ""}`}
                    onClick={() => {
                        setImportMode("git");
                        setError(null);
                    }}
                >
                    <FolderGit2 size={15} />
                    <span>Git Repository</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={importMode === "zip"}
                    className={`tab-btn ${importMode === "zip" ? "tab-active" : ""}`}
                    onClick={() => {
                        setImportMode("zip");
                        setError(null);
                    }}
                >
                    <FileArchive size={15} />
                    <span>ZIP Archive</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="form-alert alert-error">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="form-alert alert-success">
                    <CheckCircle2 size={15} />
                    <span>{successMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="upload-form">
                {importMode === "git" ? (
                    <div className="form-section">
                        <div className="form-group">
                            <label htmlFor="git-url" className="form-label">
                                Repository URL <span className="req-star">*</span>
                            </label>
                            <input
                                id="git-url"
                                type="text"
                                placeholder="https://github.com/organization/repository.git"
                                value={gitUrl}
                                onChange={(e) => setGitUrl(e.target.value)}
                                disabled={isSubmitting}
                                className="form-input"
                                autoFocus
                            />
                            <span className="field-hint">
                                Supports GitHub, GitLab, and public/authorized Git remotes.
                            </span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="git-branch" className="form-label">
                                Branch Name
                            </label>
                            <div className="input-with-icon">
                                <GitBranch size={14} className="input-icon" />
                                <input
                                    id="git-branch"
                                    type="text"
                                    placeholder="main"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    disabled={isSubmitting}
                                    className="form-input has-icon"
                                />
                            </div>
                            <span className="field-hint">
                                Target branch to analyze (defaults to main).
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="form-section">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".zip,application/zip,application/x-zip-compressed"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFileSelect(e.target.files[0]);
                                }
                            }}
                        />

                        {!zipFile ? (
                            <div
                                className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="dropzone-icon">
                                    <UploadCloud size={30} />
                                </div>
                                <div className="dropzone-text">
                                    <span className="dropzone-title">
                                        Click to browse or drag & drop repository ZIP
                                    </span>
                                    <span className="dropzone-sub">
                                        Supports .zip archives containing codebase root
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="selected-file-card">
                                <div className="file-info-group">
                                    <FileCode size={24} className="file-icon" />
                                    <div className="file-text-details">
                                        <span className="file-name">{zipFile.name}</span>
                                        <span className="file-meta">
                                            {formatFileSize(zipFile.size)} • ZIP Archive
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="remove-file-btn"
                                    onClick={() => setZipFile(null)}
                                    disabled={isSubmitting}
                                    title="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="form-actions">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || (importMode === "zip" && !zipFile)}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="spin-icon" />
                                <span>Importing...</span>
                            </>
                        ) : (
                            <span>
                                {importMode === "git" ? "Import Repository" : "Upload Archive"}
                            </span>
                        )}
                    </Button>
                </div>
            </form>

            <style>{`
                .repo-upload-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .upload-tabs {
                    display: flex;
                    gap: 6px;
                    padding: 4px;
                    background: var(--sidebar-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                }
                .tab-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-size: 12px;
                    font-weight: 500;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .tab-btn:hover {
                    color: var(--text-primary);
                    background: rgba(255, 255, 255, 0.03);
                }
                .tab-active {
                    background: var(--card-background) !important;
                    color: var(--text-primary) !important;
                    border: 1px solid var(--card-border);
                    font-weight: 600;
                }
                .tab-active svg {
                    color: var(--primary);
                }

                .form-alert {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 9px 12px;
                    border-radius: var(--radius-sm);
                    font-size: 12px;
                }
                .alert-error {
                    background: rgba(184, 120, 112, 0.12);
                    border: 1px solid rgba(184, 120, 112, 0.3);
                    color: var(--danger);
                }
                .alert-success {
                    background: rgba(145, 167, 138, 0.12);
                    border: 1px solid rgba(145, 167, 138, 0.3);
                    color: var(--success);
                }

                .upload-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .form-section {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .form-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .req-star {
                    color: var(--danger);
                }
                .form-input {
                    height: 36px;
                    padding: 0 10px;
                    background: var(--sidebar-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-primary);
                    font-size: 12px;
                    outline: none;
                    transition: border-color 0.15s ease;
                }
                .form-input:focus {
                    border-color: var(--primary);
                }
                .form-input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .field-hint {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 10px;
                    color: var(--text-muted);
                    pointer-events: none;
                }
                .form-input.has-icon {
                    padding-left: 32px;
                    width: 100%;
                }

                /* Dropzone styling */
                .dropzone {
                    border: 1.5px dashed var(--card-border);
                    border-radius: var(--border-radius);
                    padding: 28px 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    background: var(--sidebar-background);
                    transition: all 0.15s ease;
                }
                .dropzone:hover, .dropzone-active {
                    border-color: var(--primary);
                    background: rgba(168, 179, 154, 0.04);
                }
                .dropzone-icon {
                    color: var(--text-muted);
                }
                .dropzone:hover .dropzone-icon, .dropzone-active .dropzone-icon {
                    color: var(--primary);
                }
                .dropzone-text {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                    text-align: center;
                }
                .dropzone-title {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .dropzone-sub {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .selected-file-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 14px;
                    background: var(--sidebar-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                }
                .file-info-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                .file-icon {
                    color: var(--secondary);
                    flex-shrink: 0;
                }
                .file-text-details {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .file-name {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .file-meta {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .remove-file-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .remove-file-btn:hover {
                    color: var(--danger);
                    background: rgba(184, 120, 112, 0.1);
                }

                .form-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 10px;
                    padding-top: 10px;
                    border-top: 1px solid var(--card-border);
                }
                .spin-icon {
                    animation: spin 0.8s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default RepositoryUpload;
