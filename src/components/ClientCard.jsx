import { Link } from "react-router-dom";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ClientCard({ client }) {
  const statusColor = {
    active: "var(--accent-teal-bright)",
    at_risk: "#FBBF24",
    churned: "var(--text-dim)",
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

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
          {(client.status || "active").replace("_", " ")}
        </span>
      </div>
    </Link>
  );
}