import { Search, Calendar as CalendarIcon } from "lucide-react";
import { useOrg } from "../context/OrgContext";

export default function Header({ title = "Dashboard", subtitle, onOpenCommandPalette, children }) {
  const { org } = useOrg();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      {/* Left: Heading & Subtitle */}
      <div>
        <h1 style={{ fontSize: "1.85rem", letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle !== undefined ? (
          subtitle && (
            <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.88rem" }}>
              {subtitle}
            </p>
          )
        ) : (
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.88rem" }}>
            {org?.name} — what needs attention right now
          </p>
        )}
      </div>

      {/* Right: Search Bar & Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
        {/* Modern Search Bar */}
        <button
          onClick={onOpenCommandPalette}
          title="Search anything (Cmd+K / Ctrl+K)"
          className="glass glass-interactive"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(20, 40, 36, 0.5)",
            border: "1px solid var(--glass-border)",
            borderRadius: "12px",
            padding: "0.6rem 1rem",
            color: "var(--text-muted)",
            fontSize: "0.84rem",
            cursor: "pointer",
            width: "320px",
            maxWidth: "100%",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Search size={16} color="var(--accent-teal-bright)" />
            <span style={{ color: "var(--text-muted)" }}>Search anything...</span>
          </div>
          <kbd
            style={{
              fontSize: "0.68rem",
              padding: "2px 7px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--glass-border)",
              color: "var(--accent-teal-bright)",
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Date pill */}
        <div
          className="glass"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 0.9rem",
            borderRadius: "12px",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <CalendarIcon size={15} color="var(--accent-teal-bright)" />
          <span>{today}</span>
        </div>

        {children}
      </div>
    </header>
  );
}
