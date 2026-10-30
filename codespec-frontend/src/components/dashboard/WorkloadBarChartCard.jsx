import { useState } from "react";
import { BarChart3, ArrowRight } from "lucide-react";
import Card from "../common/Card";

export default function WorkloadBarChartCard() {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const bars = [
        { id: 1, label: "01", height: 35, val: "7 pkts" },
        { id: 2, label: "02", height: 80, val: "16 pkts" },
        { id: 3, label: "03", height: 45, val: "9 pkts" },
        { id: 4, label: "04", height: 60, val: "12 pkts" },
        { id: 5, label: "05", height: 95, val: "20 pkts" },
        { id: 6, label: "06", height: 50, val: "10 pkts" },
        { id: 7, label: "07", height: 75, val: "15 pkts" },
    ];

    return (
        <Card className="workload-bar-card cs-card--gold">
            <div className="workload-header">
                <div className="workload-title-col">
                    <span className="workload-sub">INGESTION WORKLOAD</span>
                    <div className="workload-hero-stat">
                        <span className="hero-number">20</span>
                        <span className="hero-exponent">a7••</span>
                    </div>
                </div>

                <div className="workload-indicator">
                    <span className="gold-pulse-mini" />
                    <span>Live Batches</span>
                </div>
            </div>

            {/* Vertical Rounded Capsule Bars */}
            <div className="bars-container">
                {bars.map((bar, i) => (
                    <div
                        key={bar.id}
                        className="bar-column"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        {/* Hover Tooltip */}
                        {hoveredIdx === i && (
                            <div className="bar-tooltip">
                                {bar.val}
                            </div>
                        )}

                        <div className="bar-track">
                            <div
                                className="bar-capsule"
                                style={{
                                    height: `${bar.height}%`,
                                    background:
                                        bar.height >= 80
                                            ? "linear-gradient(180deg, #c4b5fd 0%, #7c3aed 100%)"
                                            : "linear-gradient(180deg, #8b5cf6 0%, #4c1d95 100%)",
                                }}
                            >
                                <span className="capsule-notch" />
                            </div>
                        </div>

                        <span className="bar-axis-label">{bar.label}</span>
                    </div>
                ))}
            </div>

            {/* Bottom summary footnote */}
            <div className="workload-footer">
                <span className="footer-meta">Active worker threads synced</span>
                <span className="footer-ops">14.2 ops/ms</span>
            </div>

            <style>{`
                .workload-bar-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    border-radius: var(--border-radius);
                    min-height: 180px;
                }

                .workload-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                }

                .workload-title-col {
                    display: flex;
                    flex-direction: column;
                }

                .workload-sub {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }

                .workload-hero-stat {
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                    margin-top: 2px;
                }

                .hero-number {
                    font-size: 32px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -1px;
                    line-height: 1;
                }

                .hero-exponent {
                    font-size: 13px;
                    font-weight: 700;
                    color: #c4b5fd;
                }

                .workload-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 9px;
                    border-radius: 9999px;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    font-size: 10.5px;
                    font-weight: 600;
                    color: #c4b5fd;
                }

                .gold-pulse-mini {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #c4b5fd;
                    box-shadow: 0 0 6px #c4b5fd;
                }

                .bars-container {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 10px;
                    height: 90px;
                    padding: 8px 6px 0;
                    margin: 8px 0;
                }

                .bar-column {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                    position: relative;
                    cursor: pointer;
                }

                .bar-tooltip {
                    position: absolute;
                    top: -24px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 2px 6px;
                    background: #181b24;
                    border: 1px solid rgba(139, 92, 246, 0.4);
                    border-radius: 5px;
                    font-size: 9.5px;
                    font-weight: 700;
                    color: #c4b5fd;
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 5;
                }

                .bar-track {
                    width: 14px;
                    height: calc(100% - 16px);
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 9999px;
                    display: flex;
                    align-items: flex-end;
                    overflow: hidden;
                    position: relative;
                }

                .bar-capsule {
                    width: 100%;
                    border-radius: 9999px;
                    position: relative;
                    transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
                }

                .bar-column:hover .bar-capsule {
                    filter: brightness(1.2);
                }

                .capsule-notch {
                    position: absolute;
                    top: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.7);
                }

                .bar-axis-label {
                    font-size: 9.5px;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-top: 5px;
                }

                .workload-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 8px;
                    font-size: 10.5px;
                }

                .footer-meta {
                    color: var(--text-muted);
                }

                .footer-ops {
                    color: #c4b5fd;
                    font-weight: 700;
                }
            `}</style>
        </Card>
    );
}
