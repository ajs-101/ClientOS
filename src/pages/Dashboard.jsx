import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { runOverdueEscalation } from "../lib/escalation";
import { AlertTriangle, Clock, CheckCircle2, Users, ArrowRight, CalendarClock } from "lucide-react";

export default function Dashboard() {
  const { activeOrg, org } = useOrg();
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!activeOrg) return;
    runOverdueEscalation(activeOrg);

    const unsubClients = onSnapshot(query(collection(db, "clients"), where("orgId", "==", activeOrg)), (snap) =>
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubEvents = onSnapshot(query(collection(db, "calendarEvents"), where("orgId", "==", activeOrg)), (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data(), _kind: "deadline" })))
    );
    const unsubTasks = onSnapshot(query(collection(db, "employeeTasks"), where("orgId", "==", activeOrg)), (snap) =>
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data(), _kind: "task" })))
    );

    return () => { unsubClients(); unsubEvents(); unsubTasks(); };
  }, [activeOrg]);

  const todayStr = new Date().toISOString().split("T")[0];
  const weekAheadStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const allDated = [
    ...events.map((e) => ({ id: e.id, title: e.title, sub: e.client, date: e.date, kind: "deadline" })),
    ...tasks.filter((t) => t.dueDate).map((t) => ({ id: t.id, title: t.title, sub: t.profile, date: t.dueDate, kind: "task", status: t.status })),
  ];

  const overdue = allDated.filter((i) => i.date < todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = allDated.filter((i) => i.date >= todayStr && i.date <= weekAheadStr).sort((a, b) => a.date.localeCompare(b.date));
  const needsAttention = tasks.filter((t) => t.status === "yellow");

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Dashboard</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>{org?.name} — what needs attention right now</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue.length} color="var(--danger)" />
        <StatCard icon={Clock} label="Due this week" value={upcoming.length} color="#FBBF24" />
        <StatCard icon={CheckCircle2} label="Needs attention" value={needsAttention.length} color="#FBBF24" />
        <StatCard icon={Users} label="Active clients" value={clients.length} color="var(--accent-teal-bright)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <Panel title="Overdue" icon={AlertTriangle} color="var(--danger)" items={overdue} empty="Nothing overdue — good shape." />
        <Panel title="Coming up this week" icon={CalendarClock} color="var(--accent-teal-bright)" items={upcoming} empty="Nothing due in the next 7 days." />
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
        <Link to="/clients" className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          View clients <ArrowRight size={14} />
        </Link>
        <Link to="/employees" className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          Employee profiles <ArrowRight size={14} />
        </Link>
        <Link to="/calendar" className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          Full calendar <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass" style={{ padding: "1.25rem 1.5rem" }}>
      <Icon size={18} color={color} />
      <p style={{ fontSize: "1.9rem", fontWeight: 700, marginTop: "0.6rem", fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{label}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, color, items, empty }) {
  return (
    <div className="glass" style={{ padding: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <Icon size={16} color={color} /> {title}
      </h2>
      {items.length === 0 && <p style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>{empty}</p>}
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {items.slice(0, 8).map((i) => (
          <div key={`${i.kind}-${i.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
            <div>
              <span>{i.title}</span>
              {i.sub && <span style={{ color: "var(--text-dim)", marginLeft: "0.4rem", fontSize: "0.75rem" }}>· {i.sub}</span>}
            </div>
            <span style={{ color: "var(--text-dim)", fontSize: "0.75rem", flexShrink: 0, marginLeft: "0.75rem" }}>{i.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
