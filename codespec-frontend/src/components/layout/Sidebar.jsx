import { NavLink } from "react-router-dom";
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
    Boxes,
    Sparkles,
    ArrowRight,
} from "lucide-react";

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
    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            {/* Brand Header */}
            <div className="sidebar-brand">
                <div className="brand-mark">
                    <Boxes size={18} strokeWidth={2.2} />
                </div>
                <div className="brand-text">
                    <span className="brand-name">CodeSpec</span>
                    <span className="brand-accent font-mono">AI</span>
                </div>
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
                        <Icon size={17} strokeWidth={1.9} className="nav-icon" />
                        <span className="nav-label">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Pro Upgrade Footer Card */}
            <div className="sidebar-footer">
                <div className="pro-card">
                    <div className="pro-header">
                        <div className="pro-icon-wrap">
                            <Sparkles size={13} />
                        </div>
                        <div className="pro-title-row">
                            <span className="pro-title">CodeSpec AI</span>
                            <span className="pro-badge font-mono">PRO</span>
                        </div>
                    </div>

                    <p className="pro-desc">
                        Turn your codebase into actionable intelligence.
                    </p>

                    <button className="upgrade-button font-mono" type="button">
                        <span>Upgrade now</span>
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            <style>{`
                .sidebar-brand {
                    height: 64px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 16px;
                    border-bottom: 1px solid var(--card-border);
                    flex-shrink: 0;
                }
                .brand-mark {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #191428;
                    border: 1px solid #3b2866;
                    border-radius: var(--radius-sm);
                    color: #c4b5fd;
                    flex-shrink: 0;
                }
                .brand-text {
                    display: flex;
                    align-items: baseline;
                    gap: 3px;
                }
                .brand-name {
                    font-size: 16px;
                    font-weight: 800;
                    letter-spacing: -0.3px;
                    color: #ffffff;
                }
                .brand-accent {
                    font-size: 11px;
                    font-weight: 800;
                    color: #8b5cf6;
                }
                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    padding: 10px 8px;
                    gap: 2px;
                    overflow-y: auto;
                    flex: 1;
                }
                .sidebar-link {
                    height: 38px;
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 0 12px;
                    border: 1px solid transparent;
                    border-radius: var(--radius-sm);
                    color: #8e8e98;
                    font-size: 13px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all var(--duration-fast) ease;
                }
                .sidebar-link:hover {
                    background: #0f0f13;
                    color: #ffffff;
                    border-color: #1e1e24;
                }
                .sidebar-link.active {
                    background: #191428;
                    color: #ffffff;
                    border-color: #3b2866;
                    font-weight: 600;
                }
                .sidebar-link.active .nav-icon {
                    color: #8b5cf6;
                }
                .sidebar-footer {
                    padding: 10px;
                    border-top: 1px solid var(--card-border);
                    flex-shrink: 0;
                }
                .pro-card {
                    background: #08080a;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .pro-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .pro-icon-wrap {
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #191428;
                    border: 1px solid #3b2866;
                    border-radius: var(--radius-sm);
                    color: #8b5cf6;
                    flex-shrink: 0;
                }
                .pro-title-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .pro-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #ffffff;
                }
                .pro-badge {
                    padding: 1px 4px;
                    background: #191428;
                    border: 1px solid #3b2866;
                    border-radius: 2px;
                    color: #8b5cf6;
                    font-size: 9px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
                .pro-desc {
                    margin: 0;
                    font-size: 10.5px;
                    color: var(--text-muted);
                    line-height: 1.35;
                }
                .upgrade-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: transparent;
                    border: none;
                    color: #8b5cf6;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 2px 0 0;
                    transition: color var(--duration-fast) ease;
                }
                .upgrade-button:hover {
                    color: #a78bfa;
                }
            `}</style>
        </aside>
    );
}

export default Sidebar;