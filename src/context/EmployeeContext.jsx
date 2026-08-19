import { createContext, useContext, useState } from "react";
import { PROFILES } from "../config/employeeProfiles";

const EmployeeContext = createContext(null);

export function EmployeeProvider({ children }) {
  const [activeProfile, setActiveProfile] = useState(null);

  function unlockProfile(profileId, passwordAttempt) {
    const profile = PROFILES[profileId];
    if (profile && passwordAttempt === profile.password) {
      setActiveProfile(profileId);
      return true;
    }
    return false;
  }

  function exitProfile() {
    setActiveProfile(null);
  }

  return (
    <EmployeeContext.Provider
      value={{
        activeProfile,
        profile: activeProfile ? PROFILES[activeProfile] : null,
        unlockProfile,
        exitProfile,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  return useContext(EmployeeContext);
}
