import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { useEmployee } from "../context/EmployeeContext";
import TaskCard from "../components/TaskCard";
import KanbanBoard from "../components/KanbanBoard";
import {
  Plus,
  FolderKanban,
  Kanban,
  ListFilter,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCw,
  Copy,
  Check,
  Globe,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Target,
  Layers,
} from "lucide-react";

export const DEFAULT_INTERNAL_APPS = [
  {
    id: "marketing-os",
    name: "Marketing OS v2",
    tagline: "Marketing Operating System & Funnel Automations",
    category: "Marketing & Funnels",
    url: "https://marketingosv2.netlify.app/",
    icon: Sparkles,
    color: "#EC4899",
    accentGlow: "rgba(236, 72, 153, 0.25)",
    badge: "v2.0 Live",
  },
  {
    id: "cold-call-agent",
    name: "Cold Call Agent",
    tagline: "AI Voice Outreach, Calling Engine & Analytics",
    category: "Outreach & Voice AI",
    url: "https://cold-call-agent.netlify.app/",
    icon: PhoneCall,
    color: "#8B5CF6",
    accentGlow: "rgba(139, 92, 246, 0.25)",
    badge: "AI Agent",
  },
  {
    id: "aise-authority-os",
    name: "AISE Authority OS",
    tagline: "Authority Architecture, SEO & Content Engine",
    category: "Authority & SEO",
    url: "https://aise-authority-os.netlify.app/",
    icon: ShieldCheck,
    color: "#06B6D4",
    accentGlow: "rgba(6, 182, 212, 0.25)",
    badge: "Authority",
  },
  {
    id: "prospects-os",
    name: "Prospects OS",
    tagline: "High-Intent Lead Intelligence & Scraping Pipeline",
    category: "Lead Gen & Data",
    url: "https://prospects-os.netlify.app/",
    icon: Target,
    color: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.25)",
    badge: "Lead OS",
  },
];

