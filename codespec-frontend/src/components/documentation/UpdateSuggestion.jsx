import { useState } from "react";
import { Sparkles, Check, Copy, ArrowUpRight, Zap, Target, FileCode } from "lucide-react";
import Badge from "../common/Badge";

function UpdateSuggestion({ suggestion, onApply }) {
    const [copied, setCopied] = useState(false);
    const [applied, setApplied] = useState(false);

    if (!suggestion) return null;

    const handleCopy = () => {
        if (suggestion.suggestedDiff) {
            navigator.clipboard.writeText(suggestion.suggestedDiff);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleApply = () => {
        setApplied(true);
        if (onApply) {
            onApply(suggestion);
        }
    };

    const isHighPriority = suggestion.priority === "High";

    return (
        <div className="update-suggestion-card cs-card">
            <div className="sug-header">
                <div className="sug-title-row">
                    <div className="sug-icon-badge">
                        <Sparkles size={13} className="sug-sparkle" />
                    </div>
                    <div className="sug-title-wrap">
                        <h4 className="sug-title">{suggestion.title}</h4>
                        <div className="sug-tags-row">
                            {suggestion.category && (
                                <Badge variant="neutral">{suggestion.category}</Badge>
                            )}
                            {suggestion.priority && (
                                <Badge variant={isHighPriority ? "warning" : "default"}>
                                    {suggestion.priority} Priority
                                </Badge>
                            )}
                            {suggestion.confidence && (
                                <span className="sug-confidence">
                                    <Zap size={11} />
                                    {suggestion.confidence} match
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sug-top-actions">
                    {suggestion.target && (
                        <span className="sug-target-badge font-mono">
                            <FileCode size={11} />
                            {suggestion.target}
                        </span>
                    )}
                </div>
            </div>

            {suggestion.reason && (
                <p className="sug-reason">{suggestion.reason}</p>
            )}

            {suggestion.suggestedDiff && (
                <div className="sug-diff-container">
                    <div className="sug-diff-header">
                        <span className="sug-diff-title">Suggested Specification / Docstring</span>
                        <button
                            type="button"
                            className="sug-copy-btn"
                            onClick={handleCopy}
                            title="Copy code to clipboard"
                        >
                            {copied ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copied ? "Copied" : "Copy"}</span>
                        </button>
                    </div>
                    <pre className="sug-diff-code font-mono">{suggestion.suggestedDiff}</pre>
                </div>
            )}

            <div className="sug-footer">
                <div className="sug-hint">
                    <Target size={11} />
                    <span>Syncs specification with current AST declarations</span>
                </div>
                <div className="sug-footer-actions">
                    <button
                        type="button"
                        className={`sug-apply-btn ${applied ? "applied" : ""}`}
                        onClick={handleApply}
                        disabled={applied}
                    >
                        {applied ? (
                            <>
                                <Check size={12} />
                                <span>Applied</span>
                            </>
                        ) : (
                            <>
                                <ArrowUpRight size={12} />
                                <span>Apply Update</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .update-suggestion-card {
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .sug-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .sug-title-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    min-width: 0;
                    flex: 1;
                }
                .sug-icon-badge {
                    width: 26px;
                    height: 26px;
                    border-radius: var(--radius-sm);
                    background: rgba(168, 179, 154, 0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .sug-sparkle {
                    color: var(--primary);
                }
                .sug-title-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .sug-title {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .sug-tags-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .sug-confidence {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 10.5px;
                    font-weight: 500;
                    color: var(--primary);
                }
                .sug-target-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 10.5px;
                    padding: 2px 6px;
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--primary);
                }
                .sug-reason {
                    margin: 0;
                    font-size: 11.5px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }
                .sug-diff-container {
                    background: var(--app-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                }
                .sug-diff-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 5px 8px;
                    background: var(--card-background-hover);
                    border-bottom: 1px solid var(--card-border);
                }
                .sug-diff-title {
                    font-size: 10.5px;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .sug-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: transparent;
                    border: 1px solid var(--card-border);
                    border-radius: 3px;
                    color: var(--text-secondary);
                    padding: 2px 6px;
                    font-size: 10px;
                    cursor: pointer;
                    transition: all 0.12s ease;
                }
                .sug-copy-btn:hover {
                    color: var(--text-primary);
                    border-color: var(--primary);
                }
                .sug-diff-code {
                    margin: 0;
                    padding: 8px 10px;
                    font-size: 11px;
                    line-height: 1.5;
                    color: var(--text-primary);
                    overflow-x: auto;
                    white-space: pre;
                }
                .sug-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding-top: 4px;
                    border-top: 1px solid var(--card-border);
                    flex-wrap: wrap;
                }
                .sug-hint {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 10.5px;
                    color: var(--text-muted);
                }
                .sug-apply-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    font-size: 11px;
                    font-weight: 500;
                    background: var(--primary);
                    color: #121312;
                    border: none;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                .sug-apply-btn:hover:not(:disabled) {
                    background: var(--primary-hover);
                }
                .sug-apply-btn.applied {
                    background: var(--card-background-hover);
                    color: var(--primary);
                    cursor: default;
                }
            `}</style>
        </div>
    );
}

export default UpdateSuggestion;
