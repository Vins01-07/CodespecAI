import {
    Files,
    Server,
    Network,
    Code2,
    Package,
} from "lucide-react";
import RepositoryCard from "../components/dashboard/RepositoryCard";
import MetricCard from "../components/dashboard/MetricCard";
import ArchitecturePreview from "../components/dashboard/ArchitecturePreview";
import RecentChanges from "../components/dashboard/RecentChanges";
import DocumentationAlerts from "../components/dashboard/DocumentationAlerts";
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

            {/* Main Content: Left Architecture Preview + Right (Recent Changes + Doc Alerts) */}
            <section className="dashboard-main-grid" aria-label="Dashboard Architecture and Activity">
                <div className="dashboard-left-col">
                    <ArchitecturePreview />
                </div>

                <div className="dashboard-right-col">
                    <RecentChanges />
                    <DocumentationAlerts />
                </div>
            </section>
        </div>
    );
}

export default Dashboard;