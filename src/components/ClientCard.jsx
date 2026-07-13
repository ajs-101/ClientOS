import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function ClientCard({ client }) {
  const statusColor = {
    active: "var(--accent-teal-bright)",
    at_risk: "#FBBF24",
    churned: "var(--text-dim)",
  }[client.status || "active"];

  return (
    <Link to={`/client/${client.id}`} className="glass glass-interactive" style={{ display: "block", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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