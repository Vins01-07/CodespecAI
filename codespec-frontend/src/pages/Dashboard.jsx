import {
    Files,
    Server,
    Network,
    Code2,
    Package,
    Filter,
} from "lucide-react";
import RepositoryCard from "../components/dashboard/RepositoryCard";
import MetricCard from "../components/dashboard/MetricCard";
import ArchitecturePreview from "../components/dashboard/ArchitecturePreview";
import RecentChanges from "../components/dashboard/RecentChanges";
import DocumentationAlerts from "../components/dashboard/DocumentationAlerts";
import SystemEfficiencyCard from "../components/dashboard/SystemEfficiencyCard";
import KeyMetricsCard from "../components/dashboard/KeyMetricsCard";
import useRepositoryStore from "../store/repositoryStore";

function Dashboard() {
    const { activeRepository } = useRepositoryStore();

    // Clean metrics definitions deriving from active repo or fallbacks
    const metricsData = [
        {
            id: "files",
            label: "Files",
            value: activeRepository?.metrics?.files?.toLocaleString() || "1,248",
            icon: Files,
            context: "Indexed AST",
            sublabel: "100% parsed",
            iconColor: "var(--primary)",
        },
        {
            id: "services",
            label: "Services",
            value: activeRepository?.metrics?.services || "12",
            icon: Server,
            context: "Active nodes",
            sublabel: "Microservices",
            iconColor: "var(--graph-service)",
        },
        {
            id: "apis",
            label: "APIs",
            value: activeRepository?.metrics?.apis || "48",
            icon: Network,
            context: "Endpoints",
            sublabel: "REST / RPC",
            iconColor: "var(--graph-frontend)",
        },
        {
            id: "functions",
            label: "Functions",
            value: activeRepository?.metrics?.functions?.toLocaleString() || "2,340",
            icon: Code2,
            context: "Call graph",
            sublabel: "Methods & defs",
            iconColor: "var(--secondary)",
        },
        {
            id: "dependencies",
            label: "Dependencies",
            value: activeRepository?.metrics?.dependencies || "36",
            icon: Package,
            context: "External packages",
            sublabel: "0 vulnerabilities",
            iconColor: "var(--graph-external)",
        },
    ];

    return (
        <div className="dashboard-container">
            {/* Top Page Header (Matches reference "Dashboard" + Filter layout) */}
            <div className="page-header-row">
                <div>
                    <h1 className="page-header-title">Dashboard</h1>
                    <span className="page-header-subtitle">
                        Codebase health, architectural topology & continuous AST intelligence
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button className="filter-pill-btn" type="button">
                        <Filter size={13} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Top: Compact Repository Header */}
            <RepositoryCard repository={activeRepository} />

            {/* Metrics Row */}
            <section className="metrics-grid" aria-label="Codebase Metrics">
                {metricsData.map((metric) => (
                    <MetricCard
                        key={metric.id}
                        label={metric.label}
                        value={metric.value}
                        icon={metric.icon}
                        context={metric.context}
                        sublabel={metric.sublabel}
                        iconColor={metric.iconColor}
                    />
                ))}
            </section>

            {/* Main Content: Left Column (Architecture + Recent Activity + Key Metric) + Right Column (Gauge + Doc Alerts) */}
            <section className="dashboard-main-grid" aria-label="Dashboard Architecture and Activity">
                <div className="dashboard-left-col">
                    <ArchitecturePreview />

                    <div className="dashboard-left-subgrid">
                        <RecentChanges asTable={true} />
                        <KeyMetricsCard
                            title="Total Functions"
                            value={activeRepository?.metrics?.functions?.toLocaleString() || "2,340"}
                            change="+8% to the last index"
                            icon={Code2}
                            accentColor="indigo"
                        />
                    </div>
                </div>

                <div className="dashboard-right-col">
                    <SystemEfficiencyCard
                        efficiency={94.8}
                        label="Efficiency"
                        sublabel="AST Parsing & Codebase Health"
                        context="100% of nodes parsed cleanly • 0 vulnerabilities"
                    />

                    <DocumentationAlerts />
                </div>
            </section>
        </div>
    );
}

export default Dashboard;