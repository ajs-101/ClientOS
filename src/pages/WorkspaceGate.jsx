import { useState } from "react";
import { ORGS } from "../config/orgs";
import { useOrg } from "../context/OrgContext";
import { Lock, ArrowRight } from "lucide-react";

export default function WorkspaceGate() {
  const { activateOrg } = useOrg();
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [initializing, setInitializing] = useState(null); // holds the org object mid-load

  function handleUnlock() {
    const org = ORGS[selected];
    if (org && password === org.password) {
      setInitializing(org);
      setTimeout(() => activateOrg(org.id), 2400);
    } else {
      setError(true);
      setPassword("");
    }
  }

  if (initializing) {
    return <InitializingScreen org={initializing} />;
  }

  return (
    <div className="gate-bg">
      <div className="gate-mesh" />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <p style={{ color: "#7C8699", fontSize: "0.78rem", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
          CLIENT OS
        </p>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "1.6rem",
          background: "linear-gradient(90deg, #5AA9FF 0%, #E9E4D8 50%, #E0C580 100%)",
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          marginBottom: "3rem",
        }}>
          Choose your workspace
        </h1>
      </div>

      <div style={{ display: "flex", gap: "2.25rem", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
        {Object.values(ORGS).map((org) => {
          const isSelected = selected === org.id;
          return (
            <div
              key={org.id}
              onClick={() => { setSelected(org.id); setError(false); setPassword(""); }}
              className="gate-card"
              style={{
                "--card-glow": org.colors.accentBright,
                "--card-border": isSelected ? org.colors.accentBright : org.colors.glassBorder,
                background: org.colors.glassBg,
                border: `1px solid var(--card-border)`,
                transform: isSelected ? "translateY(-6px)" : undefined,
                boxShadow: isSelected ? `0 20px 60px -20px ${org.colors.accentBright}55` : undefined,
              }}
            >
              <img src={org.logo} alt={org.name} style={{ width: "100%", maxWidth: 190, margin: "0 auto 1.75rem", display: "block" }} />

              {isSelected ? (
                <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <input
                    type="password" autoFocus placeholder="Workspace password" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: "rgba(255,255,255,0.06)", border: `1px solid ${org.colors.glassBorder}`,
                      borderRadius: 10, padding: "0.7rem 0.9rem", color: "#F2F2F2", outline: "none", textAlign: "center",
                    }}
                  />
                  {error && <p style={{ color: "#F87171", fontSize: "0.75rem" }}>Incorrect password</p>}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnlock(); }}
                    className="gate-unlock-btn"
                    style={{ background: `linear-gradient(135deg, ${org.colors.accentPrimary}, ${org.colors.accentBright})` }}
                  >
                    Unlock <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#7C8699", fontSize: "0.85rem" }}>
                  <Lock size={14} /> Click to unlock
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InitializingScreen({ org }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
      background: `radial-gradient(circle at 50% 45%, ${org.colors.bgElevated} 0%, #05070C 70%)`,
    }}>
      <div className="init-ring" style={{ "--ring-color": org.colors.accentBright }} />
      <img src={org.logo} alt={org.name} className="init-logo" style={{ maxWidth: 200, position: "relative", zIndex: 1 }} />

      <p style={{
        marginTop: "2rem", color: org.colors.accentBright, fontSize: "0.85rem",
        letterSpacing: "0.08em", position: "relative", zIndex: 1,
      }}>
        Initializing {org.name} workspace
      </p>

      <div className="init-bar-track" style={{ "--bar-color": org.colors.accentBright, "--bar-color-2": org.colors.accentPrimary }}>
        <div className="init-bar-fill" />
      </div>
    </div>
  );
}