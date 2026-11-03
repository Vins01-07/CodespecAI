import {
    Filter,
} from "lucide-react";
import RepositoryCard from "../components/dashboard/RepositoryCard";
import MetricCard from "../components/dashboard/MetricCard";
import ArchitecturePreview from "../components/dashboard/ArchitecturePreview";
import DocumentationAlerts from "../components/dashboard/DocumentationAlerts";
import SystemEfficiencyCard from "../components/dashboard/SystemEfficiencyCard";
import useRepositoryStore from "../store/repositoryStore";

// High-fidelity 3D isometric dark server, code plate, document sheet & glowing crimson platform
function HeaderArchitectureIllustration() {
    return (
        <div className="header-illustration" aria-hidden="true">
            <svg width="230" height="110" viewBox="0 0 240 120" fill="none">
                <defs>
                    <radialGradient id="platformGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FF3548" stopOpacity="0.65" />
                        <stop offset="45%" stopColor="#E32636" stopOpacity="0.35" />
                        <stop offset="85%" stopColor="#800010" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="serverTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2A2C38" />
                        <stop offset="100%" stopColor="#171821" />
                    </linearGradient>
                    <linearGradient id="serverLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1E202B" />
                        <stop offset="100%" stopColor="#101117" />
                    </linearGradient>
                    <linearGradient id="serverRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#222430" />
                        <stop offset="100%" stopColor="#13141C" />
                    </linearGradient>
                    <linearGradient id="redRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF3548" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#E32636" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FF3548" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="crimsonBlur" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ambient Red Glow Sphere behind server */}
                <ellipse cx="170" cy="55" rx="50" ry="40" fill="rgba(227, 38, 54, 0.28)" filter="url(#crimsonBlur)" />

                {/* Glowing Concentric Crimson Rings Pedestal */}
                <ellipse cx="170" cy="88" rx="52" ry="20" fill="url(#platformGlow)" />
                <ellipse cx="170" cy="88" rx="46" ry="17" fill="none" stroke="url(#redRingGrad)" strokeWidth="1.5" />
                <ellipse cx="170" cy="88" rx="34" ry="12" fill="none" stroke="rgba(255, 53, 72, 0.5)" strokeWidth="1" strokeDasharray="3 3" />

                {/* Floating Isometric Server Tier 1 (Lower Base) */}
                <g transform="translate(15, 6)">
                    {/* Top face */}
                    <polygon points="155,54 188,38 155,22 122,38" fill="url(#serverTopGrad)" stroke="rgba(255, 53, 72, 0.4)" strokeWidth="0.8" />
                    {/* Left face */}
                    <polygon points="122,38 155,54 155,72 122,56" fill="url(#serverLeftGrad)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
                    {/* Right face */}
                    <polygon points="155,54 188,38 188,56 155,72" fill="url(#serverRightGrad)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />

                    {/* Server Front Slots & Glowing Red LEDs */}
                    <line x1="130" y1="47" x2="148" y2="56" stroke="#FF3548" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="130" y1="54" x2="148" y2="63" stroke="#FF3548" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="151" cy="58" r="1.5" fill="#FF3548" filter="drop-shadow(0 0 3px #FF3548)" />
                    <circle cx="151" cy="65" r="1.5" fill="#10B981" />
                </g>

                {/* Floating Isometric Server Tier 2 (Upper Module) */}
                <g transform="translate(15, -12)">
                    {/* Top face */}
                    <polygon points="155,46 182,32 155,18 128,32" fill="url(#serverTopGrad)" stroke="rgba(255, 53, 72, 0.6)" strokeWidth="0.8" />
                    {/* Left face */}
                    <polygon points="128,32 155,46 155,60 128,46" fill="url(#serverLeftGrad)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
                    {/* Right face */}
                    <polygon points="155,46 182,32 182,46 155,60" fill="url(#serverRightGrad)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />

                    {/* Upper Server Glowing Slots */}
                    <line x1="135" y1="41" x2="149" y2="48" stroke="#FF3548" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="152" cy="50" r="1.5" fill="#FF3548" />
                </g>

                {/* Floating Code Card < / > on Left */}
                <g transform="translate(35, 24)">
                    <polygon points="48,34 72,22 48,10 24,22" fill="#181922" stroke="rgba(255, 53, 72, 0.6)" strokeWidth="1" />
                    <polygon points="24,22 48,34 48,46 24,34" fill="#12131A" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
                    <polygon points="48,34 72,22 72,34 48,46" fill="#15161F" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
                    <text x="48" y="24" fill="#FF3548" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono, monospace" filter="drop-shadow(0 0 4px rgba(255, 53, 72, 0.6))">
                        &lt;/&gt;
                    </text>
                </g>

                {/* Floating Red Document Sheet on Right */}
                <g transform="translate(182, 18)">
                    <polygon points="26,20 44,11 26,2 8,11" fill="rgba(227, 38, 54, 0.22)" stroke="#FF3548" strokeWidth="0.8" />
                    <polygon points="8,11 26,20 26,28 8,19" fill="rgba(227, 38, 54, 0.15)" stroke="rgba(255, 53, 72, 0.3)" strokeWidth="0.8" />
                    <polygon points="26,20 44,11 44,19 26,28" fill="rgba(227, 38, 54, 0.18)" stroke="rgba(255, 53, 72, 0.3)" strokeWidth="0.8" />
                    <line x1="16" y1="12" x2="26" y2="17" stroke="#FF3548" strokeWidth="1" />
                    <line x1="26" y1="17" x2="36" y2="12" stroke="#FF3548" strokeWidth="1" />
                </g>
            </svg>
        </div>
    );
}

