import { useState, useEffect } from "react";
import { Search, X, CornerDownLeft, Sparkles } from "lucide-react";
import Button from "../common/Button";

function SearchBar({
    query = "",
    onSearch,
    isLoading = false,
    placeholder = "Search your codebase (e.g. authenticateUser, UserService, database connection)...",
    suggestions = ["authenticateUser", "UserService", "database connection", "calculate function", "token"],
}) {
    const [inputValue, setInputValue] = useState(query);

    useEffect(() => {
        setInputValue(query);
    }, [query]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed && !isLoading) {
            onSearch(trimmed);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSubmit(e);
        }
    };

    const handleClear = () => {
        setInputValue("");
        onSearch("");
    };

    const handleSuggestionClick = (suggestion) => {
        setInputValue(suggestion);
        onSearch(suggestion);
    };

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "var(--card-background)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "var(--border-radius)",
                    padding: "6px 8px 6px 14px",
                    boxShadow: "var(--card-shadow)",
                    transition: "border-color 0.15s ease",
                }}
            >
                <Search size={18} color="var(--primary)" style={{ flexShrink: 0 }} />

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isLoading}
                    style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        fontFamily: "inherit",
                    }}
                />

                {inputValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Clear search"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "4px",
                        }}
                    >
                        <X size={15} />
                    </button>
                )}

                <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isLoading}
                    style={{ minWidth: "90px" }}
                >
                    {isLoading ? "Searching..." : "Search"}
                    {!isLoading && <CornerDownLeft size={13} style={{ opacity: 0.7 }} />}
                </Button>
            </form>

            {suggestions && suggestions.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        padding: "0 4px",
                    }}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                        <Sparkles size={12} color="var(--secondary)" />
                        Suggestions:
                    </span>
                    {suggestions.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => handleSuggestionClick(item)}
                            style={{
                                background: "var(--card-background)",
                                border: "1px solid var(--card-border)",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                color: "var(--text-secondary)",
                                fontSize: "11px",
                                fontFamily: "ui-monospace, monospace",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--primary)";
                                e.currentTarget.style.color = "var(--text-primary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--card-border)";
                                e.currentTarget.style.color = "var(--text-secondary)";
                            }}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SearchBar;
