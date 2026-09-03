import { Link } from "react-router-dom";
import { ArrowUpRight, Trash2, Activity } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ClientCard({ client }) {
  const statusConfig = {
    active: { color: "var(--accent-teal-bright)", label: "Healthy", score: 94, barBg: "rgba(31, 216, 180, 0.2)" },
    at_risk: { color: "#FBBF24", label: "Needs Review", score: 62, barBg: "rgba(251, 191, 36, 0.2)" },
    churned: { color: "var(--danger)", label: "High Risk", score: 35, barBg: "rgba(248, 113, 113, 0.2)" },
  }[client.status || "active"];

  async function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete ${client.name}? This can't be undone.`)) return;
    await deleteDoc(doc(db, "clients", client.id));
  }

  return (
    <Link to={`/client/${client.id}`} className="glass glass-interactive" style={{ display: "block", padding: "1.5rem", position: "relative" }}>
      <button
        onClick={handleDelete}
        style={{
          position: "absolute", top: "1rem", right: "1rem",
          background: "none", border: "none", color: "var(--text-dim)",
          display: "flex", padding: "0.25rem", borderRadius: "6px",
          opacity: 0.6, transition: "opacity 0.2s ease, color 0.2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "var(--danger)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.color = "var(--text-dim)"; }}
      >
        <Trash2 size={15} />
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingRight: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem" }}>{client.name}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {client.industry || "No industry set"}
          </p>
        </div>
        <ArrowUpRight size={18} color="var(--text-dim)" />
      </div>

      {/* --- HEALTH SCORE GAUGE --- */}
      <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Activity size={12} color={statusConfig.color} /> Client Health
          </span>
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: statusConfig.color }}>
            {statusConfig.score}% · {statusConfig.label}
          </span>
        </div>
        <div style={{ width: "100%", height: 5, borderRadius: 4, background: statusConfig.barBg, overflow: "hidden" }}>
          <div style={{ width: `${statusConfig.score}%`, height: "100%", borderRadius: 4, background: statusConfig.color, transition: "width 0.5s ease" }} />
        </div>
      </div>
    </Link>
  );
}