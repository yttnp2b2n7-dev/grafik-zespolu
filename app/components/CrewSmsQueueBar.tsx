"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  cancelCrewSms,
  getCrewSmsSnapshot,
  subscribeCrewSms,
  type PendingCrewSms,
} from "@/lib/crewSmsQueue";

// Stable reference: useSyncExternalStore loops forever if the server
// snapshot returns a new array on every call.
const NO_ITEMS: PendingCrewSms[] = [];

// Shows automatic crew SMS that are about to go out. No countdown: the
// message simply waits a moment, and "Cofnij" removes it before it is sent.
export function CrewSmsQueueBar() {
  const items = useSyncExternalStore(
    subscribeCrewSms,
    getCrewSmsSnapshot,
    () => NO_ITEMS
  );

  // Pending messages live only in this tab, so warn before leaving it.
  const hasPending = items.some((i) => !i.error);
  useEffect(() => {
    if (!hasPending) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasPending]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-xl"
        >
          <div className="min-w-0 flex-1">
            {item.error ? (
              <p className="text-sm text-red-400">
                SMS do {item.personName} nie został wysłany: {item.error}
              </p>
            ) : (
              <p className="text-sm text-foreground">
                {item.kind === "add" ? "Dopisanie" : "Zdjęcie"} {item.personName}
                <span className="text-muted"> — SMS wyśle się za chwilę</span>
              </p>
            )}
            <p className="mt-0.5 truncate text-xs text-muted">{item.title}</p>
          </div>
          {!item.error && (
            <button
              onClick={() => cancelCrewSms(item.id)}
              className="shrink-0 rounded-md border border-border-subtle px-2.5 py-1 text-xs text-foreground transition hover:border-accent"
            >
              Cofnij
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
