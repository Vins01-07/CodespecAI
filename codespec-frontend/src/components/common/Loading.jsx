function Loading({ text, message, size = 20, className = "", style = {} }) {
    const label = message || text || "Loading intelligence...";

    return (
        <div
            className={`loading-wrap ${className}`}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "28px 20px",
                color: "var(--text-secondary)",
                fontSize: "12.5px",
                width: "100%",
                ...style,
            }}
        >
            <div
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    border: "2px solid var(--card-border)",
                    borderTopColor: "var(--primary)",
                    animation: "spin 0.8s linear infinite",
                    flexShrink: 0,
                }}
            />
            <span>{label}</span>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default Loading;
