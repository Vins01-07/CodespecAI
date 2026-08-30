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

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-mark">C</div>
                <span>CodeSpec AI</span>
            </div>

            <nav className="sidebar-nav">
                {navigation.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === "/"}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <Icon size={18} strokeWidth={1.8} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="pro-mark">C</div>

                <div className="pro-content">
                    <div className="pro-title">
                        <span>CodeSpec AI</span>
                        <span className="pro-badge">PRO</span>
                    </div>

                    <p>Turn your codebase into actionable intelligence.</p>

                    <button className="upgrade-button">
                        Upgrade now
                        <span>→</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;