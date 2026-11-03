import { useState } from "react";
import { ChevronRight, ChevronDown, SearchX, RotateCcw } from "lucide-react";

function DocumentationList({
    documents = [],
    selectedDocId,
    onSelectDoc,
    onResetFilters,
}) {
    // Keep track of collapsed categories
    const [collapsedCategories, setCollapsedCategories] = useState({});

    const toggleCategory = (cat) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [cat]: !prev[cat],
        }));
    };

    if (!documents || documents.length === 0) {
        return (
            <div className="doc-list-empty-full">
                <div className="doc-empty-icon-wrap">
                    <SearchX size={20} />
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
                        padding: 32px 16px;
                        text-align: center;
                        gap: 8px;
                        background: rgba(16, 17, 21, 0.4);
                        border: 1px dashed rgba(255, 255, 255, 0.08);
                        border-radius: 12px;
                        min-height: 220px;
                    }
                    .doc-empty-icon-wrap {
                        width: 38px;
                        height: 38px;
                        border-radius: 10px;
                        background: rgba(22, 140, 163, 0.12);
                        border: 1px solid rgba(22, 140, 163, 0.3);
                        color: #00F2FE;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 4px;
                    }
                    .doc-empty-title {
                        margin: 0;
                        font-size: 13px;
                        font-weight: 700;
                        color: #F5F5F7;
                    }
                    .doc-empty-desc {
                        margin: 0;
                        font-size: 11.5px;
                        color: #8E8E98;
                        line-height: 1.4;
                        max-width: 240px;
                    }
                    .doc-reset-filter-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        margin-top: 8px;
                        padding: 5px 12px;
                        font-size: 11px;
                        font-weight: 600;
                        background: #1B1B22;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 6px;
                        color: #F5F5F7;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }
                    .doc-reset-filter-btn:hover {
                        background: rgba(22, 140, 163, 0.2);
                        border-color: rgba(22, 140, 163, 0.4);
                        color: #00F2FE;
                    }
                `}</style>
            </div>
        );
    }

    // Group documents by category
    const grouped = documents.reduce((acc, doc) => {
        const cat = doc.category || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(doc);
        return acc;
    }, {});

    const getStatusIndicator = (status) => {
        switch (status) {
            case "up-to-date":
                return <span className="status-dot dot-green" title="Up to date" />;
            case "needs-review":
                return <span className="status-dot dot-amber" title="Needs review" />;
            case "outdated":
                return <span className="status-dot dot-red" title="Outdated" />;
            default:
                return <span className="status-dot dot-gray" title="Draft" />;
        }
    };

    return (
        <div className="documentation-tree-nav">
            {Object.entries(grouped).map(([category, docs]) => {
                const isCollapsed = !!collapsedCategories[category];
                const hasSelectedInCat = docs.some((d) => d.id === selectedDocId);

                return (
                    <div key={category} className="doc-tree-category-group">
                        {/* Category Heading */}
                        <button
                            type="button"
                            className={`doc-tree-cat-header ${hasSelectedInCat ? "has-active" : ""}`}
                            onClick={() => toggleCategory(category)}
                        >
                            <span className="cat-title-wrap">
                                {isCollapsed ? (
                                    <ChevronRight size={12} className="cat-chevron" />
                                ) : (
                                    <ChevronDown size={12} className="cat-chevron" />
                                )}
                                <span className="cat-name">{category}</span>
                            </span>
                            <span className="cat-count font-mono">{docs.length}</span>
                        </button>

                        {/* Category Items */}
                        {!isCollapsed && (
                            <div className="doc-tree-items-list">
                                {docs.map((doc) => {
                                    const isSelected = selectedDocId === doc.id;

                                    return (
                                        <button
                                            key={doc.id}
                                            type="button"
                                            className={`doc-tree-node-item ${isSelected ? "active" : ""}`}
                                            onClick={() => onSelectDoc && onSelectDoc(doc)}
                                        >
                                            <div className="node-item-lead">
                                                {getStatusIndicator(doc.status)}
                                                <span className="node-item-title" title={doc.title}>
                                                    {doc.title}
                                                </span>
                                            </div>

                                            {doc.completeness && (
                                                <span className="node-item-pct font-mono">
                                                    {doc.completeness}%
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            <style>{`
                .documentation-tree-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    width: 100%;
                }

                .doc-tree-category-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .doc-tree-cat-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 8px;
                    background: transparent;
                    border: none;
                    color: #8E8E98;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all var(--duration-fast) ease;
                }

                .doc-tree-cat-header:hover {
                    color: #F5F5F7;
                    background: rgba(255, 255, 255, 0.03);
                }

                .doc-tree-cat-header.has-active {
                    color: #E2E8F0;
                }

                .cat-title-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .cat-chevron {
                    color: var(--secondary-text);
                    flex-shrink: 0;
                }

                .cat-count {
                    font-size: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1px 6px;
                    border-radius: 10px;
                    color: #8E8E98;
                }

                .doc-tree-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    padding-left: 8px;
                }

                .doc-tree-node-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 8px 10px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    color: #A1A1AC;
                    cursor: pointer;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all var(--duration-fast) ease;
                    width: 100%;
                }

                .doc-tree-node-item:hover:not(.active) {
                    background: rgba(255, 255, 255, 0.04);
                    color: #F5F5F7;
                }

                /* Active state matching reference pill */
                .doc-tree-node-item.active {
                    background: linear-gradient(135deg, rgba(227, 38, 54, 0.95) 0%, rgba(168, 0, 24, 0.9) 100%) !important;
                    color: #FFFFFF !important;
                    font-weight: 600;
                    border-color: rgba(255, 255, 255, 0.16) !important;
                    box-shadow: 0 4px 16px rgba(227, 38, 54, 0.4), 0 0 10px rgba(255, 53, 72, 0.25) !important;
                }

                .node-item-lead {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                    flex: 1;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .dot-green {
                    background: #10B981;
                    box-shadow: 0 0 6px #10B981;
                }

                .dot-amber {
                    background: #F59E0B;
                    box-shadow: 0 0 6px #F59E0B;
                }

                .dot-red {
                    background: #FF3548;
                    box-shadow: 0 0 6px #FF3548;
                }

                .dot-gray {
                    background: #8E8E98;
                }

                .node-item-title {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.3;
                }

                .doc-tree-node-item.active .node-item-title {
                    color: #FFFFFF !important;
                }

                .node-item-pct {
                    font-size: 10px;
                    color: #8E8E98;
                    flex-shrink: 0;
                }

                .doc-tree-node-item.active .node-item-pct {
                    color: rgba(255, 255, 255, 0.85);
                }
            `}</style>
        </div>
    );
}

export default DocumentationList;
