import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { PROFILES } from "../config/employeeProfiles";
import {
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  FolderGit2,
  KeyRound,
  UsersRound,
  FolderKanban,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { activeOrg, org, switchOrg } = useOrg();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tools, setTools] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open and load current data
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      if (activeOrg) {
        // Fetch clients
        getDocs(query(collection(db, "clients"), where("orgId", "==", activeOrg)))
          .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
          .catch(() => {});

        // Fetch employee tasks
        getDocs(query(collection(db, "employeeTasks"), where("orgId", "==", activeOrg)))
          .then((snap) => setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
          .catch(() => {});

        // Fetch tools
        getDocs(query(collection(db, "projects"), where("orgId", "==", activeOrg)))
          .then((snap) => setTools(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
          .catch(() => {});
      }
    }
  }, [isOpen, activeOrg]);

  // Static navigation routes
  const staticItems = [
    { id: "p-dash", title: "Dashboard", category: "Navigation", icon: LayoutDashboard, action: () => navigate("/") },
    { id: "p-clients", title: "Clients Directory", category: "Navigation", icon: Users, action: () => navigate("/clients") },
    { id: "p-cal", title: "Calendar & Deadlines", category: "Navigation", icon: Calendar, action: () => navigate("/calendar") },
    { id: "p-emp", title: "Employee Profiles", category: "Navigation", icon: UsersRound, action: () => navigate("/employees") },
    { id: "p-internal", title: "Internal Projects", category: "Navigation", icon: FolderKanban, action: () => navigate("/internal-projects") },
    { id: "p-tools", title: "Tools & Deployments", category: "Navigation", icon: FolderGit2, action: () => navigate("/projects") },
    { id: "p-cred", title: "Credentials Vault", category: "Navigation", icon: KeyRound, action: () => navigate("/credentials") },
    { id: "p-admin", title: "Admin Overview", category: "Navigation", icon: ShieldCheck, action: () => navigate("/admin-overview") },
    { id: "act-switch", title: "Switch Workspace", category: "Actions", icon: Zap, action: () => switchOrg() },
  ];

  // Employee profiles
  const profileItems = Object.values(PROFILES).map((p) => ({
    id: `prof-${p.id}`,
    title: `${p.name} Profile (${p.people})`,
    category: "Profiles",
    icon: p.icon || UsersRound,
    color: p.color,
    action: () => navigate(p.isAdmin ? "/admin-overview" : `/employees/${p.id}`),
  }));

  // Client items
  const clientItems = clients.map((c) => ({
    id: `client-${c.id}`,
    title: c.name,
    sub: c.industry || "Client Folder",
    category: "Clients",
    icon: Users,
    action: () => navigate(`/client/${c.id}`),
  }));

  // Task items
  const taskItems = tasks.map((t) => ({
    id: `task-${t.id}`,
    title: t.title,
    sub: `${t.profile || "Team"} · Due: ${t.dueDate || "No date"}`,
    category: "Tasks",
    icon: Zap,
    action: () => navigate(t.profile ? `/employees/${t.profile}` : "/dashboard"),
  }));

  // Tool items
  const toolItems = tools.map((t) => ({
    id: `tool-${t.id}`,
    title: t.name,
    sub: t.url,
    category: "Tools",
    icon: ExternalLink,
    action: () => window.open(t.url, "_blank"),
  }));

  // Internal Apps
  const internalAppItems = [
    {
      id: "app-marketing-os",
      title: "Marketing OS v2",
      sub: "Marketing Operating System & Funnel Automations",
      category: "Internal Apps",
      icon: ExternalLink,
      color: "#EC4899",
      action: () => navigate("/internal-projects?tab=apps&app=marketing-os"),
    },
    {
      id: "app-cold-call",
      title: "Cold Call Agent",
      sub: "AI Voice Outreach, Calling Engine & Analytics",
      category: "Internal Apps",
      icon: ExternalLink,
      color: "#8B5CF6",
      action: () => navigate("/internal-projects?tab=apps&app=cold-call-agent"),
    },
    {
      id: "app-aise",
      title: "AISE Authority OS",
      sub: "Authority Architecture, SEO & Content Engine",
      category: "Internal Apps",
      icon: ExternalLink,
      color: "#06B6D4",
      action: () => navigate("/internal-projects?tab=apps&app=aise-authority-os"),
    },
    {
      id: "app-prospects",
      title: "Prospects OS",
      sub: "High-Intent Lead Intelligence & Scraping Pipeline",
      category: "Internal Apps",
      icon: ExternalLink,
      color: "#10B981",
      action: () => navigate("/internal-projects?tab=apps&app=prospects-os"),
    },
  ];

  const allItems = [...staticItems, ...internalAppItems, ...profileItems, ...clientItems, ...taskItems, ...toolItems];

  const filteredItems = search.trim()
    ? allItems.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.sub && item.sub.toLowerCase().includes(search.toLowerCase())) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      )
    : allItems.slice(0, 16);

  function executeItem(item) {
    if (!item) return;
    onClose();
    item.action();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 7, 12, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: "100%",
          maxWidth: 620,
          background: "rgba(11, 24, 21, 0.95)",
          border: "1px solid var(--accent-teal)",
          borderRadius: 18,
          boxShadow: "0 25px 80px -20px rgba(31, 216, 180, 0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Search Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--glass-border)",
            gap: "0.85rem",
          }}
        >
          <Search size={20} color="var(--accent-teal-bright)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, client, task, profile, or tool..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              fontSize: "1.05rem",
              color: "var(--text-primary)",
              outline: "none",
              padding: 0,
            }}
          />
          <span
            style={{
              fontSize: "0.72rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--glass-border)",
              borderRadius: 6,
              padding: "2px 6px",
              color: "var(--text-muted)",
            }}
          >
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: 380,
            overflowY: "auto",
            padding: "0.5rem",
            display: "grid",
            gap: "0.25rem",
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-dim)" }}>
              No matches found for "{search}"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon || Zap;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.7rem 0.9rem",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: isSelected ? "rgba(31, 216, 180, 0.15)" : "transparent",
                    border: isSelected ? "1px solid rgba(31, 216, 180, 0.3)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: item.color ? `${item.color}22` : "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={item.color || "var(--accent-teal-bright)"} />
                    </div>
                    <div style={{ display: "grid", gap: "0.1rem", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </span>
                      {item.sub && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.sub}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.04)",
                        color: "var(--text-dim)",
                      }}
                    >
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={14} color="var(--accent-teal-bright)" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.6rem 1.25rem",
            borderTop: "1px solid var(--glass-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.72rem",
            color: "var(--text-dim)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <span>Use ↑ ↓ to navigate, Enter to select</span>
          <span style={{ color: "var(--accent-teal-bright)", fontWeight: 500 }}>
            {org?.name || "ClientOS"}
          </span>
        </div>
      </div>
    </div>
  );
}
