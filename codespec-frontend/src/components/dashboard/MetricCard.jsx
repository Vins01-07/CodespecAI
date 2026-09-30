import Card from "../common/Card";

// Color accent map: maps an iconColor key to card variant + icon variant class names
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
                        <Icon size={16} strokeWidth={2.2} />
                    </div>
                )}
            </div>

            <div className="metric-body">
                <div className="metric-value">{value}</div>
                {(context || sublabel) && (
                    <div className="metric-context">
                        {context && <span className="context-text">{context}</span>}
                        {sublabel && (
                            <span className="sublabel-pill">{sublabel}</span>
                        )}
                    </div>
                )}
                {trend && (
                    <div className="metric-trend">
                        <span style={{ color: trend.startsWith("+") ? "#6ee7b7" : "#fda4af", fontSize: "11px", fontWeight: 600 }}>
                            {trend}
                        </span>
                    </div>
                )}
            </div>

            <style>{`
                .metric-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 112px;
                    border-radius: var(--radius-lg);
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease;
                    cursor: default;
                }
                .metric-card:hover {
                    transform: translateY(-3px);
                }
                .metric-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .metric-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                }
                .metric-body {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .metric-value {
                    font-size: 28px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.8px;
                    line-height: 1;
                }
                .metric-context {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-top: 5px;
                    flex-wrap: wrap;
                }
                .context-text {
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                .sublabel-pill {
                    padding: 1px 7px;
                    background: rgba(255, 255, 255, 0.07);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 9999px;
                    color: var(--text-secondary);
                    font-size: 10px;
                    font-weight: 600;
                }
                .metric-trend {
                    margin-top: 3px;
                }
            `}</style>
        </Card>
    );
}

export default MetricCard;
