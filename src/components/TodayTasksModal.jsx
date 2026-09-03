import { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export default function TodayTasksModal({
  isOpen,
  onClose,
  tasks = [],
  events = [],
  internalProjects = [],
  profileName = "All Workspace",
}) {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'overdue', 'today'

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isOpen && !briefing) {
      fetchAIBriefing();
    }
  }, [isOpen]);

  async function fetchAIBriefing() {
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/today-tasks-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todayStr,
          profileName,
          tasks,
          events,
          internalProjects,
        }),
      });
      const data = await res.json();
      setBriefing(data.briefing || "Today's tasks summarized successfully.");
    } catch (err) {
      console.error(err);
      setBriefing("Could not fetch AI briefing right now. Please check the tasks listed below.");
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  // Filter tasks & events
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== "green"
  );
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const todayEvents = events.filter((e) => e.date === todayStr);

  const allItems = [
    ...overdueTasks.map((t) => ({ ...t, kind: "task", isOverdue: true })),
    ...todayTasks.map((t) => ({ ...t, kind: "task", isToday: true })),
    ...todayEvents.map((e) => ({ ...e, kind: "event", isToday: true })),
  ];

  const displayedItems = allItems.filter((i) => {
    if (filter === "overdue") return i.isOverdue;
    if (filter === "today") return i.isToday && !i.isOverdue;
    return true;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "2rem",
          borderRadius: 20,
          background: "var(--bg-elevated)",
          border: "1px solid var(--glass-border-hover)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(31, 216, 180, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={20} color="var(--accent-teal-bright)" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.35rem", margin: 0 }}>
                  My Tasks Today — AI Brief
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {profileName} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* AI Briefing Box */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(31, 216, 180, 0.08), rgba(56, 189, 248, 0.08))",
            border: "1px solid rgba(31, 216, 180, 0.3)",
            borderRadius: 14,
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.6rem",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--accent-teal-bright)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Sparkles size={14} /> Claude Executive Summary
            </span>
            <button
              onClick={fetchAIBriefing}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={12} className={loading ? "spin" : ""} />
              {loading ? "Updating..." : "Refresh AI"}
            </button>
          </div>

          {loading ? (
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              Claude is analyzing today's workload and schedule...
            </p>
          ) : (
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
              }}
            >
              {briefing}
            </p>
          )}
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.2rem",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginRight: "0.4rem" }}>
            Filter:
          </span>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: 20,
              fontSize: "0.78rem",
              fontWeight: 500,
              border: filter === "all" ? "1px solid var(--accent-teal)" : "1px solid var(--glass-border)",
              background: filter === "all" ? "rgba(31,216,180,0.15)" : "transparent",
              color: filter === "all" ? "var(--accent-teal-bright)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            All ({allItems.length})
          </button>
          <button
            onClick={() => setFilter("overdue")}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: 20,
              fontSize: "0.78rem",
              fontWeight: 500,
              border: filter === "overdue" ? "1px solid var(--danger)" : "1px solid var(--glass-border)",
              background: filter === "overdue" ? "rgba(248,113,113,0.15)" : "transparent",
              color: filter === "overdue" ? "var(--danger)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            🔴 Overdue ({overdueTasks.length})
          </button>
          <button
            onClick={() => setFilter("today")}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: 20,
              fontSize: "0.78rem",
              fontWeight: 500,
              border: filter === "today" ? "1px solid #FBBF24" : "1px solid var(--glass-border)",
              background: filter === "today" ? "rgba(251,191,36,0.15)" : "transparent",
              color: filter === "today" ? "#FBBF24" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            🟡 Due Today ({todayTasks.length + todayEvents.length})
          </button>
        </div>

        {/* Task Items List */}
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {displayedItems.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem" }}>
              No tasks found for this filter. 👍
            </p>
          ) : (
            displayedItems.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.85rem 1.1rem",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: item.isOverdue
                    ? "1px solid rgba(248, 113, 113, 0.3)"
                    : "1px solid var(--glass-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {item.isOverdue ? (
                    <AlertTriangle size={17} color="var(--danger)" />
                  ) : item.kind === "event" ? (
                    <Calendar size={17} color="var(--accent-cyan)" />
                  ) : (
                    <Clock size={17} color="#FBBF24" />
                  )}
                  <div>
                    <p style={{ fontSize: "0.88rem", fontWeight: 500, margin: 0 }}>
                      {item.title || item.name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "2px" }}>
                      {item.profile ? `Profile: ${item.profile}` : item.client ? `Client: ${item.client}` : "General Workspace"}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: item.isOverdue
                        ? "rgba(248, 113, 113, 0.15)"
                        : "rgba(251, 191, 36, 0.15)",
                      color: item.isOverdue ? "var(--danger)" : "#FBBF24",
                      fontWeight: 600,
                    }}
                  >
                    {item.isOverdue ? `Overdue (${item.dueDate || item.date})` : "Due Today"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
