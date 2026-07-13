import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useOrg } from "./context/OrgContext";
import WorkspaceGate from "./pages/WorkspaceGate";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ClientFolder from "./pages/ClientFolder";
import Calendar from "./pages/Calendar";
import Credentials from "./pages/Credentials";
import Projects from "./pages/Projects";

export default function App() {
  const { activeOrg, switchOrg } = useOrg();

  if (!activeOrg) return <WorkspaceGate />;

  return (
    <BrowserRouter>
      <div className="ambient-orb" style={{ width: 500, height: 500, top: -100, left: -100, background: "var(--accent-teal)" }} />
      <div className="ambient-orb" style={{ width: 400, height: 400, bottom: -80, right: -80, background: "var(--accent-cyan)", animationDelay: "3s" }} />
      <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
        <Sidebar onLogout={switchOrg} />
        <main style={{ flex: 1, padding: "2.5rem 3rem", maxWidth: 1400 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/client/:clientId" element={<ClientFolder />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}