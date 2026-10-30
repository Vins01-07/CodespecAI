import { Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";

import Dashboard from "../pages/Dashboard";
import Repository from "../pages/Repository";
import Ingestion from "../pages/Ingestion";
import KnowledgeSearch from "../pages/KnowledgeSearch";
import Architecture from "../pages/Architecture";
import Dependencies from "../pages/Dependencies";
import SystemQA from "../pages/SystemQA";
import ChangeImpact from "../pages/ChangeImpact";
import Documentation from "../pages/Documentation";

function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/repository" element={<Repository />} />
                <Route path="/ingestion" element={<Ingestion />} />
                <Route path="/knowledge-search" element={<KnowledgeSearch />} />
                <Route path="/architecture" element={<Architecture />} />
                <Route path="/dependencies" element={<Dependencies />} />
                <Route path="/system-qa" element={<SystemQA />} />
                <Route path="/change-impact" element={<ChangeImpact />} />
                <Route path="/documentation" element={<Documentation />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;