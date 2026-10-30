import { useState } from "react";
import { GitPullRequest, ArrowRight, Activity } from "lucide-react";
import Card from "../common/Card";

export default function NetworkRouteCard() {
    return (
        <Card className="network-route-card cs-card--gold">
            <div className="route-header">
                <div className="route-title-group">
                    <span className="route-dot" />
                    <span className="route-title">Regional Telemetry Route</span>
                </div>
                <span className="route-rate-badge">4.2 GB/s Flow</span>
            </div>

            {/* Network Route Visualizer */}
            <div className="route-canvas-wrap">
                <svg className="route-svg" viewBox="0 0 360 110" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="routeLineGold" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#c4b5fd" stopOpacity="1" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>

                    {/* Background Dotted Terrain */}
                    <g fill="#8b5cf6" opacity="0.25">
                        <circle cx="30" cy="40" r="1.8" /><circle cx="50" cy="35" r="1.8" /><circle cx="70" cy="45" r="1.8" />
                        <circle cx="40" cy="65" r="1.8" /><circle cx="65" cy="70" r="1.8" /><circle cx="90" cy="60" r="1.8" />
                        <circle cx="160" cy="30" r="1.8" /><circle cx="180" cy="38" r="1.8" /><circle cx="210" cy="35" r="1.8" />
                        <circle cx="270" cy="45" r="1.8" /><circle cx="295" cy="50" r="1.8" /><circle cx="330" cy="40" r="1.8" />
                        <circle cx="280" cy="80" r="1.8" /><circle cx="310" cy="85" r="1.8" />
                    </g>

                    {/* Primary Route Highway Connector Line */}
                    <path
                        d="M 30,55 Q 110,25 185,55 T 330,60"
                        fill="none"
                        stroke="url(#routeLineGold)"
                        strokeWidth="2.5"
                        strokeDasharray="5 5"
                    />

                    {/* Route Waypoint Hubs */}
                    <g className="waypoint-hub">
                        <circle cx="30" cy="55" r="4.5" fill="#c4b5fd" />
                        <circle cx="30" cy="55" r="9" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.4" />
                    </g>

                    <g className="waypoint-hub">
                        <circle cx="185" cy="55" r="5" fill="#c4b5fd" />
                        <circle cx="185" cy="55" r="11" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.5" />
                    </g>

                    <g className="waypoint-hub">
                        <circle cx="330" cy="60" r="4.5" fill="#c4b5fd" />
                        <circle cx="330" cy="60" r="9" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.4" />
                    </g>

                    {/* Animated Packet Stream (Moving Circle) */}
                    <circle cx="120" cy="38" r="3" fill="#ffffff" className="packet-dot">
                        <animate
                            attributeName="cx"
                            values="30;185;330"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="cy"
                            values="55;55;60"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>

                {/* Micro Node Labels */}
                <div className="route-node-labels">
                    <span className="node-lbl">EDGE-US</span>
                    <span className="node-lbl center">CORE-AST-BROKER</span>
                    <span className="node-lbl right">SYNC-EU</span>
                </div>
            </div>

            <div className="route-footer">
                <span className="route-sub-txt">Sub-millisecond packet synchronization</span>
                <span className="route-ok-txt">0.18ms</span>
            </div>

            <style>{`
                .network-route-card {
                    padding: 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    border-radius: var(--border-radius);
                }

                .route-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .route-title-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .route-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #c4b5fd;
                }

                .route-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .route-rate-badge {
                    padding: 2px 8px;
                    border-radius: 9999px;
                    background: rgba(139, 92, 246, 0.12);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    color: #c4b5fd;
                    font-size: 10px;
                    font-weight: 700;
                }

                .route-canvas-wrap {
                    position: relative;
                    width: 100%;
                    height: 85px;
                }

                .route-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .route-node-labels {
                    position: absolute;
                    bottom: 2px;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 10px;
                }

                .node-lbl {
                    font-size: 8.5px;
                    font-weight: 700;
                    color: var(--text-muted);
                    letter-spacing: 0.06em;
                }

                .node-lbl.center {
                    color: #c4b5fd;
                }

                .route-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 8px;
                    font-size: 10.5px;
                }

                .route-sub-txt {
                    color: var(--text-muted);
                }

                .route-ok-txt {
                    color: #6ee7b7;
                    font-weight: 700;
                }
            `}</style>
        </Card>
    );
}
