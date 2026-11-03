import { ArrowRight, MoreHorizontal, Sparkles } from "lucide-react";
import Card from "../common/Card";

function SystemEfficiencyCard({
    efficiency = 96.7,
    label = "EFFICIENCY",
    sublabel = "AST & Service Health",
    context = "100% of nodes parsed cleanly â€¢ 0 vulnerabilities",
}) {
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference * (1 - efficiency / 100);

    return (
        <Card className="efficiency-card">
            <div className="efficiency-header">
                <div className="efficiency-title-wrap">
                    <span className="efficiency-title">System Analysis</span>
                    <span className="efficiency-tag font-mono">AST / HEALTH SCORE</span>
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

                <svg className="gauge-svg" viewBox="0 0 200 200">
                    <defs>
                        <filter id="gauge-red-glow" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="gauge-arc-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#A80018" />
                            <stop offset="40%" stopColor="#E32636" />
                            <stop offset="100%" stopColor="#FF3548" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.06)"
                        strokeWidth="11"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="url(#gauge-arc-gradient)"
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        transform="rotate(-90 100 100)"
                        filter="url(#gauge-red-glow)"
                        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    />
                </svg>

                <div className="sparkle-badge" aria-hidden="true">
                    <Sparkles size={14} className="sparkle-icon" />
                </div>
            </div>

            <div className="efficiency-footer">
                <span className="efficiency-sublabel">{context}</span>
            </div>

            <style>{`
                .efficiency-card {
                    padding: 16px 18px;
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
                    gap: 1px;
                }
                .efficiency-title {
                    font-size: 14.5px;
                    font-weight: 800;
                    color: #F5F5F7;
                }
                .efficiency-tag {
                    font-size: 10px;
                    color: var(--secondary-text);
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
                .efficiency-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .icon-tiny-btn {
                    width: 26px;
                    height: 26px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--secondary-text);
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }
                .icon-tiny-btn:hover {
                    color: #FFFFFF;
                    border-color: rgba(227, 38, 54, 0.4);
                }
                .gauge-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 0;
                }
                .gauge-svg {
                    width: 170px;
                    height: 170px;
                }
                .gauge-center-text {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
                .gauge-percentage {
                    font-size: 28px;
                    font-weight: 800;
                    color: #F5F5F7;
                    letter-spacing: -0.6px;
                    line-height: 1;
                }
                .gauge-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--bright-red);
                    letter-spacing: 0.08em;
                    margin-top: 4px;
                }
                .sparkle-badge {
                    position: absolute;
                    bottom: 14px;
                    right: 28px;
                    color: var(--bright-red);
                    filter: drop-shadow(0 0 6px rgba(255, 53, 72, 0.8));
                }
                .efficiency-footer {
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    font-size: 11px;
                    color: var(--secondary-text);
                    text-align: center;
                }
            `}</style>
        </Card>
    );
}

export default SystemEfficiencyCard;
