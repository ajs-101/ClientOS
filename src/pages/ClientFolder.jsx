import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadFile } from "../lib/cloudinary";
import { Upload, Sparkles, FileText, StickyNote, Plus, Trash2 } from "lucide-react";

const ASSET_TYPES = ["newsletter", "press_release", "image", "agreement", "other"];

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: "var(--accent-teal-bright)", textDecoration: "underline" }}>
        {part}
      </a>
    ) : (
      part
    )
  );
}

export default function ClientFolder() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetType, setAssetType] = useState("newsletter");
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "clients", clientId)).then((snap) => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });

    const assetsQ = query(collection(db, "assets"), where("clientId", "==", clientId));
    const unsubAssets = onSnapshot(assetsQ, (snap) => {
      setAssets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const notesQ = query(collection(db, "notes"), where("clientId", "==", clientId), orderBy("createdAt", "desc"));
    const unsubNotes = onSnapshot(notesQ, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAssets(); unsubNotes(); };
  }, [clientId]);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      await addDoc(collection(db, "assets"), {
        clientId,
        orgId: client?.orgId,
        type: assetType,
        url,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      });
    } catch {
      alert("Upload failed — check your Cloudinary config.");
    }
    setUploading(false);
  }

  async function handleSaveNote() {
    if (!noteDraft.trim()) return;
    await addDoc(collection(db, "notes"), {
      clientId,
      orgId: client?.orgId,
      title: noteTitle.trim() || "Untitled note",
      content: noteDraft,
      createdAt: new Date().toISOString(),
    });
    setNoteDraft("");
    setNoteTitle("");
    setShowNoteForm(false);
  }

  async function handleDeleteNote(noteId) {
    if (!confirm("Delete this note? This can't be undone.")) return;
    await deleteDoc(doc(db, "notes", noteId));
  }

  async function handleDeleteAsset(assetId) {
    if (!confirm("Remove this file from the client folder?")) return;
    await deleteDoc(doc(db, "assets", assetId));
  }

  async function handleSummarize() {
    setLoadingSummary(true);
    try {
      const res = await fetch("/.netlify/functions/summarize-client", {
        method: "POST",
        body: JSON.stringify({
          clientName: client?.name,
          activityLog: [
            ...assets.map((a) => `${a.type}: ${a.fileName}`),
            ...notes.map((n) => `note "${n.title}": ${n.content.slice(0, 200)}`),
          ],
        }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary("Couldn't reach Claude right now — try again shortly.");
    }
    setLoadingSummary(false);
  }

  if (!client) return <p style={{ color: "var(--text-muted)" }}>Loading client…</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem" }}>{client.name}</h1>
      <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>{client.industry}</p>

      <div className="glass" style={{ padding: "1.25rem 1.5rem", margin: "1.5rem 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Sparkles size={18} color="var(--accent-teal-bright)" />
          <span style={{ fontSize: "0.9rem", color: summary ? "var(--text-primary)" : "var(--text-muted)" }}>
            {summary || "Summarize everything on file for this client."}
          </span>
        </div>
        <button className="btn-ghost" onClick={handleSummarize} disabled={loadingSummary}>
          {loadingSummary ? "Summarizing…" : "Summarize"}
        </button>
      </div>

      {/* --- NOTES SECTION --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <StickyNote size={17} color="var(--accent-teal-bright)" /> Notes & scope
        </h2>
        <button className="btn-ghost" onClick={() => setShowNoteForm(!showNoteForm)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
          <Plus size={14} /> Add note
        </button>
      </div>

      {showNoteForm && (
        <div className="glass" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "grid", gap: "0.75rem" }}>
          <input placeholder="Note title (e.g. Project Deliverables)" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
          <textarea
            placeholder="Paste any text here — scope, deliverables, links, whatever you'd normally type up..."
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={10}
            style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />
          <button className="btn-primary" onClick={handleSaveNote} style={{ justifySelf: "start" }}>Save note</button>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
        {notes.length === 0 && !showNoteForm && (
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>No notes yet — click "Add note" to paste in scope, deliverables, or anything else.</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="glass" style={{ padding: "1.25rem 1.5rem", position: "relative" }}>
            <button
              onClick={() => handleDeleteNote(n.id)}
              style={{
                position: "absolute", top: "1rem", right: "1rem",
                background: "none", border: "none", color: "var(--text-dim)", display: "flex",
                opacity: 0.6, transition: "opacity 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "var(--danger)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.color = "var(--text-dim)"; }}
            >
              <Trash2 size={14} />
            </button>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem", paddingRight: "1.5rem" }}>{n.title}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {linkify(n.content)}
            </p>
          </div>
        ))}
      </div>

      {/* --- FILE UPLOADS --- */}
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Files</h2>
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
            {ASSET_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
          <label className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Upload size={16} />
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" hidden onChange={handleFile} disabled={uploading} />
          </label>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {assets.map((a) => (
          <div key={a.id} className="glass glass-interactive" style={{ padding: "1.25rem", position: "relative" }}>
            <button
              onClick={() => handleDeleteAsset(a.id)}
              style={{
                position: "absolute", top: "0.75rem", right: "0.75rem",
                background: "none", border: "none", color: "var(--text-dim)", display: "flex",
                opacity: 0.6, transition: "opacity 0.2s ease, color 0.2s ease", zIndex: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "var(--danger)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.color = "var(--text-dim)"; }}
            >
              <Trash2 size={14} />
            </button>
            <a href={a.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
              <FileText size={18} color="var(--accent-teal-bright)" />
              <p style={{ fontSize: "0.85rem", marginTop: "0.6rem", paddingRight: "1.25rem" }}>{a.fileName}</p>
              <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.2rem", textTransform: "capitalize" }}>{a.type.replace("_", " ")}</p>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}