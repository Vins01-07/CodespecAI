/**
 * IridescentOrb
 *
 * A dimensional, glossy, iridescent AI orb inspired by the reference design:
 * - Layered fluid swirls in deep blue, cyan, teal, violet, and hints of magenta & amber
 * - Continuous slow rotation and floating animation
 * - Soft pulsing outer atmospheric glow
 * - Curved specular glass reflections for true 3D spherical depth
 */
export default function IridescentOrb({ size = 160 }) {
    return (
        <div className="iridescent-orb-wrapper" style={{ width: size, height: size }}>
            {/* Outer Soft Pulsing Ambient Glow */}
            <div className="orb-ambient-glow" />

            {/* The 3D Iridescent Sphere */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 200 200"
                className="orb-svg"
            >
                <defs>
                    {/* Outer Clip Circle */}
                    <clipPath id="orbSphereClip">
                        <circle cx="100" cy="100" r="94" />
                    </clipPath>

                    {/* Gradient 1: Deep Ocean to Dark Indigo Base */}
                    <radialGradient id="orbBaseGrad" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#151A2C" />
                        <stop offset="45%" stopColor="#0B0E1A" />
                        <stop offset="85%" stopColor="#05060A" />
                        <stop offset="100%" stopColor="#020306" />
                    </radialGradient>

                    {/* Gradient 2: Cyan & Teal Fluid Ribbon */}
                    <linearGradient id="orbCyanTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00F2FE" />
                        <stop offset="35%" stopColor="#168CA3" />
                        <stop offset="70%" stopColor="#075A68" />
                        <stop offset="100%" stopColor="#073A50" />
                    </linearGradient>

                    {/* Gradient 3: Electric Blue to Rich Violet */}
                    <linearGradient id="orbElectricViolet" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4FACFE" />
                        <stop offset="30%" stopColor="#254D9C" />
                        <stop offset="65%" stopColor="#6C2BD9" />
                        <stop offset="100%" stopColor="#292052" />
                    </linearGradient>

                    {/* Gradient 4: Iridescent Magenta & Warm Golden Amber */}
                    <linearGradient id="orbMagentaAmber" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF2A6D" />
                        <stop offset="35%" stopColor="#D946EF" />
                        <stop offset="70%" stopColor="#FFA000" />
                        <stop offset="100%" stopColor="#FFD166" />
                    </linearGradient>

                    {/* Spherical Inner Shadow for 3D Convexity */}
                    <radialGradient id="orbSphericalShadow" cx="38%" cy="32%" r="62%">
                        <stop offset="0%" stopColor="transparent" stopOpacity="0" />
                        <stop offset="50%" stopColor="transparent" stopOpacity="0" />
                        <stop offset="80%" stopColor="#000000" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
                    </radialGradient>

                    {/* Top Specular Crescent Sheen */}
                    <linearGradient id="orbSpecularGrad" x1="30%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                        <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.25" />
                        <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.03" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>

                    {/* Fluid Blur for organic color mixing */}
                    <filter id="fluidBlend" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feColorMatrix
                            type="matrix"
                            values="1 0 0 0 0  
                                    0 1 0 0 0  
                                    0 0 1 0 0  
                                    0 0 0 18 -7"
                        />
                    </filter>
                </defs>

                {/* Spherical Base */}
                <circle cx="100" cy="100" r="94" fill="url(#orbBaseGrad)" />

                {/* Swirling Iridescent Fluid Core (Clipped inside sphere) */}
                <g clipPath="url(#orbSphereClip)">
                    {/* Deep colored fluid background */}
                    <rect width="200" height="200" fill="#0A0D18" />

                    {/* Swirling Fluid Group with continuous slow rotation */}
                    <g className="orb-swirl-group">
                        {/* Fluid Ribbon 1: Electric Blue & Cyan */}
                        <path
                            d="M 50,40 Q 110,10 150,60 T 160,150 T 80,160 T 30,100 Z"
                            fill="url(#orbCyanTeal)"
                            opacity="0.85"
                            className="fluid-wave wave-1"
                        />

                        {/* Fluid Ribbon 2: Violet & Indigo */}
                        <path
                            d="M 120,30 Q 170,80 140,140 T 60,130 T 40,70 T 120,30 Z"
                            fill="url(#orbElectricViolet)"
                            opacity="0.8"
                            className="fluid-wave wave-2"
                        />

                        {/* Fluid Ribbon 3: Luminous Magenta & Amber Flame Accent */}
                        <path
                            d="M 80,80 Q 130,70 125,115 T 75,130 T 70,95 Z"
                            fill="url(#orbMagentaAmber)"
                            opacity="0.9"
                            className="fluid-wave wave-3"
                        />

                        {/* Secondary cyan highlight vortex */}
                        <path
                            d="M 90,60 Q 140,90 100,140 Q 60,110 90,60 Z"
                            fill="#00F2FE"
                            opacity="0.55"
                            filter="blur(6px)"
                        />

                        {/* Amber luminous flare */}
                        <ellipse
                            cx="128"
                            cy="110"
                            rx="18"
                            ry="26"
                            transform="rotate(-25 128 110)"
                            fill="#FFA000"
                            opacity="0.75"
                            filter="blur(7px)"
                        />
                    </g>

                    {/* 3D Convex Spherical Occlusion (Dark edge vignette) */}
                    <circle cx="100" cy="100" r="94" fill="url(#orbSphericalShadow)" />

                    {/* Curved Primary Specular Sheen (top-left glass reflection) */}
                    <ellipse
                        cx="75"
                        cy="48"
                        rx="52"
                        ry="26"
                        transform="rotate(-28 75 48)"
                        fill="url(#orbSpecularGrad)"
                    />

                    {/* Secondary Subtle Rim Light on Bottom Edge */}
                    <path
                        d="M 40,160 Q 100,192 160,160"
                        fill="none"
                        stroke="rgba(0, 242, 254, 0.35)"
                        strokeWidth="2.5"
                        filter="blur(2px)"
                    />
                </g>

                {/* Thin Glossy Glass Rim */}
                <circle
                    cx="100"
                    cy="100"
                    r="93.5"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.16)"
                    strokeWidth="1.2"
                />
            </svg>

            <style>{`
                .iridescent-orb-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: orbFloat 7s ease-in-out infinite alternate;
                    user-select: none;
                    margin: 0 auto;
                }

                .orb-ambient-glow {
                    position: absolute;
                    inset: -20px;
                    border-radius: 50%;
                    background: radial-gradient(
                        circle at 50% 50%,
                        rgba(22, 140, 163, 0.38) 0%,
                        rgba(37, 77, 156, 0.28) 40%,
                        rgba(41, 32, 82, 0.15) 65%,
                        transparent 80%
                    );
                    filter: blur(28px);
                    animation: orbGlowPulse 5s ease-in-out infinite alternate;
                    pointer-events: none;
                    z-index: 0;
                }

                .orb-svg {
                    position: relative;
                    z-index: 1;
                    filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.7));
                }

                .orb-swirl-group {
                    transform-origin: 100px 100px;
                    animation: orbSwirl 32s linear infinite;
                }

                .wave-1 {
                    animation: waveMorph1 14s ease-in-out infinite alternate;
                    transform-origin: 100px 100px;
                }

                .wave-2 {
                    animation: waveMorph2 18s ease-in-out infinite alternate;
                    transform-origin: 100px 100px;
                }

                .wave-3 {
                    animation: waveMorph3 12s ease-in-out infinite alternate;
                    transform-origin: 100px 100px;
                }

                @keyframes orbFloat {
                    0% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-9px);
                    }
                    100% {
                        transform: translateY(2px);
                    }
                }

                @keyframes orbGlowPulse {
                    0% {
                        transform: scale(0.92);
                        opacity: 0.75;
                    }
                    50% {
                        transform: scale(1.08);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0.96);
                        opacity: 0.8;
                    }
                }

                @keyframes orbSwirl {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                @keyframes waveMorph1 {
                    0% {
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        transform: scale(1.08) rotate(15deg);
                    }
                    100% {
                        transform: scale(0.95) rotate(-10deg);
                    }
                }

                @keyframes waveMorph2 {
                    0% {
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        transform: scale(0.92) rotate(-20deg);
                    }
                    100% {
                        transform: scale(1.05) rotate(15deg);
                    }
                }

                @keyframes waveMorph3 {
                    0% {
                        transform: scale(0.95) translate(0, 0);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.1) translate(4px, -3px);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1) translate(-2px, 2px);
                        opacity: 0.85;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .iridescent-orb-wrapper,
                    .orb-ambient-glow,
                    .orb-swirl-group,
                    .wave-1,
                    .wave-2,
                    .wave-3 {
                        animation: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

