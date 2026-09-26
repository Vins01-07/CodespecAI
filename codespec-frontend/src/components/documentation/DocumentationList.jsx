import { FileText, ChevronRight, Tag, Clock, RotateCcw, SearchX } from "lucide-react";
import Badge from "../common/Badge";

function DocumentationList({
    documents = [],
    selectedDocId,
    onSelectDoc,
    onResetFilters,
}) {
    if (!documents || documents.length === 0) {
        return (
            <div className="doc-list-empty-full cs-card">
                <div className="doc-empty-icon-wrap">
                    <SearchX size={22} />
                </div>
                <h4 className="doc-empty-title">No Specifications Found</h4>
                <p className="doc-empty-desc">
                    No documentation items match your current search query or active filter settings.
                </p>
                {onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="doc-reset-filter-btn"
                    >
                        <RotateCcw size={12} />
                        <span>Clear Filters</span>
                    </button>
                )}

                <style>{`
                    .doc-list-empty-full {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 36px 20px;
                        text-align: center;
                        gap: 8px;
                        height: 100%;
                        min-height: 280px;
                        border-style: dashed;
                    }
                    .doc-empty-icon-wrap {
                        width: 42px;
                        height: 42px;
                        border-radius: 50%;
                        background: rgba(168, 179, 154, 0.08);
                        border: 1px solid var(--card-border);
                        color: var(--text-muted);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 4px;
                    }
                    .doc-empty-title {
                        margin: 0;
                        font-size: 13px;
                        font-weight: 600;
                        color: var(--text-primary);
                    }
                    .doc-empty-desc {
                        margin: 0;
                        font-size: 11.5px;
                        color: var(--text-secondary);
                        line-height: 1.45;
                        max-width: 260px;
                    }
                    .doc-reset-filter-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        margin-top: 8px;
                        padding: 5px 12px;
                        font-size: 11px;
                        font-weight: 500;
                        background: var(--card-background-hover);
                        border: 1px solid var(--card-border);
                        border-radius: var(--radius-sm);
                        color: var(--primary);
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }
                    .doc-reset-filter-btn:hover {
                        background: var(--active-background);
                        border-color: var(--primary);
                    }
                `}</style>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case "up-to-date":
                return <Badge variant="success">Up to date</Badge>;
            case "needs-review":
                return <Badge variant="warning">Needs review</Badge>;
            case "outdated":
                return <Badge variant="danger">Outdated</Badge>;
            default:
                return <Badge variant="neutral">{status || "Draft"}</Badge>;
        }
    };

    return (
        <div className="documentation-list">
            {documents.map((doc) => {
                const isSelected = selectedDocId === doc.id;

                return (
                    <div
                        key={doc.id}
                        className={`doc-item-card cs-card ${isSelected ? "selected" : ""}`}
                        onClick={() => onSelectDoc && onSelectDoc(doc)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelectDoc && onSelectDoc(doc);
                            }
                        }}
                    >
                        <div className="doc-item-header">
                            <div className="doc-item-title-row">
                                <div className="doc-icon-wrap">
                                    <FileText size={14} />
                                </div>
                                <div className="doc-title-container">
                                    <h3 className="doc-item-title">{doc.title}</h3>
                                    <div className="doc-item-sub">
                                        {doc.category && (
                                            <span className="doc-category-badge">{doc.category}</span>
                                        )}
                                        {doc.module && (
                                            <span className="doc-module-badge font-mono">{doc.module}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="doc-item-status-wrap">
                                {getStatusBadge(doc.status)}
                                <ChevronRight size={13} className="doc-item-arrow" />
                            </div>
                        </div>

                        {doc.summary && (
                            <p className="doc-item-summary">{doc.summary}</p>
                        )}

                        <div className="doc-item-footer">
                            <div className="doc-completeness-wrap">
                                <div className="doc-progress-bar">
                                    <div
                                        className="doc-progress-fill"
                                        style={{
                                            width: `${doc.completeness || 0}%`,
                                            backgroundColor:
                                                doc.completeness > 85
                                                    ? "var(--success)"
                                                    : doc.completeness > 60
                                                    ? "var(--warning)"
                                                    : "var(--danger)",
                                        }}
                                    />
                                </div>
                                <span className="doc-completeness-text font-mono">
                                    {doc.completeness || 0}%
                                </span>
                            </div>

                            <div className="doc-meta-info">
                                {doc.tags && doc.tags.length > 0 && (
                                    <div className="doc-tags-mini">
                                        <Tag size={10} />
                                        <span>{doc.tags.slice(0, 2).join(", ")}</span>
                                    </div>
                                )}
                                {doc.lastUpdated && (
                                    <span className="doc-updated-date">
                                        <Clock size={10} />
                                        {doc.lastUpdated}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            <style>{`
                .documentation-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .doc-item-card {
                    padding: 11px 13px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    outline: none;
                }
                .doc-item-card:hover {
                    background: var(--card-background-hover);
                    border-color: var(--card-border);
                }
                .doc-item-card.selected {
                    background: var(--active-background);
                    border-color: var(--active-border);
                }
                .doc-item-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 10px;
                }
                .doc-item-title-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    min-width: 0;
                    flex: 1;
                }
                .doc-icon-wrap {
                    width: 24px;
                    height: 24px;
                    border-radius: var(--radius-sm);
                    background: rgba(168, 179, 154, 0.12);
                    color: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .doc-title-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .doc-item-title {
                    margin: 0;
                    font-size: 12.5px;
                    font-weight: 600;
                    color: var(--text-primary);
                    line-height: 1.35;
                }
                .doc-item-sub {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .doc-category-badge {
                    font-size: 10px;
                    color: var(--text-secondary);
                    background: var(--card-background-hover);
                    padding: 1px 5px;
                    border-radius: 3px;
                }
                .doc-module-badge {
                    font-size: 10px;
                    color: var(--primary);
                    background: rgba(168, 179, 154, 0.08);
                    padding: 1px 5px;
                    border-radius: 3px;
                }
                .doc-item-status-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-shrink: 0;
                }
                .doc-item-arrow {
                    color: var(--text-muted);
                    transition: transform 0.15s ease;
                }
                .doc-item-card:hover .doc-item-arrow {
                    transform: translateX(2px);
                    color: var(--primary);
                }
                .doc-item-summary {
                    margin: 0;
                    font-size: 11.5px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .doc-item-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding-top: 6px;
                    border-top: 1px solid var(--card-border);
                    flex-wrap: wrap;
                }
                .doc-completeness-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .doc-progress-bar {
                    width: 50px;
                    height: 4px;
                    background: var(--app-background);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .doc-progress-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }
                .doc-completeness-text {
                    font-size: 10px;
                    color: var(--text-muted);
                }
                .doc-meta-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 10.5px;
                    color: var(--text-muted);
                }
                .doc-tags-mini,
                .doc-updated-date {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }
            `}</style>
        </div>
    );
}

export default DocumentationList;
