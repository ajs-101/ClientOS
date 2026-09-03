import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";
import { PROFILE_LIST } from "../config/employeeProfiles";
import {
  Sparkles,
  X,
  Plus,
  Trash2,
  Check,
  Zap,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function AutoTaskGeneratorModal({
  isOpen,
  onClose,
  clientName = "",
  onSuccess,
}) {
  const { activeOrg } = useOrg();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/auto-task-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPrompt: prompt.trim(),
          clientName,
        }),
      });
      const data = await res.json();
      setGeneratedTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI task breakdown. Please try again.");
    }
    setLoading(false);
  }

  function handleTaskChange(idx, field, value) {
    const updated = [...generatedTasks];
    updated[idx] = { ...updated[idx], [field]: value };
    setGeneratedTasks(updated);
  }

  function handleRemoveTask(idx) {
    setGeneratedTasks(generatedTasks.filter((_, i) => i !== idx));
  }

  async function handleBatchSave() {
    if (generatedTasks.length === 0 || saving) return;
    setSaving(true);

    try {
      for (const t of generatedTasks) {
        // 1. Add Task
        await addDoc(collection(db, "employeeTasks"), {
          orgId: activeOrg,
          profile: t.profile,
          title: t.title,
          description: t.description,
          dueDate: t.dueDate,
          status: "green",
          createdAt: new Date().toISOString(),
        });

        // 2. Add Activity Log
        await addDoc(collection(db, "activityLog"), {
          orgId: activeOrg,
          profile: t.profile,
          message: `AI Onboarding assigned task: "${t.title}"`,
          createdAt: new Date().toISOString(),
        });

        // 3. Add Notification
        await addDoc(collection(db, "notifications"), {
          orgId: activeOrg,
          targetProfile: t.profile,
          type: "reminder",
          message: `New AI task assigned: "${t.title}"`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      setGeneratedTasks([]);
      setPrompt("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving batch tasks to Firestore.");
    }
    setSaving(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "88vh",
          overflowY: "auto",
          padding: "2rem",
          borderRadius: 20,
          background: "var(--bg-elevated)",
          border: "1px solid var(--glass-border-hover)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(31, 216, 180, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={20} color="var(--accent-teal-bright)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem", margin: 0 }}>
                AI Project Onboarding & Auto-Task Breakdown
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {clientName ? `Client: ${clientName}` : "AI Automated Task Generator"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Prompt Input Box */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: "0.4rem" }}>
            Describe the project or client onboarding scope:
          </label>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <textarea
              placeholder="e.g. Redesign Shopify store homepage, setup Klaviyo email onboarding flow, and launch podcast intro audio episode..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              style={{ flex: 1, fontSize: "0.88rem", resize: "vertical", fontFamily: "inherit" }}
            />
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", height: "fit-content", padding: "0.75rem 1.25rem" }}
            >
              <Sparkles size={16} />
              {loading ? "Generating..." : "Generate AI Tasks"}
            </button>
          </div>
        </div>

        {/* Generated Tasks Preview List */}
        {generatedTasks.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-teal-bright)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Layers size={15} /> Generated Task Breakdown ({generatedTasks.length} tasks)
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Edit titles or reassign profiles before saving
              </span>
            </div>

            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {generatedTasks.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "1rem",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--glass-border)",
                    display: "grid",
                    gap: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <input
                      value={t.title}
                      onChange={(e) => handleTaskChange(idx, "title", e.target.value)}
                      style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600 }}
                    />
                    <select
                      value={t.profile}
                      onChange={(e) => handleTaskChange(idx, "profile", e.target.value)}
                      style={{ fontSize: "0.8rem" }}
                    >
                      {PROFILE_LIST.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={t.dueDate}
                      onChange={(e) => handleTaskChange(idx, "dueDate", e.target.value)}
                      style={{ fontSize: "0.8rem", width: 145 }}
                    />
                    <button
                      onClick={() => handleRemoveTask(idx)}
                      style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", opacity: 0.7 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    value={t.description}
                    onChange={(e) => handleTaskChange(idx, "description", e.target.value)}
                    placeholder="Deliverable details..."
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleBatchSave}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Check size={16} />
                {saving ? "Saving Tasks..." : `Batch Assign ${generatedTasks.length} Tasks`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
