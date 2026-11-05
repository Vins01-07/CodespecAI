import { useState } from "react";
import { NavLink } from "react-router-dom";
import useUiStore from "../../store/uiStore";
import Modal from "../common/Modal";
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
    Check,
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
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState("annual");
    const [upgradeComplete, setUpgradeComplete] = useState(false);
    const [isPro, setIsPro] = useState(() => localStorage.getItem("codespecPro") === "active");

    const activateTrial = () => {
        localStorage.setItem("codespecPro", "active");
        localStorage.setItem("codespecProBilling", billingCycle);
        setIsPro(true);
        setUpgradeComplete(true);
    };

    const closeUpgrade = () => {
        setUpgradeOpen(false);
        setUpgradeComplete(false);
    };

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

                    <button
                        className="upgrade-button font-mono"
                        type="button"
                        onClick={() => setUpgradeOpen(true)}
                    >
                        <span>{isPro ? "Manage plan" : "Upgrade now"}</span>
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            <Modal
                isOpen={upgradeOpen}
                onClose={closeUpgrade}
                title={upgradeComplete ? "Upgrade complete" : "Upgrade to CodeSpec AI Pro"}
                panelClassName="upgrade-modal-panel"
            >
                {upgradeComplete ? (
                    <div className="upgrade-success">
                        <div className="upgrade-success-icon">
                            <Check size={22} />
                        </div>
                        <h4>Your Pro trial is active</h4>
                        <p>
                            Your {billingCycle === "annual" ? "annual" : "monthly"} plan is ready.
                            Premium codebase insights are now unlocked.
                        </p>
                        <button className="upgrade-cta" type="button" onClick={closeUpgrade}>
                            Continue to dashboard
                        </button>
                    </div>
                ) : (
                    <div className="upgrade-modal-content">
                        <div className="upgrade-billing-toggle" role="group" aria-label="Billing cycle">
                            <button
                                type="button"
                                className={billingCycle === "monthly" ? "active" : ""}
                                onClick={() => setBillingCycle("monthly")}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                className={billingCycle === "annual" ? "active" : ""}
                                onClick={() => setBillingCycle("annual")}
                            >
                                Annual <span>Save 20%</span>
                            </button>
                        </div>

                        <div className="upgrade-plan">
                            <div>
                                <span className="upgrade-plan-label">Pro plan</span>
                                <div className="upgrade-price">
                                    {billingCycle === "annual" ? "$19" : "$24"}
                                    <span>/month</span>
                                </div>
                            </div>
                            <p>{billingCycle === "annual" ? "$228 billed annually" : "Billed monthly"}</p>
                        </div>

                        <ul className="upgrade-features">
                            <li><Check size={15} /> Unlimited repository analysis</li>
                            <li><Check size={15} /> Advanced architecture intelligence</li>
                            <li><Check size={15} /> Change impact and dependency insights</li>
                            <li><Check size={15} /> Priority documentation suggestions</li>
                        </ul>

                        <button className="upgrade-cta" type="button" onClick={activateTrial}>
                            {isPro ? "Update plan" : "Start 14-day free trial"}
                            <ArrowRight size={14} />
                        </button>
                        <span className="upgrade-note">No payment is charged today.</span>
                    </div>
                )}
            </Modal>

            <style>{`
                .upgrade-modal-overlay.modal-overlay {
                    background: rgba(16, 17, 21, 0.3) !important;
                    backdrop-filter: blur(1.5px) !important;
                }
                .upgrade-modal-panel {
                    max-width: 360px !important;
                    min-height: min(720px, calc(100vh - 32px));
                    background: rgba(86, 18, 26, 0.78) !important;
                    border-color: rgba(255, 92, 104, 0.32) !important;
                    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.72),
                        inset 0 1px rgba(255, 255, 255, 0.08) !important;
                    backdrop-filter: blur(24px) saturate(120%) !important;
                    -webkit-backdrop-filter: blur(24px) saturate(120%) !important;
                }
                .upgrade-modal-panel > div:first-child {
                    border-bottom-color: rgba(255, 255, 255, 0.05) !important;
                }
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
                .upgrade-modal-content {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .upgrade-billing-toggle {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px;
                    padding: 4px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.04);
                }
                .upgrade-billing-toggle button {
                    border: 0;
                    border-radius: 7px;
                    background: transparent;
                    color: var(--secondary-text);
                    padding: 9px;
                    cursor: pointer;
                    font-weight: 700;
                }
                .upgrade-billing-toggle button.active {
                    background: #292a32;
                    color: white;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                .upgrade-billing-toggle span {
                    color: #ff6675;
                    font-size: 10px;
                    margin-left: 4px;
                }
                .upgrade-plan {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    padding: 16px;
                    border: 1px solid rgba(227, 38, 54, 0.32);
                    border-radius: 12px;
                    background: linear-gradient(135deg, rgba(227, 38, 54, 0.12), transparent 70%);
                }
                .upgrade-plan-label {
                    font-size: 12px;
                    color: var(--secondary-text);
                }
                .upgrade-price {
                    font-size: 32px;
                    line-height: 1;
                    font-weight: 800;
                    margin-top: 7px;
                }
                .upgrade-price span {
                    font-size: 12px;
                    color: var(--secondary-text);
                    font-weight: 500;
                }
                .upgrade-plan p {
                    margin: 0;
                    font-size: 11px;
                    color: var(--secondary-text);
                }
                .upgrade-features {
                    list-style: none;
                    margin: 0;
                    padding: 2px 0;
                    display: grid;
                    gap: 9px;
                }
                .upgrade-features li {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #d9d9df;
                    font-size: 13px;
                }
                .upgrade-features svg {
                    color: #ff5263;
                    flex: 0 0 auto;
                }
                .upgrade-cta {
                    min-height: 42px;
                    border: 0;
                    border-radius: 9px;
                    color: white;
                    background: linear-gradient(135deg, #ff3548, #e32636);
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                }
                .upgrade-note {
                    text-align: center;
                    font-size: 10px;
                    color: var(--secondary-text);
                }
                .upgrade-success {
                    text-align: center;
                    padding: 12px 4px 4px;
                }
                .upgrade-success-icon {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 12px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    color: white;
                    background: linear-gradient(135deg, #ff3548, #e32636);
                    box-shadow: 0 0 24px rgba(227, 38, 54, 0.35);
                }
                .upgrade-success h4 {
                    margin: 0 0 7px;
                    font-size: 18px;
                }
                .upgrade-success p {
                    margin: 0 0 18px;
                    color: var(--secondary-text);
                    font-size: 13px;
                    line-height: 1.5;
                }
                .upgrade-success .upgrade-cta {
                    width: 100%;
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
