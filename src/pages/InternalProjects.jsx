import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { useEmployee } from "../context/EmployeeContext";
import TaskCard from "../components/TaskCard";
import { Plus, FolderKanban } from "lucide-react";

export default function InternalProjects() {
  const navigate = useNavigate();
  const { activeOrg } = useOrg();
  const { activeProfile, profile } = useEmployee();

  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "" });

  useEffect(() => {
    if (!activeProfile) navigate("/employees");
  }, [activeProfile, navigate]);

  useEffect(() => {
    if (!activeOrg) return;
    const q = query(collection(db, "internalProjects"), where("orgId", "==", activeOrg));
    return onSnapshot(q, (snap) => setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [activeOrg]);

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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <FolderKanban size={22} color="var(--accent-teal-bright)" />
          <h1 style={{ fontSize: "1.8rem" }}>Internal Projects</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={16} /> New project
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "grid", gap: "0.75rem", maxWidth: 420 }}>
          <input placeholder="Project title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description (optional)" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical", fontFamily: "inherit" }} />
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <button className="btn-primary" onClick={handleAdd}>Add project</button>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.9rem" }}>
        {projects.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>No internal projects yet.</p>}
        {projects.map((p) => (
          <TaskCard key={p.id} task={p} authorLabel={profile?.name || "Team"} onStatusChange={handleStatusChange} onDelete={handleDelete} commentsCollection="internalProjectComments" />
        ))}
      </div>
    </div>
  );
}
