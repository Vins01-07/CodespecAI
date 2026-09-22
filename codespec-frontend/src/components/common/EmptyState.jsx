function EmptyState({
    icon: Icon,
    title = "No data available",
    description = "No items to display at this time.",
    action,
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
            }}
        >
            {Icon && (
                <div
                    style={{
                        marginBottom: "12px",
                        color: "var(--text-secondary)",
                    }}
                >
                    <Icon size={32} strokeWidth={1.5} />
                </div>
            )}
            <div
                style={{
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    marginBottom: "4px",
                }}
            >
                {title}
            </div>
            <div
                style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    maxWidth: "280px",
                    lineHeight: 1.4,
                    marginBottom: action ? "14px" : "0",
                }}
            >
                {description}
            </div>
            {action}
        </div>
    );
}

export default EmptyState;
