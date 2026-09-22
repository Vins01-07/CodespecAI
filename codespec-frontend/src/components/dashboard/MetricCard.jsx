import Card from "../common/Card";

function MetricCard({
    label,
    value,
    icon: Icon,
    context,
    sublabel,
    iconColor = "var(--primary)",
}) {
    return (
        <Card className="metric-card">
            <div className="metric-header">
                <span className="metric-label">{label}</span>
                {Icon && (
                    <div
                        className="metric-icon-wrap"
                        style={{ color: iconColor }}
                    >
                        <Icon size={16} strokeWidth={2} />
                    </div>
                )}
            </div>

            <div className="metric-body">
                <div className="metric-value">{value}</div>
                {(context || sublabel) && (
                    <div className="metric-context">
                        {context && <span className="context-text">{context}</span>}
                        {sublabel && <span className="sublabel-text">{sublabel}</span>}
                    </div>
                )}
            </div>

            <style>{`
                .metric-card {
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 94px;
                    transition: transform 0.12s ease, border-color 0.15s ease, background 0.15s ease;
                }
                .metric-card:hover {
                    background: var(--card-background-hover);
                    border-color: #4a5043;
                }
                .metric-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .metric-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                }
                .metric-icon-wrap {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 26px;
                    height: 26px;
                    border-radius: 5px;
                    background: #171916;
                    border: 1px solid var(--card-border);
                }
                .metric-body {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .metric-value {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: -0.5px;
                    line-height: 1.1;
                }
                .metric-context {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-top: 3px;
                }
                .context-text {
                    color: var(--text-secondary);
                }
                .sublabel-text {
                    color: var(--text-muted);
                }
            `}</style>
        </Card>
    );
}

export default MetricCard;
