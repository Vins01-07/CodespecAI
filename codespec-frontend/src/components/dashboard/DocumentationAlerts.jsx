import { Link } from "react-router-dom";
import { AlertTriangle, AlertCircle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const defaultAlerts = [
    {
        id: "alert-1",
        type: "warning",
        title: "Missing API Documentation",
        module: "/api/v1/graph/export",
        detail: "Endpoint lacks OpenAPI response model annotations",
        severity: "warning",
        time: "10m ago",
    },
    {
        id: "alert-2",
        type: "danger",
        title: "Undocumented Core Function",
        module: "compute_impact_vector()",
        detail: "0 docstrings in AST dependency engine",
        severity: "danger",
        time: "32m ago",
    },
    {
        id: "alert-3",
        type: "warning",
        title: "Outdated Module Spec",
        module: "AuthMiddleware",
        detail: "Signature modified 4 days ago without spec update",
        severity: "warning",
        time: "2h ago",
    },
];

function DocumentationAlerts({ alerts = defaultAlerts }) {
    return (
        <Card className="doc-alerts-card cs-card--violet">
            <div className="doc-alerts-header">
                <div className="doc-alerts-title-wrap">
                    <div className="icon-accent icon-accent--violet">
                        <ShieldAlert size={16} strokeWidth={2} />
                    </div>
                    <div className="doc-header-text">
                        <span className="doc-alerts-title">Documentation Alerts</span>
                        <span className="doc-alerts-subtitle">Real-time sync warnings</span>
                    </div>
                </div>
                <Badge variant="warning" className="doc-count-badge">
                    {alerts.length} pending
                </Badge>
            </div>

            <div className="alerts-list">
                {alerts.map((alert) => {
                    const isDanger = alert.severity === "danger";
                    const Icon = isDanger ? AlertCircle : AlertTriangle;
                    const accentColor = isDanger ? "#f87171" : "#a78bfa";
                    const bgTint = isDanger ? "rgba(248, 113, 113, 0.12)" : "rgba(167, 139, 250, 0.12)";

                    return (
                        <div
                            key={alert.id}
                            className="alert-item"
                        >
                            <div
                                className="alert-item-icon"
                                style={{ background: bgTint, color: accentColor, borderColor: isDanger ? "rgba(248, 113, 113, 0.25)" : "rgba(167, 139, 250, 0.25)" }}
                            >
                                <Icon size={15} strokeWidth={2} />
                            </div>

                            <div className="alert-item-body">
                                <div className="alert-item-header">
                                    <span className="alert-item-title">{alert.title}</span>
                                    <span
                                        className="alert-severity-tag"
                                        style={{ color: accentColor }}
                                    >
                                        {alert.severity}
                                    </span>
                                </div>

                                <div className="alert-item-module font-mono">{alert.module}</div>
                                <div className="alert-item-detail">{alert.detail}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="doc-alerts-footer">
                <Link to="/documentation" className="view-doc-link">
                    <span>Inspect documentation hub</span>
                    <ArrowRight size={13} />
                </Link>
            </div>

            <style>{`
                .doc-alerts-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    border-radius: var(--border-radius);
                }
                .doc-alerts-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .doc-alerts-title-wrap {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .doc-icon-badge {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 11px;
                    background: rgba(167, 139, 250, 0.12);
                    border: 1px solid rgba(167, 139, 250, 0.25);
                    color: #a78bfa;
                }
                .doc-header-text {
                    display: flex;
                    flex-direction: column;
                }
                .doc-alerts-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #ffffff;
                }
                .doc-alerts-subtitle {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .doc-count-badge {
                    background: rgba(167, 139, 250, 0.12) !important;
                    color: #c4b5fd !important;
                    border: 1px solid rgba(167, 139, 250, 0.25) !important;
                    font-size: 10.5px;
                    padding: 3px 8px;
                }
                .alerts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .alert-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 10px 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    transition: background 0.15s ease, border-color 0.15s ease;
                }
                .alert-item:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(167, 139, 250, 0.25);
                }
                .alert-item-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    border: 1px solid transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .alert-item-body {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .alert-item-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                }
                .alert-item-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #ffffff;
                }
                .alert-severity-tag {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .alert-item-module {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 10.5px;
                    color: var(--primary);
                }
                .alert-item-detail {
                    font-size: 11px;
                    color: var(--text-muted);
                    line-height: 1.35;
                }
                .doc-alerts-footer {
                    padding-top: 6px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .view-doc-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11.5px;
                    font-weight: 600;
                    color: var(--primary);
                    transition: color 0.15s ease, transform 0.15s ease;
                }
                .view-doc-link:hover {
                    color: #ffffff;
                    transform: translateX(2px);
                }
            `}</style>
        </Card>
    );
}

export default DocumentationAlerts;
