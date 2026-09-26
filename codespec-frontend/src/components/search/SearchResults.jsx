import { useState } from "react";
import { Code2, Box, FileCode, Layers, Sparkles, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import SourceReference from "./SourceReference";

function SearchResults({ results = [], query = "", activeFilter = "all", onFilterChange }) {
    const [expandedSnippets, setExpandedSnippets] = useState({});
    const [copiedSnippetId, setCopiedSnippetId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedSnippets((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopySnippet = (id, snippet, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(snippet);
        setCopiedSnippetId(id);
        setTimeout(() => setCopiedSnippetId(null), 1800);
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case "function":
                return <Code2 size={13} />;
            case "class":
                return <Box size={13} />;
            case "method":
                return <Code2 size={13} />;
            case "file":
                return <FileCode size={13} />;
            case "module":
                return <Layers size={13} />;
            default:
                return <Code2 size={13} />;
        }
    };

    const getTypeBadgeVariant = (type) => {
        switch (type?.toLowerCase()) {
            case "function":
                return "primary";
            case "class":
                return "warning";
            case "method":
                return "primary";
            case "file":
                return "default";
            case "module":
                return "success";
            default:
                return "default";
        }
    };

    // Calculate filter counts
    const counts = {
        all: results.length,
        function: results.filter((r) => r.type?.toLowerCase() === "function" || r.type?.toLowerCase() === "method").length,
        class: results.filter((r) => r.type?.toLowerCase() === "class").length,
        file: results.filter((r) => r.type?.toLowerCase() === "file").length,
    };

    const filteredResults = results.filter((item) => {
        if (!activeFilter || activeFilter === "all") return true;
        if (activeFilter === "function") return item.type?.toLowerCase() === "function" || item.type?.toLowerCase() === "method";
        return item.type?.toLowerCase() === activeFilter.toLowerCase();
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Filter Tabs & Result Stats */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    borderBottom: "1px solid var(--card-border)",
                    paddingBottom: "10px",
                }}
            >
                <div style={{ display: "flex", gap: "6px" }}>
                    {[
                        { id: "all", label: "All Results", count: counts.all },
                        { id: "function", label: "Functions & Methods", count: counts.function },
                        { id: "class", label: "Classes", count: counts.class },
                        { id: "file", label: "Files", count: counts.file },
                    ].map((tab) => {
                        const isActive = (activeFilter || "all") === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onFilterChange && onFilterChange(tab.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: isActive ? "var(--active-background)" : "transparent",
                                    border: `1px solid ${isActive ? "var(--active-border)" : "transparent"}`,
                                    borderRadius: "var(--border-radius)",
                                    padding: "4px 10px",
                                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                                    fontSize: "12px",
                                    fontWeight: isActive ? 600 : 400,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <span>{tab.label}</span>
                                <span
                                    style={{
                                        fontSize: "10px",
                                        background: "var(--card-background)",
                                        padding: "1px 5px",
                                        borderRadius: "3px",
                                        border: "1px solid var(--card-border)",
                                    }}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Showing <strong style={{ color: "var(--text-primary)" }}>{filteredResults.length}</strong> matches for{" "}
                    <span style={{ color: "var(--primary)", fontFamily: "monospace" }}>"{query}"</span>
                </div>
            </div>

            {/* Result Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredResults.map((result) => {
                    const isExpanded = expandedSnippets[result.id];
                    const hasLongSnippet = result.snippet && result.snippet.split("\n").length > 5;
                    const lines = result.snippet ? result.snippet.split("\n") : [];
                    const displayedLines = hasLongSnippet && !isExpanded ? lines.slice(0, 5) : lines;
                    const startLineNumber = result.line || 1;

                    return (
                        <Card
                            key={result.id}
                            style={{
                                padding: "16px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                                background: "var(--card-background)",
                            }}
                        >
                            {/* Card Top: Type, Symbol Name, Match score */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <Badge variant={getTypeBadgeVariant(result.type)}>
                                        {getTypeIcon(result.type)}
                                        <span>{result.type}</span>
                                    </Badge>

                                    <span
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "var(--text-primary)",
                                            fontFamily: "ui-monospace, monospace",
                                        }}
                                    >
                                        {result.name}
                                    </span>

                                    {result.signature && result.signature !== result.name && (
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                color: "var(--text-muted)",
                                                fontFamily: "ui-monospace, monospace",
                                                maxWidth: "500px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                            title={result.signature}
                                        >
                                            {result.signature}
                                        </span>
                                    )}
                                </div>

                                {result.relevance && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                            flexShrink: 0,
                                        }}
                                        title={`Relevance match score: ${Math.round(result.relevance * 100)}%`}
                                    >
                                        <Sparkles size={11} color="var(--primary)" />
                                        <span>{Math.round(result.relevance * 100)}% match</span>
                                    </div>
                                )}
                            </div>

                            {/* Summary / Doc description */}
                            {result.summary && (
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "12px",
                                        color: "var(--text-secondary)",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {result.summary}
                                </p>
                            )}

                            {/* Code Snippet Block */}
                            {result.snippet && (
                                <div
                                    style={{
                                        background: "var(--app-background)",
                                        border: "1px solid var(--card-border)",
                                        borderRadius: "var(--border-radius)",
                                        overflow: "hidden",
                                        position: "relative",
                                    }}
                                >
                                    {/* Snippet Header */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "4px 10px",
                                            background: "rgba(0, 0, 0, 0.2)",
                                            borderBottom: "1px solid var(--card-border)",
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        <span>{result.language?.toUpperCase() || "CODE"}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => handleCopySnippet(result.id, result.snippet, e)}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                color: copiedSnippetId === result.id ? "var(--success)" : "var(--text-muted)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                fontSize: "11px",
                                                padding: "2px 4px",
                                            }}
                                        >
                                            {copiedSnippetId === result.id ? <Check size={11} /> : <Copy size={11} />}
                                            <span>{copiedSnippetId === result.id ? "Copied" : "Copy snippet"}</span>
                                        </button>
                                    </div>

                                    {/* Snippet Lines with Line Numbers */}
                                    <div
                                        style={{
                                            padding: "10px 0",
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                            fontSize: "12px",
                                            lineHeight: 1.6,
                                            overflowX: "auto",
                                        }}
                                    >
                                        {displayedLines.map((line, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: "flex",
                                                    padding: "0 12px",
                                                    gap: "14px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: "28px",
                                                        textAlign: "right",
                                                        color: "var(--text-muted)",
                                                        userSelect: "none",
                                                        fontSize: "11px",
                                                        opacity: 0.6,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {startLineNumber + idx}
                                                </span>
                                                <span
                                                    style={{
                                                        color: "var(--text-primary)",
                                                        whiteSpace: "pre",
                                                    }}
                                                >
                                                    {line}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Expand/Collapse Toggle for long snippets */}
                                    {hasLongSnippet && (
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                padding: "4px 8px",
                                                borderTop: "1px dashed var(--card-border)",
                                                background: "rgba(0,0,0,0.15)",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(result.id)}
                                                style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    color: "var(--secondary)",
                                                    cursor: "pointer",
                                                    fontSize: "11px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    padding: "2px 6px",
                                                }}
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronUp size={12} /> Show less
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown size={12} /> Show {lines.length - 5} more lines
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Card Bottom: Source Reference */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    borderTop: "1px solid var(--card-border)",
                                    paddingTop: "10px",
                                }}
                            >
                                <SourceReference
                                    file={result.file}
                                    line={result.line}
                                    endLine={result.endLine}
                                    module={result.module}
                                    symbol={result.name}
                                />
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default SearchResults;
