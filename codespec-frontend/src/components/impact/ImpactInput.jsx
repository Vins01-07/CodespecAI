import { useState } from "react";
import {
    Zap,
    Sliders,
    Sparkles,
    AlertCircle,
    Code,
    FileCode,
    X,
    Loader2,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const CHANGE_TYPES = [
    { value: "modify", label: "Modify Implementation", desc: "Internal logic or refactoring" },
    { value: "signature_change", label: "Signature Change", desc: "Parameters or return types" },
    { value: "delete", label: "Delete / Deprecate", desc: "Removal of symbol or endpoint" },
    { value: "dependency_update", label: "Dependency Update", desc: "Upgrading external package" },
];

export function ImpactInput({
    target,
    setTarget,
    changeType,
    setChangeType,
    onSubmit,
    isLoading,
    suggestedTargets = [],
}) {
    const [validationError, setValidationError] = useState(null);

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (!target.trim()) {
            setValidationError("Please enter a target file path, symbol, or select a suggested target.");
            return;
        }
        setValidationError(null);
        onSubmit();
    };

    const handleSelectSuggestion = (sug) => {
        setTarget(sug.target);
        setValidationError(null);
    };

    const isSubmitDisabled = isLoading || !target.trim();

    return (
        <Card className="impact-input-card">
            <form onSubmit={handleSubmit} className="impact-form">
                {/* Header title */}
                <div className="impact-header-row">
                    <div className="impact-title-group">
                        <Zap size={15} color="var(--primary)" />
                        <span className="impact-title-text">
                            Target Specification
                        </span>
                    </div>
                    <span className="impact-subtitle-hint">
                        Enter a file, class, function, or select a preset
                    </span>
                </div>

                {/* Main Input Row */}
                <div className="impact-controls-row">
                    {/* Target Input */}
                    <div className="impact-input-wrapper">
                        <div
                            className={`impact-text-input-box ${validationError ? "has-error" : ""}`}
                        >
                            <FileCode size={15} className="input-icon" />
                            <input
                                type="text"
                                value={target}
                                onChange={(e) => {
                                    setTarget(e.target.value);
                                    if (validationError) setValidationError(null);
                                }}
                                placeholder="e.g., src/auth/service.py:authenticateUser or UserService"
                                className="impact-text-field font-mono"
                                disabled={isLoading}
                            />
                            {target && (
                                <button
                                    type="button"
                                    onClick={() => setTarget("")}
                                    className="impact-clear-btn"
                                    title="Clear input"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {validationError && (
                            <div className="impact-validation-msg">
                                <AlertCircle size={12} />
                                <span>{validationError}</span>
                            </div>
                        )}
                    </div>

                    {/* Change Type Selector */}
                    <div className="impact-select-wrapper">
                        <div className="impact-select-box">
                            <Sliders size={13} className="select-icon" />
                            <select
                                value={changeType}
                                onChange={(e) => setChangeType(e.target.value)}
                                disabled={isLoading}
                                className="impact-select-element"
                            >
                                {CHANGE_TYPES.map((ct) => (
                                    <option key={ct.value} value={ct.value}>
                                        {ct.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className={`impact-submit-btn ${isSubmitDisabled ? "disabled" : ""}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={14} className="impact-spinning" />
                                <span>Computing Blast Radius...</span>
                            </>
                        ) : (
                            <>
                                <Zap size={14} />
                                <span>Analyze Impact</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Preset Suggestions */}
                {suggestedTargets.length > 0 && (
                    <div className="impact-presets-section">
                        <div className="impact-presets-header">
                            <Sparkles size={11} color="var(--primary)" />
                            <span>Quick Presets:</span>
                        </div>
                        <div className="impact-presets-list">
                            {suggestedTargets.map((sug, idx) => {
                                const isSelected = target === sug.target;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelectSuggestion(sug)}
                                        disabled={isLoading}
                                        className={`impact-preset-chip ${isSelected ? "selected" : ""}`}
                                        title={sug.description}
                                    >
                                        <Code size={12} color={isSelected ? "var(--primary)" : "var(--text-muted)"} />
                                        <span className="font-mono">{sug.symbol || sug.target}</span>
                                        <span className="preset-cat-badge">
                                            {sug.category}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </form>

            <style>{`
                .impact-input-card {
                    padding: 16px 18px;
                    margin-bottom: 0;
                }
                .impact-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .impact-header-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .impact-title-group {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }
                .impact-title-text {
                    font-size: 13.5px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .impact-subtitle-hint {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .impact-controls-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    width: 100%;
                }
                @media (max-width: 900px) {
                    .impact-controls-row {
                        flex-direction: column;
                        align-items: stretch;
                    }
                }
                .impact-input-wrapper {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .impact-text-input-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                    padding: 0 12px;
                    height: 38px;
                    transition: border-color 0.15s ease, background 0.15s ease;
                }
                .impact-text-input-box:focus-within {
                    border-color: var(--primary);
                    background: var(--sidebar-background);
                }
                .impact-text-input-box.has-error {
                    border-color: var(--danger);
                }
                .input-icon {
                    color: var(--text-muted);
                    flex-shrink: 0;
                }
                .impact-text-field {
                    flex: 1;
                    min-width: 0;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--text-primary);
                    font-size: 12.5px;
                    height: 100%;
                }
                .impact-clear-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 4px;
                    border-radius: 3px;
                }
                .impact-clear-btn:hover {
                    color: var(--text-primary);
                    background: rgba(255, 255, 255, 0.06);
                }
                .impact-validation-msg {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--danger);
                    font-size: 11px;
                }
                .impact-select-wrapper {
                    width: 220px;
                    flex-shrink: 0;
                }
                @media (max-width: 900px) {
                    .impact-select-wrapper {
                        width: 100%;
                    }
                }
                .impact-select-box {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    border-radius: var(--border-radius);
                    padding: 0 10px;
                    height: 38px;
                }
                .select-icon {
                    color: var(--secondary);
                    flex-shrink: 0;
                }
                .impact-select-element {
                    flex: 1;
                    min-width: 0;
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 11.5px;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    height: 100%;
                }
                .impact-select-element option {
                    background: var(--card-background);
                    color: var(--text-primary);
                }
                .impact-submit-btn {
                    height: 38px;
                    padding: 0 18px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border-radius: var(--border-radius);
                    border: 1px solid var(--primary);
                    background: var(--primary);
                    color: #121312;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.15s ease;
                    white-space: nowrap;
                }
                .impact-submit-btn:hover:not(:disabled) {
                    background: var(--primary-hover);
                    border-color: var(--primary-hover);
                }
                .impact-submit-btn.disabled,
                .impact-submit-btn:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                    background: var(--card-background-hover);
                    color: var(--text-muted);
                    border-color: var(--card-border);
                }
                .impact-spinning {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .impact-presets-section {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding-top: 4px;
                }
                .impact-presets-header {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 10.5px;
                    color: var(--text-muted);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .impact-presets-list {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .impact-preset-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    border-radius: var(--radius-sm);
                    background: var(--card-background-hover);
                    border: 1px solid var(--card-border);
                    color: var(--text-secondary);
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.12s ease;
                }
                .impact-preset-chip:hover:not(:disabled) {
                    border-color: var(--primary);
                    color: var(--text-primary);
                }
                .impact-preset-chip.selected {
                    background: var(--active-background);
                    border-color: var(--active-border);
                    color: var(--primary);
                }
                .preset-cat-badge {
                    font-size: 9px;
                    color: var(--text-muted);
                    background: var(--app-background);
                    border: 1px solid var(--card-border);
                    padding: 0 4px;
                    border-radius: 2px;
                }
            `}</style>
        </Card>
    );
}

export default ImpactInput;
