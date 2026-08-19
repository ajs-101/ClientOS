import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MessageSquare, Trash2, ChevronDown, ChevronUp, Send } from "lucide-react";
import StatusBar from "./StatusBar";

export default function TaskCard({ task, authorLabel, onStatusChange, onDelete, commentsCollection = "taskComments" }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!expanded) return;
    const q = query(
      collection(db, commentsCollection),
      where("taskId", "==", task.id),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [expanded, task.id, commentsCollection]);

  async function handlePostComment() {
    if (!draft.trim()) return;
    await addDoc(collection(db, commentsCollection), {
      taskId: task.id,
      orgId: task.orgId,
      author: authorLabel,
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    });
    setDraft("");
  }

  const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split("T")[0] && task.status !== "green";

  return (
    <div className="glass" style={{ padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <p style={{ fontWeight: 500 }}>{task.title}</p>
            {isOverdue && (
              <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 20, background: "rgba(248,113,113,0.15)", color: "var(--danger)", fontWeight: 600 }}>
                OVERDUE
              </span>
            )}
          </div>
          {task.description && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>{task.description}</p>
          )}
          {task.dueDate && (
            <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>Due {task.dueDate}</p>
          )}
        </div>
        {onDelete && (
          <button
            onClick={() => { if (confirm("Delete this task?")) onDelete(task.id); }}
            style={{ background: "none", border: "none", color: "var(--text-dim)", display: "flex" }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
        <StatusBar status={task.status || "green"} onChange={(s) => onStatusChange(task.id, s)} />
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: "none", border: "none", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem" }}
        >
          <MessageSquare size={14} /> {comments.length > 0 ? comments.length : ""}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
          <div style={{ display: "grid", gap: "0.6rem", marginBottom: "0.75rem", maxHeight: 220, overflowY: "auto" }}>
            {comments.length === 0 && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>No comments yet.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} style={{ fontSize: "0.8rem" }}>
                <span style={{ fontWeight: 600, color: "var(--accent-teal-bright)" }}>{c.author}</span>
                <span style={{ color: "var(--text-dim)", fontSize: "0.7rem", marginLeft: "0.5rem" }}>
                  {new Date(c.createdAt).toLocaleString()}
                </span>
                <p style={{ color: "var(--text-muted)", marginTop: "0.15rem" }}>{c.text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
              style={{ flex: 1 }}
            />
            <button className="btn-ghost" onClick={handlePostComment} style={{ padding: "0.5rem 0.8rem" }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
