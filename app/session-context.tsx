"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/session";

type SessionState = {
  role: Role | null;
  loading: boolean;
};

const SessionContext = createContext<SessionState>({ role: null, loading: true });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ role: null, loading: true });

  useEffect(() => {
    fetch("/api/session")
      .then((res) => (res.ok ? res.json() : { role: null }))
      .then((data) => setState({ role: data.role ?? null, loading: false }))
      .catch(() => setState({ role: null, loading: false }));
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
