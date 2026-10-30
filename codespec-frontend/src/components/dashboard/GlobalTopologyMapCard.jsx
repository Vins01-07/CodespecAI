import { useState } from "react";
import { Globe, Radio, Wifi, Zap } from "lucide-react";
import Card from "../common/Card";

export default function GlobalTopologyMapCard() {
    const [selectedRegion, setSelectedRegion] = useState("Americas");

    const regions = [
        { id: "Americas", ping: "14ms", status: "Operational", activeNodes: 420 },
        { id: "EMEA", ping: "22ms", status: "Operational", activeNodes: 380 },
        { id: "APAC", ping: "38ms", status: "Operational", activeNodes: 290 },
    ];

    return (
        <Card className="global-map-card cs-card--gold">
            <div className="map-header">
                <div className="map-header-left">
                    <span className="map-live-dot" />
                    <span className="map-title">Global Topology</span>
                </div>

                <div className="map-region-pills">
                    {regions.map((reg) => (
                        <button
                            key={reg.id}
                            type="button"
                            onClick={() => setSelectedRegion(reg.id)}
                            className={`map-pill-btn ${selectedRegion === reg.id ? "active" : ""}`}
                        >
                            {reg.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dotted Matrix World Map SVG */}
            <div className="map-canvas-container">
                <svg className="world-map-svg" viewBox="0 0 540 260">
                    <defs>
                        <radialGradient id="mapGlowPoint" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="arcFlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.9" />
                        </linearGradient>
                    </defs>

                    {/* Dotted Continents Pattern */}
                    <g className="map-continents" fill="#8b5cf6" opacity="0.35">
                        {/* North America Dotted Cluster */}
                        <circle cx="80" cy="65" r="2.2" /><circle cx="95" cy="60" r="2.2" /><circle cx="110" cy="55" r="2.2" /><circle cx="125" cy="50" r="2.2" />
                        <circle cx="75" cy="80" r="2.2" /><circle cx="90" cy="75" r="2.2" /><circle cx="105" cy="70" r="2.2" /><circle cx="120" cy="68" r="2.2" /><circle cx="135" cy="65" r="2.2" />
                        <circle cx="85" cy="95" r="2.2" /><circle cx="100" cy="90" r="2.2" /><circle cx="115" cy="85" r="2.2" /><circle cx="130" cy="82" r="2.2" /><circle cx="145" cy="80" r="2.2" />
                        <circle cx="95" cy="110" r="2.2" /><circle cx="110" cy="105" r="2.2" /><circle cx="125" cy="100" r="2.2" /><circle cx="140" cy="98" r="2.2" />
                        <circle cx="115" cy="125" r="2.2" /><circle cx="130" cy="120" r="2.2" />

                        {/* South America Dotted Cluster */}
                        <circle cx="140" cy="150" r="2.2" /><circle cx="155" cy="155" r="2.2" />
                        <circle cx="145" cy="165" r="2.2" /><circle cx="160" cy="170" r="2.2" /><circle cx="175" cy="172" r="2.2" />
                        <circle cx="150" cy="180" r="2.2" /><circle cx="165" cy="185" r="2.2" /><circle cx="180" cy="188" r="2.2" />
                        <circle cx="155" cy="195" r="2.2" /><circle cx="170" cy="200" r="2.2" />
                        <circle cx="160" cy="210" r="2.2" />

                        {/* Europe Cluster */}
                        <circle cx="260" cy="60" r="2.2" /><circle cx="275" cy="55" r="2.2" /><circle cx="290" cy="58" r="2.2" /><circle cx="305" cy="62" r="2.2" />
                        <circle cx="255" cy="75" r="2.2" /><circle cx="270" cy="72" r="2.2" /><circle cx="285" cy="70" r="2.2" /><circle cx="300" cy="75" r="2.2" />
                        <circle cx="265" cy="90" r="2.2" /><circle cx="280" cy="88" r="2.2" /><circle cx="295" cy="85" r="2.2" />

                        {/* Africa Cluster */}
                        <circle cx="265" cy="115" r="2.2" /><circle cx="280" cy="112" r="2.2" /><circle cx="295" cy="118" r="2.2" />
                        <circle cx="260" cy="130" r="2.2" /><circle cx="275" cy="132" r="2.2" /><circle cx="290" cy="135" r="2.2" /><circle cx="305" cy="140" r="2.2" />
                        <circle cx="270" cy="145" r="2.2" /><circle cx="285" cy="150" r="2.2" /><circle cx="300" cy="155" r="2.2" />
                        <circle cx="280" cy="165" r="2.2" /><circle cx="295" cy="170" r="2.2" />
                        <circle cx="290" cy="185" r="2.2" />

                        {/* Asia Cluster */}
                        <circle cx="340" cy="65" r="2.2" /><circle cx="355" cy="60" r="2.2" /><circle cx="370" cy="62" r="2.2" /><circle cx="385" cy="68" r="2.2" /><circle cx="400" cy="70" r="2.2" /><circle cx="415" cy="75" r="2.2" />
                        <circle cx="330" cy="80" r="2.2" /><circle cx="345" cy="78" r="2.2" /><circle cx="360" cy="75" r="2.2" /><circle cx="375" cy="82" r="2.2" /><circle cx="390" cy="85" r="2.2" /><circle cx="405" cy="88" r="2.2" />
                        <circle cx="335" cy="95" r="2.2" /><circle cx="350" cy="92" r="2.2" /><circle cx="365" cy="90" r="2.2" /><circle cx="380" cy="98" r="2.2" /><circle cx="395" cy="102" r="2.2" /><circle cx="410" cy="105" r="2.2" />
                        <circle cx="355" cy="115" r="2.2" /><circle cx="370" cy="112" r="2.2" /><circle cx="385" cy="118" r="2.2" /><circle cx="400" cy="120" r="2.2" />
                        <circle cx="380" cy="130" r="2.2" /><circle cx="395" cy="135" r="2.2" />

                        {/* Australia / Oceania Cluster */}
                        <circle cx="420" cy="165" r="2.2" /><circle cx="435" cy="162" r="2.2" /><circle cx="450" cy="168" r="2.2" />
                        <circle cx="425" cy="180" r="2.2" /><circle cx="440" cy="178" r="2.2" /><circle cx="455" cy="182" r="2.2" />
                        <circle cx="430" cy="195" r="2.2" /><circle cx="445" cy="192" r="2.2" />
                    </g>

                    {/* Flight Highway Arcs connecting primary hubs */}
                    <path
                        d="M 120,70 Q 195,20 270,72"
                        fill="none"
                        stroke="url(#arcFlightGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                    />
                    <path
                        d="M 270,72 Q 320,40 375,82"
                        fill="none"
                        stroke="url(#arcFlightGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                    />
                    <path
                        d="M 375,82 Q 410,120 435,178"
                        fill="none"
                        stroke="url(#arcFlightGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                    />

                    {/* Primary Server Node: US East */}
                    <g className="map-node node-us">
                        <circle cx="120" cy="70" r="4.5" fill="#c4b5fd" />
                        <circle cx="120" cy="70" r="10" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.6" className="map-pulse" />
                    </g>

                    {/* Primary Server Node: EU Central */}
                    <g className="map-node node-eu">
                        <circle cx="270" cy="72" r="4.5" fill="#c4b5fd" />
                        <circle cx="270" cy="72" r="10" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.6" className="map-pulse" />
                    </g>

                    {/* Primary Server Node: Asia Pacific */}
                    <g className="map-node node-ap">
                        <circle cx="375" cy="82" r="4.5" fill="#c4b5fd" />
                        <circle cx="375" cy="82" r="10" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.6" className="map-pulse" />
                    </g>

                    {/* Primary Server Node: Sydney */}
                    <g className="map-node node-oc">
                        <circle cx="435" cy="178" r="4" fill="#a78bfa" />
                    </g>
                </svg>

                {/* Floating Region Telemetry HUD */}
                <div className="map-telemetry-hud">
                    <div className="hud-metric">
                        <span className="hud-val">99.98%</span>
                        <span className="hud-lbl">GLOBAL AVAILABILITY</span>
                    </div>
                    <div className="hud-metric">
                        <span className="hud-val">1,090</span>
                        <span className="hud-lbl">EDGE POPs</span>
                    </div>
                </div>
            </div>

            <style>{`
                .global-map-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    border-radius: var(--border-radius);
                    position: relative;
                }

                .map-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .map-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .map-live-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #c4b5fd;
                    box-shadow: 0 0 8px rgba(196, 181, 253, 0.6);
                }

                .map-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .map-region-pills {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    padding: 3px;
                    border-radius: 9999px;
                }

                .map-pill-btn {
                    padding: 3px 9px;
                    border-radius: 9999px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .map-pill-btn:hover {
                    color: var(--text-primary);
                }

                .map-pill-btn.active {
                    background: #8b5cf6;
                    color: #ffffff;
                    font-weight: 700;
                }

                .map-canvas-container {
                    position: relative;
                    width: 100%;
                    height: 180px;
                    }

                .world-map-svg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .map-pulse {
                    animation: mapPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                    transform-origin: center;
                }

                @keyframes mapPing {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(2.2); opacity: 0; }
                }

                .map-telemetry-hud {
                    position: absolute;
                    bottom: 8px;
                    left: 12px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: rgba(15, 17, 23, 0.88);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    backdrop-filter: blur(10px);
                }

                .hud-metric {
                    display: flex;
                    flex-direction: column;
                }

                .hud-val {
                    font-size: 12px;
                    font-weight: 800;
                    color: #c4b5fd;
                    line-height: 1;
                }

                .hud-lbl {
                    font-size: 8.5px;
                    font-weight: 700;
                    color: var(--text-muted);
                    letter-spacing: 0.06em;
                    margin-top: 2px;
                }
            `}</style>
        </Card>
    );
}
