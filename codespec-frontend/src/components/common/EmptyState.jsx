function EmptyState({
    icon: Icon,
    title = "No data available",
    description,
    message,
    action,
    className = "",
    style = {},
}) {
    const text = message || description || "No items to display at this time.";

    return (
        <div
            className={`empty-state-wrap ${className}`}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                width: "100%",
                ...style,
            }}
        >
            {Icon && (
                <div
                    style={{
                        marginBottom: "12px",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Icon size={30} strokeWidth={1.6} />
                </div>
            )}
            <div
                style={{
                    color: "var(--text-primary)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    marginBottom: "4px",
                }}
            >
                {title}
            </div>
            {text && (
                <div
                    style={{
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                        maxWidth: "380px",
                        lineHeight: 1.45,
                        marginBottom: action ? "16px" : "0",
                    }}
                >
                    {text}
                </div>
            )}
            {action}
        </div>
    );
}

export default EmptyState;
