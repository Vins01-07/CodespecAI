import { useState } from "react";
import { TrendingUp, Activity, Layers } from "lucide-react";
import Card from "../common/Card";

export default function TrendAreaChartCard() {
    const [activeRange, setActiveRange] = useState("24h");

    const ranges = ["24h", "7d", "30d"];

    return (
        <Card className="trend-area-card cs-card--gold">
            <div className="trend-top-header">
                <div className="trend-title-meta">
                    <span className="trend-category-tag">AST Throughput</span>
                    <h3 className="trend-title">Continuous Ingestion</h3>
                </div>

                <div className="trend-range-pills">
                    {ranges.map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setActiveRange(r)}
                            className={`trend-pill-btn ${activeRange === r ? "active" : ""}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Spline Area Chart */}
            <div className="trend-chart-container">
                <svg className="trend-svg" viewBox="0 0 360 140" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="trendGoldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.38" />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="trendLineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c4b5fd" />
                            <stop offset="60%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>

                    {/* Threshold Horizontal Gridlines */}
                    <line x1="0" y1="35" x2="360" y2="35" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 4" strokeWidth="1" />
                    <line x1="0" y1="75" x2="360" y2="75" stroke="rgba(139, 92, 246, 0.15)" strokeDasharray="2 3" strokeWidth="1" />
                    <line x1="0" y1="115" x2="360" y2="115" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

                    {/* Smooth Mountain Fill Area */}
                    <path
                        d="M 0,105 
                           C 45,95 70,60 110,65 
                           C 145,70 165,115 205,80 
                           C 240,48 260,35 295,42 
                           C 325,48 340,70 360,60 
                           L 360,135 L 0,135 Z"
                        fill="url(#trendGoldGradient)"
                    />

                    {/* Violet Spline Stroke */}
                    <path
                        d="M 0,105 
                           C 45,95 70,60 110,65 
                           C 145,70 165,115 205,80 
                           C 240,48 260,35 295,42 
                           C 325,48 340,70 360,60"
                        fill="none"
                        stroke="url(#trendLineStroke)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />

                    {/* Active Highlight Points */}
                    <circle cx="295" cy="42" r="4.5" fill="#c4b5fd" stroke="#0c0d12" strokeWidth="2" />
                    <circle cx="295" cy="42" r="8" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.6" />
                </svg>

                {/* Live Floating Metric Badge */}
                <div className="trend-floating-badge">
                    <span className="badge-value">99.8%</span>
                    <span className="badge-label">Purity Index</span>
                </div>
            </div>

            {/* Bottom Telemetry Metrics */}
            <div className="trend-footer-row">
                <div className="trend-stat-block">
                    <span className="stat-sub">PEAK INGESTION</span>
                    <span className="stat-val">4.8k ops/s</span>
                </div>
                <div className="trend-stat-divider" />
                <div className="trend-stat-block">
                    <span className="stat-sub">AVG LATENCY</span>
                    <span className="stat-val">12.4 ms</span>
                </div>
                <div className="trend-stat-divider" />
                <div className="trend-stat-block">
                    <span className="stat-sub">AST COVERAGE</span>
                    <span className="stat-val gold-text">100% CLEAN</span>
                </div>
            </div>

            <style>{`
                .trend-area-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    border-radius: var(--border-radius);
                }

                .trend-top-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .trend-category-tag {
                    font-size: 10.5px;
                    font-weight: 700;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                }

                .trend-title {
                    font-size: 14.5px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 2px 0 0;
                }

                .trend-range-pills {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    padding: 3px;
                    border-radius: 9999px;
                }

                .trend-pill-btn {
                    padding: 3px 9px;
                    border-radius: 9999px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    font-size: 10.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .trend-pill-btn:hover {
                    color: var(--text-primary);
                }

                .trend-pill-btn.active {
                    background: #8b5cf6;
                    color: #ffffff;
                    font-weight: 700;
                }

                .trend-chart-container {
                    position: relative;
                    width: 100%;
                    height: 120px;
                    margin: 4px 0;
                }

                .trend-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                    overflow: visible;
                }

                .trend-floating-badge {
                    position: absolute;
                    top: 8px;
                    right: 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    padding: 4px 8px;
                    background: rgba(18, 20, 26, 0.85);
                    border: 1px solid rgba(139, 92, 246, 0.28);
                    border-radius: 8px;
                    backdrop-filter: blur(8px);
                }

                .badge-value {
                    font-size: 13px;
                    font-weight: 800;
                    color: #c4b5fd;
                    line-height: 1;
                }

                .badge-label {
                    font-size: 9px;
                    color: var(--text-muted);
                    font-weight: 600;
                    margin-top: 2px;
                }

                .trend-footer-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .trend-stat-block {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .stat-sub {
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    color: var(--text-muted);
                }

                .stat-val {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-secondary);
                }

                .gold-text {
                    color: #c4b5fd;
                }

                .trend-stat-divider {
                    width: 1px;
                    height: 22px;
                    background: rgba(255, 255, 255, 0.06);
                }
            `}</style>
        </Card>
    );
}
