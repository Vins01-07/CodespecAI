import { useReactFlow } from "@xyflow/react";
import {
    ZoomIn,
    ZoomOut,
    Maximize,
    RotateCcw,
    MapPin,
    LayoutGrid,
    Eye,
    EyeOff,
} from "lucide-react";

function GraphControls({
    showMinimap = true,
    onToggleMinimap,
    onAutoLayout,
    onResetSelection,
    hasSelection = false,
}) {
    const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();

    const handleZoomIn = () => {
        zoomIn({ duration: 250 });
    };

    const handleZoomOut = () => {
        zoomOut({ duration: 250 });
    };

    const handleFitView = () => {
        fitView({ padding: 0.25, duration: 350 });
    };

    const handleResetView = () => {
        fitView({ padding: 0.2, duration: 300 });
    };

    const buttonStyle = {
        width: "30px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "all 0.12s ease",
        padding: 0,
    };

    return (
        <div
            className="graph-controls-panel"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                background: "#09090b",
                border: "1px solid var(--card-border)",
                padding: "5px",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
            }}
        >
            <button
                type="button"
                style={buttonStyle}
                onClick={handleZoomIn}
                title="Zoom in (+)"
                aria-label="Zoom in"
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                }}
            >
                <ZoomIn size={15} />
            </button>

            <button
                type="button"
                style={buttonStyle}
                onClick={handleZoomOut}
                title="Zoom out (-)"
                aria-label="Zoom out"
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                }}
            >
                <ZoomOut size={15} />
            </button>

            <div style={{ height: "1px", background: "var(--card-border)", margin: "1px 2px" }} />

            <button
                type="button"
                style={buttonStyle}
                onClick={handleFitView}
                title="Fit all nodes in view"
                aria-label="Fit view"
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                }}
            >
                <Maximize size={15} />
            </button>

            <button
                type="button"
                style={buttonStyle}
                onClick={handleResetView}
                title="Reset viewport"
                aria-label="Reset view"
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "var(--card-border)";
                }}
            >
                <RotateCcw size={14} />
            </button>

            {onToggleMinimap && (
                <button
                    type="button"
                    style={{
                        ...buttonStyle,
                        color: showMinimap ? "var(--primary)" : "var(--text-muted)",
                    }}
                    onClick={onToggleMinimap}
                    title={showMinimap ? "Hide minimap" : "Show minimap"}
                    aria-label="Toggle minimap"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--card-border)";
                    }}
                >
                    <MapPin size={15} />
                </button>
            )}

            {onAutoLayout && (
                <button
                    type="button"
                    style={buttonStyle}
                    onClick={onAutoLayout}
                    title="Auto-arrange layout"
                    aria-label="Auto-arrange layout"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--text-primary)";
                        e.currentTarget.style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.borderColor = "var(--card-border)";
                    }}
                >
                    <LayoutGrid size={15} />
                </button>
            )}
        </div>
    );
}

export default GraphControls;
