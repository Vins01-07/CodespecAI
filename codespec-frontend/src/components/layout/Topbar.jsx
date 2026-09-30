import {
    Menu,
    Search,
    Bell,
    CircleHelp,
    Settings,
    ChevronDown,
    Command,
} from "lucide-react";

function Topbar({ onMenuToggle }) {
    return (
        <header className="topbar">
            <div className="topbar-left">
                <button
                    className="menu-button"
                    type="button"
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                >
                    <Menu size={20} />
                </button>

                <div className="search-box">
                    <Search size={16} strokeWidth={2} />

                    <input
                        type="text"
                        placeholder="Search anything in your codebase..."
                        aria-label="Search"
                    />

                    <span className="search-shortcut">⌘ K</span>
                </div>
            </div>

            <div className="topbar-right">
                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Help & Documentation"
                >
                    <CircleHelp size={18} strokeWidth={1.8} />
                </button>

                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Notifications"
                >
                    <Bell size={18} strokeWidth={1.8} />
                    <span className="notification-dot" />
                </button>

                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Settings"
                >
                    <Settings size={18} strokeWidth={1.8} />
                </button>

                <div className="profile" role="button" tabIndex={0}>
                    <div className="profile-avatar">VD</div>

                    <div className="profile-meta">
                        <span className="profile-name">Vineet Dalvi</span>
                        <span className="profile-role">Lead Architect</span>
                    </div>

                    <ChevronDown size={14} className="profile-chevron" />
                </div>
            </div>

            <style>{`
                .profile-meta {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.15;
                }
                .profile-role {
                    font-size: 10px;
                    color: var(--text-muted);
                    font-weight: 500;
                }
                .profile-chevron {
                    color: var(--text-muted);
                    margin-left: 2px;
                }
            `}</style>
        </header>
    );
}

export default Topbar;