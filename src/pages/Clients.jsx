import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import ClientCard from "../components/ClientCard";
import { Plus, Sparkles } from "lucide-react";

export default function Clients() {
  const { activeOrg } = useOrg();
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [riskSummary, setRiskSummary] = useState("");
  const [loadingRisk, setLoadingRisk] = useState(false);

  useEffect(() => {
    if (!activeOrg) return;
    const q = query(
      collection(db, "clients"),
      where("orgId", "==", activeOrg),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [activeOrg]);

  async function handleAddClient() {
    if (!name.trim()) return;
    await addDoc(collection(db, "clients"), {
      orgId: activeOrg,
      name,
      industry,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    setName("");
    setIndustry("");
    setShowForm(false);
  }

  async function handleRiskCheck() {
    setLoadingRisk(true);
    try {
      const res = await fetch("/.netlify/functions/deadline-risk", {
        method: "POST",
        body: JSON.stringify({ clients: clients.map((c) => c.name) }),
      });
      const data = await res.json();
      setRiskSummary(data.summary);
    } catch {
      setRiskSummary("Couldn't reach the risk checker — try again in a moment.");
    }
    setLoadingRisk(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Clients</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""} on record
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={16} /> New client
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem", display: "grid", gap: "0.75rem", maxWidth: 420 }}>
          <input placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Industry (e.g. Legal, Medical)" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          <button className="btn-primary" onClick={handleAddClient}>Create folder</button>
        </div>
      )}

      <div className="glass" style={{ padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Sparkles size={18} color="var(--accent-teal-bright)" />
          <span style={{ fontSize: "0.9rem", color: riskSummary ? "var(--text-primary)" : "var(--text-muted)" }}>
            {riskSummary || "Check which clients have deadlines at risk this week."}
          </span>
        </div>
        <button className="btn-ghost" onClick={handleRiskCheck} disabled={loadingRisk}>
          {loadingRisk ? "Checking…" : "Run check"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {clients.map((c) => (
          <ClientCard key={c.id} client={c} />
        ))}
      </div>
    </div>
  );
}
