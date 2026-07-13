import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadFile } from "../lib/cloudinary";
import { Upload, Sparkles, FileText } from "lucide-react";

const ASSET_TYPES = ["newsletter", "press_release", "image", "agreement", "other"];

export default function ClientFolder() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetType, setAssetType] = useState("newsletter");
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "clients", clientId)).then((snap) => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });
    const q = query(collection(db, "assets"), where("clientId", "==", clientId));
    const unsub = onSnapshot(q, (snap) => {
      setAssets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
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

  async function handleSummarize() {
    setLoadingSummary(true);
    try {
      const res = await fetch("/.netlify/functions/summarize-client", {
        method: "POST",
        body: JSON.stringify({
          clientName: client?.name,
          activityLog: assets.map((a) => `${a.type}: ${a.fileName}`),
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
          <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="glass glass-interactive" style={{ display: "block", padding: "1.25rem" }}>
            <FileText size={18} color="var(--accent-teal-bright)" />
            <p style={{ fontSize: "0.85rem", marginTop: "0.6rem" }}>{a.fileName}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.2rem", textTransform: "capitalize" }}>{a.type.replace("_", " ")}</p>
          </a>
        ))}
      </div>
    </div>
  );
}