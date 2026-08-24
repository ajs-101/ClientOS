import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  User,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";

const emptyForm = {
  title: "",
  recurring: "none",
  assignedTo: "",
  status: "Pending",
};

export default function Calendar() {
  const { activeOrg } = useOrg();
  const [events, setEvents] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!activeOrg) return;
    const q = query(
      collection(db, "calendarEvents"),
      where("orgId", "==", activeOrg),
    );
    return onSnapshot(q, (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, [activeOrg]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function eventsForDateStr(ds) {
    if (!ds) return [];
    return events.filter((e) => e.date === ds);
  }

  function eventsFor(day) {
    if (!day) return [];
    return eventsForDateStr(dateStr(day));
  }

  function openDay(ds) {
    setSelectedDate(ds);
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(ev, e) {
    if (e) e.stopPropagation();
    if (ev.date) setSelectedDate(ev.date);
    setEditingId(ev.id);
    setForm({
      title: ev.title || "",
      recurring: ev.recurring || "none",
      assignedTo: ev.assignedTo || "",
      status: ev.status || "Pending",
    });
  }

  async function handleDelete(id, e) {
    if (e) e.stopPropagation();
    try {
      await deleteDoc(doc(db, "calendarEvents", id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !selectedDate) return;

    try {
      const payload = {
        title: form.title.trim(),
        assignedTo: form.assignedTo.trim(),
        status: form.status.trim() || "Pending",
        recurring: form.recurring,
      };

      if (editingId) {
        await updateDoc(doc(db, "calendarEvents", editingId), payload);
      } else {
        await addDoc(collection(db, "calendarEvents"), {
          ...payload,
          date: selectedDate,
          orgId: activeOrg,
        });
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving event:", err);
    }
  }

  function closeModal() {
    setSelectedDate(null);
    setEditingId(null);
    setForm(emptyForm);
  }

  const optionStyle = {
    backgroundColor: "#0B1815",
    color: "#EAF6F2",
  };

  const dayEventsList = selectedDate ? eventsForDateStr(selectedDate) : [];

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Calendar</h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              marginTop: "0.2rem",
            }}
          >
            Track deliverables, task handlers, and status.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="btn-ghost"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            style={{ padding: "0.5rem" }}
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <span
            style={{
              fontWeight: 600,
              minWidth: 150,
              textAlign: "center",
              fontSize: "1.1rem",
            }}
          >
            {viewDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            className="btn-ghost"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            style={{ padding: "0.5rem" }}
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-dim)",
              padding: "0.5rem 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
        }}
      >
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds = dateStr(day);
          const dayEvents = eventsFor(day);
          const isToday = ds === todayStr;
          return (
            <div
              key={i}
              onClick={() => openDay(ds)}
              className="glass glass-interactive"
              style={{
                minHeight: 100,
                padding: "0.6rem",
                cursor: "pointer",
                border: isToday ? "1px solid var(--accent-teal)" : undefined,
                background: isToday ? "rgba(31, 216, 180, 0.04)" : undefined,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: isToday ? 700 : 500,
                      color: isToday
                        ? "var(--accent-teal-bright)"
                        : "var(--text-muted)",
                    }}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: "var(--accent-teal)",
                        color: "#06110E",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: "4px",
                      }}
                    >
                      Today
                    </span>
                  )}
                </div>

                {/* Day events badges */}
                <div
                  style={{ display: "grid", gap: "4px", marginTop: "0.4rem" }}
                >
                  {dayEvents.slice(0, 2).map((e) => {
                    return (
                      <div
                        key={e.id}
                        onClick={(evt) => startEdit(e, evt)}
                        title={`Click to edit: ${e.title}`}
                        style={{
                          fontSize: "0.7rem",
                          padding: "3px 6px",
                          borderRadius: "6px",
                          background:
                            ds < todayStr
                              ? "rgba(248,113,113,0.15)"
                              : "rgba(31,216,180,0.12)",
                          color:
                            ds < todayStr
                              ? "var(--danger)"
                              : "var(--accent-teal-bright)",
                          border:
                            ds < todayStr
                              ? "1px solid rgba(248,113,113,0.3)"
                              : "1px solid rgba(31,216,180,0.25)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {e.title}
                        </span>
                        {e.assignedTo && (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              opacity: 0.85,
                              fontWeight: 600,
                            }}
                          >
                            ({e.assignedTo.split(" ")[0]})
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-dim)",
                        marginTop: "2px",
                      }}
                    >
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Date Modal */}
      {selectedDate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={closeModal}
        >
          <div
            className="glass"
            style={{
              padding: "1.75rem",
              width: 480,
              maxWidth: "92vw",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Title Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <CalendarIcon size={18} color="var(--accent-teal-bright)" />
                <h3 style={{ fontSize: "1.1rem" }}>
                  Deadlines · {selectedDate}
                </h3>
              </div>
              <X
                size={20}
                style={{ cursor: "pointer", color: "var(--text-dim)" }}
                onClick={closeModal}
              />
            </div>

            {/* List of Existing Events for Selected Date */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.6rem",
                }}
              >
                Existing Tasks ({dayEventsList.length})
              </h4>

              {dayEventsList.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                  }}
                >
                  No deadlines added for this day yet. Fill out the form below
                  to create one.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  {dayEventsList.map((ev) => {
                    const isBeingEdited = editingId === ev.id;
                    return (
                      <div
                        key={ev.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          background: isBeingEdited
                            ? "rgba(31, 216, 180, 0.08)"
                            : "rgba(255,255,255,0.03)",
                          border: isBeingEdited
                            ? "1px solid var(--accent-teal)"
                            : "1px solid var(--glass-border)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "grid", gap: "4px" }}>
                          <span
                            style={{
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {ev.title}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.6rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {ev.assignedTo && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <User size={12} /> {ev.assignedTo}
                              </span>
                            )}
                            {ev.status && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "1px 7px",
                                  borderRadius: "6px",
                                  background: "rgba(56, 189, 248, 0.12)",
                                  color: "#38bdf8",
                                  border: "1px solid rgba(56, 189, 248, 0.25)",
                                  fontWeight: 500,
                                }}
                              >
                                {ev.status}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <button
                            onClick={(evt) => startEdit(ev, evt)}
                            style={{
                              background: isBeingEdited
                                ? "var(--accent-teal)"
                                : "rgba(255,255,255,0.06)",
                              color: isBeingEdited
                                ? "#06110E"
                                : "var(--text-primary)",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="Edit task"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(evt) => handleDelete(ev.id, evt)}
                            style={{
                              background: "rgba(248, 113, 113, 0.12)",
                              color: "var(--danger)",
                              border: "1px solid rgba(248, 113, 113, 0.25)",
                              borderRadius: "6px",
                              padding: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="Delete task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add / Edit Form */}
            <div
              style={{
                borderTop: "1px solid var(--glass-border)",
                paddingTop: "1.25rem",
              }}
            >
              <h4
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: editingId
                    ? "var(--accent-teal-bright)"
                    : "var(--text-primary)",
                  marginBottom: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {editingId ? <Pencil size={16} /> : <Plus size={16} />}
                {editingId ? "Edit Deadline / Task" : "Add New Deadline"}
              </h4>

              <div style={{ display: "grid", gap: "0.85rem" }}>
                {/* Deliverable / Title Input */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    Deliverable / Task Name *
                  </label>
                  <input
                    style={{ width: "100%" }}
                    placeholder="e.g. March Newsletter, Website Redesign"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                {/* Task Handler Input (Kon handle kar raha hai) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    Task Handler (Assigned To)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ width: "100%", paddingLeft: "2.2rem" }}
                      placeholder="e.g. Ali Khan, Sarah Ahmed"
                      value={form.assignedTo}
                      onChange={(e) =>
                        setForm({ ...form, assignedTo: e.target.value })
                      }
                    />
                    <User
                      size={15}
                      style={{
                        position: "absolute",
                        left: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-dim)",
                      }}
                    />
                  </div>
                </div>

                {/* Status Input (Text field) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    Task Status
                  </label>
                  <input
                    style={{ width: "100%" }}
                    placeholder="e.g. Pending, In Progress, Sent for Review"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  />
                </div>

                {/* Recurrence Select */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    Recurrence
                  </label>
                  <select
                    value={form.recurring}
                    onChange={(e) =>
                      setForm({ ...form, recurring: e.target.value })
                    }
                    style={{
                      width: "100%",
                      backgroundColor: "#0B1815",
                      color: "#EAF6F2",
                    }}
                  >
                    <option style={optionStyle} value="none">
                      One-time
                    </option>
                    <option style={optionStyle} value="monthly">
                      Repeats monthly
                    </option>
                    <option style={optionStyle} value="yearly">
                      Repeats yearly
                    </option>
                  </select>
                </div>

                {/* Submit & Cancel Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.4rem",
                  }}
                >
                  <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleSave}
                  >
                    {editingId ? "Update Task" : "Save Task"}
                  </button>
                  {editingId && (
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm);
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
