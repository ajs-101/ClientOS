import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadFile } from "../lib/cloudinary";
import {
  Upload,
  Sparkles,
  FileText,
  StickyNote,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";

const ASSET_TYPES = [
  "newsletter",
  "press_release",
  "image",
  "agreement",
  "other",
];

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer"
        style={{
          color: "var(--accent-teal-bright)",
          textDecoration: "underline",
        }}
      >
        {part}
      </a>
    ) : (
      part
    ),
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

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [statusDrafts, setStatusDrafts] = useState({});

  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editAssetType, setEditAssetType] = useState("");
  const [editFileName, setEditFileName] = useState("");

  useEffect(() => {
    getDoc(doc(db, "clients", clientId)).then((snap) => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });

    const assetsQ = query(
      collection(db, "assets"),
      where("clientId", "==", clientId),
    );
    const unsubAssets = onSnapshot(assetsQ, (snap) => {
      setAssets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const notesQ = query(
      collection(db, "notes"),
      where("clientId", "==", clientId),
    );
    const unsubNotes = onSnapshot(notesQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setNotes(list);
    });

    return () => {
      unsubAssets();
      unsubNotes();
    };
  }, [clientId]);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Cloudinary Free tier limit is 10 MB (10,485,760 bytes)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(
        `File size too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size for upload is 10 MB.`,
      );
      return;
    }

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
    } catch (err) {
      console.error("Upload error:", err);
      alert(
        `Upload failed — ${err.message || "check your Cloudinary config."}`,
      );
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

  function startEditNote(note) {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  }

  async function saveEditNote(noteId) {
    await updateDoc(doc(db, "notes", noteId), {
      title: editTitle.trim() || "Untitled note",
      content: editContent,
      editedAt: new Date().toISOString(),
    });
    setEditingNoteId(null);
  }

  async function handleStatusChange(noteId, status) {
    setStatusDrafts((prev) => ({
      ...prev,
      [noteId]: status,
    }));

    await updateDoc(doc(db, "notes", noteId), {
      status: status.trim(),
      statusUpdatedAt: new Date().toISOString(),
    });
  }

  async function handleDeleteNote(noteId) {
    if (!confirm("Delete this note? This can't be undone.")) return;
    await deleteDoc(doc(db, "notes", noteId));
  }

  function startEditAsset(asset) {
    setEditingAssetId(asset.id);
    setEditAssetType(asset.type);
    setEditFileName(asset.fileName);
  }

  async function saveEditAsset(assetId) {
    await updateDoc(doc(db, "assets", assetId), {
      type: editAssetType,
      fileName: editFileName.trim() || "Untitled file",
    });
    setEditingAssetId(null);
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
            ...notes.map(
              (n) => `note "${n.title}": ${n.content.slice(0, 200)}`,
            ),
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

  if (!client)
    return <p style={{ color: "var(--text-muted)" }}>Loading client…</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem" }}>{client.name}</h1>
      <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
        {client.industry}
      </p>

      <div
        className="glass"
        style={{
          padding: "1.25rem 1.5rem",
          margin: "1.5rem 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Sparkles size={18} color="var(--accent-teal-bright)" />
          <span
            style={{
              fontSize: "0.9rem",
              color: summary ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {summary || "Summarize everything on file for this client."}
          </span>
        </div>
        <button
          className="btn-ghost"
          onClick={handleSummarize}
          disabled={loadingSummary}
        >
          {loadingSummary ? "Summarizing…" : "Summarize"}
        </button>
      </div>

      {/* --- NOTES SECTION --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <StickyNote size={17} color="var(--accent-teal-bright)" /> Notes &
          scope
        </h2>
        <button
          className="btn-ghost"
          onClick={() => setShowNoteForm(!showNoteForm)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.85rem",
          }}
        >
          <Plus size={14} /> Add note
        </button>
      </div>

      {showNoteForm && (
        <div
          className="glass"
          style={{
            padding: "1.5rem",
            marginBottom: "1.5rem",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <input
            placeholder="Note title (e.g. Project Deliverables)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <textarea
            placeholder="Paste any text here — scope, deliverables, links, whatever you'd normally type up..."
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={10}
            style={{
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />
          <button
            className="btn-primary"
            onClick={handleSaveNote}
            style={{ justifySelf: "start" }}
          >
            Save note
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
        {notes.length === 0 && !showNoteForm && (
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
            No notes yet — click "Add note" to paste in scope, deliverables, or
            anything else.
          </p>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className="glass"
            style={{ padding: "1.25rem 1.5rem", position: "relative" }}
          >
            {editingNoteId === n.id ? (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  style={{
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn-primary"
                    onClick={() => saveEditNote(n.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setEditingNoteId(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    onClick={() => startEditNote(n)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      display: "flex",
                      opacity: 0.6,
                      transition: "opacity 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 1;
                      e.currentTarget.style.color = "var(--accent-teal-bright)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0.6;
                      e.currentTarget.style.color = "var(--text-dim)";
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(n.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      display: "flex",
                      opacity: 0.6,
                      transition: "opacity 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 1;
                      e.currentTarget.style.color = "var(--danger)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0.6;
                      e.currentTarget.style.color = "var(--text-dim)";
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p
                  style={{
                    fontWeight: 500,
                    marginBottom: "0.5rem",
                    paddingRight: "3.5rem",
                  }}
                >
                  {n.title}
                </p>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {linkify(n.content)}
                </p>

                {/* STATUS */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    marginTop: "1rem",
                    paddingTop: "0.9rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-dim)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Status
                  </span>

                  <input
                    type="text"
                    placeholder="Enter status..."
                    value={
                      statusDrafts[n.id] !== undefined
                        ? statusDrafts[n.id]
                        : n.status || ""
                    }
                    onChange={(e) =>
                      setStatusDrafts((prev) => ({
                        ...prev,
                        [n.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.target.blur();
                      }
                    }}
                    onBlur={(e) => handleStatusChange(n.id, e.target.value)}
                    style={{
                      flex: 1,
                      fontSize: "0.8rem",
                      padding: "0.5rem 0.7rem",
                    }}
                  />
                </div>

                {n.editedAt && (
                  <p
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-dim)",
                      marginTop: "0.5rem",
                    }}
                  >
                    Edited {new Date(n.editedAt).toLocaleString()}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* --- FILE UPLOADS --- */}
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Files</h2>
      <div
        className="glass"
        style={{ padding: "1.5rem", marginBottom: "2rem" }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
          <label
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Upload size={16} />
            {uploading ? "Uploading…" : "Upload file"}
            <input
              type="file"
              hidden
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {assets.map((a) => (
          <div
            key={a.id}
            className="glass glass-interactive"
            style={{ padding: "1.25rem", position: "relative" }}
          >
            {editingAssetId === a.id ? (
              <div
                style={{ display: "grid", gap: "0.5rem" }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  style={{ fontSize: "0.8rem", padding: "0.5rem 0.7rem" }}
                />
                <select
                  value={editAssetType}
                  onChange={(e) => setEditAssetType(e.target.value)}
                  style={{ fontSize: "0.8rem", padding: "0.5rem 0.7rem" }}
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    className="btn-primary"
                    onClick={() => saveEditAsset(a.id)}
                    style={{
                      padding: "0.4rem 0.7rem",
                      fontSize: "0.78rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Check size={13} /> Save
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setEditingAssetId(null)}
                    style={{
                      padding: "0.4rem 0.7rem",
                      fontSize: "0.78rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    display: "flex",
                    gap: "0.4rem",
                    zIndex: 2,
                  }}
                >
                  <button
                    onClick={() => startEditAsset(a)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      display: "flex",
                      opacity: 0.6,
                      transition: "opacity 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 1;
                      e.currentTarget.style.color = "var(--accent-teal-bright)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0.6;
                      e.currentTarget.style.color = "var(--text-dim)";
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(a.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      display: "flex",
                      opacity: 0.6,
                      transition: "opacity 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 1;
                      e.currentTarget.style.color = "var(--danger)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0.6;
                      e.currentTarget.style.color = "var(--text-dim)";
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block" }}
                >
                  <FileText size={18} color="var(--accent-teal-bright)" />
                  <p
                    style={{
                      fontSize: "0.85rem",
                      marginTop: "0.6rem",
                      paddingRight: "2.5rem",
                    }}
                  >
                    {a.fileName}
                  </p>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-dim)",
                      marginTop: "0.2rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {a.type.replace("_", " ")}
                  </p>
                </a>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
