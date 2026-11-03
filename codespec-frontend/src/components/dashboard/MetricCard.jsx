import {
    Files,
    Server,
    Boxes,
    Code2,
    Package,
} from "lucide-react";
import Card from "../common/Card";

// Mini Crimson Chart Visualizations matching img2
function MetricMiniChart({ type }) {
    if (type === "area") {
        // Files: Smooth red glowing area wave
        return (
            <div className="mini-chart-wrap" aria-hidden="true">
                <svg viewBox="0 0 140 45" preserveAspectRatio="none" className="mini-chart-svg">
                    <defs>
                        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#E32636" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M 0,38 Q 20,32 40,36 T 80,22 T 110,26 T 140,8 L 140,45 L 0,45 Z"
                        fill="url(#areaGrad)"
                    />
                    <path
                        d="M 0,38 Q 20,32 40,36 T 80,22 T 110,26 T 140,8"
                        fill="none"
                        stroke="#FF3548"
                        strokeWidth="1.8"
                    />
                </svg>
            </div>
        );
    }

    if (type === "bar") {
        // Services: Crimson vertical bar chart (histogram) with varying heights
        const bars = [18, 24, 20, 32, 28, 42, 38];
        return (
            <div className="mini-chart-wrap" aria-hidden="true">
                <svg viewBox="0 0 140 45" preserveAspectRatio="none" className="mini-chart-svg">
                    <defs>
                        <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#800010" stopOpacity="0.3" />
                        </linearGradient>
                    </defs>
                    {bars.map((height, i) => {
                        const x = 30 + i * 15;
                        const y = 45 - height;
                        return (
                            <rect
                                key={i}
                                x={x}
                                y={y}
                                width="9"
                                height={height}
                                rx="2"
                                fill="url(#barGrad)"
                            />
                        );
                    })}
                </svg>
            </div>
        );
    }

    if (type === "mountain") {
        // APIs: Crimson ascending mountain wave
        return (
            <div className="mini-chart-wrap" aria-hidden="true">
                <svg viewBox="0 0 140 45" preserveAspectRatio="none" className="mini-chart-svg">
                    <defs>
                        <linearGradient id="mountGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#E32636" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M 0,42 Q 25,40 50,30 T 90,28 T 120,12 T 140,6 L 140,45 L 0,45 Z"
                        fill="url(#mountGrad)"
                    />
                    <path
                        d="M 0,42 Q 25,40 50,30 T 90,28 T 120,12 T 140,6"
                        fill="none"
                        stroke="#FF3548"
                        strokeWidth="1.8"
                    />
                </svg>
            </div>
        );
    }

    if (type === "sparkline") {
        // Functions: Active curve with peaks
        return (
            <div className="mini-chart-wrap" aria-hidden="true">
                <svg viewBox="0 0 140 45" preserveAspectRatio="none" className="mini-chart-svg">
                    <defs>
                        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#E32636" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M 0,34 Q 20,14 40,32 T 80,16 T 115,28 T 140,10 L 140,45 L 0,45 Z"
                        fill="url(#sparkGrad)"
                    />
                    <path
                        d="M 0,34 Q 20,14 40,32 T 80,16 T 115,28 T 140,10"
                        fill="none"
                        stroke="#FF3548"
                        strokeWidth="1.8"
                    />
                </svg>
            </div>
        );
    }

    // Dependencies: Stepped / polygon wave
    return (
        <div className="mini-chart-wrap" aria-hidden="true">
            <svg viewBox="0 0 140 45" preserveAspectRatio="none" className="mini-chart-svg">
                <defs>
                    <linearGradient id="stepGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF3548" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#E32636" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path
                    d="M 0,38 L 30,38 L 30,28 L 70,28 L 70,18 L 110,18 L 110,10 L 140,10 L 140,45 L 0,45 Z"
                    fill="url(#stepGrad)"
                />
                <path
                    d="M 0,38 L 30,38 L 30,28 L 70,28 L 70,18 L 110,18 L 110,10 L 140,10"
                    fill="none"
                    stroke="#FF3548"
                    strokeWidth="1.6"
                />
            </svg>
        </div>
    );
}

// Icon resolver for metric cards
function getMetricIcon(type) {
    switch (type) {
        case "files":
            return Files;
        case "services":
            return Server;
        case "apis":
            return Boxes;
        case "functions":
            return Code2;
        case "dependencies":
            return Package;
        default:
            return Files;
    }
}

function MetricCard({
    label,
    value,
    trendValue,
    trendText,
    chartType = "area",
    iconType = "files",
}) {
    const Icon = getMetricIcon(iconType);

    return (
        <Card className="metric-card-container">
            <div className="metric-card-inner">
                {/* Header row: Label + Crimson Icon Badge */}
                <div className="metric-card-header">
                    <span className="metric-card-label">{label}</span>
                    <div className="metric-icon-badge">
                        <Icon size={14} strokeWidth={2.2} />
                    </div>
                </div>

                {/* Big bold value */}
                <div className="metric-card-value font-mono">{value}</div>

                {/* Trend status */}
                <div className="metric-card-trend">
                    <span className="trend-green font-mono">&uarr; {trendValue}</span>
                    <span className="trend-text">{trendText}</span>
                </div>
            </div>

            {/* Embedded glowing crimson chart */}
            <MetricMiniChart type={chartType} />

            <style>{`
                .metric-card-container {
                    background: linear-gradient(180deg, #181920 0%, #111217 100%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 16px !important;
                    position: relative;
                    overflow: hidden;
                    min-height: 116px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    transition: all var(--duration-fast) ease;
                }
                .metric-card-container:hover {
                    border-color: rgba(227, 38, 54, 0.45) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(227, 38, 54, 0.2) !important;
                }
                .metric-card-inner {
                    padding: 14px 16px 6px 16px;
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                }
                .metric-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }
                .metric-card-label {
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #A1A1AC;
                }
                .metric-icon-badge {
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: rgba(227, 38, 54, 0.14);
                    border: 1px solid rgba(227, 38, 54, 0.35);
                    color: #FF3548;
                    flex-shrink: 0;
                }
                .metric-card-value {
                    font-size: 26px;
                    font-weight: 800;
                    color: #F5F5F7;
                    letter-spacing: -0.6px;
                    line-height: 1.1;
                }
                .metric-card-trend {
                    display: flex;
                    align-items: baseline;
                    gap: 5px;
                    margin-top: 6px;
                    font-size: 11px;
                }
                .trend-green {
                    color: #10B981;
                    font-weight: 700;
                }
                .trend-text {
                    color: #8E8E98;
                }
                .mini-chart-wrap {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 100%;
                    height: 48px;
                    pointer-events: none;
                    z-index: 1;
                }
                .mini-chart-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
            `}</style>
        </Card>
    );
}

export default MetricCard;
