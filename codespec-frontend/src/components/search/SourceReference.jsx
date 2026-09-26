import { useState } from "react";
import { FileCode, Copy, Check, Hash, Layers } from "lucide-react";

/**
 * Reusable SourceReference component
 * Displays precise file path, line numbers/range, module, and copyable location reference.
 */
function SourceReference({
    file,
    line,
    endLine,
    module,
    symbol,
    className = "",
    style = {},
    showCopy = true,
}) {
    const [copied, setCopied] = useState(false);

    if (!file) return null;

    const lineText = line ? (endLine && endLine !== line ? `:${line}-${endLine}` : `:${line}`) : "";
    const fullReference = `${file}${lineText}`;

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(fullReference);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div
            className={`source-reference ${className}`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "12px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "var(--text-secondary)",
                ...style,
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "var(--app-background)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--card-border)",
                    color: "var(--text-primary)",
                }}
            >
                <FileCode size={13} color="var(--primary)" />
                <span style={{ fontWeight: 500 }}>{file}</span>
                {lineText && (
                    <span style={{ color: "var(--secondary)", fontWeight: 600 }}>
                        {lineText}
                    </span>
                )}
            </div>

            {module && (
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        background: "rgba(168, 179, 154, 0.06)",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        border: "1px solid var(--card-border)",
                    }}
                >
                    <Layers size={11} />
                    <span>{module}</span>
                </div>
            )}

            {showCopy && (
                <button
                    type="button"
                    onClick={handleCopy}
                    title="Copy source reference"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "transparent",
                        border: "none",
                        color: copied ? "var(--success)" : "var(--text-muted)",
                        cursor: "pointer",
                        padding: "2px 5px",
                        borderRadius: "3px",
                        fontSize: "11px",
                        transition: "color 0.15s ease",
                    }}
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span style={{ fontFamily: "inherit" }}>
                        {copied ? "Copied" : "Copy path"}
                    </span>
                </button>
            )}
        </div>
    );
}

export default SourceReference;
