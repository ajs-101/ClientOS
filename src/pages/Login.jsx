import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useOrg } from "../context/OrgContext";

export default function Login() {
  const { org } = useOrg();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Wrong email or password.");
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <div className="glass" style={{ padding: "2.5rem", width: 340 }}>
        <div className="logo-glow" style={{ marginBottom: "2rem" }}>
          <img src={org.logo} alt={org.name} style={{ width: "100%", maxWidth: 220 }} />
        </div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>Sign in to ClientOS</h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          {error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{error}</p>}
          <button className="btn-primary" onClick={handleLogin}>Sign in</button>
        </div>
      </div>
    </div>
  );
}