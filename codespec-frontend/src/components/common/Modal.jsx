import { X } from "lucide-react";

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                className="cs-card"
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    padding: "20px",
                    position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                        borderBottom: "1px solid var(--card-border)",
                        paddingBottom: "12px",
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                        }}
                    >
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}

export default Modal;
