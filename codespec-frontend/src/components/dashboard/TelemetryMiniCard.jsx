import { useState } from "react";
import { Zap, Radio, Check } from "lucide-react";
import Card from "../common/Card";

export default function TelemetryMiniCard() {
    const [activePill, setActivePill] = useState(1);

    return (
        <Card className="telemetry-mini-card cs-card--gold">
            <div className="mini-left-col">
                <span className="mini-label">DELTA DRIFT</span>
                <div className="mini-value-row">
                    <span className="mini-big-stat">6%</span>
                    <span className="mini-badge-ok">NOMINAL</span>
                </div>
                <div className="mini-subtext">AST variance delta</div>
            </div>

            <div className="mini-center-divider" />

            <div className="mini-right-col">
                <div className="mini-pill-switches">
                    <button
                        type="button"
                        onClick={() => setActivePill(1)}
                        className={`mini-pill-btn ${activePill === 1 ? "active" : ""}`}
                    >
                        <Zap size={10} />
                        <span>Turbo</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActivePill(2)}
                        className={`mini-pill-btn ${activePill === 2 ? "active" : ""}`}
                    >
                        <Radio size={10} />
                        <span>Stream</span>
                    </button>
                </div>

                <div className="mini-footer-stats">
                    <span className="mini-ping-val">0.14ms jitter</span>
                    <span className="mini-status-dot" />
                </div>
            </div>

            <style>{`
                .telemetry-mini-card {
                    padding: 14px 18px;
                    display: grid;
                    grid-template-columns: 1fr 1px 1fr;
                    gap: 14px;
                    align-items: center;
                    border-radius: var(--border-radius);
                }

                .mini-left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .mini-label {
                    font-size: 9.5px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                }

                .mini-value-row {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }

                .mini-big-stat {
                    font-size: 26px;
                    font-weight: 800;
                    color: #c4b5fd;
                    line-height: 1.1;
                }

                .mini-badge-ok {
                    padding: 1px 6px;
                    border-radius: 9999px;
                    background: rgba(52, 211, 153, 0.1);
                    border: 1px solid rgba(52, 211, 153, 0.2);
                    color: #6ee7b7;
                    font-size: 8.5px;
                    font-weight: 700;
                }

                .mini-subtext {
                    font-size: 10px;
                    color: var(--text-secondary);
                }

                .mini-center-divider {
                    width: 1px;
                    height: 48px;
                    background: rgba(255, 255, 255, 0.06);
                }

                .mini-right-col {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .mini-pill-switches {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .mini-pill-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--text-muted);
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .mini-pill-btn.active {
                    background: #8b5cf6;
                    border-color: #a78bfa;
                    color: #ffffff;
                    font-weight: 700;
                }

                .mini-footer-stats {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .mini-ping-val {
                    font-size: 10px;
                    color: var(--text-muted);
                }

                .mini-status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #6ee7b7;
                    box-shadow: 0 0 6px #6ee7b7;
                }
            `}</style>
        </Card>
    );
}
