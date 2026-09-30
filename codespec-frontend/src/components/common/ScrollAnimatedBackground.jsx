import { useEffect, useRef, useState } from "react";

/**
 * ScrollAnimatedBackground
 *
 * Renders a high-performance, GPU-accelerated background matching the screenshot's
 * luminous 3D purple silk ribbon waves and ambient atmospheric glow.
 * Dynamically reacts to user scrolling across all pages:
 * - Parallax 3D purple silk ribbons that undulate and translate on scroll
 * - Ambient soft violet/indigo radiant mesh glows
 * - Subtle digital coordinate grid and stardust particles
 * - requestAnimationFrame scroll-velocity tracking
 */
export default function ScrollAnimatedBackground() {
    const [scrollPos, setScrollPos] = useState({ y: 0, progress: 0, velocity: 0 });
    const lastScrollY = useRef(0);
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

                    const maxScroll = Math.max(
                        1,
                        document.documentElement.scrollHeight - window.innerHeight
                    );
                    const progress = Math.min(1, Math.max(0, currentY / maxScroll));
                    const velocity = Math.abs(currentY - lastScrollY.current);
                    lastScrollY.current = currentY;

                    setScrollPos({
                        y: currentY,
                        progress,
                        velocity: Math.min(velocity, 50),
                    });
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

    const { y, progress, velocity } = scrollPos;

    // Parallax translation variables
    const ribbon1Y = y * 0.28;
    const ribbon2Y = y * -0.22;
    const ribbon3Y = y * 0.14;
    const ambientGlowY = y * 0.18;
    const dynamicBlur = 48 + velocity * 0.35;

    return (
        <div className="scroll-animated-bg" aria-hidden="true">
            {/* Ambient Deep Atmospheric Glows */}
            <div
                className="bg-purple-orb orb-top-left"
                style={{
                    transform: `translate3d(0, ${ambientGlowY * 0.8}px, 0) scale(${1 + progress * 0.12})`,
                    filter: `blur(${dynamicBlur}px)`,
                }}
            />

            <div
                className="bg-purple-orb orb-bottom-right"
                style={{
                    transform: `translate3d(0, ${ambientGlowY * -0.6}px, 0) scale(${1 - progress * 0.08})`,
                    filter: `blur(${dynamicBlur + 16}px)`,
                }}
            />

            {/* 3D Luminous Purple Silk Ribbon Waves (Signature visual from screenshot) */}
            <svg
                className="bg-silk-ribbon-svg"
                viewBox="0 0 1440 900"
                preserveAspectRatio="none"
            >
                <defs>
                    {/* Primary Violet-Purple Silk Gradient */}
                    <linearGradient id="purpleSilkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#705df2" stopOpacity="0.45" />
                        <stop offset="35%" stopColor="#8b5cf6" stopOpacity="0.65" />
                        <stop offset="65%" stopColor="#a855f7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
                    </linearGradient>

                    {/* Secondary Deep Indigo-Magenta Ribbon Gradient */}
                    <linearGradient id="purpleSilkGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                        <stop offset="45%" stopColor="#7c3aed" stopOpacity="0.55" />
                        <stop offset="75%" stopColor="#4f46e5" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
                    </linearGradient>

                    {/* Specular Ribbon Edge Highlight */}
                    <linearGradient id="ribbonEdgeSpecular" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.7" />
                        <stop offset="50%" stopColor="#c084fc" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                    </linearGradient>

                    {/* Subtle Gaussian Blur for Smooth Silk Diffusion */}
                    <filter id="silkDiffusion" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="18" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Top-Left Dramatic Sweeping Silk Ribbon */}
                <g
                    style={{
                        transform: `translate3d(0, ${ribbon1Y}px, 0)`,
                        transition: "transform 0.1s ease-out",
                    }}
                    filter="url(#silkDiffusion)"
                >
                    <path
                        d={`M -80,-60 
                            C 180,60 320,${220 + Math.sin(progress * 3.5) * 45} 240,${440 + Math.cos(progress * 2.5) * 55} 
                            C 160,${620 - Math.sin(progress * 2) * 40} 40,680 -120,720 
                            Z`}
                        fill="url(#purpleSilkGrad1)"
                    />
                    {/* Glowing Silk Crest Line */}
                    <path
                        d={`M -80,-60 
                            C 180,60 320,${220 + Math.sin(progress * 3.5) * 45} 240,${440 + Math.cos(progress * 2.5) * 55} 
                            C 160,${620 - Math.sin(progress * 2) * 40} 40,680 -120,720`}
                        fill="none"
                        stroke="url(#ribbonEdgeSpecular)"
                        strokeWidth="3"
                        strokeOpacity="0.75"
                    />
                </g>

                {/* Bottom-Right Large Cascading Silk Ribbon Wave */}
                <g
                    style={{
                        transform: `translate3d(0, ${ribbon2Y}px, 0)`,
                        transition: "transform 0.1s ease-out",
                    }}
                    filter="url(#silkDiffusion)"
                >
                    <path
                        d={`M 1520,320 
                            C 1340,${420 + Math.sin(progress * 3) * 50} 1180,${520 - Math.cos(progress * 2) * 40} 1220,${720 + Math.sin(progress * 3) * 60} 
                            C 1260,${880 + Math.cos(progress * 2.5) * 40} 1420,960 1560,940 
                            Z`}
                        fill="url(#purpleSilkGrad2)"
                    />
                    {/* Crest Curve Highlight */}
                    <path
                        d={`M 1520,320 
                            C 1340,${420 + Math.sin(progress * 3) * 50} 1180,${520 - Math.cos(progress * 2) * 40} 1220,${720 + Math.sin(progress * 3) * 60} 
                            C 1260,${880 + Math.cos(progress * 2.5) * 40} 1420,960 1560,940`}
                        fill="none"
                        stroke="url(#ribbonEdgeSpecular)"
                        strokeWidth="2.5"
                        strokeOpacity="0.8"
                    />
                </g>

                {/* Floating Translucent Ambient Spline */}
                <g
                    style={{
                        transform: `translate3d(0, ${ribbon3Y}px, 0)`,
                        transition: "transform 0.1s ease-out",
                    }}
                    opacity="0.35"
                >
                    <path
                        d={`M 200,920 Q 640,${720 + Math.sin(progress * 4) * 60} 1100,${860 - Math.cos(progress * 3) * 40}`}
                        fill="none"
                        stroke="url(#purpleSilkGrad1)"
                        strokeWidth="24"
                        strokeLinecap="round"
                    />
                </g>
            </svg>

            {/* Subtle Constellation Floating Particle Field */}
            <div
                className="bg-stardust"
                style={{
                    transform: `translate3d(0, ${y * -0.06}px, 0)`,
                }}
            >
                <span className="star s1" />
                <span className="star s2" />
                <span className="star s3" />
                <span className="star s4" />
                <span className="star s5" />
                <span className="star s6" />
            </div>

            <style>{`
                .scroll-animated-bg {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                    overflow: hidden;
                    contain: strict;
                }

                .bg-purple-orb {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    will-change: transform, filter;
                    transition: filter 0.25s ease-out;
                }

                .orb-top-left {
                    top: -10%;
                    left: -10%;
                    width: 720px;
                    height: 720px;
                    background: radial-gradient(circle, rgba(112, 93, 242, 0.22) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%);
                }

                .orb-bottom-right {
                    bottom: -15%;
                    right: -10%;
                    width: 820px;
                    height: 820px;
                    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 75%);
                }

                .bg-silk-ribbon-svg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    overflow: visible;
                }

                .bg-stardust {
                    position: absolute;
                    inset: 0;
                    will-change: transform;
                }

                .star {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    border-radius: 50%;
                    background: #c084fc;
                    box-shadow: 0 0 8px rgba(192, 132, 252, 0.8);
                    opacity: 0.45;
                    animation: floatStar 9s ease-in-out infinite alternate;
                }

                .s1 { top: 18%; left: 22%; animation-duration: 7s; width: 4px; height: 4px; opacity: 0.6; }
                .s2 { top: 38%; left: 82%; animation-duration: 10s; }
                .s3 { top: 68%; left: 14%; animation-duration: 8.5s; width: 3.5px; height: 3.5px; }
                .s4 { top: 82%; left: 74%; animation-duration: 11s; }
                .s5 { top: 48%; left: 42%; animation-duration: 7.5s; opacity: 0.35; }
                .s6 { top: 28%; left: 66%; animation-duration: 9.5s; }

                @keyframes floatStar {
                    0% { transform: translateY(0) scale(1); opacity: 0.35; }
                    50% { transform: translateY(-14px) scale(1.3); opacity: 0.75; }
                    100% { transform: translateY(8px) scale(0.9); opacity: 0.35; }
                }
            `}</style>
        </div>
    );
}
