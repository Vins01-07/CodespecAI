import { X } from "lucide-react";

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "16px",
            }}
            onClick={onClose}
        >
            <div
                className="cs-card"
                style={{
                    width: "100%",
                    maxWidth: "540px",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    padding: "18px 20px",
                    position: "relative",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "14px",
                        borderBottom: "1px solid var(--card-border)",
                        paddingBottom: "12px",
                        flexShrink: 0,
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
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "4px",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div
                    style={{
                        overflowY: "auto",
                        maxHeight: "calc(90vh - 80px)",
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
