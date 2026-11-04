import { useLocation } from "react-router-dom";
import {
    Menu,
    Search,
    Bell,
    CircleHelp,
    Settings,
    ChevronDown,
} from "lucide-react";

function Topbar({ onMenuToggle }) {
    const location = useLocation();
    const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button
                    className="menu-button"
                    type="button"
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                >
                    <Menu size={18} />
                </button>

                {/* Search section only displayed on the Dashboard */}
                {isDashboard && (
                    <div className="search-box">
                        <Search size={14} strokeWidth={2.2} className="search-icon" />

                        <input
                            type="text"
                            placeholder="Search anything in your codebase..."
                            aria-label="Search"
                        />

                        <span className="search-shortcut font-mono">&#8984; K</span>
                    </div>
                )}
            </div>

            <div className="topbar-right">
                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Help & Documentation"
                    title="Documentation"
                >
                    <CircleHelp size={18} strokeWidth={1.8} />
                </button>

                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Notifications"
                    title="Notifications"
                >
                    <Bell size={18} strokeWidth={1.8} />
                    <span className="notification-dot" />
                </button>

                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Settings"
                    title="Settings"
                >
                    <Settings size={18} strokeWidth={1.8} />
                </button>

                <div className="profile" role="button" tabIndex={0}>
                    <div className="profile-avatar font-mono">RP</div>

                    <div className="profile-meta">
                        <span className="profile-name">Raj Patel</span>
                        <span className="profile-role font-mono">Developer</span>
                    </div>

                    <ChevronDown size={13} className="profile-chevron" />
                </div>
            </div>

            <style>{`
                .menu-button {
                    display: none;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: #15161B;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--secondary-text);
                    cursor: pointer;
                }
                @media (max-width: 860px) {
                    .menu-button {
                        display: flex;
                    }
                }
                .search-icon {
                    color: var(--secondary-text);
                    flex-shrink: 0;
                }
                .profile-chevron {
                    color: var(--secondary-text);
                    margin-left: 2px;
                }
            `}</style>
        </header>
    );
}

export default Topbar;
