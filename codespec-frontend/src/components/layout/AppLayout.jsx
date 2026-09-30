import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ScrollAnimatedBackground from "../common/ScrollAnimatedBackground";

function AppLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="app-shell">
            {/* Background Scroll Animation across all pages */}
            <ScrollAnimatedBackground />

            {/* Backdrop overlay for mobile */}
            {mobileOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

            <div className="main-shell">
                <Topbar onMenuToggle={() => setMobileOpen(!mobileOpen)} />

                <main className="page-content">
                    <Outlet />
                </main>
            </div>

            <style>{`
                .sidebar-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(6px);
                    z-index: 95;
                }
                @media (max-width: 640px) {
                    .sidebar.open {
                        display: flex;
                        position: fixed;
                        top: 10px;
                        left: 10px;
                        bottom: 10px;
                        width: 250px;
                        z-index: 100;
                    }
                }
            `}</style>
        </div>
    );
}

export default AppLayout;