import { Sparkles, Network, ArrowUpRight } from "lucide-react";
import Card from "../common/Card";

export default function DualMetricCard({
    metric1 = { value: "1025/3", label: "AST Nodes / Depth", sub: "100% cleanly resolved" },
    metric2 = { value: "1918/3", label: "Symbol Index / Refs", sub: "Continuous graph verified" },
}) {
    return (
        <Card className="dual-metric-card cs-card--gold">
            <div className="dual-card-header">
                <div className="dual-header-left">
                    <span className="gold-indicator-ring" />
                    <span className="dual-section-title">Core Codebase Metrics</span>
                </div>
                <div className="dual-header-badge">
                    <Sparkles size={11} />
                    <span>Realtime AST</span>
                </div>
            </div>

            {/* Connecting Circuit Architecture Graphic */}
            <div className="dual-circuit-connector">
                <svg className="circuit-svg" viewBox="0 0 380 40" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="circuitGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>

                    {/* Circuit Polyline connecting Metric 1 to Metric 2 */}
                    <path
                        d="M 40,20 L 130,20 Q 155,20 170,10 L 210,10 Q 225,20 250,20 L 340,20"
                        fill="none"
                        stroke="url(#circuitGoldGrad)"
                        strokeWidth="1.6"
                        strokeDasharray="4 4"
                    />

                    {/* Left Node */}
                    <circle cx="40" cy="20" r="4" fill="#c4b5fd" />
                    {/* Center Interconnect Pulse Node */}
                    <circle cx="190" cy="10" r="5" fill="#c4b5fd" className="circuit-pulse" />
                    <circle cx="190" cy="10" r="10" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.4" />
                    {/* Right Node */}
                    <circle cx="340" cy="20" r="4" fill="#c4b5fd" />
                </svg>
            </div>

            {/* Dual Standout Values */}
            <div className="dual-metrics-row">
                {/* Metric 1 */}
                <div className="dual-metric-block">
                    <div className="metric-super-label">
                        <span className="metric-code-pill">AST PASS</span>
                        <ArrowUpRight size={13} className="metric-arrow" />
                    </div>
                    <div className="dual-value-display">{metric1.value}</div>
                    <div className="dual-label-text">{metric1.label}</div>
                    <div className="dual-sub-note">{metric1.sub}</div>
                </div>

                {/* Vertical Divider */}
                <div className="dual-metric-divider" />

                {/* Metric 2 */}
                <div className="dual-metric-block">
                    <div className="metric-super-label">
                        <span className="metric-code-pill">SYMBOLS</span>
                        <ArrowUpRight size={13} className="metric-arrow" />
                    </div>
                    <div className="dual-value-display">{metric2.value}</div>
                    <div className="dual-label-text">{metric2.label}</div>
                    <div className="dual-sub-note">{metric2.sub}</div>
                </div>
            </div>

            {/* Background Ambient Mountain Sparkline */}
            <div className="dual-mountain-backdrop">
                <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="mountain-svg">
                    <path
                        d="M 0,60 L 60,42 L 120,48 L 190,25 L 260,38 L 320,18 L 400,32 L 400,60 Z"
                        fill="rgba(139, 92, 246, 0.06)"
                    />
                </svg>
            </div>

            <style>{`
                .dual-metric-card {
                    padding: 20px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    border-radius: var(--border-radius);
                    position: relative;
                    overflow: hidden;
                }

                .dual-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 1;
                }

                .dual-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .gold-indicator-ring {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #c4b5fd;
                    box-shadow: 0 0 10px rgba(196, 181, 253, 0.7);
                }

                .dual-section-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .dual-header-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 3px 10px;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    border-radius: 9999px;
                    font-size: 10.5px;
                    font-weight: 700;
                    color: #c4b5fd;
                }

                .dual-circuit-connector {
                    width: 100%;
                    height: 24px;
                    margin: -4px 0;
                    z-index: 1;
                }

                .circuit-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .circuit-pulse {
                    animation: pulseDot 2s ease-in-out infinite;
                }

                @keyframes pulseDot {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.3); opacity: 1; }
                }

                .dual-metrics-row {
                    display: grid;
                    grid-template-columns: 1fr 1px 1fr;
                    gap: 20px;
                    align-items: center;
                    z-index: 1;
                }

                .dual-metric-block {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .metric-super-label {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .metric-code-pill {
                    font-size: 9.5px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                }

                .metric-arrow {
                    color: #c4b5fd;
                }

                .dual-value-display {
                    font-size: 36px;
                    font-weight: 800;
                    letter-spacing: -1.2px;
                    color: #ffffff;
                    line-height: 1;
                    font-family: inherit;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
                }

                .dual-label-text {
                    font-size: 13px;
                    font-weight: 600;
                    color: #c4b5fd;
                    margin-top: 2px;
                }

                .dual-sub-note {
                    font-size: 11px;
                    color: var(--text-secondary);
                }

                .dual-metric-divider {
                    width: 1px;
                    height: 80px;
                    background: linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.35), transparent);
                }

                .dual-mountain-backdrop {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 50px;
                    pointer-events: none;
                    z-index: 0;
                }

                .mountain-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
            `}</style>
        </Card>
    );
}