function Dashboard() {
    const { activeRepository } = useRepositoryStore();

    // 5 Metric Cards definitions exactly matching reference img2
    const metricsData = [
        {
            id: "files",
            label: "Files",
            value: activeRepository?.metrics?.files?.toLocaleString() || "1,248",
            trendValue: "12%",
            trendText: "vs last scan",
            chartType: "area",
            iconType: "files",
        },
        {
            id: "services",
            label: "Services",
            value: activeRepository?.metrics?.services || "12",
            trendValue: "1",
            trendText: "new service",
            chartType: "bar",
            iconType: "services",
        },
        {
            id: "apis",
            label: "APIs",
            value: activeRepository?.metrics?.apis || "48",
            trendValue: "8%",
            trendText: "endpoints",
            chartType: "mountain",
            iconType: "apis",
        },
        {
            id: "functions",
            label: "Functions",
            value: activeRepository?.metrics?.functions?.toLocaleString() || "2,340",
            trendValue: "14%",
            trendText: "methods",
            chartType: "sparkline",
            iconType: "functions",
        },
        {
            id: "dependencies",
            label: "Dependencies",
            value: activeRepository?.metrics?.dependencies || "36",
            trendValue: "5%",
            trendText: "total deps",
            chartType: "stepped",
            iconType: "dependencies",
        },
    ];

    return (
        <div className="dashboard-container">
            {/* Top Page Header (Matches img2 "Dash" in white + "board" in crimson + 3D illustration + Filter) */}
            <div className="dashboard-header-banner">
                <div className="dashboard-header-left">
                    <h1 className="page-header-title">
                        <span className="dash-white">Dash</span>
                        <span className="dash-crimson">board</span>
                    </h1>
                    <span className="page-header-subtitle">
                        Codebase health, architectural topology & continuous insights
                    </span>
                </div>

                <div className="dashboard-header-right">
                    <HeaderArchitectureIllustration />
                    <button className="filter-pill-btn" type="button">
                        <Filter size={13} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Top: Compact Repository Header */}
            <RepositoryCard repository={activeRepository} />

            {/* Five Metrics Row with embedded crimson mini charts */}
            <section className="metrics-grid" aria-label="Codebase Metrics">
                {metricsData.map((metric) => (
                    <MetricCard
                        key={metric.id}
                        label={metric.label}
                        value={metric.value}
                        trendValue={metric.trendValue}
                        trendText={metric.trendText}
                        chartType={metric.chartType}
                        iconType={metric.iconType}
                    />
                ))}
            </section>

            {/* Main Content: Left Column (Architecture Preview) + Right Column (Speedometer Gauge + Doc Alerts) */}
            <section className="dashboard-main-grid" aria-label="Dashboard Architecture and Activity">
                <div className="dashboard-left-col">
                    <ArchitecturePreview />
                </div>

                <div className="dashboard-right-col">
                    <SystemEfficiencyCard
                        efficiency={96.7}
                        label="EFFICIENCY"
                        sublabel="AST / INDEX"
                        context="Excellent performance • 0 vulnerabilities"
                    />

                    <DocumentationAlerts />
                </div>
            </section>

            <style>{`
                .dashboard-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                .dashboard-header-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .dashboard-header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .dash-white {
                    color: #F5F5F7;
                    font-size: 26px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                .dash-crimson {
                    color: #FF3548;
                    font-size: 26px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    text-shadow: 0 0 16px rgba(255, 53, 72, 0.4);
                }
                .dashboard-header-right {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .header-illustration {
                    display: block;
                    margin-right: -6px;
                    pointer-events: none;
                }
                @media (max-width: 820px) {
                    .header-illustration {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}

export default Dashboard;
