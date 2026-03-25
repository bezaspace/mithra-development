import React, { createContext, useContext, useState, ReactNode } from "react";

interface PatientContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  clearPatient: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  // We use session-based storage or just memory if we don't want it to persist across reloads
  // The user said "Assume as if it's operating for that particular user account only throughout that session"
  // and "we don't want it to remember the last set patient" (on first open)
  const [userId, setUserId] = useState<string | null>(null);

  const clearPatient = () => setUserId(null);

  return (
    <PatientContext.Provider value={{ userId, setUserId, clearPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
}
