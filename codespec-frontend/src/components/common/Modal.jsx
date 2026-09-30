import { X } from "lucide-react";

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "16px",
            }}
            onClick={onClose}
        >
            <div
                className="cs-card cs-card--violet"
                style={{
                    width: "100%",
                    maxWidth: "540px",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px 20px",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--card-border-gold)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8), 0 0 24px rgba(124, 58, 237, 0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                        borderBottom: "1px solid var(--card-border)",
                        paddingBottom: "10px",
                        flexShrink: 0,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.2px",
                        }}
                    >
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "#090a0f",
                            border: "1px solid var(--card-border)",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "var(--radius-sm)",
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>
                <div
                    style={{
                        overflowY: "auto",
                        maxHeight: "calc(90vh - 70px)",
                        paddingRight: "2px",
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;
