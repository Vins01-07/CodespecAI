import { useState } from "react";
import { Compass, CheckCircle2, ShieldCheck, Activity, Cpu, SlidersHorizontal } from "lucide-react";
import Card from "../common/Card";

export default function RadarScannerCard() {
    const [sensitivity, setSensitivity] = useState(72);
    const [activeTarget, setActiveTarget] = useState("AST Engine");

    const statusItems = [
        { id: 1, label: "AST Parser Worker", status: "Optimal", ping: "4ms", icon: Cpu },
        { id: 2, label: "Symbol Graph Indexer", status: "Active", ping: "9ms", icon: Activity },
        { id: 3, label: "Security & Policy Shield", status: "Protected", ping: "2ms", icon: ShieldCheck },
    ];

    return (
        <Card className="radar-scanner-card cs-card--gold">
            {/* Header */}
            <div className="radar-header">
                <div className="radar-title-group">
                    <span className="radar-badge-dot" />
                    <span className="radar-title">System Scanner</span>
                </div>
                <div className="radar-meta-pill">
                    <Compass size={12} className="spin-slow" />
                    <span>0° N • 248° W</span>
                </div>
            </div>

            {/* Radar Dial */}
            <div className="radar-viewport">
                <div className="radar-glow-ambient" />

                <svg className="radar-svg" viewBox="0 0 240 240">
                    <defs>
                        <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.35" />
                            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Concentric Coordinate Rings */}
                    <circle cx="120" cy="120" r="105" fill="none" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" />
                    <circle cx="120" cy="120" r="75" fill="none" stroke="rgba(139, 92, 246, 0.22)" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="120" cy="120" r="45" fill="none" stroke="rgba(139, 92, 246, 0.35)" strokeWidth="1.2" />
                    <circle cx="120" cy="120" r="16" fill="rgba(139, 92, 246, 0.12)" stroke="#c4b5fd" strokeWidth="1.5" />

                    {/* Crosshair Axes */}
                    <line x1="120" y1="12" x2="120" y2="228" stroke="rgba(139, 92, 246, 0.18)" strokeWidth="1" />
                    <line x1="12" y1="120" x2="228" y2="120" stroke="rgba(139, 92, 246, 0.18)" strokeWidth="1" />

                    {/* Outer tick marks */}
                    <line x1="120" y1="5" x2="120" y2="15" stroke="#c4b5fd" strokeWidth="1.5" />
                    <line x1="120" y1="225" x2="120" y2="235" stroke="#c4b5fd" strokeWidth="1.5" />
                    <line x1="5" y1="120" x2="15" y2="120" stroke="#c4b5fd" strokeWidth="1.5" />
                    <line x1="225" y1="120" x2="235" y2="120" stroke="#c4b5fd" strokeWidth="1.5" />

                    {/* Rotating Sweep Beam */}
                    <g className="radar-sweep-beam">
                        <path
                            d="M 120 120 L 120 15 A 105 105 0 0 1 205 60 Z"
                            fill="url(#radarSweepGrad)"
                        />
                        <line x1="120" y1="120" x2="120" y2="15" stroke="#c4b5fd" strokeWidth="1.8" />
                    </g>

                    {/* Telemetry Target Blips */}
                    <g className="radar-blip b1">
                        <circle cx="85" cy="80" r="4.5" fill="#c4b5fd" />
                        <circle cx="85" cy="80" r="9" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.6" className="pulse-ring" />
                    </g>
                    <g className="radar-blip b2">
                        <circle cx="165" cy="145" r="3.5" fill="#a78bfa" />
                    </g>
                    <g className="radar-blip b3">
                        <circle cx="140" cy="65" r="3" fill="#8b5cf6" opacity="0.8" />
                    </g>
                </svg>

                {/* Compass HUD Center Coordinate */}
                <div className="radar-hud-tag">
                    <span className="radar-hud-val">{sensitivity}%</span>
                    <span className="radar-hud-lbl">RADAR GAIN</span>
                </div>
            </div>

            {/* Sensitivity Slider Control */}
            <div className="radar-slider-wrap">
                <div className="radar-slider-row">
                    <span className="slider-label">
                        <SlidersHorizontal size={11} />
                        Scan Resolution
                    </span>
                    <span className="slider-value">{sensitivity} kHz</span>
                </div>
                <input
                    type="range"
                    min="20"
                    max="100"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(Number(e.target.value))}
                    className="gold-range-slider"
                />
            </div>

            {/* System Status Checklist */}
            <div className="radar-status-section">
                <div className="status-section-title">Telemetry Status</div>
                <div className="status-items-list">
                    {statusItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.id} className="status-row-item">
                                <div className="status-item-left">
                                    <span className="gold-bullet-dot" />
                                    <Icon size={12} className="status-icon" />
                                    <span className="status-item-name">{item.label}</span>
                                </div>
                                <div className="status-item-right">
                                    <span className="status-ping">{item.ping}</span>
                                    <span className="status-badge-chip">{item.status}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                .radar-scanner-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    border-radius: var(--border-radius);
                    position: relative;
                }

                .radar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .radar-title-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .radar-badge-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #c4b5fd;
                    box-shadow: 0 0 8px rgba(196, 181, 253, 0.6);
                }

                .radar-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: -0.2px;
                }

                .radar-meta-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 3px 9px;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    border-radius: 9999px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #c4b5fd;
                }

                .spin-slow {
                    animation: spinRadar 14s linear infinite;
                }

                .radar-viewport {
                    position: relative;
                    width: 100%;
                    max-width: 220px;
                    margin: 0 auto;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .radar-glow-ambient {
                    position: absolute;
                    inset: 15%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
                    pointer-events: none;
                }

                .radar-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .radar-sweep-beam {
                    transform-origin: 120px 120px;
                    animation: spinRadar 4s linear infinite;
                }

                @keyframes spinRadar {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .pulse-ring {
                    animation: pingRing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                    transform-origin: 85px 80px;
                }

                @keyframes pingRing {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }

                .radar-hud-tag {
                    position: absolute;
                    bottom: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    pointer-events: none;
                }

                .radar-hud-val {
                    font-size: 13px;
                    font-weight: 800;
                    color: #c4b5fd;
                    line-height: 1;
                }

                .radar-hud-lbl {
                    font-size: 8.5px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                    margin-top: 2px;
                }

                .radar-slider-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }

                .radar-slider-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11px;
                }

                .slider-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    color: var(--text-secondary);
                    font-weight: 600;
                }

                .slider-value {
                    color: #c4b5fd;
                    font-weight: 700;
                    font-family: inherit;
                }

                .gold-range-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 5px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.08);
                    outline: none;
                }

                .gold-range-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%);
                    cursor: pointer;
                    box-shadow: 0 0 6px rgba(139, 92, 246, 0.6);
                    border: 2px solid #0c0d12;
                }

                .radar-status-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    padding-top: 10px;
                }

                .status-section-title {
                    font-size: 10.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--text-muted);
                }

                .status-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .status-row-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 5px 8px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.02);
                    transition: background 0.15s ease;
                }

                .status-row-item:hover {
                    background: rgba(139, 92, 246, 0.08);
                }

                .status-item-left {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }

                .gold-bullet-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #8b5cf6;
                }

                .status-icon {
                    color: var(--text-muted);
                }

                .status-item-name {
                    font-size: 11.5px;
                    color: var(--text-primary);
                    font-weight: 500;
                }

                .status-item-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-ping {
                    font-size: 10px;
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .status-badge-chip {
                    padding: 2px 7px;
                    border-radius: 9999px;
                    background: rgba(52, 211, 153, 0.1);
                    border: 1px solid rgba(52, 211, 153, 0.2);
                    color: #6ee7b7;
                    font-size: 9.5px;
                    font-weight: 700;
                }
            `}</style>
        </Card>
    );
}
