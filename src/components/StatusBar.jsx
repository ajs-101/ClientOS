const STATUS_COLORS = {
  green: "#4ADE80",
  yellow: "#FBBF24",
  red: "#F87171",
};

const STATUS_LABELS = {
  green: "On track",
  yellow: "Needs attention",
  red: "Overdue / blocked",
};

export default function StatusBar({ status, onChange, readOnly }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.35rem" }}>
        {["green", "yellow", "red"].map((s) => (
          <button
            key={s}
            disabled={readOnly}
            onClick={() => onChange && onChange(s)}
            title={STATUS_LABELS[s]}
            style={{
              width: 22,
              height: 8,
              borderRadius: 6,
              border: "none",
              cursor: readOnly ? "default" : "pointer",
              background: STATUS_COLORS[s],
              opacity: status === s ? 1 : 0.25,
              transition: "opacity 0.2s ease, transform 0.2s ease",
              transform: status === s ? "scaleY(1.3)" : "scaleY(1)",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "0.72rem", color: STATUS_COLORS[status], fontWeight: 600 }}>
        {STATUS_LABELS[status] || "Set status"}
      </span>
    </div>
  );
}

export { STATUS_COLORS, STATUS_LABELS };
