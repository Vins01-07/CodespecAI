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
        <Card className="doc-alerts-card">
            <div className="doc-alerts-header">
                <div className="doc-alerts-title-wrap">
                    <div className="icon-accent">
                        <ShieldAlert size={15} strokeWidth={2.2} />
                    </div>
                    <div className="doc-header-text">
                        <span className="doc-alerts-title">Documentation Alerts</span>
                        <span className="doc-alerts-subtitle">Real-time sync warnings</span>
                    </div>
                </div>
                <Badge variant="primary" className="doc-count-badge font-mono">
                    {alerts.length} PENDING
                </Badge>
            </div>

            <div className="alerts-list">
                {alerts.map((alert) => {
                    const isDanger = alert.severity === "danger";
                    const Icon = isDanger ? AlertCircle : AlertTriangle;
                    const accentColor = isDanger ? "var(--bright-red)" : "#F59E0B";
                    const bgTint = isDanger ? "rgba(255, 53, 72, 0.12)" : "rgba(245, 158, 11, 0.12)";
                    const borderTint = isDanger ? "rgba(255, 53, 72, 0.3)" : "rgba(245, 158, 11, 0.3)";

                    return (
                        <div key={alert.id} className="alert-item">
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
                    padding: 16px 18px;
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
                    gap: 10px;
                }
                .doc-header-text {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
                .doc-alerts-title {
                    font-size: 14.5px;
                    font-weight: 800;
                    color: #F5F5F7;
                }
                .doc-alerts-subtitle {
                    font-size: 11px;
                    color: var(--secondary-text);
                }
                .doc-count-badge {
                    font-size: 10px;
                }
                .alerts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .alert-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 10px;
                    background: #101115;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 10px;
                    transition: border-color var(--duration-fast) ease;
                }
                .alert-item:hover {
                    border-color: rgba(227, 38, 54, 0.3);
                }
                .alert-item-icon {
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    border: 1px solid;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .alert-item-body {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
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
                    color: #F5F5F7;
                }
                .alert-severity-tag {
                    font-size: 9.5px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
                .alert-item-module {
                    font-size: 10.5px;
                    color: var(--bright-red);
                    word-break: break-all;
                }
                .alert-item-detail {
                    font-size: 11px;
                    color: var(--secondary-text);
                    line-height: 1.35;
                }
                .doc-alerts-footer {
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .view-doc-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11.5px;
                    font-weight: 600;
                    color: var(--bright-red);
                    transition: all var(--duration-fast) ease;
                }
                .view-doc-link:hover {
                    color: #FFFFFF;
                    transform: translateX(2px);
                }
            `}</style>
        </Card>
    );
}

export default DocumentationAlerts;
