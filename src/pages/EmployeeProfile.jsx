import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { useEmployee } from "../context/EmployeeContext";
import { runOverdueEscalation } from "../lib/escalation";
import { PROFILES } from "../config/employeeProfiles";
import TaskCard from "../components/TaskCard";
import NotificationPanel from "../components/NotificationPanel";
import { Plus, Sparkles, Activity, ArrowLeft } from "lucide-react";

export default function EmployeeProfile() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const { activeProfile } = useEmployee();
  const profile = PROFILES[profileId];
  const profileConfig = profile;

  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Guard: must have unlocked this exact profile
  useEffect(() => {
    if (!profile) {
      navigate("/employees");
      return;
    }
    if (activeProfile !== profileId && activeProfile !== "admin") {
      navigate("/employees");
      return;
    }
  }, [profile, activeProfile, profileId, navigate]);

  useEffect(() => {
    if (!activeOrg || !profileId) return;
    runOverdueEscalation(activeOrg);

    const tasksQ = query(
      collection(db, "employeeTasks"),
      where("orgId", "==", activeOrg),
      where("profile", "==", profileId),
    );
    const unsubTasks = onSnapshot(tasksQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) =>
        (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
      );
      setTasks(list);
    });

    const activityQ = query(
      collection(db, "activityLog"),
      where("orgId", "==", activeOrg),
      where("profile", "==", profileId),
    );
    const unsubActivity = onSnapshot(activityQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setActivity(list.slice(0, 8));
    });

    return () => {
      unsubTasks();
      unsubActivity();
    };
  }, [activeOrg, profileId]);

  async function handleAddTask() {
    if (!form.title.trim()) return;
    await addDoc(collection(db, "employeeTasks"), {
      orgId: activeOrg,
      profile: profileId,
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
      status: "green",
      createdAt: new Date().toISOString(),
    });
    await addDoc(collection(db, "activityLog"), {
      orgId: activeOrg,
      profile: profileId,
      message: `New task added: "${form.title}"`,
      createdAt: new Date().toISOString(),
    });

    setForm({ title: "", description: "", dueDate: "" });
    setShowForm(false);
  }

  async function handleStatusChange(taskId, newStatus) {
    const task = tasks.find((t) => t.id === taskId);
    await updateDoc(doc(db, "employeeTasks", taskId), { status: newStatus });
    await addDoc(collection(db, "activityLog"), {
      orgId: activeOrg,
      profile: profileId,
      message: `"${task?.title || "Task"}" status changed to ${newStatus}`,
      createdAt: new Date().toISOString(),
    });
  }

  async function handleDeleteTask(taskId) {
    await deleteDoc(doc(db, "employeeTasks", taskId));
  }

  async function handleSummarize() {
    setLoadingSummary(true);
    try {
      const res = await fetch("/.netlify/functions/profile-summary", {
        method: "POST",
        body: JSON.stringify({
          profileName: profileConfig?.name,
          tasks: tasks.map(
            (t) =>
              `${t.title} [${t.status}]${t.dueDate ? ` due ${t.dueDate}` : ""}`,
          ),
        }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary("Couldn't reach Claude right now — try again shortly.");
    }
    setLoadingSummary(false);
  }

  if (!profileConfig) return null;
  const Icon = profileConfig.icon;

  return (
    <div>
      <button
        onClick={() => navigate("/employees")}
        className="btn-ghost"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.8rem",
          marginBottom: "1.5rem",
          padding: "0.5rem 0.9rem",
        }}
      >
        <ArrowLeft size={14} /> All profiles
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: `${profileConfig.color}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={22} color={profileConfig.color} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.6rem" }}>{profileConfig.name}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {profileConfig.people}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <NotificationPanel orgId={activeOrg} targetProfile={profileId} />
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Plus size={16} /> New task
          </button>
        </div>
      </div>

      <div
        className="glass"
        style={{
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Sparkles size={18} color="var(--accent-teal-bright)" />
          <span
            style={{
              fontSize: "0.9rem",
              color: summary ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {summary ||
              `AI overview of everything on ${profileConfig.name}'s plate.`}
          </span>
        </div>
        <button
          className="btn-ghost"
          onClick={handleSummarize}
          disabled={loadingSummary}
        >
          {loadingSummary ? "Summarizing…" : "AI Overview"}
        </button>
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
            placeholder="Task title"
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
          <button className="btn-primary" onClick={handleAddTask}>
            Add task
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.9rem", marginBottom: "2.5rem" }}>
        {tasks.length === 0 && (
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
            No tasks yet.
          </p>
        )}
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            authorLabel={profileConfig.name}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
          />
        ))}
      </div>

      <div>
        <h2
          style={{
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.9rem",
          }}
        >
          <Activity size={16} color="var(--accent-teal-bright)" /> Recent
          activity
        </h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {activity.length === 0 && (
            <p style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
              Nothing logged yet.
            </p>
          )}
          {activity.map((a) => (
            <div
              key={a.id}
              style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
            >
              {a.message}{" "}
              <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>
                · {timeAgo(a.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
