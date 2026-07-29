import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, FolderGit2, KeyRound, LogOut, LayoutGrid } from "lucide-react";
import { useOrg } from "../context/OrgContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/credentials", label: "Credentials", icon: KeyRound },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const { org, switchOrg } = useOrg();

  return (
    <aside
      className="glass glass-static"
      style={{
        width: 240,
        minHeight: "100vh",
        borderRadius: 0,
        borderRight: "1px solid var(--glass-border)",
        borderTop: "none",
        borderBottom: "none",
        borderLeft: "none",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ padding: "1.75rem 1.5rem 1rem" }}>
        <div className="logo-glow">
          <img src={org.logo} alt={org.name} style={{ width: "100%", maxWidth: 200 }} />
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--accent-teal-bright)", marginTop: "0.5rem", letterSpacing: "0.08em", fontWeight: 600 }}>
          {org.name.toUpperCase()} WORKSPACE
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.5rem 1rem" }}>
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.7rem 0.9rem",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: active ? "var(--accent-teal-bright)" : "var(--text-muted)",
                background: active ? "rgba(31,216,180,0.1)" : "transparent",
                border: active ? "1px solid var(--glass-border-hover)" : "1px solid transparent",
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={switchOrg}
        style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          margin: "1rem 1rem 4.5rem", padding: "0.6rem 0.9rem",
          background: "none", border: "1px solid var(--glass-border)",
          borderRadius: "10px", color: "var(--text-dim)", fontSize: "0.8rem",
          position: "absolute", bottom: "3.5rem", width: "calc(100% - 2rem)",
        }}
      >
        <LayoutGrid size={15} /> Switch workspace
      </button>

      <button
        className="logout-btn"
        onClick={onLogout}
        style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          margin: "1rem", padding: "0.7rem 0.9rem",
          background: "none", border: "1px solid var(--glass-border)",
          borderRadius: "10px", color: "var(--text-muted)", fontSize: "0.85rem",
          position: "absolute", bottom: 0, width: "calc(100% - 2rem)",
        }}
      >
        <LogOut size={16} /> Sign out
      </button>
    </aside>
  );
}