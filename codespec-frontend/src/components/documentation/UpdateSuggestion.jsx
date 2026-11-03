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
                        <Sparkles size={14} className="sug-sparkle" />
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
                                <span className="sug-confidence font-mono">
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
                        <span className="sug-diff-title font-mono">Suggested Specification / Docstring</span>
                        <button
                            type="button"
                            className="sug-copy-btn font-mono"
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
                                <span>Applied to Spec</span>
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
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: rgba(16, 17, 21, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
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
                    gap: 10px;
                    min-width: 0;
                }
                .sug-icon-badge {
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    background: rgba(22, 140, 163, 0.15);
                    border: 1px solid rgba(22, 140, 163, 0.35);
                    color: #00F2FE;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .sug-title-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .sug-title {
                    margin: 0;
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #F5F5F7;
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
                    font-weight: 600;
                    color: #10B981;
                }
                .sug-target-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 10.5px;
                    padding: 3px 8px;
                    background: #14151B;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                    color: #168CA3;
                }
                .sug-reason {
                    margin: 0;
                    font-size: 12px;
                    color: #A1A1AC;
                    line-height: 1.45;
                }
                .sug-diff-container {
                    background: #090A0D;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .sug-diff-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 10px;
                    background: #101116;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .sug-diff-title {
                    font-size: 10.5px;
                    font-weight: 600;
                    color: var(--secondary-text);
                }
                .sug-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 4px;
                    color: var(--secondary-text);
                    padding: 2px 7px;
                    font-size: 10px;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }
                .sug-copy-btn:hover {
                    color: #FFFFFF;
                    border-color: rgba(22, 140, 163, 0.4);
                }
                .sug-diff-code {
                    margin: 0;
                    padding: 10px 12px;
                    font-size: 11.5px;
                    line-height: 1.5;
                    color: #F5F5F7;
                    overflow-x: auto;
                    white-space: pre;
                }
                .sug-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding-top: 4px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    flex-wrap: wrap;
                }
                .sug-hint {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    color: var(--muted-text);
                }
                .sug-apply-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 12px;
                    font-size: 11.5px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #168CA3 0%, #254D9C 100%);
                    color: #FFFFFF;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 8px;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(22, 140, 163, 0.35);
                    transition: all var(--duration-fast) ease;
                }
                .sug-apply-btn:hover:not(:disabled) {
                    box-shadow: 0 4px 14px rgba(22, 140, 163, 0.55);
                    transform: translateY(-1px);
                }
                .sug-apply-btn.applied {
                    background: #14151B;
                    border-color: rgba(16, 185, 129, 0.3);
                    color: #10B981;
                    box-shadow: none;
                    cursor: default;
                    transform: none;
                }
            `}</style>
        </div>
    );
}

export default UpdateSuggestion;
