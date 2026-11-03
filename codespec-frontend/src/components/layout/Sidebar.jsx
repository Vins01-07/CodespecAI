import { NavLink } from "react-router-dom";
import useUiStore from "../../store/uiStore";
import {
    LayoutDashboard,
    FolderGit2,
    Upload,
    Search,
    Network,
    GitBranch,
    MessageSquare,
    GitCompare,
    FileText,
    Sparkles,
    ArrowRight,
} from "lucide-react";

// Red Hexagonal Brand Mark Icon matching the reference screenshot
function BrandHexIcon({ size = 20 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="brand-hex-svg"
        >
            <defs>
                <linearGradient id="brandHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF3548" />
                    <stop offset="100%" stopColor="#E32636" />
                </linearGradient>
                <filter id="hexGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Outer Hexagon */}
            <path
                d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
                fill="url(#brandHexGrad)"
                filter="url(#hexGlow)"
            />
            {/* Inner Core */}
            <path
                d="M12 6L17.2 9V15L12 18L6.8 15V9L12 6Z"
                fill="#101115"
            />
            <circle cx="12" cy="12" r="2.5" fill="#FF3548" />
        </svg>
    );
}

const navigation = [
    {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Repository",
        path: "/repository",
        icon: FolderGit2,
    },
    {
        label: "Ingestion",
        path: "/ingestion",
        icon: Upload,
    },
    {
        label: "Knowledge Search",
        path: "/knowledge-search",
        icon: Search,
    },
    {
        label: "Architecture",
        path: "/architecture",
        icon: Network,
    },
    {
        label: "Dependencies",
        path: "/dependencies",
        icon: GitBranch,
    },
    {
        label: "System Q&A",
        path: "/system-qa",
        icon: MessageSquare,
    },
    {
        label: "Change Impact",
        path: "/change-impact",
        icon: GitCompare,
    },
    {
        label: "Documentation",
        path: "/documentation",
        icon: FileText,
    },
];

function Sidebar({ isOpen = false, onClose }) {
    const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
    const toggleSidebar = useUiStore((state) => state.toggleSidebar);

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
            {/* Brand Header */}
            <div className="sidebar-brand">
                <div className="brand-mark">
                    <BrandHexIcon size={20} />
                </div>
                <div className="brand-text">
                    <span className="brand-name">CodeSpec</span>
                    <span className="brand-accent font-mono">AI</span>
                </div>
                <button
                    className="sidebar-toggle"
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <i
                        className={`ri-${sidebarCollapsed ? "arrow-right-double" : "arrow-left-double"}-line`}
                        aria-hidden="true"
                    />
                </button>
            </div>

            {/* Navigation List */}
            <nav className="sidebar-nav">
                {navigation.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === "/"}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <Icon size={16} strokeWidth={2} className="nav-icon" />
                        <span className="nav-label">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Pro Upgrade Footer Card */}
            <div className="sidebar-footer">
                <div className="pro-card">
                    <div className="pro-header">
                        <div className="pro-icon-wrap">
                            <Sparkles size={12} />
                        </div>
                        <div className="pro-title-row">
                            <span className="pro-title">CodeSpec AI</span>
                            <span className="pro-badge font-mono">PRO</span>
                        </div>
                    </div>

                    <p className="pro-desc">
                        Unlock advanced codebase insights with premium features.
                    </p>

                    <button className="upgrade-button font-mono" type="button">
                        <span>Upgrade now</span>
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            <style>{`
                .sidebar.collapsed {
                    width: var(--sidebar-dock-width) !important;
                }
                .sidebar.collapsed .sidebar-brand {
                    justify-content: center;
                    padding: 0;
                }
                .sidebar.collapsed .brand-text,
                .sidebar.collapsed .nav-label,
                .sidebar.collapsed .sidebar-footer {
                    display: none;
                }
                .sidebar.collapsed .sidebar-toggle {
                    display: none;
                }
                .sidebar.collapsed .sidebar-link {
                    justify-content: center;
                    padding: 0;
                    width: 44px;
                    height: 44px;
                    margin: 0 auto;
                }
                @media (max-width: 860px) {
                    .sidebar {
                        transform: translateX(-110%);
                    }
                    .sidebar.open {
                        transform: translateX(0);
                        display: flex;
                        position: fixed;
                        top: 14px;
                        left: 14px;
                        bottom: 14px;
                        width: 250px !important;
                        z-index: 100;
                    }
                }
            `}</style>
        </aside>
    );
}

export default Sidebar;
