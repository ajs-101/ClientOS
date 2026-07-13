import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { encryptField, decryptField } from "../lib/crypto";
import { useOrg } from "../context/OrgContext";
import { Plus, Eye, EyeOff, KeyRound, ExternalLink } from "lucide-react";

export default function Credentials() {
  const { activeOrg } = useOrg();
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [visibleId, setVisibleId] = useState(null);
  const [form, setForm] = useState({ platform: "", username: "", password: "", url: "" });

  useEffect(() => {
    if (activeOrg) loadEntries();
  }, [activeOrg]);

  async function loadEntries() {
    const q = query(collection(db, "credentials"), where("orgId", "==", activeOrg));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data(), password: decryptField(d.data().password) }));
    setEntries(data);
  }

  async function handleSave() {
    if (!form.platform || !form.username || !form.password) return;
    await addDoc(collection(db, "credentials"), {
      orgId: activeOrg,
      platform: form.platform,
      username: form.username,
      password: encryptField(form.password),
      url: form.url,
      createdAt: new Date().toISOString(),
    });
    setForm({ platform: "", username: "", password: "", url: "" });
    setShowForm(false);
    loadEntries();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Credentials</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>Encrypted at rest · visible only inside this dashboard</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={16} /> Add credential
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem", display: "grid", gap: "0.75rem", maxWidth: 420 }}>
          <input placeholder="Platform (e.g. Instagram)" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
          <input placeholder="Username / Email" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <button className="btn-primary" onClick={handleSave}>Save credential</button>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {entries.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>No credentials saved yet.</p>}
        {entries.map((e) => (
          <div key={e.id} className="glass" style={{ padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flex: 1 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(31,216,180,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <KeyRound size={16} color="var(--accent-teal-bright)" />
              </div>
              <div style={{ display: "grid", gap: "0.15rem" }}>
                <span style={{ fontWeight: 500, fontSize: "0.92rem" }}>{e.platform}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{e.username}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "var(--text-muted)", minWidth: 140 }}>
              {visibleId === e.id ? e.password : "••••••••"}
              <button onClick={() => setVisibleId(visibleId === e.id ? null : e.id)} style={{ background: "none", border: "none", color: "var(--text-dim)", display: "flex" }}>
                {visibleId === e.id ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {e.url && <a href={e.url} target="_blank" rel="noreferrer" style={{ color: "var(--text-dim)", display: "flex" }}><ExternalLink size={16} /></a>}
          </div>
        ))}
      </div>
    </div>
  );
}