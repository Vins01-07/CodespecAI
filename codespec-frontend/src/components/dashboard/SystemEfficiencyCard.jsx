import { ArrowRight, MoreHorizontal, Sparkles } from "lucide-react";
import Card from "../common/Card";

function SystemEfficiencyCard({
    efficiency = 94.8,
    label = "Efficiency",
    sublabel = "AST & Service Health",
    context = "100% of nodes parsed cleanly",
}) {
    // Semi-circular arc math
    // Radius: 100, Center: 130, 115
    const radius = 85;
    const circumference = Math.PI * radius;
    // Percentage to stroke-dashoffset (semicircle: strokeDasharray = circumference)
    const progressOffset = circumference * (1 - efficiency / 100);

    return (
        <Card className="efficiency-card cs-card--gold">
            <div className="efficiency-header">
                <div className="efficiency-title-wrap">
                    <span className="efficiency-title">System Analysis</span>
                    <span className="efficiency-tag">AST / Index</span>
                </div>

                <div className="efficiency-header-actions">
                    <button className="icon-tiny-btn" type="button" aria-label="More options">
                        <MoreHorizontal size={14} />
                    </button>
                    <button className="icon-tiny-btn" type="button" aria-label="Open metrics">
                        <ArrowRight size={13} />
                    </button>
                </div>
            </div>

            <div className="gauge-container">
                <div className="gauge-center-text">
                    <span className="gauge-percentage">{efficiency.toFixed(2)}%</span>
                    <span className="gauge-label">{label}</span>
                </div>

                <svg className="gauge-svg" viewBox="0 0 260 140">
                    <defs>
                        {/* Glowing radial gradient for the area under the arch */}
                        <radialGradient id="gauge-glow" cx="50%" cy="100%" r="80%">
                            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.22)" />
                            <stop offset="50%" stopColor="rgba(124, 58, 237, 0.08)" />
                            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                        </radialGradient>
                        <linearGradient id="gauge-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c4b5fd" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>

                    {/* Ambient glow fill under arc */}
                    <path
                        d="M 35 125 A 95 95 0 0 1 225 125 Z"
                        fill="url(#gauge-glow)"
                    />

                    {/* Track Arch */}
                    <path
                        d="M 45 125 A 85 85 0 0 1 215 125"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="14"
                        strokeLinecap="round"
                    />

                    {/* Progress Arch */}
                    <path
                        d="M 45 125 A 85 85 0 0 1 215 125"
                        fill="none"
                        stroke="url(#gauge-arc-gradient)"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        style={{
                            transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    />
                </svg>
            </div>

            <div className="efficiency-footer">
                <span className="efficiency-sublabel">{context}</span>
            </div>

            <style>{`
                .efficiency-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    border-radius: var(--border-radius);
                    position: relative;
                    overflow: hidden;
                }
                .efficiency-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .efficiency-title-wrap {
                    display: flex;
                    flex-direction: column;
                }
                .efficiency-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #ffffff;
                }
                .efficiency-tag {
                    font-size: 11px;
                    color: var(--text-muted);
                    font-weight: 500;
                }
                .efficiency-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .icon-tiny-btn {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .icon-tiny-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(167, 139, 250, 0.3);
                }
                .gauge-container {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 8px 0 0;
                    height: 130px;
                }
                .gauge-svg {
                    width: 240px;
                    height: 130px;
                    display: block;
                }
                .gauge-center-text {
                    position: absolute;
                    bottom: 18px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    pointer-events: none;
                }
                .gauge-percentage {
                    font-size: 26px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.6px;
                    line-height: 1.1;

                }
                .gauge-label {
                    font-size: 11px;
                    color: var(--text-muted);
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    margin-top: 2px;
                }
                .efficiency-footer {
                    text-align: center;
                    padding-top: 4px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .efficiency-sublabel {
                    font-size: 11px;
                    color: var(--text-secondary);
                }
            `}</style>
        </Card>
    );
}

export default SystemEfficiencyCard;
