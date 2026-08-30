import {
    Menu,
    Search,
    Bell,
    CircleHelp,
    Settings,
    ChevronDown,
} from "lucide-react";

function Topbar() {
    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="menu-button" type="button">
                    <Menu size={20} />
                </button>

                <div className="search-box">
                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search anything in your codebase..."
                    />

                    <span className="search-shortcut">⌘ K</span>
                </div>
            </div>

            <div className="topbar-right">
                <button className="topbar-icon" type="button">
                    <Bell size={19} />
                    <span className="notification-dot" />
                </button>

                <button className="topbar-icon" type="button">
                    <CircleHelp size={19} />
                </button>

                <button className="topbar-icon" type="button">
                    <Settings size={19} />
                </button>

                <div className="profile">
                    <div className="profile-avatar">VD</div>

                    <span className="profile-name">Vineet Dalvi</span>

                    <ChevronDown size={16} />
                </div>
            </div>
        </header>
    );
}

export default Topbar;