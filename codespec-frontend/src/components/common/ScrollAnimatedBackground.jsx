import { useEffect, useRef, useState } from "react";

/**
 * ScrollAnimatedBackground
 *
 * Renders a high-performance, GPU-accelerated dark geometric ambient background
 * matching the reference dark Neo-Brutalist developer aesthetic:
 * - Subtle purple geometric wireframe polygons & isometric grid matrix
 * - Restrained slow ambient atmospheric purple glow
 * - Digital coordinate crosses & floating geometry
 * - Gentle scroll parallax without visual distraction
 */
export default function ScrollAnimatedBackground() {
    const [scrollY, setScrollY] = useState(0);
    const rafId = useRef(null);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                rafId.current = window.requestAnimationFrame(() => {
                    const currentY =
                        window.scrollY ||
                        document.documentElement.scrollTop ||
                        document.querySelector(".page-content")?.scrollTop ||
                        0;
                    setScrollY(currentY);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        const pageContent = document.querySelector(".page-content");
        if (pageContent) {
            pageContent.addEventListener("scroll", handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (pageContent) {
                pageContent.removeEventListener("scroll", handleScroll);
            }
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    const parallax1 = scrollY * 0.12;
    const parallax2 = scrollY * -0.08;

    return (
        <div className="geometric-ambient-bg" aria-hidden="true">
            {/* Ambient Deep Atmospheric Glows */}
            <div
                className="geo-glow geo-glow-top"
                style={{
                    transform: `translate3d(0, ${parallax1 * 0.5}px, 0)`,
                }}
            />
            <div
                className="geo-glow geo-glow-bottom"
                style={{
                    transform: `translate3d(0, ${parallax2 * 0.5}px, 0)`,
                }}
            />

            {/* Geometric Grid Texture */}
            <div className="geo-grid-pattern" />

            {/* Subtle Purple Geometric Wireframe Vector Canvas */}
            <svg
                className="geo-vector-svg"
                viewBox="0 0 1440 900"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="purpleLineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.05" />
                    </linearGradient>

                    <linearGradient id="purpleLineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                        <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#312e81" stopOpacity="0.03" />
                    </linearGradient>

                    <pattern id="dotMatrix" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="rgba(139, 92, 246, 0.14)" />
                    </pattern>
                </defs>

                {/* Dot matrix grid */}
                <rect width="100%" height="100%" fill="url(#dotMatrix)" opacity="0.6" />

                {/* Top-Right Floating Geometric Wireframe Prism */}
                <g
                    className="floating-geo geo-prism-1"
                    style={{
                        transform: `translate3d(0, ${parallax1}px, 0)`,
                    }}
                >
                    <polygon
                        points="1180,120 1340,80 1400,220 1240,260"
                        fill="rgba(124, 58, 237, 0.03)"
                        stroke="url(#purpleLineGrad1)"
                        strokeWidth="1.2"
                    />
                    <line x1="1180" y1="120" x2="1400" y2="220" stroke="url(#purpleLineGrad1)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="1340" y1="80" x2="1240" y2="260" stroke="url(#purpleLineGrad1)" strokeWidth="1" strokeDasharray="3 3" />
                    
                    {/* Corner Crosses */}
                    <circle cx="1180" cy="120" r="2.5" fill="#a78bfa" opacity="0.6" />
                    <circle cx="1340" cy="80" r="2.5" fill="#a78bfa" opacity="0.6" />
                    <circle cx="1400" cy="220" r="2.5" fill="#a78bfa" opacity="0.6" />
                    <circle cx="1240" cy="260" r="2.5" fill="#a78bfa" opacity="0.6" />
                </g>

                {/* Bottom-Left Floating Geometric Polygonal Cluster */}
                <g
                    className="floating-geo geo-prism-2"
                    style={{
                        transform: `translate3d(0, ${parallax2}px, 0)`,
                    }}
                >
                    <polygon
                        points="80,680 240,620 320,760 160,820"
                        fill="rgba(139, 92, 246, 0.025)"
                        stroke="url(#purpleLineGrad2)"
                        strokeWidth="1.2"
                    />
                    <line x1="80" y1="680" x2="320" y2="760" stroke="url(#purpleLineGrad2)" strokeWidth="0.9" strokeDasharray="4 4" />
                    <polygon
                        points="240,620 380,580 440,700 320,760"
                        fill="rgba(99, 102, 241, 0.02)"
                        stroke="url(#purpleLineGrad2)"
                        strokeWidth="1"
                    />
                    <circle cx="240" cy="620" r="2" fill="#c084fc" opacity="0.5" />
                    <circle cx="320" cy="760" r="2" fill="#c084fc" opacity="0.5" />
                    <circle cx="160" cy="820" r="2" fill="#c084fc" opacity="0.5" />
                </g>

                {/* Subtle Coordinate Axis Lines */}
                <line x1="0" y1="450" x2="1440" y2="450" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="1" strokeDasharray="8 8" />
                <line x1="720" y1="0" x2="720" y2="900" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="1" strokeDasharray="8 8" />
            </svg>

            {/* Subtle Floating Node Markers */}
            <div className="geo-floating-nodes">
                <span className="geo-node n1" />
                <span className="geo-node n2" />
                <span className="geo-node n3" />
                <span className="geo-node n4" />
            </div>

            <style>{`
                .geometric-ambient-bg {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                    overflow: hidden;
                    contain: strict;
                    background: #07070a;
                }

                .geo-glow {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    will-change: transform;
                    filter: blur(100px);
                }

                .geo-glow-top {
                    top: -15%;
                    left: 20%;
                    width: 650px;
                    height: 550px;
                    background: radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 75%);
                    animation: subtlePulse 12s ease-in-out infinite alternate;
                }

                .geo-glow-bottom {
                    bottom: -20%;
                    right: 15%;
                    width: 750px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(109, 40, 217, 0.14) 0%, rgba(99, 102, 241, 0.04) 55%, transparent 75%);
                    animation: subtlePulse 15s ease-in-out 3s infinite alternate;
                }

                .geo-grid-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
                    background-size: 48px 48px;
                    opacity: 0.7;
                }

                .geo-vector-svg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                .floating-geo {
                    will-change: transform;
                    transition: transform 0.15s ease-out;
                }

                .geo-prism-1 {
                    animation: geoDrift1 20s ease-in-out infinite alternate;
                }

                .geo-prism-2 {
                    animation: geoDrift2 24s ease-in-out infinite alternate;
                }

                .geo-floating-nodes {
                    position: absolute;
                    inset: 0;
                }

                .geo-node {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: #a855f7;
                    border-radius: 1px;
                    box-shadow: 0 0 6px rgba(168, 85, 247, 0.8);
                    opacity: 0.35;
                }

                .n1 { top: 22%; left: 35%; animation: nodeFloat 8s ease-in-out infinite alternate; }
                .n2 { top: 65%; left: 78%; animation: nodeFloat 11s ease-in-out 1s infinite alternate; }
                .n3 { top: 82%; left: 25%; animation: nodeFloat 9.5s ease-in-out 2s infinite alternate; }
                .n4 { top: 30%; left: 88%; animation: nodeFloat 10s ease-in-out 0.5s infinite alternate; }

                @keyframes geoDrift1 {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(-15px, 12px) rotate(1.5deg); }
                }

                @keyframes geoDrift2 {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(12px, -14px) rotate(-1.5deg); }
                }

                @keyframes nodeFloat {
                    0% { transform: translateY(0); opacity: 0.25; }
                    50% { transform: translateY(-8px); opacity: 0.65; }
                    100% { transform: translateY(4px); opacity: 0.25; }
                }

                @keyframes subtlePulse {
                    0% { transform: scale(1); opacity: 0.85; }
                    50% { transform: scale(1.08); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.85; }
                }
            `}</style>
        </div>
    );
}
