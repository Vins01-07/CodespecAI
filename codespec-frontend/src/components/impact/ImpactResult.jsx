import { useState } from "react";
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Info,
    FileCode,
    Layers,
    Activity,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Filter,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const RISK_BADGES = {
    CRITICAL: { variant: "danger", icon: ShieldAlert, color: "var(--danger)" },
    HIGH: { variant: "warning", icon: AlertTriangle, color: "#E5C07B" },
    MEDIUM: { variant: "primary", icon: Info, color: "var(--primary)" },
    LOW: { variant: "success", icon: CheckCircle2, color: "var(--success)" },
};

export function ImpactResult({ result }) {
    const [filterType, setFilterType] = useState("all"); // "all" | "direct" | "indirect" | "high"

    if (!result) return null;

    const {
        target,
        risk_level = "MEDIUM",
        risk_score = 50,
        summary,
        blast_radius = {},
        affected_items = [],
        recommended_actions = [],
    } = result;

    const riskConfig = RISK_BADGES[risk_level?.toUpperCase()] || RISK_BADGES.MEDIUM;
    const RiskIcon = riskConfig.icon;

    const filteredItems = affected_items.filter((item) => {
        if (filterType === "direct") return item.impact_type === "direct";
        if (filterType === "indirect") return item.impact_type === "indirect";
        if (filterType === "high") return item.severity === "HIGH" || item.severity === "CRITICAL";
        return true;
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Risk Overview Banner */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                }}
            >
                {/* Risk Level Card */}
                <Card
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 16px",
                        borderLeft: `4px solid ${riskConfig.color}`,
                    }}
                >
                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "10px",
                            background: "rgba(23, 26, 23, 0.8)",
                            border: `1px solid ${riskConfig.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <RiskIcon size={22} color={riskConfig.color} />
                    </div>
                    <div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            Assessed Risk
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                                {risk_level}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                                (Score: {risk_score}/100)
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Direct Dependents */}
                <Card style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        Direct Dependents
                    </span>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        {blast_radius.direct_dependents ?? affected_items.filter((i) => i.impact_type === "direct").length}
                    </div>
                </Card>

                {/* Indirect Dependents */}
                <Card style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        Indirect Dependents
                    </span>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        {blast_radius.indirect_dependents ?? affected_items.filter((i) => i.impact_type === "indirect").length}
                    </div>
                </Card>

                {/* Affected Test Suites */}
                <Card style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        Affected Tests
                    </span>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--secondary)", marginTop: "2px" }}>
                        {blast_radius.affected_tests ?? "—"}
                    </div>
                </Card>
            </div>

            {/* Summary Narrative */}
            {summary && (
                <Card style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <Activity size={14} color="var(--primary)" />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            Executive Summary
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {summary}
                    </p>
                </Card>
            )}

            {/* Affected Items Table */}
            {affected_items.length > 0 && (
                <Card style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Layers size={14} color="var(--primary)" />
                            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                                Affected Components & Dependents ({filteredItems.length})
                            </span>
                        </div>

                        {/* Filter pills */}
                        <div style={{ display: "flex", gap: "6px" }}>
                            {[
                                { id: "all", label: "All" },
                                { id: "direct", label: "Direct" },
                                { id: "indirect", label: "Indirect" },
                                { id: "high", label: "High Severity" },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setFilterType(f.id)}
                                    style={{
                                        padding: "3px 8px",
                                        borderRadius: "4px",
                                        fontSize: "11px",
                                        fontWeight: filterType === f.id ? 600 : 400,
                                        background: filterType === f.id ? "var(--active-background)" : "transparent",
                                        border: `1px solid ${filterType === f.id ? "var(--primary)" : "var(--card-border)"}`,
                                        color: filterType === f.id ? "var(--primary)" : "var(--text-muted)",
                                        cursor: "pointer",
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {filteredItems.map((item, idx) => {
                            const isDirect = item.impact_type === "direct";
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        padding: "10px 12px",
                                        borderRadius: "var(--border-radius)",
                                        background: "var(--sidebar-background)",
                                        border: "1px solid var(--card-border)",
                                    }}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                                                {item.name || item.id}
                                            </span>
                                            <Badge
                                                variant={isDirect ? "warning" : "secondary"}
                                                style={{ fontSize: "9.5px", padding: "1px 5px", textTransform: "uppercase" }}
                                            >
                                                {item.impact_type || "Dependent"}
                                            </Badge>
                                            {item.type && (
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                                                    • {item.type}
                                                </span>
                                            )}
                                        </div>

                                        {item.reason && (
                                            <span style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                                {item.reason}
                                            </span>
                                        )}

                                        {item.file && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                                <FileCode size={11} color="var(--primary)" />
                                                <span>{item.file}</span>
                                            </div>
                                        )}
                                    </div>

                                    {item.severity && (
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                background: item.severity === "HIGH" ? "rgba(184, 120, 112, 0.15)" : "rgba(168, 179, 154, 0.1)",
                                                color: item.severity === "HIGH" ? "var(--danger)" : "var(--primary)",
                                                border: `1px solid ${item.severity === "HIGH" ? "rgba(184, 120, 112, 0.3)" : "rgba(168, 179, 154, 0.2)"}`,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {item.severity}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Recommended Actions */}
            {recommended_actions.length > 0 && (
                <Card style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <CheckSquare size={14} color="var(--primary)" />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                            Recommended Mitigations & Validation
                        </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {recommended_actions.map((action, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    fontSize: "12px",
                                    color: "var(--text-secondary)",
                                    lineHeight: 1.4,
                                }}
                            >
                                <span style={{ color: "var(--primary)", fontWeight: 700 }}>•</span>
                                <span>{action}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

export default ImpactResult;
