import { createContext, useContext, useState, useEffect } from "react";
import { ORGS } from "../config/orgs";

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
  const [activeOrg, setActiveOrg] = useState(() => localStorage.getItem("activeOrg") || null);

  useEffect(() => {
    if (!activeOrg) return;
    const org = ORGS[activeOrg];
    if (!org) return;
    const root = document.documentElement.style;
    root.setProperty("--bg-base", org.colors.bgBase);
    root.setProperty("--bg-elevated", org.colors.bgElevated);
    root.setProperty("--glass-bg", org.colors.glassBg);
    root.setProperty("--glass-border", org.colors.glassBorder);
    root.setProperty("--glass-border-hover", org.colors.glassBorderHover);
    root.setProperty("--accent-teal", org.colors.accentPrimary);
    root.setProperty("--accent-teal-bright", org.colors.accentBright);
    root.setProperty("--accent-cyan", org.colors.accentSecondary);
    localStorage.setItem("activeOrg", activeOrg);
  }, [activeOrg]);

  function unlockOrg(orgId, passwordAttempt) {
    const org = ORGS[orgId];
    if (org && passwordAttempt === org.password) {
      setActiveOrg(orgId);
      return true;
    }
    return false;
  }

  function activateOrg(orgId) {
    setActiveOrg(orgId);
  }

  function switchOrg() {
    localStorage.removeItem("activeOrg");
    setActiveOrg(null);
  }

  return (
    <OrgContext.Provider value={{ activeOrg, org: activeOrg ? ORGS[activeOrg] : null, unlockOrg, activateOrg, switchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}