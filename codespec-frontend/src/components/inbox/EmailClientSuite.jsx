import { useState } from "react";
import {
    Home,
    BarChart2,
    Building2,
    Mail,
    PlayCircle,
    Users,
    FileText,
    CircleDollarSign,
    Settings,
    ChevronRight,
    Star,
    Send,
    FileEdit,
    Trash2,
    Plus,
    Folder,
    Search,
    Reply,
    ReplyAll,
    Forward,
    FolderInput,
    FolderOutput,
    Archive,
    Ban,
    VolumeX,
    Calendar,
    Paperclip,
    MoreVertical,
    Check,
} from "lucide-react";

export default function EmailClientSuite() {
    const [selectedEmailId, setSelectedEmailId] = useState("email-4"); // Default Reid Smith from screenshot
    const [filterTab, setFilterTab] = useState("all"); // "all" | "read" | "unread"
    const [contextMenuVisible, setContextMenuVisible] = useState(true); // Matches screenshot
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFolder, setActiveFolder] = useState("inbox");

    const emails = [
        {
            id: "email-1",
            sender: "Hannah Morgan",
            time: "1:24 PM",
            unread: true,
            starred: true,
            subject: "Meeting scheduled",
            preview: "Hi James, I just scheduled a meeting with the team to go over the design ....",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
            body: "Hi James,\n\nI just scheduled a meeting with the team to go over the design system updates and architectural benchmarks. Please review the attached slides before we jump on the call.",
            to: "James Hendricks",
            cc: "Design Team",
        },
        {
            id: "email-2",
            sender: "Megan Clark",
            time: "12:32 PM",
            unread: false,
            starred: false,
            subject: "Update on marketing campaign",
            preview: "Hey Richard, Here's an update on the marketing campaign my team is ....",
            avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
            body: "Hey Richard,\n\nHere's an update on the marketing campaign my team is finalizing. Conversion metrics on the developer portal are up 34% this sprint!",
            to: "James Hendricks",
            cc: "Marketing Leads",
        },
        {
            id: "email-3",
            sender: "Brandon Williams",
            time: "Yesterday",
            unread: true,
            starred: false,
            subject: "Designly 2.0 is about to launch",
            preview: "James! I'd like to invite you to the relaunch of Designly, as Designly 2.0 ....",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
            body: "James!\n\nI'd like to invite you to the relaunch of Designly, as Designly 2.0. We completely re-architected our front-end using real-time canvas indexing.",
            to: "James Hendricks",
            cc: "Core Beta Users",
        },
        {
            id: "email-4",
            sender: "Reid Smith",
            time: "Yesterday",
            unread: false,
            starred: true,
            subject: "My friend Julie loves Dappr!",
            preview: "Good morning guys, My friend Julie recently started her business ....",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
            body: `Good morning guys,\n\nMy friend Julie recently started her business using Dappr, and now she can't stop talking about how easy it was to start, and now, run her business on their platform. When I first told her about Dappr a few weeks ago, and how easy and fun it was to start my business, she wouldn't believe me. Now all she's talking about is how amazing Dappr is, and she's telling her friends to start a business using Dappr as well.\n\nShe said she never knew that people who use other services to start their business have to pay so much more and deal with terrible support.\n\nKeep up the great work!`,
            to: "James Hendricks",
            cc: "Jared Moore, Michela Nava, Eric Stromberg",
        },
        {
            id: "email-5",
            sender: "Russ Miller",
            time: "2/5/26",
            unread: true,
            starred: false,
            subject: "We need some more sweeeeg",
            preview: "Hey James, We're running out of Dappr company swag, you need to order ....",
            avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=faces",
            body: "Hey James,\n\nWe're running out of Dappr company swag, you need to order another batch of hoodies and thermal bottles for the upcoming developer hackathon.",
            to: "James Hendricks",
            cc: "Operations",
        },
        {
            id: "email-6",
            sender: "Rachel Davis",
            time: "Yesterday",
            unread: true,
            starred: false,
            subject: "New Regional Sales Manager",
            preview: "Hello James, Please stop by my office ....",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces",
            body: "Hello James,\n\nPlease stop by my office at 3:00 PM today to meet the new Regional Sales Manager for the EMEA division.",
            to: "James Hendricks",
            cc: "Executive Team",
        },
    ];

    const currentEmail = emails.find((e) => e.id === selectedEmailId) || emails[3];

    // Filter logic
    const filteredEmails = emails.filter((e) => {
        if (filterTab === "unread") return e.unread;
        if (filterTab === "read") return !e.unread;
        return true;
    }).filter((e) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            e.sender.toLowerCase().includes(q) ||
            e.subject.toLowerCase().includes(q) ||
            e.preview.toLowerCase().includes(q)
        );
    });

    return (
        <div className="dappr-window-shell">
            {/* Window Top Titlebar with macOS Traffic Lights */}
            <div className="dappr-window-titlebar">
                <div className="traffic-lights">
                    <span className="light light-close" title="Close" />
                    <span className="light light-minimize" title="Minimize" />
                    <span className="light light-expand" title="Expand" />
                </div>
                <div className="window-title-text">Dappr Mail • Communications Suite</div>
                <div className="window-spacer" />
            </div>

            {/* Main Application Body (3 Columns + Left Icon Dock) */}
            <div className="dappr-app-body">
                {/* 1. Leftmost Icon Dock */}
                <aside className="dappr-icon-dock" aria-label="App Navigation">
                    <div className="dock-top">
                        <div className="dock-brand">
                            <span className="brand-logo-text">dappr</span>
                        </div>
                        <button className="dock-expand-pill" type="button" title="Expand Dock">
                            <ChevronRight size={13} strokeWidth={2.6} />
                        </button>
                    </div>

                    <nav className="dock-nav-icons">
                        <button className="dock-icon-btn" type="button" title="Home">
                            <Home size={18} strokeWidth={1.8} />
                        </button>
                        <button className="dock-icon-btn" type="button" title="Analytics">
                            <BarChart2 size={18} strokeWidth={1.8} />
                        </button>
                        <button className="dock-icon-btn" type="button" title="Organizations">
                            <Building2 size={18} strokeWidth={1.8} />
                        </button>
                        {/* Active Mail Icon matching screenshot purple pill */}
                        <button className="dock-icon-btn active-purple-pill" type="button" title="Email (Active)">
                            <Mail size={17} strokeWidth={2.2} />
                        </button>
                        <button className="dock-icon-btn" type="button" title="Recordings">
                            <PlayCircle size={18} strokeWidth={1.8} />
                        </button>
                        <button className="dock-icon-btn" type="button" title="Directory">
                            <Users size={18} strokeWidth={1.8} />
                        </button>
                        <button className="dock-icon-btn" type="button" title="Documents">
                            <FileText size={18} strokeWidth={1.8} />
                        </button>
                        <button className="dock-icon-btn" type="button" title="Billing">
                            <CircleDollarSign size={18} strokeWidth={1.8} />
                        </button>
                    </nav>

                    <div className="dock-bottom">
                        <button className="dock-icon-btn" type="button" title="Settings">
                            <Settings size={18} strokeWidth={1.8} />
                        </button>
                    </div>
                </aside>

                {/* 2. Folders / Navigation Column */}
                <div className="dappr-folders-col">
                    <div className="folders-header">
                        <h2 className="folders-pane-title">Email</h2>
                    </div>

                    <div className="folders-list">
                        <button
                            type="button"
                            onClick={() => setActiveFolder("inbox")}
                            className={`folder-row-btn ${activeFolder === "inbox" ? "active" : ""}`}
                        >
                            <div className="folder-name-wrap">
                                <Mail size={16} />
                                <span>Inbox</span>
                            </div>
                            <span className="folder-badge-purple">4</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveFolder("important")}
                            className={`folder-row-btn ${activeFolder === "important" ? "active" : ""}`}
                        >
                            <div className="folder-name-wrap">
                                <Star size={16} />
                                <span>Important</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveFolder("sent")}
                            className={`folder-row-btn ${activeFolder === "sent" ? "active" : ""}`}
                        >
                            <div className="folder-name-wrap">
                                <Send size={16} />
                                <span>Sent</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveFolder("drafts")}
                            className={`folder-row-btn ${activeFolder === "drafts" ? "active" : ""}`}
                        >
                            <div className="folder-name-wrap">
                                <FileEdit size={16} />
                                <span>Drafts</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveFolder("deleted")}
                            className={`folder-row-btn ${activeFolder === "deleted" ? "active" : ""}`}
                        >
                            <div className="folder-name-wrap">
                                <Trash2 size={16} />
                                <span>Deleted</span>
                            </div>
                        </button>
                    </div>

                    {/* Custom Folders Section */}
                    <div className="custom-folders-section">
                        <div className="custom-folders-title-row">
                            <span className="section-title-label">Folders</span>
                            <button className="folders-gear-btn" type="button" title="Manage Folders">
                                <Settings size={13} />
                            </button>
                        </div>

                        <div className="custom-folders-list">
                            <button className="add-folder-btn" type="button">
                                <Plus size={14} />
                                <span>Add Folder</span>
                            </button>
                            <button className="custom-folder-item" type="button">
                                <Folder size={15} />
                                <span>Client</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Middle Message List Column */}
                <div className="dappr-message-list-col">
                    <div className="list-top-header">
                        <div className="inbox-title-row">
                            <h2 className="list-pane-title">Inbox</h2>
                            <button className="compose-round-btn" type="button" title="Compose New Message">
                                <Plus size={16} strokeWidth={2.4} />
                            </button>
                        </div>

                        {/* Search Bar Input */}
                        <div className="inbox-search-box">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Tabs: All, Read, Unread */}
                        <div className="inbox-filter-tabs">
                            <button
                                type="button"
                                onClick={() => setFilterTab("all")}
                                className={`filter-tab-pill ${filterTab === "all" ? "active" : ""}`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab("read")}
                                className={`filter-tab-pill ${filterTab === "read" ? "active" : ""}`}
                            >
                                Read
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab("unread")}
                                className={`filter-tab-pill ${filterTab === "unread" ? "active" : ""}`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>

                    {/* Message Cards List */}
                    <div className="inbox-items-container">
                        {filteredEmails.map((email) => {
                            const isSelected = email.id === selectedEmailId;

                            return (
                                <div
                                    key={email.id}
                                    onClick={() => setSelectedEmailId(email.id)}
                                    className={`email-list-card ${isSelected ? "selected-purple" : ""}`}
                                >
                                    <div className="card-top-line">
                                        <div className="sender-group">
                                            {email.unread && <span className="unread-green-dot" />}
                                            {email.starred && <Star size={11} className="star-icon filled" fill="#c4b5fd" color="#c4b5fd" />}
                                            <span className="sender-name">{email.sender}</span>
                                        </div>
                                        <span className="email-time-stamp">{email.time}</span>
                                    </div>

                                    <div className="email-subject-line">{email.subject}</div>
                                    <div className="email-preview-snippet">{email.preview}</div>

                                    {/* Interactive Context Menu Dropdown on Active Selected Item */}
                                    {isSelected && contextMenuVisible && (
                                        <div
                                            className="dappr-context-menu"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="context-item">Open</div>
                                            <div className="context-item highlighted-purple">Reply</div>
                                            <div className="context-item">Reply All</div>
                                            <div className="context-item">Forward</div>
                                            <div className="context-item">Forward as attachment</div>
                                            <div className="context-item">Mark as unread</div>
                                            <div className="context-item">Move to Junk</div>
                                            <div className="context-item">Mute</div>
                                            <div className="context-item">Delete</div>

                                            {/* Star rating palette from screenshot */}
                                            <div className="context-star-row">
                                                <span className="star-row-label">Star</span>
                                                <div className="stars-palette">
                                                    <span className="color-star" style={{ color: "#c4b5fd" }}>★</span>
                                                    <span className="color-star" style={{ color: "#ef4444" }}>★</span>
                                                    <span className="color-star" style={{ color: "#3b82f6" }}>★</span>
                                                    <span className="color-star" style={{ color: "#10b981" }}>★</span>
                                                    <span className="color-star" style={{ color: "#9ca3af" }}>★</span>
                                                </div>
                                            </div>

                                            <div className="context-divider" />
                                            <div className="context-item">Archive</div>
                                            <div className="context-item">Move to</div>
                                            <div className="context-item">Copy to</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Right Detail / Reading Pane */}
                <div className="dappr-detail-pane">
                    {/* Top Action Toolbar */}
                    <div className="detail-action-bar">
                        <div className="detail-actions-left">
                            <button className="detail-action-btn" type="button">
                                <Reply size={14} />
                                <span>Reply</span>
                            </button>
                            <button className="detail-action-btn" type="button">
                                <ReplyAll size={14} />
                                <span>Reply all</span>
                            </button>
                            <button className="detail-action-btn" type="button">
                                <Forward size={14} />
                                <span>Forward</span>
                            </button>
                            <button className="detail-action-btn" type="button">
                                <Trash2 size={14} />
                                <span>Delete</span>
                            </button>
                            <button className="detail-action-btn" type="button">
                                <Star size={14} />
                                <span>Important</span>
                            </button>
                        </div>

                        <div className="detail-actions-right">
                            <button className="detail-action-btn icon-only" type="button" title="View Calendar">
                                <Calendar size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Email Content Container */}
                    <div className="detail-content-scroll">
                        {/* Sender & Header Metadata */}
                        <div className="detail-email-header">
                            <img
                                src={currentEmail.avatar}
                                alt={currentEmail.sender}
                                className="sender-avatar-img"
                            />

                            <div className="header-meta-col">
                                <div className="header-title-row">
                                    <h3 className="sender-title-name">{currentEmail.sender}</h3>
                                    <span className="detail-date-label">{currentEmail.time}</span>
                                </div>

                                <div className="detail-subject-heading">{currentEmail.subject}</div>

                                <div className="detail-recipients-row">
                                    <span className="rcpt-label">To:</span>
                                    <span className="rcpt-name">{currentEmail.to},</span>
                                    <span className="rcpt-label">Cc:</span>
                                    <span className="rcpt-cc">{currentEmail.cc}</span>
                                </div>
                            </div>
                        </div>

                        {/* Email Body */}
                        <div className="detail-email-body">
                            {currentEmail.body.split("\n\n").map((para, i) => (
                                <p key={i} className="email-body-para">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .dappr-window-shell {
                    width: 100%;
                    max-width: 1280px;
                    margin: 0 auto 30px;
                    border-radius: 18px;
                    background: #111217;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.7), 0 0 60px rgba(112, 93, 242, 0.12);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
                    position: relative;
                    z-index: 10;
                }

                .dappr-window-titlebar {
                    height: 42px;
                    background: #15161d;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                    user-select: none;
                }

                .traffic-lights {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .light {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    display: inline-block;
                }

                .light-close { background: #ff5f56; }
                .light-minimize { background: #ffbd2e; }
                .light-expand { background: #27c93f; }

                .window-title-text {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.45);
                    letter-spacing: -0.2px;
                }

                .window-spacer {
                    width: 52px;
                }

                .dappr-app-body {
                    display: grid;
                    grid-template-columns: 68px 180px 340px minmax(0, 1fr);
                    min-height: 640px;
                    height: 680px;
                    background: #0f1015;
                }

                /* 1. Left Icon Dock */
                .dappr-icon-dock {
                    background: #15161c;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 16px 0;
                    justify-content: space-between;
                }

                .dock-top {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    position: relative;
                }

                .dock-brand {
                    font-size: 16px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    color: #ffffff;
                }

                .dock-expand-pill {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #705df2;
                    border: none;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(112, 93, 242, 0.5);
                    transition: transform 0.2s ease;
                }

                .dock-expand-pill:hover {
                    transform: scale(1.1);
                }

                .dock-nav-icons {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 14px;
                }

                .dock-icon-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.45);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .dock-icon-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.06);
                }

                .dock-icon-btn.active-purple-pill {
                    background: #705df2;
                    color: #ffffff;
                    box-shadow: 0 4px 14px rgba(112, 93, 242, 0.4);
                }

                /* 2. Folders Pane */
                .dappr-folders-col {
                    background: #121319;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 20px 14px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .folders-pane-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 16px 6px;
                }

                .folders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .folder-row-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 10px;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.65);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .folder-row-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.04);
                }

                .folder-row-btn.active {
                    background: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                    font-weight: 600;
                }

                .folder-name-wrap {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .folder-badge-purple {
                    width: 18px;
                    height: 18px;
                    border-radius: 9999px;
                    background: #705df2;
                    color: #ffffff;
                    font-size: 10.5px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .custom-folders-section {
                    margin-top: auto;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .custom-folders-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 6px 10px;
                }

                .section-title-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.85);
                }

                .folders-gear-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.4);
                    cursor: pointer;
                }

                .custom-folders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .add-folder-btn, .custom-folder-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 7px 10px;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.55);
                    font-size: 12.5px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .add-folder-btn:hover, .custom-folder-item:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.04);
                }

                /* 3. Middle Message List Column */
                .dappr-message-list-col {
                    background: #14151b;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .list-top-header {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }

                .inbox-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .list-pane-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0;
                }

                .compose-round-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: #705df2;
                    border: none;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(112, 93, 242, 0.4);
                    transition: transform 0.15s ease;
                }

                .compose-round-btn:hover {
                    transform: scale(1.08);
                }

                .inbox-search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 12px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 9999px;
                }

                .search-icon {
                    color: rgba(255, 255, 255, 0.4);
                }

                .inbox-search-box input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #ffffff;
                    font-size: 12.5px;
                }

                .inbox-search-box input::placeholder {
                    color: rgba(255, 255, 255, 0.35);
                }

                .inbox-filter-tabs {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .filter-tab-pill {
                    flex: 1;
                    padding: 5px 0;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid transparent;
                    color: rgba(255, 255, 255, 0.55);
                    font-size: 11.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-align: center;
                }

                .filter-tab-pill:hover {
                    color: #ffffff;
                }

                .filter-tab-pill.active {
                    background: #705df2;
                    color: #ffffff;
                    font-weight: 700;
                    box-shadow: 0 2px 8px rgba(112, 93, 242, 0.35);
                }

                .inbox-items-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    position: relative;
                }

                .email-list-card {
                    padding: 10px 12px;
                    border-radius: 10px;
                    background: transparent;
                    border: 1px solid transparent;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    transition: all 0.15s ease;
                    position: relative;
                }

                .email-list-card:hover {
                    background: rgba(255, 255, 255, 0.03);
                }

                .email-list-card.selected-purple {
                    background: #705df2 !important;
                    box-shadow: 0 4px 14px rgba(112, 93, 242, 0.35);
                }

                .card-top-line {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .sender-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .unread-green-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 6px #22c55e;
                }

                .sender-name {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #ffffff;
                }

                .email-time-stamp {
                    font-size: 10.5px;
                    color: rgba(255, 255, 255, 0.45);
                }

                .email-list-card.selected-purple .email-time-stamp {
                    color: rgba(255, 255, 255, 0.85);
                }

                .email-subject-line {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.85);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .email-list-card.selected-purple .email-subject-line {
                    color: #ffffff;
                }

                .email-preview-snippet {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.45);
                    line-height: 1.35;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .email-list-card.selected-purple .email-preview-snippet {
                    color: rgba(255, 255, 255, 0.8);
                }

                /* Context Menu Popover matching screenshot */
                .dappr-context-menu {
                    position: absolute;
                    top: 10px;
                    right: -130px;
                    width: 175px;
                    background: #1b1d26;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                    padding: 6px 0;
                    z-index: 50;
                    backdrop-filter: blur(20px);
                }

                .context-item {
                    padding: 6px 14px;
                    font-size: 11.5px;
                    color: rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    transition: background 0.1s ease;
                }

                .context-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                }

                .context-item.highlighted-purple {
                    background: #705df2;
                    color: #ffffff;
                    font-weight: 600;
                }

                .context-star-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 14px;
                    font-size: 11.5px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .stars-palette {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }

                .color-star {
                    font-size: 13px;
                    cursor: pointer;
                    line-height: 1;
                }

                .context-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.06);
                    margin: 4px 0;
                }

                /* 4. Right Detail / Reading Pane */
                .dappr-detail-pane {
                    background: #101117;
                    display: flex;
                    flex-direction: column;
                }

                .detail-action-bar {
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .detail-actions-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .detail-action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.65);
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: color 0.15s ease;
                    padding: 4px 6px;
                    border-radius: 6px;
                }

                .detail-action-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.04);
                }

                .detail-action-btn.icon-only {
                    padding: 6px;
                }

                .detail-content-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .detail-email-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    padding-bottom: 18px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .sender-avatar-img {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(255, 255, 255, 0.12);
                }

                .header-meta-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .header-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .sender-title-name {
                    font-size: 15px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0;
                }

                .detail-date-label {
                    font-size: 11.5px;
                    color: rgba(255, 255, 255, 0.45);
                }

                .detail-subject-heading {
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #ffffff;
                }

                .detail-recipients-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11.5px;
                    flex-wrap: wrap;
                }

                .rcpt-label {
                    color: rgba(255, 255, 255, 0.45);
                }

                .rcpt-name {
                    color: rgba(255, 255, 255, 0.85);
                }

                .rcpt-cc {
                    color: rgba(255, 255, 255, 0.6);
                }

                .detail-email-body {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .email-body-para {
                    font-size: 13px;
                    line-height: 1.65;
                    color: rgba(255, 255, 255, 0.82);
                    margin: 0;
                }

                @media (max-width: 1024px) {
                    .dappr-app-body {
                        grid-template-columns: 60px 150px 280px minmax(0, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .dappr-app-body {
                        grid-template-columns: 56px 1fr;
                    }
                    .dappr-folders-col, .dappr-message-list-col {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
