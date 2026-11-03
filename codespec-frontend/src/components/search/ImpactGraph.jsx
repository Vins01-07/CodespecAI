import { Network, ArrowRight } from "lucide-react";
import Card from "../common/Card";

function ArchitecturalResultsPanel({ query = "searchQuery" }) {
    const nodes = [
        { id: "fe", label: "Client Web App", type: "frontend", color: "#FF5A6E" },
        { id: "api", label: "API Gateway", type: "service", color: "#FF3548" },
        { id: "graph", label: "Graph Engine", type: "engine", color: "#FF3548" },
        { id: "db", label: "Postgres DB", type: "storage", color: "#10B981" },
    ];

    return (
        <Card className="arch-results-card">
            <div className="arch-results-header">
                <div className="arch-results-title-row">
                    <div className="icon-accent">
                        <Network size={14} strokeWidth={2.2} />
                    </div>
                    <span className="arch-results-title">Architectural Results</span>
                </div>
                <span className="arch-results-tag font-mono">AST TOPOLOGY MATCH</span>
            </div>

            <div className="arch-flow-diagram">
                {nodes.map((node, index) => (
                    <div key={node.id} className="arch-flow-step">
                        <div
                            className="arch-flow-node"
                            style={{
                                borderColor: index === 1 || index === 2 ? "#FF3548" : "rgba(255, 255, 255, 0.1)",
                                boxShadow: index === 1 || index === 2 ? "0 0 14px rgba(227, 38, 54, 0.25)" : "none",
                            }}
                        >
                            <span
                                className="arch-node-indicator"
                                style={{ backgroundColor: node.color }}
                            />
                            <div className="arch-node-text">
                                <span className="arch-node-name">{node.label}</span>
                                <span className="arch-node-type font-mono">{node.type}</span>
                            </div>
                        </div>

                        {index < nodes.length - 1 && (
                            <div className="arch-flow-arrow">
                                <ArrowRight size={14} className="flow-arrow-icon" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
                .arch-results-card {
                    padding: 16px 18px;
                    background: #15161B !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 16px !important;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 14px;
                }
                .arch-results-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .arch-results-title-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .arch-results-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #F5F5F7;
                }
                .arch-results-tag {
                    font-size: 10px;
                    color: var(--secondary-text);
                    letter-spacing: 0.05em;
                }
                .arch-flow-diagram {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #090A0D;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 12px;
                    padding: 16px 20px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .arch-flow-step {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    min-width: 130px;
                }
                .arch-flow-node {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #15161B;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    padding: 10px 14px;
                    transition: all var(--duration-fast) ease;
                }
                .arch-node-indicator {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .arch-node-text {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
                .arch-node-name {
                    font-size: 12px;
                    font-weight: 700;
                    color: #F5F5F7;
                }
                .arch-node-type {
                    font-size: 9.5px;
                    color: var(--secondary-text);
                    text-transform: uppercase;
                }
                .arch-flow-arrow {
                    color: var(--bright-red);
                    display: flex;
                    align-items: center;
                }
            `}</style>
        </Card>
    );
}

export default ArchitecturalResultsPanel;

