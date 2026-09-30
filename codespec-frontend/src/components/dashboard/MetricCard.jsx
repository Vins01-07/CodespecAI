import Card from "../common/Card";

// Color accent map
const COLOR_VARIANT_MAP = {
    "var(--primary)":         { card: "cs-card--violet",  icon: "icon-accent--violet"  },
    "var(--graph-service)":   { card: "cs-card--violet",  icon: "icon-accent--violet"  },
    "var(--graph-frontend)":  { card: "cs-card--violet",  icon: "icon-accent--violet"  },
    "var(--secondary)":       { card: "cs-card--violet",  icon: "icon-accent--violet"  },
    "var(--graph-external)":  { card: "cs-card--cyan",    icon: "icon-accent--cyan"    },
    "var(--graph-database)":  { card: "cs-card--teal",    icon: "icon-accent--teal"    },
    "var(--graph-cache)":     { card: "cs-card--amber",   icon: "icon-accent--amber"   },
    "var(--success)":         { card: "cs-card--green",   icon: "icon-accent--green"   },
    "var(--warning)":         { card: "cs-card--amber",   icon: "icon-accent--amber"   },
    "var(--danger)":          { card: "cs-card--rose",    icon: "icon-accent--rose"    },
};

function MetricCard({
    label,
    value,
    icon: Icon,
    context,
    sublabel,
    iconColor = "var(--primary)",
    trend,
}) {
    const variants = COLOR_VARIANT_MAP[iconColor] || { card: "cs-card--violet", icon: "icon-accent--violet" };

    return (
        <Card className={`metric-card ${variants.card}`}>
            <div className="metric-header">
                <span className="metric-label">{label}</span>
                {Icon && (
                    <div className={`icon-accent ${variants.icon}`}>
                        <Icon size={15} strokeWidth={2.2} />
                    </div>
                )}
            </div>

            <div className="metric-body">
                <div className="metric-value font-mono">{value}</div>
                {(context || sublabel) && (
                    <div className="metric-context">
                        {context && <span className="context-text">{context}</span>}
                        {sublabel && (
                            <span className="sublabel-pill">{sublabel}</span>
                        )}
                    </div>
                )}
                {trend && (
                    <div className="metric-trend font-mono">
                        <span style={{ color: trend.startsWith("+") ? "#34d399" : "#f87171", fontSize: "10.5px", fontWeight: 700 }}>
                            {trend}
                        </span>
                    </div>
                )}
            </div>

            <style>{`
                .metric-card {
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 104px;
                    border-radius: var(--border-radius);
                    cursor: default;
                }
                .metric-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .metric-label {
                    font-size: 10.5px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    font-family: "JetBrains Mono", monospace;
                }
                .metric-body {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .metric-value {
                    font-size: 24px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.6px;
                    line-height: 1.1;
                }
                .metric-context {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-top: 4px;
                    flex-wrap: wrap;
                }
                .context-text {
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                .sublabel-pill {
                    padding: 1px 5px;
                    background: #141620;
                    border: 1px solid var(--card-border);
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    font-size: 9.5px;
                    font-weight: 600;
                    font-family: "JetBrains Mono", monospace;
                }
                .metric-trend {
                    margin-top: 2px;
                }
            `}</style>
        </Card>
    );
}

export default MetricCard;