export default function InternalProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeOrg } = useOrg();
  const { profile } = useEmployee();

  // Active top-level mode: "apps" (iFrame Hub) vs "tasks" (Kanban/List)
  const initialMode = searchParams.get("tab") === "tasks" ? "tasks" : "apps";
  const [mainTab, setMainTab] = useState(initialMode);

  // Selected embedded app
  const appParam = searchParams.get("app");
  const initialApp = DEFAULT_INTERNAL_APPS.find((a) => a.id === appParam) || DEFAULT_INTERNAL_APPS[0];
  const [selectedApp, setSelectedApp] = useState(initialApp);

  // iFrame controls
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeContainerRef = useRef(null);

  // Tasks state
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const [viewMode, setViewMode] = useState("kanban");

  // Sync selectedApp when search param changes
  useEffect(() => {
    const currentAppParam = searchParams.get("app");
    if (currentAppParam) {
      const match = DEFAULT_INTERNAL_APPS.find((a) => a.id === currentAppParam);
      if (match && match.id !== selectedApp.id) {
        setSelectedApp(match);
        setIsLoadingIframe(true);
        setIframeKey((k) => k + 1);
      }
    }
    const currentTab = searchParams.get("tab");
    if (currentTab && (currentTab === "apps" || currentTab === "tasks")) {
      setMainTab(currentTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeOrg) return;
    const q = query(
      collection(db, "internalProjects"),
      where("orgId", "==", activeOrg),
    );
    return onSnapshot(q, (snap) =>
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, [activeOrg]);

  function handleSelectApp(app) {
    setSelectedApp(app);
    setIsLoadingIframe(true);
    setIframeKey((k) => k + 1);
    setSearchParams({ tab: "apps", app: app.id });
  }

  function handleRefreshIframe() {
    setIsLoadingIframe(true);
    setIframeKey((k) => k + 1);
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(selectedApp.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleFullscreen() {
    setIsFullscreen((prev) => !prev);
  }

  async function handleAdd() {
    if (!form.title.trim()) return;
    await addDoc(collection(db, "internalProjects"), {
      orgId: activeOrg,
      profile: "internal",
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
      status: "green",
      createdBy: profile?.name || "Team",
      createdAt: new Date().toISOString(),
    });
    setForm({ title: "", description: "", dueDate: "" });
    setShowForm(false);
  }

  async function handleStatusChange(id, status) {
    await updateDoc(doc(db, "internalProjects", id), { status });
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "internalProjects", id));
  }

  const ActiveIcon = selectedApp.icon || Globe;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "rgba(31, 216, 180, 0.12)",
              border: "1px solid var(--glass-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FolderKanban size={24} color="var(--accent-teal-bright)" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", lineHeight: 1.2 }}>Internal Projects</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Live embedded OS systems, AI agents & internal tasks
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.35rem",
              background: "rgba(255,255,255,0.03)",
              padding: 4,
              borderRadius: 12,
              border: "1px solid var(--glass-border)",
            }}
          >
            <button
              onClick={() => {
                setMainTab("apps");
                setSearchParams({ tab: "apps", app: selectedApp.id });
              }}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: 9,
                fontSize: "0.82rem",
                fontWeight: 600,
                border: "none",
                background:
                  mainTab === "apps"
                    ? "linear-gradient(135deg, rgba(31,216,180,0.25), rgba(56,189,248,0.2))"
                    : "transparent",
                color:
                  mainTab === "apps"
                    ? "var(--accent-teal-bright)"
                    : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                transition: "all 0.2s ease",
              }}
            >
              <Layers size={15} /> Live Apps ({DEFAULT_INTERNAL_APPS.length})
            </button>
            <button
              onClick={() => {
                setMainTab("tasks");
                setSearchParams({ tab: "tasks" });
              }}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: 9,
                fontSize: "0.82rem",
                fontWeight: 600,
                border: "none",
                background:
                  mainTab === "tasks"
                    ? "linear-gradient(135deg, rgba(31,216,180,0.25), rgba(56,189,248,0.2))"
                    : "transparent",
                color:
                  mainTab === "tasks"
                    ? "var(--accent-teal-bright)"
                    : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                transition: "all 0.2s ease",
              }}
            >
              <Kanban size={15} /> Tasks & Roadmap
            </button>
          </div>

          {mainTab === "tasks" && (
            <button
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Plus size={16} /> New project
            </button>
          )}
        </div>
      </div>

      {/* ===================== VIEW 1: LIVE APPS IFRAME HUB ===================== */}
      {mainTab === "apps" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* App Selection Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "0.85rem",
            }}
          >
            {DEFAULT_INTERNAL_APPS.map((app) => {
              const IconComponent = app.icon;
              const isSelected = selectedApp.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => handleSelectApp(app)}
                  className="glass glass-interactive"
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: 14,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    border: isSelected
                      ? `1.5px solid ${app.color}`
                      : "1px solid var(--glass-border)",
                    background: isSelected
                      ? `linear-gradient(135deg, ${app.accentGlow}, rgba(11,24,21,0.7))`
                      : "var(--glass-bg)",
                    boxShadow: isSelected
                      ? `0 8px 24px -4px ${app.accentGlow}`
                      : "none",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "0.6rem",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${app.color}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${app.color}44`,
                      }}
                    >
                      <IconComponent size={18} color={app.color} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: 6,
                        background: isSelected ? `${app.color}33` : "rgba(255,255,255,0.06)",
                        color: isSelected ? app.color : "var(--text-dim)",
                        border: `1px solid ${isSelected ? app.color + "66" : "transparent"}`,
                      }}
                    >
                      {app.badge}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "0.96rem",
                      fontWeight: 600,
                      color: isSelected ? "var(--text-primary)" : "var(--text-muted)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {app.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--text-dim)",
                      lineHeight: 1.35,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {app.tagline}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Embedded iFrame Viewport Container */}
          <div
            ref={iframeContainerRef}
            className="glass"
            style={{
              borderRadius: isFullscreen ? 0 : 16,
              border: "1px solid var(--glass-border)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "#070F0D",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              ...(isFullscreen
                ? {
                    position: "fixed",
                    inset: 0,
                    zIndex: 99999,
                    height: "100vh",
                    width: "100vw",
                  }
                : {
                    height: "calc(100vh - 270px)",
                    minHeight: "680px",
                  }),
            }}
          >
            {/* iFrame Browser Navigation Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1.25rem",
                background: "rgba(11, 24, 21, 0.9)",
                borderBottom: "1px solid var(--glass-border)",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              {/* Left: App Identity */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${selectedApp.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${selectedApp.color}44`,
                    flexShrink: 0,
                  }}
                >
                  <ActiveIcon size={15} color={selectedApp.color} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedApp.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: `${selectedApp.color}22`,
                      color: selectedApp.color,
                      border: `1px solid ${selectedApp.color}44`,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedApp.category}
                  </span>
                </div>
              </div>

              {/* Center: URL pill / status */}
              <div
                onClick={handleCopyUrl}
                title="Click to copy URL"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 20,
                  padding: "0.3rem 0.9rem",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  maxWidth: 380,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: selectedApp.color,
                    boxShadow: `0 0 8px ${selectedApp.color}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedApp.url}
                </span>
                {copied ? (
                  <Check size={13} color="var(--accent-teal-bright)" />
                ) : (
                  <Copy size={13} color="var(--text-dim)" />
                )}
              </div>

              {/* Right: Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {/* Reload Button */}
                <button
                  onClick={handleRefreshIframe}
                  title="Reload iFrame"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <RotateCw size={14} />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Fullscreen"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                {/* Open in New Tab */}
                <a
                  href={selectedApp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open live app in new browser tab"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, rgba(31,216,180,0.15), rgba(56,189,248,0.15))",
                    border: "1px solid var(--glass-border)",
                    color: "var(--accent-teal-bright)",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Open Tab</span>
                </a>
              </div>
            </div>

            {/* iFrame Content Container */}
            <div style={{ position: "relative", flex: 1, width: "100%", height: "100%", background: "#05070C" }}>
              {isLoadingIframe && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(7, 15, 13, 0.92)",
                    backdropFilter: "blur(6px)",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${selectedApp.color}22`,
                      border: `1px solid ${selectedApp.color}66`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "pulse 1.5s infinite ease-in-out",
                    }}
                  >
                    <ActiveIcon size={22} color={selectedApp.color} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-primary)" }}>
                      Loading {selectedApp.name}...
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "4px" }}>
                      Connecting to {selectedApp.url}
                    </p>
                  </div>
                </div>
              )}

              <iframe
                key={`${selectedApp.id}-${iframeKey}`}
                src={selectedApp.url}
                title={selectedApp.name}
                onLoad={() => setIsLoadingIframe(false)}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
                allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; microphone"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: TASKS & ROADMAP ===================== */}
      {mainTab === "tasks" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.4rem",
                background: "rgba(255,255,255,0.03)",
                padding: 4,
                borderRadius: 10,
                border: "1px solid var(--glass-border)",
              }}
            >
              <button
                onClick={() => setViewMode("kanban")}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: 8,
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  border: "none",
                  background:
                    viewMode === "kanban"
                      ? "rgba(31,216,180,0.2)"
                      : "transparent",
                  color:
                    viewMode === "kanban"
                      ? "var(--accent-teal-bright)"
                      : "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Kanban size={14} /> Kanban Board
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: 8,
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  border: "none",
                  background:
                    viewMode === "list" ? "rgba(31,216,180,0.2)" : "transparent",
                  color:
                    viewMode === "list"
                      ? "var(--accent-teal-bright)"
                      : "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <ListFilter size={14} /> List View
              </button>
            </div>
          </div>

          {showForm && (
            <div
              className="glass"
              style={{
                padding: "1.5rem",
                marginBottom: "1.5rem",
                display: "grid",
                gap: "0.75rem",
                maxWidth: 420,
              }}
            >
              <input
                placeholder="Project title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                placeholder="Description (optional)"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
              <button className="btn-primary" onClick={handleAdd}>
                Add project
              </button>
            </div>
          )}

          {viewMode === "kanban" ? (
            <KanbanBoard
              tasks={projects}
              authorLabel={profile?.name || "Team"}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ) : (
            <div style={{ display: "grid", gap: "0.9rem" }}>
              {projects.length === 0 && (
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
                  No internal projects yet.
                </p>
              )}
              {projects.map((p) => (
                <TaskCard
                  key={p.id}
                  task={p}
                  authorLabel={profile?.name || "Team"}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  commentsCollection="internalProjectComments"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
