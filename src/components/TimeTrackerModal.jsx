import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { Play, Pause, RotateCcw, Clock, Plus, Trash2, X, Check, Timer } from "lucide-react";

export default function TimeTrackerModal({ isOpen, onClose, taskId = null, taskTitle = "", clientName = "" }) {
  const { activeOrg } = useOrg();
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLogs, setTimeLogs] = useState([]);
  const [manualNote, setManualNote] = useState("");
  const [manualHours, setManualHours] = useState("");

  // Live Timer tick
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Load time logs for this org / task
  useEffect(() => {
    if (!isOpen || !activeOrg) return;
    const q = taskId
      ? query(collection(db, "timeLogs"), where("orgId", "==", activeOrg), where("taskId", "==", taskId))
      : query(collection(db, "timeLogs"), where("orgId", "==", activeOrg));

    const unsub = onSnapshot(q, (snap) => {
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setTimeLogs(logs.slice(0, 10));
    });
    return unsub;
  }, [isOpen, activeOrg, taskId]);

  function formatTime(totalSecs) {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  async function handleSaveTimerSession() {
    if (seconds < 5) return;
    const hours = (seconds / 3600).toFixed(2);
    await addDoc(collection(db, "timeLogs"), {
      orgId: activeOrg,
      taskId: taskId || null,
      taskTitle: taskTitle || "General Agency Work",
      clientName: clientName || "General",
      durationSeconds: seconds,
      hours: parseFloat(hours),
      note: manualNote || `Tracked via stopwatch (${formatTime(seconds)})`,
      createdAt: new Date().toISOString(),
    });
    setSeconds(0);
    setIsRunning(false);
    setManualNote("");
  }

  async function handleSaveManual() {
    const hrs = parseFloat(manualHours);
    if (!hrs || hrs <= 0) return;
    await addDoc(collection(db, "timeLogs"), {
      orgId: activeOrg,
      taskId: taskId || null,
      taskTitle: taskTitle || "General Work",
      clientName: clientName || "General",
      durationSeconds: Math.round(hrs * 3600),
      hours: hrs,
      note: manualNote || "Manual time entry",
      createdAt: new Date().toISOString(),
    });
    setManualHours("");
    setManualNote("");
  }

  async function handleDeleteLog(id) {
    await deleteDoc(doc(db, "timeLogs", id));
  }

  if (!isOpen) return null;

  const totalLoggedHours = timeLogs.reduce((acc, l) => acc + (l.hours || 0), 0);

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
          maxWidth: 580,
          background: "rgba(11, 24, 21, 0.96)",
          border: "1px solid var(--accent-teal)",
          borderRadius: 20,
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
            <Timer size={20} color="var(--accent-teal-bright)" />
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0 }}>
                Time & Retainer Tracker
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {taskTitle ? `Tracking: ${taskTitle}` : "Log billable hours and deliverables"}
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

        {/* Body */}
        <div style={{ padding: "1.5rem", display: "grid", gap: "1.5rem" }}>
          {/* Stopwatch Card */}
          <div
            className="glass"
            style={{
              padding: "1.5rem",
              textAlign: "center",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 16,
              display: "grid",
              gap: "1rem",
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', monospace",
                fontSize: "2.8rem",
                fontWeight: 700,
                color: isRunning ? "var(--accent-teal-bright)" : "var(--text-primary)",
                letterSpacing: "0.05em",
              }}
            >
              {formatTime(seconds)}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
              <button
                className="btn-primary"
                onClick={() => setIsRunning(!isRunning)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.5rem" }}
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
                {isRunning ? "Pause" : "Start Timer"}
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <RotateCcw size={15} /> Reset
              </button>
              {seconds > 10 && (
                <button
                  className="btn-primary"
                  onClick={handleSaveTimerSession}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "linear-gradient(135deg, #22C55E, #16A34A)",
                  }}
                >
                  <Check size={16} /> Log {(seconds / 3600).toFixed(2)} hrs
                </button>
              )}
            </div>
          </div>

          {/* Quick Manual Entry */}
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Or enter manual hours:
            </span>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <input
                type="number"
                step="0.25"
                placeholder="Hours (e.g. 1.5)"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                style={{ width: 140 }}
              />
              <input
                type="text"
                placeholder="Session note / deliverable details"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn-ghost" onClick={handleSaveManual} style={{ padding: "0.6rem 1rem" }}>
                Add
              </button>
            </div>
          </div>

          {/* Recent Logs List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
                Recent Time Logs
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--accent-teal-bright)", fontWeight: 600 }}>
                Total: {totalLoggedHours.toFixed(2)} hrs logged
              </span>
            </div>

            <div style={{ maxHeight: 160, overflowY: "auto", display: "grid", gap: "0.4rem" }}>
              {timeLogs.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>No time logged yet.</p>
              ) : (
                timeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="glass"
                    style={{
                      padding: "0.6rem 0.9rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{log.hours} hrs</span>
                      <span style={{ color: "var(--text-dim)", marginLeft: "0.5rem" }}>
                        · {log.note || log.taskTitle}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
