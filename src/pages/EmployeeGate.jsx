import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROFILES, PROFILE_LIST } from "../config/employeeProfiles";
import { useEmployee } from "../context/EmployeeContext";
import { Lock, ArrowRight } from "lucide-react";

export default function EmployeeGate() {
  const { unlockProfile } = useEmployee();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleUnlock(profileId) {
    const success = unlockProfile(profileId, password);
    if (!success) {
      setError(true);
      setPassword("");
      return;
    }
    if (profileId === "admin") navigate("/admin-overview");
    else navigate(`/employees/${profileId}`);
  }

  return (
    <div style={{ width: "100%", padding: "1rem", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)" }}>
          Employee Profiles
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            marginTop: "0.25rem",
            fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
          }}
        >
          Select your profile and enter its password to view and manage tasks.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
          gap: "1.25rem",
        }}
      >
        {[...PROFILE_LIST, PROFILES.admin].map((p) => {
          const Icon = p.icon;
          const isSelected = selected === p.id;
          return (
            <div
              key={p.id}
              onClick={() => {
                setSelected(p.id);
                setError(false);
                setPassword("");
              }}
              className="glass glass-interactive employee-card"
              style={{
                padding:
                  "clamp(1.25rem, 3vw, 1.75rem) clamp(1rem, 2.5vw, 1.5rem)",
                cursor: "pointer",
                border: isSelected ? `1px solid ${p.color}` : undefined,
                boxShadow: isSelected
                  ? `0 16px 40px -18px ${p.color}66`
                  : undefined,
                boxSizing: "border-box",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  marginBottom: "1rem",
                  background: `${p.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color={p.color} />
              </div>
              <p style={{ fontWeight: 600, fontSize: "1rem" }}>{p.name}</p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginTop: "0.2rem",
                }}
              >
                {p.people}
              </p>

              {isSelected ? (
                <div
                  style={{
                    display: "grid",
                    gap: "0.6rem",
                    marginTop: "1.25rem",
                    width: "100%",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="password"
                    autoFocus
                    placeholder="Profile password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock(p.id)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                  {error && (
                    <p style={{ color: "var(--danger)", fontSize: "0.72rem" }}>
                      Incorrect password
                    </p>
                  )}
                  <button
                    onClick={() => handleUnlock(p.id)}
                    style={{
                      background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`,
                      color: "#0A0A0A",
                      fontWeight: 600,
                      border: "none",
                      borderRadius: 10,
                      padding: "0.6rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      width: "100%",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    Unlock <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginTop: "1.25rem",
                    color: "var(--text-dim)",
                    fontSize: "0.78rem",
                  }}
                >
                  <Lock size={12} /> Click to unlock
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
