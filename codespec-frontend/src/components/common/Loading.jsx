function Loading({ text = "Loading intelligence...", size = 20 }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "24px",
                color: "var(--text-secondary)",
                fontSize: "13px",
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
                }}
            />
            <span>{text}</span>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default Loading;
