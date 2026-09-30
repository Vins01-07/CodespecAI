import { MoreHorizontal, TrendingUp } from "lucide-react";
import Card from "../common/Card";

function KeyMetricsCard({
    title = "Total Functions",
    value = "2,340",
    change = "+8% to the last index",
    icon: Icon,
    accentColor = "violet",
}) {
    const isPositive = change.startsWith("+");

    return (
        <Card className={`key-metrics-card cs-card--${accentColor}`}>
            <div className="card-top-row">
                <div className="card-identity">
                    {Icon && (
                        <div className={`icon-accent icon-accent--${accentColor}`}>
                            <Icon size={14} strokeWidth={2.2} />
                        </div>
                    )}
                    <span className="card-title-text font-mono">{title}</span>
                </div>

                <button className="card-more-btn" type="button" aria-label="More options">
                    <MoreHorizontal size={13} />
                </button>
            </div>

            <div className="card-center-row">
                <span className="card-value-display font-mono">{value}</span>
            </div>

            <div className="card-bottom-row">
                <div className="trend-badge font-mono">
                    <TrendingUp size={11} style={{ color: isPositive ? "#34d399" : "#f87171" }} />
                    <span className="trend-text" style={{ color: isPositive ? "#34d399" : "#f87171" }}>
                        {change}
                    </span>
                </div>
            </div>

            <style>{`
                .key-metrics-card {
                    padding: 14px 18px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    border-radius: var(--border-radius);
                    min-height: 140px;
                }
                .card-top-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .card-identity {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .card-title-text {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .card-more-btn {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-sm);
                    background: #090a0f;
                    border: 1px solid var(--card-border);
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .card-more-btn:hover {
                    color: #ffffff;
                    background: #141620;
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .card-center-row {
                    margin: 6px 0;
                }
                .card-value-display {
                    font-size: 28px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.6px;
                    line-height: 1.1;
                }
                .card-bottom-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .trend-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                }
                .trend-text {
                    font-weight: 600;
                }
            `}</style>
        </Card>
    );
}

export default KeyMetricsCard;
