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
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(29, 32, 27, 0.9)",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--border-radius)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        padding: 0,
    };

    return (
        <div
            className="graph-controls-panel"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                background: "rgba(23, 25, 22, 0.85)",
                backdropFilter: "blur(6px)",
                padding: "6px",
                borderRadius: "var(--border-radius)",
                border: "1px solid var(--card-border)",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
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
