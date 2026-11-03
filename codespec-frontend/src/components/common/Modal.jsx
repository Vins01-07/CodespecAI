import { X } from "lucide-react";

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(8px)",
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
                    padding: "18px 22px",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "18px",
                    background: "#1B1B22",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(227, 38, 54, 0.18)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "14px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        paddingBottom: "12px",
                        flexShrink: 0,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "#F5F5F7",
                            letterSpacing: "-0.2px",
                        }}
                    >
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "#101115",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            color: "var(--secondary-text)",
                            cursor: "pointer",
                            padding: "5px",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "8px",
                            transition: "all 0.15s ease",
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
