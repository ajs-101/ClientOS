import { useState } from "react";
import { X, Sparkles, Copy, Check, Printer, FileText, Send } from "lucide-react";

export default function ClientReportModal({ isOpen, onClose, client, tasks = [], notes = [], assets = [] }) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerateReport() {
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/generate-client-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: client?.name,
          industry: client?.industry,
          tasks: tasks.map((t) => ({ title: t.title, status: t.status, dueDate: t.dueDate })),
          notes: notes.map((n) => ({ title: n.title, text: n.text })),
          assets: assets.map((a) => ({ fileName: a.fileName, type: a.type })),
        }),
      });
      const data = await res.json();
      setReport(data.report || "No report generated.");
    } catch (err) {
      console.error(err);
      setReport("Failed to generate report. Please try again.");
    }
    setLoading(false);
  }

  function handleCopy() {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 7, 12, 0.8)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 20,
          background: "rgba(11, 24, 21, 0.96)",
          border: "1px solid var(--accent-teal)",
          boxShadow: "0 25px 80px -20px rgba(31, 216, 180, 0.4)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--glass-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <FileText size={20} color="var(--accent-teal-bright)" />
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
                Weekly Status Report — {client?.name}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                AI executive update generated from deliverables and recent activity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, display: "grid", gap: "1rem" }}>
          {!report && !loading && (
            <div
              style={{
                padding: "3rem 1.5rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  background: "rgba(31, 216, 180, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={24} color="var(--accent-teal-bright)" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600 }}>Generate Client Status Report</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.3rem", maxWidth: 420 }}>
                  Compile all active deliverables, completed milestones, notes, and upcoming deadlines into a client-ready executive summary.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={handleGenerateReport}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}
              >
                <Sparkles size={16} /> Generate Report Now
              </button>
            </div>
          )}

          {loading && (
            <div style={{ padding: "4rem 1.5rem", textAlign: "center", display: "grid", gap: "0.75rem" }}>
              <Sparkles size={28} color="var(--accent-teal-bright)" style={{ margin: "0 auto", animation: "pulse 1.5s infinite" }} />
              <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Analyzing deliverables & drafting report...</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>This takes just a few seconds</p>
            </div>
          )}

          {report && !loading && (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div
                className="glass"
                style={{
                  padding: "1.25rem 1.5rem",
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: 12,
                  fontSize: "0.88rem",
                  lineHeight: 1.65,
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {report}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {report && !loading && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <button
              className="btn-ghost"
              onClick={handleGenerateReport}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
            >
              <Sparkles size={14} /> Regenerate
            </button>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                className="btn-ghost"
                onClick={handlePrint}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
              >
                <Printer size={14} /> Print / PDF
              </button>
              <button
                className="btn-primary"
                onClick={handleCopy}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
