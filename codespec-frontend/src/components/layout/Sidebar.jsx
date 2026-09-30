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
    Mail,
} from "lucide-react";

const navigation = [
    {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Inbox",
        path: "/inbox",
        icon: Mail,
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
            <div className="sidebar-brand">
                <div className="brand-mark">
                    <Boxes size={18} strokeWidth={2.2} />
                </div>
                <div className="brand-text">
                    <span className="brand-name">CodeSpec</span>
                    <span className="brand-accent">AI</span>
                </div>
            </div>

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
                        <Icon size={18} strokeWidth={1.9} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="pro-mark">
                    <Sparkles size={14} />
                </div>

                <div className="pro-content">
                    <div className="pro-title">
                        <span>CodeSpec AI</span>
                        <span className="pro-badge">PRO</span>
                    </div>

                    <p>Turn your codebase into actionable intelligence.</p>

                    <button className="upgrade-button" type="button">
                        Upgrade now
                        <span>→</span>
                    </button>
                </div>
            </div>

            <style>{`
                .brand-text {
                    display: flex;
                    align-items: baseline;
                    gap: 3px;
                }
                .brand-name {
                    font-size: 15px;
                    font-weight: 700;
                    letter-spacing: -0.3px;
                    color: #ffffff;
                }
                .brand-accent {
                    font-size: 12px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </aside>
    );
}

export default Sidebar;