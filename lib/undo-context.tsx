"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type UndoAction = {
  label: string;
  restore: () => Promise<void>;
};

const UndoContext = createContext<((action: UndoAction) => void) | null>(null);

const DURATION_MS = 60_000;

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<UndoAction | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const pushUndo = useCallback(
    (next: UndoAction) => {
      clearTimers();
      setAction(next);
      setRestoring(false);
      const expiresAt = Date.now() + DURATION_MS;
      setRemainingMs(DURATION_MS);
      intervalRef.current = setInterval(() => {
        setRemainingMs(Math.max(0, expiresAt - Date.now()));
      }, 250);
      timeoutRef.current = setTimeout(() => {
        clearTimers();
        setAction(null);
      }, DURATION_MS);
    },
    [clearTimers]
  );

  useEffect(() => clearTimers, [clearTimers]);

  async function handleUndo() {
    if (!action || restoring) return;
    setRestoring(true);
    try {
      await action.restore();
    } finally {
      clearTimers();
      setAction(null);
      setRestoring(false);
    }
  }

  return (
    <UndoContext.Provider value={pushUndo}>
      {children}
      {action && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-xl">
          <span className="text-sm text-foreground">{action.label}</span>
          <button
            onClick={handleUndo}
            disabled={restoring}
            className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {restoring ? "Przywracanie…" : `Cofnij (${Math.ceil(remainingMs / 1000)}s)`}
          </button>
        </div>
      )}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const ctx = useContext(UndoContext);
  if (!ctx) {
    throw new Error("useUndo must be used within UndoProvider");
  }
  return ctx;
}
