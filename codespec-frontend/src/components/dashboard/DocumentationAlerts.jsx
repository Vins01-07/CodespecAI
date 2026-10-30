import { Link } from "react-router-dom";
import { AlertTriangle, AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";
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
                        <ShieldAlert size={15} strokeWidth={2.2} />
                    </div>
                    <div className="doc-header-text">
                        <span className="doc-alerts-title">Documentation Alerts</span>
                        <span className="doc-alerts-subtitle">Real-time sync warnings</span>
                    </div>
                </div>
                <Badge variant="warning" className="doc-count-badge font-mono">
                    {alerts.length} PENDING
                </Badge>
            </div>

            <div className="alerts-list">
                {alerts.map((alert) => {
                    const isDanger = alert.severity === "danger";
                    const Icon = isDanger ? AlertCircle : AlertTriangle;
                    const accentColor = isDanger ? "#f87171" : "#fbbf24";
                    const bgTint = isDanger ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)";
                    const borderTint = isDanger ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)";

                    return (
                        <div
                            key={alert.id}
                            className="alert-item"
                        >
                            <div
                                className="alert-item-icon"
                                style={{ background: bgTint, color: accentColor, borderColor: borderTint }}
                            >
                                <Icon size={14} strokeWidth={2.2} />
                            </div>

                            <div className="alert-item-body">
                                <div className="alert-item-header">
                                    <span className="alert-item-title">{alert.title}</span>
                                    <span
                                        className="alert-severity-tag font-mono"
                                        style={{ color: accentColor }}
                                    >
                                        {alert.severity.toUpperCase()}
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
                    padding: 14px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
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
                    gap: 8px;
                }
                .doc-header-text {
                    display: flex;
                    flex-direction: column;
                }
                .doc-alerts-title {
                    font-size: 13.5px;
                    font-weight: 800;
                    color: #ffffff;
                }
                .doc-alerts-subtitle {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .doc-count-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                }
                .alerts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .alert-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 8px 10px;
                    background: #090a0f;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    transition: border-color 0.15s ease;
                }
                .alert-item:hover {
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .alert-item-icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                    border: 1px solid;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .alert-item-body {
                    flex: 1;
                    min-width: 0;
                }
                .alert-item-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                }
                .alert-item-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #ffffff;
                }
                .alert-severity-tag {
                    font-size: 9.5px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .alert-item-module {
                    font-size: 11px;
                    color: #a78bfa;
                    margin: 2px 0 1px;
                }
                .alert-item-detail {
                    font-size: 11px;
                    color: var(--text-secondary);
                    line-height: 1.35;
                }
                .doc-alerts-footer {
                    padding-top: 6px;
                    border-top: 1px solid var(--card-border);
                }
                .view-doc-link {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #c4b5fd;
                    transition: color 0.15s ease;
                }
                .view-doc-link:hover {
                    color: #ffffff;
                }
            `}</style>
        </Card>
    );
}

export default DocumentationAlerts;
