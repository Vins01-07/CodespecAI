import { AlertCircle, AlertTriangle, Info, CheckCircle2, Clock } from "lucide-react";
import Badge from "../common/Badge";

function DocumentationAlert({ alert, onFix, isCompact = false }) {
    if (!alert) return null;

    const severityConfig = {
        danger: {
            icon: AlertCircle,
            accent: "var(--bright-red)",
            bg: "rgba(255, 53, 72, 0.12)",
            border: "rgba(255, 53, 72, 0.35)",
            badgeVariant: "danger",
            label: "Critical",
        },
        warning: {
            icon: AlertTriangle,
            accent: "#F59E0B",
            bg: "rgba(245, 158, 11, 0.12)",
            border: "rgba(245, 158, 11, 0.35)",
            badgeVariant: "warning",
            label: "Warning",
        },
        info: {
            icon: Info,
            accent: "#168CA3",
            bg: "rgba(22, 140, 163, 0.12)",
            border: "rgba(22, 140, 163, 0.35)",
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
                        padding: 10px 14px;
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                        background: rgba(16, 17, 21, 0.85);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 10px;
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
                        font-weight: 700;
                        color: #F5F5F7;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .doc-alert-badge {
                        font-size: 9.5px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .doc-alert-module {
                        font-size: 10.5px;
                        color: var(--bright-red);
                    }
                    .doc-alert-detail {
                        font-size: 11px;
                        color: var(--secondary-text);
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
                            border: `1px solid ${config.border}`,
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
                                    {alert.module}
                                </span>
                            )}
                            {alert.file && (
                                <span className="doc-alert-file font-mono">
                                    {alert.file}
                                </span>
                            )}
                            {alert.detectedAt && (
                                <span className="doc-alert-time font-mono">
                                    <Clock size={10} />
                                    {alert.detectedAt}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {alert.detail && (
                <p className="doc-alert-description">{alert.detail}</p>
            )}

            {alert.suggestedFix && (
                <div className="doc-alert-suggested-fix">
                    <div className="suggested-fix-header">
                        <CheckCircle2 size={12} className="fix-icon" />
                        <span>Recommended Remediation</span>
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
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: rgba(16, 17, 21, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
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
                    gap: 12px;
                    min-width: 0;
                }
                .doc-alert-icon-box {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
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
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #F5F5F7;
                }
                .doc-alert-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 3px;
                    font-size: 11px;
                    color: var(--secondary-text);
                    flex-wrap: wrap;
                }
                .doc-alert-target {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--bright-red);
                    background: rgba(227, 38, 54, 0.12);
                    border: 1px solid rgba(227, 38, 54, 0.25);
                    padding: 2px 7px;
                    border-radius: 6px;
                    font-size: 10.5px;
                }
                .doc-alert-file {
                    color: var(--secondary-text);
                }
                .doc-alert-time {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--muted-text);
                }
                .doc-alert-description {
                    margin: 0;
                    font-size: 12px;
                    color: #D1D1DB;
                    line-height: 1.45;
                }
                .doc-alert-suggested-fix {
                    background: #090A0D;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    padding: 10px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .suggested-fix-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #10B981;
                }
                .fix-icon {
                    color: #10B981;
                }
                .suggested-fix-text {
                    font-size: 11.5px;
                    color: #F5F5F7;
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
                    gap: 6px;
                    padding: 5px 12px;
                    font-size: 11px;
                    font-weight: 600;
                    background: #1B1B22;
                    color: #F5F5F7;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all var(--duration-fast) ease;
                }
                .doc-alert-resolve-btn:hover {
                    color: #FFFFFF;
                    border-color: rgba(227, 38, 54, 0.4);
                    background: rgba(227, 38, 54, 0.15);
                }
            `}</style>
        </div>
    );
}

export default DocumentationAlert;
