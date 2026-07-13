import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function Calendar() {
  const { activeOrg } = useOrg();
  const [events, setEvents] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ title: "", client: "", recurring: "none" });

  useEffect(() => {
    if (!activeOrg) return;
    const q = query(collection(db, "calendarEvents"), where("orgId", "==", activeOrg));
    return onSnapshot(q, (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
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
  function eventsFor(day) {
    if (!day) return [];
    const ds = dateStr(day);
    return events.filter((e) => e.date === ds);
  }

  async function handleAdd() {
    if (!form.title || !selectedDate) return;
    await addDoc(collection(db, "calendarEvents"), { ...form, date: selectedDate, orgId: activeOrg });
    setForm({ title: "", client: "", recurring: "none" });
    setSelectedDate(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Calendar</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="btn-ghost" onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ padding: "0.5rem" }}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 500, minWidth: 140, textAlign: "center" }}>
            {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button className="btn-ghost" onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ padding: "0.5rem" }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-dim)", padding: "0.5rem 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds = dateStr(day);
          const dayEvents = eventsFor(day);
          const isToday = ds === todayStr;
          return (
            <div key={i} onClick={() => setSelectedDate(ds)} className="glass glass-interactive"
              style={{ minHeight: 90, padding: "0.5rem", cursor: "pointer", border: isToday ? "1px solid var(--accent-teal)" : undefined }}>
              <span style={{ fontSize: "0.8rem", color: isToday ? "var(--accent-teal-bright)" : "var(--text-muted)" }}>{day}</span>
              <div style={{ display: "grid", gap: "3px", marginTop: "0.4rem" }}>
                {dayEvents.slice(0, 2).map((e) => (
                  <div key={e.id} style={{
                    fontSize: "0.68rem", padding: "2px 5px", borderRadius: "5px",
                    background: ds < todayStr ? "rgba(248,113,113,0.15)" : "rgba(31,216,180,0.12)",
                    color: ds < todayStr ? "var(--danger)" : "var(--accent-teal-bright)",
                    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                  }}>{e.title}</div>
                ))}
                {dayEvents.length > 2 && <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>+{dayEvents.length - 2} more</span>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setSelectedDate(null)}>
          <div className="glass" style={{ padding: "1.75rem", width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.05rem" }}>Add deadline · {selectedDate}</h3>
              <X size={18} style={{ cursor: "pointer", color: "var(--text-dim)" }} onClick={() => setSelectedDate(null)} />
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <input placeholder="Deliverable (e.g. March Newsletter)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
              <select value={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.value })}>
                <option value="none">One-time</option>
                <option value="monthly">Repeats monthly</option>
                <option value="yearly">Repeats yearly</option>
              </select>
              <button className="btn-primary" onClick={handleAdd}>Save deadline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}