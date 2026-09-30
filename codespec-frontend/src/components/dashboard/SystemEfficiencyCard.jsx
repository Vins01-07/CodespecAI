import { ArrowRight, MoreHorizontal } from "lucide-react";
import Card from "../common/Card";

function SystemEfficiencyCard({
    efficiency = 94.8,
    label = "Efficiency",
    sublabel = "AST & Service Health",
    context = "100% of nodes parsed cleanly",
}) {
    // Semi-circular arc math
    const radius = 80;
    const circumference = Math.PI * radius;
    const progressOffset = circumference * (1 - efficiency / 100);

    return (
        <Card className="efficiency-card cs-card--gold">
            <div className="efficiency-header">
                <div className="efficiency-title-wrap">
                    <span className="efficiency-title">System Analysis</span>
                    <span className="efficiency-tag font-mono">AST / INDEX</span>
                </div>

                <div className="efficiency-header-actions">
                    <button className="icon-tiny-btn" type="button" aria-label="More options">
                        <MoreHorizontal size={13} />
                    </button>
                    <button className="icon-tiny-btn" type="button" aria-label="Open metrics">
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            <div className="gauge-container">
                <div className="gauge-center-text">
                    <span className="gauge-percentage font-mono">{efficiency.toFixed(1)}%</span>
                    <span className="gauge-label font-mono">{label}</span>
                </div>

                <svg className="gauge-svg" viewBox="0 0 240 130">
                    <defs>
                        <radialGradient id="gauge-glow" cx="50%" cy="100%" r="80%">
                            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.25)" />
                            <stop offset="60%" stopColor="rgba(139, 92, 246, 0.05)" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                        <linearGradient id="gauge-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#c4b5fd" />
                        </linearGradient>
                    </defs>

                    {/* Ambient glow fill under arc */}
                    <path
                        d="M 35 115 A 85 85 0 0 1 205 115 Z"
                        fill="url(#gauge-glow)"
                    />

                    {/* Track Arch */}
                    <path
                        d="M 40 115 A 80 80 0 0 1 200 115"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="12"
                        strokeLinecap="square"
                    />

                    {/* Progress Arch */}
                    <path
                        d="M 40 115 A 80 80 0 0 1 200 115"
                        fill="none"
                        stroke="url(#gauge-arc-gradient)"
                        strokeWidth="12"
                        strokeLinecap="square"
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
                    padding: 14px 18px;
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
                    font-size: 13.5px;
                    font-weight: 800;
                    color: #ffffff;
                }
                .efficiency-tag {
                    font-size: 10px;
                    color: var(--text-muted);
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
                .efficiency-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .icon-tiny-btn {
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                    background: #090a0f;
                    border: 1px solid var(--card-border);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .icon-tiny-btn:hover {
                    color: #ffffff;
                    background: #141620;
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .gauge-container {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 4px 0 0;
                    height: 120px;
                }
                .gauge-svg {
                    width: 220px;
                    height: 120px;
                    display: block;
                }
                .gauge-center-text {
                    position: absolute;
                    bottom: 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    pointer-events: none;
                }
                .gauge-percentage {
                    font-size: 24px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.6px;
                    line-height: 1.1;
                }
                .gauge-label {
                    font-size: 10px;
                    color: var(--text-muted);
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    margin-top: 1px;
                }
                .efficiency-footer {
                    text-align: center;
                    padding-top: 6px;
                    border-top: 1px solid var(--card-border);
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
