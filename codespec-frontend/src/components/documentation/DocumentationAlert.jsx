import { AlertCircle, AlertTriangle, Info, CheckCircle2, FileCode, Wrench, Clock } from "lucide-react";
import Badge from "../common/Badge";

function DocumentationAlert({ alert, onFix, isCompact = false }) {
    if (!alert) return null;

    const severityConfig = {
        danger: {
            icon: AlertCircle,
            accent: "var(--danger)",
            bg: "rgba(184, 120, 112, 0.1)",
            border: "rgba(184, 120, 112, 0.3)",
            badgeVariant: "danger",
            label: "Critical",
        },
        warning: {
            icon: AlertTriangle,
            accent: "var(--warning)",
            bg: "rgba(182, 154, 103, 0.1)",
            border: "rgba(182, 154, 103, 0.3)",
            badgeVariant: "warning",
            label: "Warning",
        },
        info: {
            icon: Info,
            accent: "var(--primary)",
            bg: "rgba(168, 179, 154, 0.1)",
            border: "rgba(168, 179, 154, 0.3)",
            badgeVariant: "default",
            label: "Info",
        },
    };

    const config = severityConfig[alert.severity] || severityConfig.warning;
    const Icon = config.icon;

    if (isCompact) {
        return (
            <div
                className="doc-alert-compact cs-card"
                style={{
                    borderLeftColor: config.accent,
                    borderLeftWidth: "3px",
                }}
            >
                <div className="doc-alert-header">
                    <div className="doc-alert-title-wrap">
                        <Icon size={13} style={{ color: config.accent, flexShrink: 0 }} />
                        <span className="doc-alert-title">{alert.title}</span>
                    </div>
                    <span className="doc-alert-badge" style={{ color: config.accent }}>
                        {config.label}
                    </span>
                </div>
                {alert.module && <div className="doc-alert-module font-mono">{alert.module}</div>}
                <div className="doc-alert-detail">{alert.detail}</div>

                <style>{`
                    .doc-alert-compact {
                        padding: 9px 12px;
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                    }
                    .doc-alert-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    .doc-alert-title-wrap {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        min-width: 0;
                    }
                    .doc-alert-title {
                        font-size: 12px;
                        font-weight: 600;
                        color: var(--text-primary);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .doc-alert-badge {
                        font-size: 9.5px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }
                    .doc-alert-module {
                        font-size: 10.5px;
                        color: var(--primary);
                    }
                    .doc-alert-detail {
                        font-size: 11px;
                        color: var(--text-secondary);
                        line-height: 1.4;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div
            className="doc-alert-full cs-card"
            style={{
                borderColor: config.border,
                borderLeftColor: config.accent,
                borderLeftWidth: "4px",
            }}
        >
            <div className="doc-alert-top">
                <div className="doc-alert-top-left">
                    <div
                        className="doc-alert-icon-box"
                        style={{
                            backgroundColor: config.bg,
                            color: config.accent,
                        }}
                    >
                        <Icon size={15} />
                    </div>
                    <div>
                        <div className="doc-alert-headline-row">
                            <h4 className="doc-alert-main-title">{alert.title}</h4>
                            <Badge variant={config.badgeVariant}>{config.label}</Badge>
                        </div>
                        <div className="doc-alert-meta-row">
                            {alert.module && (
                                <span className="doc-alert-target font-mono">
                                    <FileCode size={11} />
                                    {alert.module}
                                </span>
                            )}
                            {alert.timestamp && (
                                <span className="doc-alert-time">
                                    <Clock size={11} />
                                    {alert.timestamp}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <p className="doc-alert-description">{alert.detail}</p>

            {alert.suggestedFix && (
                <div className="doc-alert-suggested-fix">
                    <div className="suggested-fix-header">
                        <Wrench size={11} className="fix-icon" />
                        <span>Recommended Resolution:</span>
                    </div>
                    <div className="suggested-fix-text font-mono">{alert.suggestedFix}</div>
                </div>
            )}

            {onFix && (
                <div className="doc-alert-actions">
                    <button
                        className="doc-alert-resolve-btn"
                        onClick={() => onFix(alert)}
                    >
                        <CheckCircle2 size={12} />
                        <span>Mark as Resolved</span>
                    </button>
                </div>
            )}

            <style>{`
                .doc-alert-full {
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .doc-alert-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 10px;
                }
                .doc-alert-top-left {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    min-width: 0;
                }
                .doc-alert-icon-box {
                    width: 28px;
                    height: 28px;
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .doc-alert-headline-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .doc-alert-main-title {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .doc-alert-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 2px;
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .doc-alert-target {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--primary);
                    background: rgba(168, 179, 154, 0.08);
                    padding: 1px 5px;
                    border-radius: 3px;
                }
                .doc-alert-time {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .doc-alert-description {
                    margin: 0;
                    font-size: 11.5px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }
                .doc-alert-suggested-fix {
                    background: var(--app-background);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    padding: 8px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .suggested-fix-header {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 10.5px;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .fix-icon {
                    color: var(--warning);
                }
                .suggested-fix-text {
                    font-size: 11px;
                    color: var(--text-primary);
                    line-height: 1.4;
                    word-break: break-all;
                }
                .doc-alert-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 2px;
                }
                .doc-alert-resolve-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 9px;
                    font-size: 11px;
                    font-weight: 500;
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .doc-alert-resolve-btn:hover {
                    color: var(--primary);
                    border-color: var(--primary);
                    background: rgba(168, 179, 154, 0.08);
                }
            `}</style>
        </div>
    );
}

export default DocumentationAlert;
