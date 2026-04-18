import React, { createContext, useCallback, useContext, useState, ReactNode } from "react";
import type { AdherenceReportSavedEvent } from "./lib/liveSocket";

interface PatientContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  clearPatient: () => void;
  // Latest adherence-save event from the live assistant (success or failure).
  // Consumers (voice page Snackbar, Dashboard auto-refresh) react to this.
  latestAdherenceEvent: AdherenceReportSavedEvent | null;
  publishAdherenceEvent: (event: AdherenceReportSavedEvent) => void;
  // Monotonically increases every time a successful save lands, so the
  // Dashboard can refetch without needing to diff event identity.
  adherenceRefreshNonce: number;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  // We use session-based storage or just memory if we don't want it to persist across reloads
  // The user said "Assume as if it's operating for that particular user account only throughout that session"
  // and "we don't want it to remember the last set patient" (on first open)
  const [userId, setUserId] = useState<string | null>(null);
  const [latestAdherenceEvent, setLatestAdherenceEvent] =
    useState<AdherenceReportSavedEvent | null>(null);
  const [adherenceRefreshNonce, setAdherenceRefreshNonce] = useState(0);

  const clearPatient = () => setUserId(null);

  const publishAdherenceEvent = useCallback(
    (event: AdherenceReportSavedEvent) => {
      setLatestAdherenceEvent(event);
      if (event.saved) {
        setAdherenceRefreshNonce((n) => n + 1);
      }
    },
    []
  );

  return (
    <PatientContext.Provider
      value={{
        userId,
        setUserId,
        clearPatient,
        latestAdherenceEvent,
        publishAdherenceEvent,
        adherenceRefreshNonce,
      }}
    >
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
