import {
    Menu,
    Search,
    Bell,
    CircleHelp,
    Settings,
    ChevronDown,
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
                    <Menu size={18} />
                </button>

                <div className="search-box">
                    <Search size={15} strokeWidth={2} className="search-icon" />

                    <input
                        type="text"
                        placeholder="Search anything in your codebase..."
                        aria-label="Search"
                    />

                    <span className="search-shortcut font-mono">⌘ K</span>
                </div>
            </div>

            <div className="topbar-right">
                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Help & Documentation"
                    title="Documentation"
                >
                    <CircleHelp size={16} strokeWidth={1.8} />
                </button>

                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Notifications"
                    title="Notifications"
                >
                    <Bell size={16} strokeWidth={1.8} />
                    <span className="notification-dot" />
                </button>

                <button
                    className="topbar-icon"
                    type="button"
                    aria-label="Settings"
                    title="Settings"
                >
                    <Settings size={16} strokeWidth={1.8} />
                </button>

                <div className="profile" role="button" tabIndex={0}>
                    <div className="profile-avatar font-mono">VD</div>

                    <div className="profile-meta">
                        <span className="profile-name">Vineet Dalvi</span>
                        <span className="profile-role font-mono">Lead Architect</span>
                    </div>

                    <ChevronDown size={13} className="profile-chevron" />
                </div>
            </div>

            <style>{`
                .search-box {
                    width: 100%;
                    max-width: 440px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 12px;
                    background: #09090b;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-muted);
                    transition: border-color var(--duration-fast) ease;
                }
                .search-box:focus-within {
                    border-color: #8b5cf6;
                }
                .search-icon {
                    color: var(--text-muted);
                    flex-shrink: 0;
                }
                .search-box input {
                    flex: 1;
                    min-width: 0;
                    border: 0;
                    outline: 0;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 13px;
                }
                .search-box input::placeholder {
                    color: var(--text-muted);
                }
                .search-shortcut {
                    padding: 1px 6px;
                    background: #141418;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-muted);
                    font-size: 10.5px;
                    font-weight: 600;
                    flex-shrink: 0;
                }
                .topbar-icon {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #09090b;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    cursor: pointer;
                    position: relative;
                    transition: all var(--duration-fast) ease;
                }
                .topbar-icon:hover {
                    color: #ffffff;
                    border-color: #2e2e38;
                    background: #111116;
                }
                .notification-dot {
                    position: absolute;
                    top: 7px;
                    right: 7px;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #ef4444;
                }
                .profile {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 3px 10px 3px 4px;
                    background: #09090b;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }
                .profile:hover {
                    border-color: #2e2e38;
                    background: #111116;
                }
                .profile-avatar {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                    background: #191428;
                    border: 1px solid #3b2866;
                    color: #c4b5fd;
                    font-size: 11px;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .profile-meta {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.15;
                }
                .profile-name {
                    font-size: 12px;
                    font-weight: 700;
                    color: #ffffff;
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