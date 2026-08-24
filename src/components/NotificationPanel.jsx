import { useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Bell, AlertTriangle, MessageCircle, CheckCheck } from "lucide-react";

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
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || ""),
        );
        setNotifications(list);
      },
      (err) => {
        console.error("Error subscribing to notifications:", err);
      },
    );
  }, [orgId, targetProfile]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;

    const now = new Date().toISOString();

    // Optimistically mark all as read in UI state immediately
    setNotifications((prev) =>
      prev.map((n) => (!n.read ? { ...n, read: true, readAt: now } : n)),
    );

    try {
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, "notifications", n.id), {
            read: true,
            // readAt: now,
          }),
        ),
      );
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  }

  async function markSingleRead(id) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;

    const now = new Date().toISOString();

    // Optimistically update single item
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, readAt: now } : n)),
    );

    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        readAt: now,
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unreadCount > 0) {
      markAllRead();
    }
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={handleOpen}
        className="btn-ghost"
        style={{ position: "relative", padding: "0.6rem", display: "flex" }}
        title="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "var(--danger)",
              color: "#fff",
              fontSize: "0.62rem",
              fontWeight: 700,
              borderRadius: "50%",
              width: 17,
              height: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="glass"
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            width: 340,
            maxHeight: 400,
            overflowY: "auto",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <p
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Notifications
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-teal-bright)",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              You're all caught up.
            </p>
          )}

          <div style={{ display: "grid", gap: "0.5rem" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markSingleRead(n.id)}
                style={{
                  padding: "0.7rem 0.85rem",
                  borderRadius: 10,
                  background: n.read
                    ? "transparent"
                    : "rgba(79, 232, 196, 0.08)",
                  border: n.read
                    ? "1px solid var(--glass-border)"
                    : "1px solid rgba(79, 232, 196, 0.3)",
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: n.read ? 0.75 : 1,
                }}
              >
                {n.type === "overdue" ? (
                  <AlertTriangle
                    size={15}
                    color="var(--danger)"
                    style={{ flexShrink: 0, marginTop: "0.1rem" }}
                  />
                ) : (
                  <MessageCircle
                    size={15}
                    color="var(--accent-teal-bright)"
                    style={{ flexShrink: 0, marginTop: "0.1rem" }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      lineHeight: 1.4,
                      fontWeight: n.read ? 400 : 600,
                    }}
                  >
                    {n.message}
                  </p>
                  <p
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-dim)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                {!n.read && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--accent-teal-bright)",
                      flexShrink: 0,
                      marginTop: "0.38rem",
                    }}
                    title="Unread"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
