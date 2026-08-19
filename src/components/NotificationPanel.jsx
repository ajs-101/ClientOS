import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Bell, AlertTriangle, MessageCircle } from "lucide-react";

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

  function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) markAllRead();
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    await Promise.all(unread.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true, readAt: now })));
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={handleOpen}
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
          <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Notifications</p>

          {notifications.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>You're all caught up.</p>
          )}

          <div style={{ display: "grid", gap: "0.5rem" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "0.7rem 0.85rem", borderRadius: 10,
                  background: "transparent",
                  border: "1px solid var(--glass-border)",
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}