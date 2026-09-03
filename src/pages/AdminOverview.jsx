import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { useEmployee } from "../context/EmployeeContext";
import { runOverdueEscalation } from "../lib/escalation";
import { PROFILE_LIST } from "../config/employeeProfiles";
import TaskCard from "../components/TaskCard";
import NotificationPanel from "../components/NotificationPanel";
import AutoTaskGeneratorModal from "../components/AutoTaskGeneratorModal";
import { Sparkles, Send, ArrowLeft, ShieldCheck, Eye, EyeOff, Plus, Zap } from "lucide-react";

export default function AdminOverview() {
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const { activeProfile } = useEmployee();

  const [tasks, setTasks] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [digest, setDigest] = useState("");
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [reminderProfile, setReminderProfile] = useState(PROFILE_LIST[0].id);
  const [reminderText, setReminderText] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAutoGenerator, setShowAutoGenerator] = useState(false);
  const [taskForm, setTaskForm] = useState({
    profile: PROFILE_LIST[0].id,
    title: "",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    if (activeProfile !== "admin") navigate("/employees");
  }, [activeProfile, navigate]);

  useEffect(() => {
    if (!activeOrg) return;
    runOverdueEscalation(activeOrg);

    const q = query(collection(db, "employeeTasks"), where("orgId", "==", activeOrg));
    const unsubTasks = onSnapshot(q, (snap) => setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

    const notifQ = query(collection(db, "notifications"), where("orgId", "==", activeOrg));
    const unsubNotif = onSnapshot(notifQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setAllNotifications(list);
    });

    return () => { unsubTasks(); unsubNotif(); };
  }, [activeOrg]);

  async function handleStatusChange(taskId, newStatus) {
    await updateDoc(doc(db, "employeeTasks", taskId), { status: newStatus });
  }

  async function handleDeleteTask(taskId) {
    await deleteDoc(doc(db, "employeeTasks", taskId));
  }

  async function handleSendReminder() {
    if (!reminderText.trim()) return;
    await addDoc(collection(db, "notifications"), {
      orgId: activeOrg,
      targetProfile: reminderProfile,
      type: "reminder",
      message: reminderText.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    });
    setReminderText("");
  }

  async function handleAssignTask() {
    if (!taskForm.title.trim()) return;

    await addDoc(collection(db, "employeeTasks"), {
      orgId: activeOrg,
      profile: taskForm.profile,
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      dueDate: taskForm.dueDate,
      status: "green",
      createdAt: new Date().toISOString(),
    });

    await addDoc(collection(db, "activityLog"), {
      orgId: activeOrg,
      profile: taskForm.profile,
      message: `Admin assigned new task: "${taskForm.title.trim()}"`,
      createdAt: new Date().toISOString(),
    });

    await addDoc(collection(db, "notifications"), {
      orgId: activeOrg,
      targetProfile: taskForm.profile,
      type: "reminder",
      message: `New task assigned by Admin: "${taskForm.title.trim()}"`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    setTaskForm({ profile: PROFILE_LIST[0].id, title: "", description: "", dueDate: "" });
    setShowTaskForm(false);
  }

  const [riskPrediction, setRiskPrediction] = useState("");
  const [loadingRiskPrediction, setLoadingRiskPrediction] = useState(false);

  async function handlePredictRisk() {
    setLoadingRiskPrediction(true);
    try {
      const res = await fetch("/.netlify/functions/predict-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          profiles: PROFILE_LIST.map((p) => p.name),
        }),
      });
      const data = await res.json();
      setRiskPrediction(data.predictions);
    } catch (err) {
      console.error(err);
      setRiskPrediction("Could not fetch risk predictions right now.");
    }
    setLoadingRiskPrediction(false);
  }

  async function handleDigest() {
    setLoadingDigest(true);
    try {
      const grouped = PROFILE_LIST.map((p) => {
        const pTasks = tasks.filter((t) => t.profile === p.id);
        return `${p.name}: ${pTasks.map((t) => `${t.title} [${t.status}]`).join(", ") || "no tasks"}`;
      }).join(" | ");
      const res = await fetch("/.netlify/functions/admin-digest", {
        method: "POST",
        body: JSON.stringify({ grouped }),
      });
      const data = await res.json();
      setDigest(data.summary);
    } catch {
      setDigest("Couldn't reach Claude right now — try again shortly.");
    }
    setLoadingDigest(false);
  }

  const filteredTasks = activeTab === "all" ? tasks : tasks.filter((t) => t.profile === activeTab);
  const profileName = (id) => PROFILE_LIST.find((p) => p.id === id)?.name || id;

  return (
    <div>
      <button onClick={() => navigate("/employees")} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "1.5rem", padding: "0.5rem 0.9rem" }}>
        <ArrowLeft size={14} /> All profiles
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(79,232,196,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={22} color="var(--accent-teal-bright)" />
          </div>
          <h1 style={{ fontSize: "1.6rem" }}>Admin Overview</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <NotificationPanel orgId={activeOrg} targetProfile="admin" />
          <button
            className="btn-ghost"
            onClick={() => setShowAutoGenerator(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Zap size={15} color="var(--accent-teal-bright)" /> AI Onboarding Generator
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowTaskForm(!showTaskForm)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Plus size={16} /> Assign Task to Employee
          </button>
        </div>
      </div>

      {showTaskForm && (
        <div className="glass" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "grid", gap: "0.75rem", maxWidth: 460 }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>Assign Task to Employee</p>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "block", marginBottom: "0.25rem" }}>Select Department / Profile</label>
            <select
              value={taskForm.profile}
              onChange={(e) => setTaskForm({ ...taskForm, profile: e.target.value })}
              style={{ width: "100%" }}
            >
              {PROFILE_LIST.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <input
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />
          <textarea
            placeholder="Description (optional)"
            rows={3}
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
          <input
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
          />
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.4rem" }}>
            <button className="btn-primary" onClick={handleAssignTask}>Assign Task</button>
            <button className="btn-ghost" onClick={() => setShowTaskForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="glass" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Sparkles size={18} color="var(--accent-teal-bright)" />
          <span style={{ fontSize: "0.9rem", color: digest ? "var(--text-primary)" : "var(--text-muted)" }}>
            {digest || "AI digest across every profile — what needs your attention right now."}
          </span>
        </div>
        <button className="btn-ghost" onClick={handleDigest} disabled={loadingDigest}>
          {loadingDigest ? "Summarizing…" : "Run digest"}
        </button>
      </div>

      {/* --- AI PREDICTIVE RISK & BOTTLENECK ANALYZER --- */}
      <div
        className="glass"
        style={{
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, rgba(248, 113, 113, 0.05), rgba(56, 189, 248, 0.05))",
          border: "1px solid rgba(248, 113, 113, 0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Zap size={18} color="var(--danger)" />
            <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
              AI Operational Risk & Capacity Predictor
            </h3>
          </div>
          <button className="btn-ghost" onClick={handlePredictRisk} disabled={loadingRiskPrediction} style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}>
            {loadingRiskPrediction ? "Analyzing Risks..." : "Predict Risks"}
          </button>
        </div>

        {riskPrediction ? (
          <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
            {riskPrediction}
          </p>
        ) : (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Click "Predict Risks" to run Claude's predictive analyzer on team burnout, overdue rates, and capacity bottlenecks.
          </p>
        )}
      </div>

      {/* --- DEPARTMENT WORKLOAD CAPACITY GRID --- */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.85rem" }}>Department Workload Capacity</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          {PROFILE_LIST.map((p) => {
            const pTasks = tasks.filter((t) => t.profile === p.id);
            const loadPercent = Math.min(Math.round((pTasks.length / 8) * 100), 100);
            const isOverloaded = loadPercent >= 80;
            const isModerate = loadPercent >= 40 && loadPercent < 80;
            const loadColor = isOverloaded ? "var(--danger)" : isModerate ? "#FBBF24" : "var(--accent-teal-bright)";
            const loadLabel = isOverloaded ? "Overloaded" : isModerate ? "Moderate" : "Balanced";

            return (
              <div key={p.id} className="glass" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{p.name}</span>
                  <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, background: `${loadColor}22`, color: loadColor, fontWeight: 600 }}>
                    {loadPercent}% · {loadLabel}
                  </span>
                </div>

                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  {pTasks.length} active tasks assigned
                </p>

                <div style={{ width: "100%", height: 6, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{ width: `${loadPercent}%`, height: "100%", borderRadius: 4, background: loadColor, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ fontWeight: 500, marginBottom: "0.75rem", fontSize: "0.9rem" }}>Send a reminder</p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <select value={reminderProfile} onChange={(e) => setReminderProfile(e.target.value)}>
            {PROFILE_LIST.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input placeholder="Reminder message…" value={reminderText} onChange={(e) => setReminderText(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <button className="btn-primary" onClick={handleSendReminder} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Send size={14} /> Send
          </button>
        </div>
      </div>

      {/* --- NOTIFICATION ACTIVITY (read/unread visibility) --- */}
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <p style={{ fontWeight: 500, marginBottom: "0.9rem", fontSize: "0.9rem" }}>Notification activity</p>
        <div style={{ display: "grid", gap: "0.6rem", maxHeight: 260, overflowY: "auto" }}>
          {allNotifications.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>No notifications sent yet.</p>}
          {allNotifications.slice(0, 20).map((n) => (
            <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{profileName(n.targetProfile)}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>{n.message}</span>
              </div>
              {n.read ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--accent-teal-bright)", fontSize: "0.72rem", flexShrink: 0 }}>
                  <Eye size={12} /> Seen{n.readAt ? ` ${new Date(n.readAt).toLocaleDateString()}` : ""}
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--text-dim)", fontSize: "0.72rem", flexShrink: 0 }}>
                  <EyeOff size={12} /> Unseen
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("all")} className={activeTab === "all" ? "btn-primary" : "btn-ghost"} style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>All</button>
        {PROFILE_LIST.map((p) => (
          <button key={p.id} onClick={() => setActiveTab(p.id)} className={activeTab === p.id ? "btn-primary" : "btn-ghost"} style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
            {p.name}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: "0.9rem" }}>
        {filteredTasks.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>No tasks here.</p>}
        {filteredTasks.map((t) => (
          <TaskCard key={t.id} task={t} authorLabel="Admin" onStatusChange={handleStatusChange} onDelete={handleDeleteTask} />
        ))}
      </div>

      <AutoTaskGeneratorModal
        isOpen={showAutoGenerator}
        onClose={() => setShowAutoGenerator(false)}
      />
    </div>
  );
}