import { MoreHorizontal, TrendingUp } from "lucide-react";
import Card from "../common/Card";

function KeyMetricsCard({
    title = "Total Functions",
    value = "2,340",
    change = "+8% to the last index",
    icon: Icon,
    accentColor = "violet", // violet | blue | teal | green | amber | rose | pink | cyan
}) {
    const isPositive = change.startsWith("+");

    return (
        <Card className={`key-metrics-card cs-card--${accentColor}`}>
            <div className="card-top-row">
                <div className="card-identity">
                    {Icon && (
                        <div className={`icon-accent icon-accent--${accentColor}`}>
                            <Icon size={15} strokeWidth={2.2} />
                        </div>
                    )}
                    <span className="card-title-text">{title}</span>
                </div>

                <button className="card-more-btn" type="button" aria-label="More options">
                    <MoreHorizontal size={14} />
                </button>
            </div>

            <div className="card-center-row">
                <span className="card-value-display">{value}</span>
            </div>

            <div className="card-bottom-row">
                <div className="trend-badge">
                    <TrendingUp size={12} style={{ color: isPositive ? "#6ee7b7" : "#fda4af" }} />
                    <span className="trend-text" style={{ color: isPositive ? "#6ee7b7" : "#fda4af" }}>
                        {change}
                    </span>
                </div>
            </div>

            <style>{`
                .key-metrics-card {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    border-radius: var(--border-radius);
                    min-height: 155px;
                }
                .card-top-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .card-identity {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .card-title-text {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .card-more-btn {
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .card-more-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.1);
                }
                .card-center-row {
                    margin: 8px 0;
                }
                .card-value-display {
                    font-size: 32px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.8px;
                    line-height: 1.1;
                }
                .card-bottom-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .trend-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11.5px;
                }
                .trend-text {
                    font-weight: 600;
                }
            `}</style>
        </Card>
    );
}

export default KeyMetricsCard;
