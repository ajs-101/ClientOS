import { useState, useMemo } from "react";
import TaskCard from "./TaskCard";
import { CheckCircle2, Clock, AlertTriangle, Search, ArrowUpDown, Filter, X } from "lucide-react";

const COLUMNS = [
  { id: "green", title: "On Track", icon: CheckCircle2, color: "#4ADE80", bg: "rgba(34, 197, 94, 0.1)" },
  { id: "yellow", title: "In Progress / Review", icon: Clock, color: "#FBBF24", bg: "rgba(245, 158, 11, 0.1)" },
  { id: "red", title: "Overdue / Critical", icon: AlertTriangle, color: "#F87171", bg: "rgba(248, 113, 113, 0.1)" },
];

export default function KanbanBoard({ tasks = [], onStatusChange, onDelete, authorLabel }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [activeFilter, setActiveFilter] = useState("all");

  function handleDragStart(e, taskId) {
    e.dataTransfer.setData("taskId", taskId);
    setDraggedTaskId(taskId);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e, statusId) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId") || draggedTaskId;
    if (taskId && onStatusChange) {
      onStatusChange(taskId, statusId);
    }
    setDraggedTaskId(null);
  }

  // Filter & Sort Tasks
  const processedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchesSearch =
          !searchTerm.trim() ||
          t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
          activeFilter === "all" || (t.status || "green") === activeFilter;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === "dueDate") {
          return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
        }
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        return 0;
      });
  }, [tasks, searchTerm, activeFilter, sortBy]);

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {/* Search & Filter Toolbar */}
      <div
        className="glass"
        style={{
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, minWidth: 220 }}>
          <Search size={15} color="var(--accent-teal-bright)" />
          <input
            type="text"
            placeholder="Filter tasks by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem",
              fontSize: "0.82rem",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--glass-border)",
              borderRadius: 8,
              flex: 1,
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{ background: "none", border: "none", color: "var(--text-dim)", display: "flex" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Status Quick Filter */}
          <div style={{ display: "flex", gap: "0.3rem", background: "rgba(255,255,255,0.03)", padding: 3, borderRadius: 8 }}>
            {[
              { id: "all", label: "All" },
              { id: "green", label: "On Track" },
              { id: "yellow", label: "Review" },
              { id: "red", label: "Critical" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: "0.25rem 0.55rem",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  background: activeFilter === f.id ? "rgba(31,216,180,0.2)" : "transparent",
                  color: activeFilter === f.id ? "var(--accent-teal-bright)" : "var(--text-muted)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <ArrowUpDown size={13} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.35rem 0.5rem",
                fontSize: "0.76rem",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="dueDate">Due Date</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
          alignItems: "flex-start",
        }}
      >
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const colTasks = processedTasks.filter((t) => (t.status || "green") === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="glass"
            style={{
              padding: "1.25rem",
              borderRadius: 16,
              background: "rgba(11, 24, 21, 0.6)",
              minHeight: 420,
              border: `1px solid ${draggedTaskId ? col.color : "var(--glass-border)"}`,
              transition: "border-color 0.2s ease",
            }}
          >
            {/* Column Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Icon size={16} color={col.color} />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>{col.title}</h3>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: col.bg,
                  color: col.color,
                }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Task List in Column */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {colTasks.length === 0 ? (
                <div
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    border: "2px dashed var(--glass-border)",
                    borderRadius: 12,
                    color: "var(--text-dim)",
                    fontSize: "0.8rem",
                  }}
                >
                  Drop tasks here
                </div>
              ) : (
                colTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    style={{ cursor: "grab" }}
                  >
                    <TaskCard
                      task={t}
                      authorLabel={authorLabel}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
