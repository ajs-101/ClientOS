import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { runOverdueEscalation } from "../lib/escalation";
import { PROFILE_LIST } from "../config/employeeProfiles";
import { AlertTriangle, Clock, CheckCircle2, Users, ArrowRight, CalendarClock } from "lucide-react";
import Header from "../components/Header";

export default function Dashboard({ onOpenCommandPalette }) {
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
      <Header
        title="Dashboard"
        subtitle={`${org?.name || "ClientOS"} — what needs attention right now`}
        onOpenCommandPalette={onOpenCommandPalette}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue.length} color="var(--danger)" />
        <StatCard icon={Clock} label="Due this week" value={upcoming.length} color="#FBBF24" />
        <StatCard icon={CheckCircle2} label="Needs attention" value={needsAttention.length} color="#FBBF24" />
        <StatCard icon={Users} label="Active clients" value={clients.length} color="var(--accent-teal-bright)" />
      </div>

      {/* --- WORKLOAD VELOCITY ANALYTICS BAR --- */}
      <div className="glass" style={{ padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>Workload Velocity & Balance</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Real-time breakdown of current agency deliverables</p>
          </div>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--accent-teal-bright)" }}>
            {overdue.length + upcoming.length + needsAttention.length} Total Deliverables
          </span>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div style={{ width: "100%", height: 10, borderRadius: 6, background: "rgba(255,255,255,0.05)", display: "flex", overflow: "hidden", marginBottom: "0.85rem" }}>
          <div
            title={`Overdue: ${overdue.length}`}
            style={{
              width: `${(overdue.length / (overdue.length + upcoming.length + needsAttention.length || 1)) * 100}%`,
              background: "var(--danger)",
              height: "100%",
              transition: "width 0.4s ease",
            }}
          />
          <div
            title={`Due this week: ${upcoming.length}`}
            style={{
              width: `${(upcoming.length / (overdue.length + upcoming.length + needsAttention.length || 1)) * 100}%`,
              background: "#FBBF24",
              height: "100%",
              transition: "width 0.4s ease",
            }}
          />
          <div
            title={`Needs attention: ${needsAttention.length}`}
            style={{
              width: `${(needsAttention.length / (overdue.length + upcoming.length + needsAttention.length || 1)) * 100}%`,
              background: "var(--accent-cyan)",
              height: "100%",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.76rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger)" }} />
            <span style={{ color: "var(--text-muted)" }}>Overdue ({overdue.length})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FBBF24" }} />
            <span style={{ color: "var(--text-muted)" }}>Due This Week ({upcoming.length})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-cyan)" }} />
            <span style={{ color: "var(--text-muted)" }}>Needs Attention ({needsAttention.length})</span>
          </div>
        </div>
      </div>

      {/* --- DEPARTMENT WORKLOAD & CAPACITY MATRIX --- */}
      <div className="glass" style={{ padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>Department Workload & Capacity</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Active task distribution and team bandwidth</p>
          </div>
          <Link to="/employees" style={{ fontSize: "0.78rem", color: "var(--accent-teal-bright)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            All Profiles <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
          {PROFILE_LIST.map((p) => {
            const pTasks = tasks.filter((t) => t.profile === p.id);
            const pOverdue = pTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "green");
            const Icon = p.icon;
            return (
              <Link
                key={p.id}
                to={`/employees/${p.id}`}
                className="glass glass-interactive"
                style={{
                  padding: "1rem",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${pOverdue.length > 0 ? "rgba(248,113,113,0.3)" : "var(--glass-border)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={p.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.86rem", fontWeight: 600 }}>{p.name}</p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.people}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {pTasks.length}
                  </span>
                  <p style={{ fontSize: "0.68rem", color: pOverdue.length > 0 ? "var(--danger)" : "var(--text-dim)" }}>
                    {pOverdue.length > 0 ? `${pOverdue.length} overdue` : "Healthy"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
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
