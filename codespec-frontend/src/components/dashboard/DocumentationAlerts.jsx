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
    },
    {
        id: "alert-2",
        type: "danger",
        title: "Undocumented Core Function",
        module: "compute_impact_vector()",
        detail: "0 docstrings in AST dependency engine",
        severity: "danger",
    },
    {
        id: "alert-3",
        type: "warning",
        title: "Outdated Module Spec",
        module: "AuthMiddleware",
        detail: "Signature modified 4 days ago without spec update",
        severity: "warning",
    },
];

function DocumentationAlerts({ alerts = defaultAlerts }) {
    return (
        <Card className="doc-alerts-card">
            <div className="doc-alerts-header">
                <div className="doc-alerts-title-wrap">
                    <ShieldAlert size={15} className="doc-header-icon" />
                    <span className="doc-alerts-title">Documentation Alerts</span>
                </div>
                <Badge variant="warning" className="doc-count-badge">
                    {alerts.length} pending
                </Badge>
            </div>

            <div className="alerts-list">
                {alerts.map((alert) => {
                    const isDanger = alert.severity === "danger";
                    const Icon = isDanger ? AlertCircle : AlertTriangle;
                    const accentColor = isDanger ? "var(--danger)" : "var(--warning)";

                    return (
                        <div
                            key={alert.id}
                            className="alert-item"
                            style={{ borderLeftColor: accentColor }}
                        >
                            <div className="alert-item-header">
                                <div className="alert-item-title-wrap">
                                    <Icon
                                        size={13}
                                        style={{ color: accentColor, flexShrink: 0 }}
                                    />
                                    <span className="alert-item-title">{alert.title}</span>
                                </div>
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
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .doc-alerts-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .doc-alerts-title-wrap {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }
                .doc-header-icon {
                    color: var(--warning);
                }
                .doc-alerts-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .doc-count-badge {
                    font-size: 10px;
                    padding: 1px 6px;
                }
                .alerts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .alert-item {
                    background: #171916;
                    border: 1px solid var(--card-border);
                    border-left-width: 3px;
                    border-radius: 5px;
                    padding: 8px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    transition: background 0.12s ease, border-color 0.12s ease;
                }
                .alert-item:hover {
                    background: var(--card-background-hover);
                }
                .alert-item-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                }
                .alert-item-title-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                }
                .alert-item-title {
                    font-size: 11.5px;
                    font-weight: 600;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .alert-severity-tag {
                    font-size: 9.5px;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    flex-shrink: 0;
                }
                .alert-item-module {
                    font-size: 10.5px;
                    color: var(--primary);
                    margin-top: 1px;
                }
                .alert-item-detail {
                    font-size: 10.5px;
                    color: var(--text-muted);
                    line-height: 1.35;
                }
                .doc-alerts-footer {
                    padding-top: 4px;
                    border-top: 1px solid var(--card-border);
                }
                .view-doc-link {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11px;
                    color: var(--text-secondary);
                    padding: 3px 2px;
                    transition: color 0.15s ease;
                }
                .view-doc-link:hover {
                    color: var(--primary);
                }
            `}</style>
        </Card>
    );
}

export default DocumentationAlerts;
