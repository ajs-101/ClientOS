import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  ChevronDown,
  Minimize2,
} from "lucide-react";

const SUGGESTIONS = [
  "What are today's overdue tasks?",
  "Show active clients count",
  "Show team workload summary",
];

export default function ChatWidget() {
  const { activeOrg, org } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your ClientOS AI Assistant. I can help you manage your workspace, tasks, clients, and deadlines. How can I help you today?",
    },
  ]);

  const [clientsData, setClientsData] = useState([]);
  const [tasksData, setTasksData] = useState([]);

  const messagesEndRef = useRef(null);

  // Subscribe to live workspace context
  useEffect(() => {
    if (!activeOrg) return;

    const unsubClients = onSnapshot(
      query(collection(db, "clients"), where("orgId", "==", activeOrg)),
      (snap) => setClientsData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubTasks = onSnapshot(
      query(collection(db, "employeeTasks"), where("orgId", "==", activeOrg)),
      (snap) => setTasksData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubClients();
      unsubTasks();
    };
  }, [activeOrg]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSend(textToSend) {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg = { role: "user", text: queryText.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const todayStr = new Date().toISOString().split("T")[0];
    const overdueCount = tasksData.filter(
      (t) => t.dueDate && t.dueDate < todayStr && t.status !== "green"
    ).length;

    const workspaceContext = {
      orgName: org?.name || "ClientOS",
      clientsCount: clientsData.length,
      clientNames: clientsData.map((c) => c.name),
      totalTasks: tasksData.length,
      overdueTasks: overdueCount,
    };

    try {
      const res = await fetch("/.netlify/functions/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          workspaceContext,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Sorry, no response returned.",
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Connection error: Could not reach AI service. Please try again.",
        },
      ]);
    }
    setLoading(false);
  }

  function handleReset() {
    setMessages([
      {
        role: "assistant",
        text: "Chat has been reset. How can I help you?",
      },
    ]);
  }

  if (!activeOrg) return null;

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999 }}>
      {/* --- CHAT DRAWER / WINDOW --- */}
      {isOpen && (
        <div
          className="glass"
          style={{
            width: "clamp(320px, 90vw, 400px)",
            height: "540px",
            marginBottom: "16px",
            borderRadius: 20,
            background: "var(--bg-elevated)",
            border: "1px solid var(--glass-border-hover)",
            boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "linear-gradient(135deg, rgba(31, 216, 180, 0.12), rgba(56, 189, 248, 0.12))",
              borderBottom: "1px solid var(--glass-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#05070C",
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 600 }}>
                  ClientOS AI Co-Pilot
                </h3>
                <p style={{ fontSize: "0.72rem", color: "var(--accent-teal-bright)", margin: 0 }}>
                  Claude Powered · Online
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <button
                onClick={handleReset}
                title="Reset Chat"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: "1rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background:
                      m.role === "user"
                        ? "rgba(56, 189, 248, 0.2)"
                        : "rgba(31, 216, 180, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {m.role === "user" ? (
                    <User size={13} color="var(--accent-cyan)" />
                  ) : (
                    <Bot size={13} color="var(--accent-teal-bright)" />
                  )}
                </div>

                <div
                  style={{
                    maxWidth: "80%",
                    padding: "0.7rem 0.9rem",
                    borderRadius: 14,
                    fontSize: "0.84rem",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))"
                        : "rgba(255,255,255,0.05)",
                    color: m.role === "user" ? "#05070C" : "var(--text-primary)",
                    fontWeight: m.role === "user" ? 500 : 400,
                    border:
                      m.role === "user"
                        ? "none"
                        : "1px solid var(--glass-border)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "rgba(31, 216, 180, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={13} color="var(--accent-teal-bright)" />
                </div>
                <div
                  style={{
                    padding: "0.6rem 0.9rem",
                    borderRadius: 14,
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--glass-border)",
                    fontStyle: "italic",
                  }}
                >
                  Claude is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div
            style={{
              padding: "0.4rem 0.8rem",
              display: "flex",
              gap: "0.4rem",
              overflowX: "auto",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              whiteSpace: "nowrap",
            }}
          >
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                style={{
                  fontSize: "0.72rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "0.75rem",
              borderTop: "1px solid var(--glass-border)",
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <input
              placeholder="Ask anything... (e.g., Today's tasks)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{
                flex: 1,
                fontSize: "0.82rem",
                padding: "0.55rem 0.85rem",
                borderRadius: 10,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn-primary"
              style={{
                padding: "0.55rem 0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* --- LAUNCHER BUTTON --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary"
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px -5px rgba(31, 216, 180, 0.5)",
          padding: 0,
          position: "relative",
        }}
      >
        {isOpen ? <X size={22} /> : <Bot size={24} />}
        {!isOpen && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "var(--accent-teal-bright)",
              border: "2px solid #05070C",
            }}
          />
        )}
      </button>
    </div>
  );
}
