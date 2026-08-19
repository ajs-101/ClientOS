import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Bell, AlertTriangle, MessageCircle, Check } from "lucide-react";

export default function NotificationPanel({ orgId, targetProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!orgId || !targetProfile) return;
    const q = query(
      collection(db, "notifications"),
      where("orgId", "==", orgId),
      where("targetProfile", "==", targetProfile),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [orgId, targetProfile]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id) {
    await updateDoc(doc(db, "notifications", id), { read: true });
  }

  async function markAllRead() {
    await Promise.all(notifications.filter((n) => !n.read).map((n) => updateDoc(doc(db, "notifications", n.id), { read: true })));
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost"
        style={{ position: "relative", padding: "0.6rem", display: "flex" }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, background: "var(--danger)", color: "#fff",
            fontSize: "0.62rem", fontWeight: 700, borderRadius: "50%", width: 17, height: 17,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass" style={{
          position: "absolute", top: "calc(100% + 0.5rem)", right: 0, width: 340,
          maxHeight: 400, overflowY: "auto", padding: "1rem", zIndex: 50,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--accent-teal-bright)", fontSize: "0.75rem" }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>You're all caught up.</p>
          )}

          <div style={{ display: "grid", gap: "0.5rem" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  padding: "0.7rem 0.85rem", borderRadius: 10, cursor: n.read ? "default" : "pointer",
                  background: n.read ? "transparent" : "rgba(248,113,113,0.08)",
                  border: `1px solid ${n.read ? "var(--glass-border)" : "rgba(248,113,113,0.25)"}`,
                  display: "flex", gap: "0.6rem", alignItems: "flex-start",
                }}
              >
                {n.type === "overdue" ? (
                  <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                ) : (
                  <MessageCircle size={15} color="var(--accent-teal-bright)" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.read && <Check size={13} color="var(--text-dim)" style={{ flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
