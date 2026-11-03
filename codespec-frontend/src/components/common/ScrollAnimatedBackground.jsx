import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollAnimatedBackground
 *
 * Renders a continuously moving, organic ambient lighting background
 * inspired by the reference AI-assistant design:
 * - Mixed palette: Midnight Black (#08090D), Dark Charcoal (#151820),
 *   Deep Ocean Blue (#073A50), Dark Teal (#075A68), Muted Cyan (#168CA3),
 *   Soft Electric Blue (#254D9C), Subtle Indigo (#292052)
 * - Flowing, multi-layered radial fields moving beneath a dark glass surface
 * - Subtle dark vignette framing the viewport
 * - Route-aware adaptation for System Q&A, Dashboard, Architecture, etc.
 * - GPU-accelerated transforms & opacity, with prefers-reduced-motion fallback
 */
export default function ScrollAnimatedBackground() {
    const location = useLocation();
    const [scrollY, setScrollY] = useState(0);
    const rafId = useRef(null);

    // Subtle parallax tracking on scroll
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

    // Determine route modifier for contextual ambient intensity
    const pageClass = useMemo(() => {
        const path = location.pathname;
        if (path === "/system-qa") return "bg-system-qa";
        if (path === "/" || path === "/dashboard") return "bg-dashboard";
        if (path === "/architecture") return "bg-architecture";
        if (path === "/repository") return "bg-repository";
        if (path === "/knowledge-search") return "bg-search";
        if (path === "/dependencies") return "bg-dependencies";
        if (path === "/documentation") return "bg-docs";
        return "bg-default";
    }, [location.pathname]);

    // Very gentle parallax offsets
    const p1 = Math.min(scrollY * 0.05, 40);
    const p2 = Math.min(scrollY * -0.04, 30);

    return (
        <div className={`ambient-universe-bg ${pageClass}`} aria-hidden="true">
            {/* Deep Midnight Base */}
            <div className="ambient-base" />

            {/* Layer 1: Deep Ocean Blue & Dark Teal flowing across lower screen */}
            <div
                className="ambient-field ambient-ocean-teal"
                style={{ transform: `translate3d(0, ${p2}px, 0)` }}
            />

            {/* Layer 2: Muted Cyan gently diffusing around the center */}
            <div
                className="ambient-field ambient-cyan-diffuse"
                style={{ transform: `translate3d(0, ${p1 * 0.6}px, 0)` }}
            />

            {/* Layer 3: Soft Electric Blue drifting in the upper & mid areas */}
            <div
                className="ambient-field ambient-electric-blue"
                style={{ transform: `translate3d(0, ${p1}px, 0)` }}
            />

            {/* Layer 4: Subtle Indigo in selected zones for depth */}
            <div
                className="ambient-field ambient-indigo-depth"
                style={{ transform: `translate3d(0, ${p2 * 0.8}px, 0)` }}
            />

            {/* Layer 5: Dark Teal lateral drift */}
            <div className="ambient-field ambient-teal-lateral" />

            {/* Subtle Glass Surface Texture & Technical Micro-Grid */}
            <div className="ambient-glass-texture" />

            {/* Framing Vignette: Dark glass surface finish with edge shadow */}
            <div className="ambient-vignette" />

            <style>{`
                .ambient-universe-bg {
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    height: 100vh;
                    pointer-events: none;
                    z-index: -1;
                    overflow: hidden;
                    background-color: #08090D;
                    contain: strict;
                }

                .ambient-base {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 40%, #151820 0%, #08090D 85%);
                    opacity: 0.95;
                }

                /* Layer 1: Deep Ocean Blue & Dark Teal flow - lower screen */
                .ambient-ocean-teal {
                    position: absolute;
                    bottom: -15%;
                    left: -10%;
                    width: 120%;
                    height: 65%;
                    background: radial-gradient(
                        ellipse 70% 55% at 50% 85%,
                        rgba(7, 90, 104, 0.42) 0%,
                        rgba(7, 58, 80, 0.38) 35%,
                        rgba(8, 9, 13, 0) 75%
                    );
                    filter: blur(60px);
                    animation: flowOceanTeal 24s ease-in-out infinite alternate;
                    will-change: transform, opacity;
                }

                /* Layer 2: Muted Cyan gently diffusing around center */
                .ambient-cyan-diffuse {
                    position: absolute;
                    top: 25%;
                    left: 20%;
                    width: 65%;
                    height: 55%;
                    background: radial-gradient(
                        circle at 50% 50%,
                        rgba(22, 140, 163, 0.22) 0%,
                        rgba(7, 90, 104, 0.14) 45%,
                        rgba(8, 9, 13, 0) 70%
                    );
                    filter: blur(75px);
                    animation: diffuseCyan 20s ease-in-out 1s infinite alternate;
                    will-change: transform, opacity;
                }

                /* Layer 3: Soft Electric Blue on upper right & mid areas */
                .ambient-electric-blue {
                    position: absolute;
                    top: -10%;
                    right: -5%;
                    width: 60%;
                    height: 60%;
                    background: radial-gradient(
                        circle at 60% 40%,
                        rgba(37, 77, 156, 0.28) 0%,
                        rgba(41, 32, 82, 0.18) 45%,
                        rgba(8, 9, 13, 0) 75%
                    );
                    filter: blur(70px);
                    animation: driftElectric 28s ease-in-out 3s infinite alternate;
                    will-change: transform, opacity;
                }

                /* Layer 4: Subtle Indigo for chromatic depth */
                .ambient-indigo-depth {
                    position: absolute;
                    bottom: 10%;
                    right: 5%;
                    width: 50%;
                    height: 50%;
                    background: radial-gradient(
                        circle at 50% 50%,
                        rgba(41, 32, 82, 0.36) 0%,
                        rgba(7, 58, 80, 0.18) 50%,
                        rgba(8, 9, 13, 0) 75%
                    );
                    filter: blur(80px);
                    animation: depthIndigo 32s ease-in-out 2s infinite alternate;
                    will-change: transform, opacity;
                }

                /* Layer 5: Dark Teal lateral drift */
                .ambient-teal-lateral {
                    position: absolute;
                    top: 40%;
                    left: -15%;
                    width: 45%;
                    height: 50%;
                    background: radial-gradient(
                        circle at 40% 50%,
                        rgba(7, 90, 104, 0.26) 0%,
                        rgba(22, 140, 163, 0.12) 50%,
                        transparent 70%
                    );
                    filter: blur(65px);
                    animation: lateralTeal 26s ease-in-out 4s infinite alternate;
                    will-change: transform, opacity;
                }

                /* Contextual tweaks for System Q&A Hero */
                .ambient-universe-bg.bg-system-qa .ambient-cyan-diffuse {
                    top: 15%;
                    left: 22%;
                    width: 56%;
                    height: 55%;
                    background: radial-gradient(
                        circle at 50% 45%,
                        rgba(22, 140, 163, 0.32) 0%,
                        rgba(37, 77, 156, 0.20) 45%,
                        rgba(8, 9, 13, 0) 75%
                    );
                    filter: blur(65px);
                    animation: diffuseCyanQA 18s ease-in-out infinite alternate;
                }

                .ambient-universe-bg.bg-system-qa .ambient-ocean-teal {
                    bottom: -20%;
                    height: 60%;
                    opacity: 0.85;
                }

                /* Subtle glass micro-grid texture */
                .ambient-glass-texture {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, rgba(255, 255, 255, 0.012) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
                    background-size: 48px 48px;
                    opacity: 0.5;
                    mix-blend-mode: screen;
                }

                /* Dark Vignette: Colored light moving beneath dark glass */
                .ambient-vignette {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        ellipse 85% 80% at 50% 50%,
                        transparent 45%,
                        rgba(8, 9, 13, 0.45) 75%,
                        rgba(8, 9, 13, 0.92) 100%
                    );
                    pointer-events: none;
                }

                /* ─── Smooth, Slow, Fluid Keyframe Animations ─── */
                @keyframes flowOceanTeal {
                    0% {
                        transform: translate3d(0, 0, 0) scale(1);
                        opacity: 0.85;
                    }
                    50% {
                        transform: translate3d(40px, -20px, 0) scale(1.08);
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(-30px, 15px, 0) scale(0.96);
                        opacity: 0.8;
                    }
                }

                @keyframes diffuseCyan {
                    0% {
                        transform: translate3d(0, 0, 0) scale(0.95);
                        opacity: 0.75;
                    }
                    50% {
                        transform: translate3d(-25px, 20px, 0) scale(1.1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(20px, -15px, 0) scale(1);
                        opacity: 0.8;
                    }
                }

                @keyframes diffuseCyanQA {
                    0% {
                        transform: translate3d(0, 0, 0) scale(1);
                        opacity: 0.9;
                    }
                    50% {
                        transform: translate3d(0, -15px, 0) scale(1.12);
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(0, 10px, 0) scale(0.98);
                        opacity: 0.85;
                    }
                }

                @keyframes driftElectric {
                    0% {
                        transform: translate3d(0, 0, 0) scale(1);
                        opacity: 0.75;
                    }
                    50% {
                        transform: translate3d(-35px, 25px, 0) scale(1.06);
                        opacity: 0.95;
                    }
                    100% {
                        transform: translate3d(20px, -20px, 0) scale(0.94);
                        opacity: 0.7;
                    }
                }

                @keyframes depthIndigo {
                    0% {
                        transform: translate3d(0, 0, 0) scale(1);
                        opacity: 0.7;
                    }
                    50% {
                        transform: translate3d(30px, -25px, 0) scale(1.12);
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(-20px, 15px, 0) scale(0.98);
                        opacity: 0.75;
                    }
                }

                @keyframes lateralTeal {
                    0% {
                        transform: translate3d(0, 0, 0) scale(1);
                        opacity: 0.65;
                    }
                    50% {
                        transform: translate3d(25px, 30px, 0) scale(1.08);
                        opacity: 0.9;
                    }
                    100% {
                        transform: translate3d(-15px, -20px, 0) scale(0.95);
                        opacity: 0.65;
                    }
                }

                /* ─── Accessibility & Reduced Motion ─── */
                @media (prefers-reduced-motion: reduce) {
                    .ambient-ocean-teal,
                    .ambient-cyan-diffuse,
                    .ambient-electric-blue,
                    .ambient-indigo-depth,
                    .ambient-teal-lateral {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
