import { useState } from "react";
import { Gauge, Zap, TrendingUp, MoreHorizontal } from "lucide-react";
import Card from "../common/Card";

export default function SpeedometerGaugeCard() {
    const [speedVal] = useState("3,312.00");

    // Slanted speed indicator bars
    const speedBars = [
        { id: 1, active: true, height: 16 },
        { id: 2, active: true, height: 24 },
        { id: 3, active: true, height: 32 },
        { id: 4, active: true, height: 40 },
        { id: 5, active: true, height: 48 },
        { id: 6, active: false, height: 56 },
    ];

    return (
        <Card className="speedometer-card cs-card--gold">
            <div className="speedometer-top-row">
                <div className="speedometer-title-group">
                    <span className="speedometer-ring-dot" />
                    <span className="speedometer-title">Performance Index</span>
                </div>

                <div className="speedometer-badge-status">
                    <Zap size={11} />
                    <span>Peak Bandwidth</span>
                </div>
            </div>

            {/* Main Gauge Visual: Slanted Speed Bars on Left + Circular Arc Gauge on Right */}
            <div className="speedometer-body">
                {/* Slanted Telemetry Speed Bars (from screenshot) */}
                <div className="speedometer-left-bars">
                    <span className="speed-bars-label">DIAG / IO</span>
                    <div className="diagonal-bars-cluster">
                        {speedBars.map((bar) => (
                            <div
                                key={bar.id}
                                className={`diag-bar-pill ${bar.active ? "active" : ""}`}
                                style={{ height: `${bar.height}px` }}
                            />
                        ))}
                    </div>
                    <span className="speed-bars-footer">92% CAP</span>
                </div>

                {/* Circular Segmented Arc Gauge */}
                <div className="speedometer-arc-wrap">
                    <svg className="speedometer-svg" viewBox="0 0 200 200">
                        <defs>
                            <linearGradient id="goldSpeedArc" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#7c3aed" />
                                <stop offset="60%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#c4b5fd" />
                            </linearGradient>
                            <radialGradient id="arcCenterGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(139, 92, 246, 0.18)" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                        </defs>

                        {/* Ambient center radial glow */}
                        <circle cx="100" cy="100" r="75" fill="url(#arcCenterGlow)" />

                        {/* Background track circle */}
                        <circle
                            cx="100"
                            cy="100"
                            r="70"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.06)"
                            strokeWidth="8"
                            strokeDasharray="400"
                            strokeDashoffset="80"
                            strokeLinecap="round"
                            transform="rotate(135 100 100)"
                        />

                        {/* Outer tick ring */}
                        <circle
                            cx="100"
                            cy="100"
                            r="82"
                            fill="none"
                            stroke="rgba(139, 92, 246, 0.25)"
                            strokeWidth="1.5"
                            strokeDasharray="2 6"
                        />

                        {/* Active Violet Progress Arc */}
                        <circle
                            cx="100"
                            cy="100"
                            r="70"
                            fill="none"
                            stroke="url(#goldSpeedArc)"
                            strokeWidth="8"
                            strokeDasharray="440"
                            strokeDashoffset="170"
                            strokeLinecap="round"
                            transform="rotate(135 100 100)"
                        />

                        {/* Pointer indicator bead */}
                        <circle cx="155" cy="140" r="4.5" fill="#c4b5fd" />
                        <circle cx="155" cy="140" r="8" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.5" />
                    </svg>

                    {/* Central Value Readout (Matches "3,312.00" from screenshot) */}
                    <div className="speedometer-center-val">
                        <span className="speed-big-number">{speedVal}</span>
                        <span className="speed-unit-lbl">OPS / SEC</span>
                    </div>
                </div>
            </div>

            {/* Bottom Status Row */}
            <div className="speedometer-footer">
                <div className="speed-foot-item">
                    <span className="foot-lbl">BUFFER HEALTH</span>
                    <span className="foot-val">99.4% Synchronized</span>
                </div>
                <div className="speed-foot-item" style={{ textAlign: "right" }}>
                    <span className="foot-lbl">EXECUTION RATE</span>
                    <span className="foot-val gold">0.42 ms / cycle</span>
                </div>
            </div>

            <style>{`
                .speedometer-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    border-radius: var(--border-radius);
                }

                .speedometer-top-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .speedometer-title-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .speedometer-ring-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #c4b5fd;
                }

                .speedometer-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .speedometer-badge-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 3px 9px;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    border-radius: 9999px;
                    font-size: 10px;
                    font-weight: 700;
                    color: #c4b5fd;
                }

                .speedometer-body {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                }

                .speedometer-left-bars {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                }

                .speed-bars-label {
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                }

                .diagonal-bars-cluster {
                    display: flex;
                    align-items: flex-end;
                    gap: 5px;
                    height: 60px;
                }

                .diag-bar-pill {
                    width: 6px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.08);
                    transform: skewX(-20deg);
                    transition: all 0.2s ease;
                }

                .diag-bar-pill.active {
                    background: linear-gradient(180deg, #c4b5fd 0%, #7c3aed 100%);
                    box-shadow: 0 0 6px rgba(139, 92, 246, 0.4);
                }

                .speed-bars-footer {
                    font-size: 9.5px;
                    font-weight: 700;
                    color: #c4b5fd;
                }

                .speedometer-arc-wrap {
                    position: relative;
                    width: 170px;
                    height: 170px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .speedometer-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .speedometer-center-val {
                    position: absolute;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    pointer-events: none;
                }

                .speed-big-number {
                    font-size: 22px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                    line-height: 1;
                }

                .speed-unit-lbl {
                    font-size: 9px;
                    font-weight: 700;
                    color: var(--text-muted);
                    letter-spacing: 0.06em;
                    margin-top: 4px;
                }

                .speedometer-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 10px;
                }

                .speed-foot-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .foot-lbl {
                    font-size: 9px;
                    font-weight: 700;
                    color: var(--text-muted);
                    letter-spacing: 0.06em;
                }

                .foot-val {
                    font-size: 11px;
                    color: var(--text-secondary);
                    font-weight: 600;
                }

                .foot-val.gold {
                    color: #c4b5fd;
                    font-weight: 700;
                }
            `}</style>
        </Card>
    );
}
