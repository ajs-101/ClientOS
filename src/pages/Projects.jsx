import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { Plus, ExternalLink } from "lucide-react";

export default function Projects() {
  const { activeOrg } = useOrg();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", host: "" });

  useEffect(() => {
    if (!activeOrg) return;
    const q = query(collection(db, "projects"), where("orgId", "==", activeOrg));
    return onSnapshot(q, (snap) => setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [activeOrg]);

  async function handleAdd() {
    if (!form.name || !form.url) return;
    await addDoc(collection(db, "projects"), { ...form, orgId: activeOrg });
    setForm({ name: "", url: "", host: "" });
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Tools</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={16} /> Add tool
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem", display: "grid", gap: "0.75rem", maxWidth: 420 }}>
          <input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Deployed URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <input placeholder="Host (Netlify, Vercel...)" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
          <button className="btn-primary" onClick={handleAdd}>Save</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {projects.map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="glass glass-interactive" style={{ display: "block", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1rem" }}>{p.name}</h3>
              <ExternalLink size={16} color="var(--text-dim)" />
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>{p.host}</p>
          </a>
        ))}
      </div>
    </div>
  );
}