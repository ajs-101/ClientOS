import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderGit2,
  KeyRound,
  LogOut,
  LayoutGrid,
  UsersRound,
  FolderKanban,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from "lucide-react";
import { useOrg } from "../context/OrgContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/employees", label: "Employees", icon: UsersRound },
  { to: "/internal-projects", label: "Internal Projects", icon: FolderKanban },
  { to: "/projects", label: "Tools", icon: FolderGit2 },
  { to: "/credentials", label: "Credentials", icon: KeyRound },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const { org, switchOrg } = useOrg();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("clientos_sidebar_collapsed") === "true";
  });

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("clientos_sidebar_collapsed", String(next));
      return next;
    });
  }

  const orgInitial = org?.name ? org.name.charAt(0).toUpperCase() : "C";

  return (
    <aside
      className="glass glass-static"
      style={{
        width: isCollapsed ? 76 : 250,
        minHeight: "100vh",
        borderRadius: 0,
        borderRight: "1px solid var(--glass-border)",
        borderTop: "none",
        borderBottom: "none",
        borderLeft: "none",
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}
    >
      {/* Header & Logo */}
      <div
        style={{
          padding: isCollapsed ? "1.25rem 0.75rem" : "1.25rem 1.25rem 1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          borderBottom: "1px solid var(--glass-border)",
          transition: "padding 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            width: "100%",
            gap: "0.5rem",
          }}
        >
          {isCollapsed ? (
            <div
              onClick={toggleCollapse}
              title="Expand sidebar"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))",
                color: "#05070C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.1rem",
                cursor: "pointer",
                boxShadow: "0 8px 20px -6px rgba(31, 216, 180, 0.4)",
              }}
            >
              {orgInitial}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", overflow: "hidden" }}>
                {org?.logo ? (
                  <img
                    src={org.logo}
                    alt={org.name}
                    style={{ height: 36, width: "auto", objectFit: "contain", maxWidth: 145 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))",
                      color: "#05070C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {orgInitial}
                  </div>
                )}
              </div>

              <button
                onClick={toggleCollapse}
                title="Collapse sidebar"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                  padding: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
              >
                <PanelLeftClose size={17} />
              </button>
            </>
          )}
        </div>

        {!isCollapsed && (
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--accent-teal-bright)",
              letterSpacing: "0.06em",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: "0.2rem",
            }}
          >
            {org?.name ? `${org.name.toUpperCase()} WORKSPACE` : "CLIENTOS WORKSPACE"}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
          padding: isCollapsed ? "1rem 0.6rem" : "1rem 0.85rem",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={isCollapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: "0.75rem",
                padding: isCollapsed ? "0.75rem 0" : "0.65rem 0.9rem",
                borderRadius: "10px",
                fontSize: "0.86rem",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--accent-teal-bright)" : "var(--text-muted)",
                background: active ? "rgba(31, 216, 180, 0.12)" : "transparent",
                borderLeft: active ? "3px solid var(--accent-teal-bright)" : "3px solid transparent",
                borderTop: active ? "1px solid var(--glass-border-hover)" : "1px solid transparent",
                borderRight: active ? "1px solid var(--glass-border-hover)" : "1px solid transparent",
                borderBottom: active ? "1px solid var(--glass-border-hover)" : "1px solid transparent",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <Icon size={isCollapsed ? 20 : 17} color={active ? "var(--accent-teal-bright)" : "var(--text-muted)"} />
              {!isCollapsed && (
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div
        style={{
          padding: isCollapsed ? "1rem 0.6rem" : "1rem 0.85rem",
          borderTop: "1px solid var(--glass-border)",
          display: "grid",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={switchOrg}
          title={isCollapsed ? "Switch workspace" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "0.75rem",
            padding: isCollapsed ? "0.75rem 0" : "0.6rem 0.9rem",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--glass-border)",
            borderRadius: "10px",
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
        >
          <LayoutGrid size={isCollapsed ? 18 : 15} />
          {!isCollapsed && (
            <span style={{ whiteSpace: "nowrap" }}>Switch workspace</span>
          )}
        </button>

        <button
          className="logout-btn"
          onClick={onLogout}
          title={isCollapsed ? "Sign out" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "0.75rem",
            padding: isCollapsed ? "0.75rem 0" : "0.65rem 0.9rem",
            background: "none",
            border: "1px solid var(--glass-border)",
            borderRadius: "10px",
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <LogOut size={isCollapsed ? 18 : 16} />
          {!isCollapsed && (
            <span style={{ whiteSpace: "nowrap" }}>Sign out</span>
          )}
        </button>
      </div>
    </aside>
  );
}
