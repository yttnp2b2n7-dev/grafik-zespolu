"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { VehicleNote } from "@/lib/types";

const MAX_LENGTH = 500;

// Problem reports for one vehicle (e.g. "uszkodzona żarówka"). Anyone in the
// team can add a note; only the admin can mark one as done, and done notes
// move into a collapsed history instead of disappearing.
export function VehicleNotes({
  notes,
  canResolve,
  onAdd,
  onResolve,
}: {
  notes: VehicleNote[];
  canResolve: boolean;
  onAdd: (text: string) => Promise<boolean>;
  onResolve: (noteId: string, resolved: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = notes.filter((n) => !n.resolvedAt).reverse();
  const done = notes.filter((n) => n.resolvedAt).reverse();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    setError(false);
    const ok = await onAdd(text);
    setSaving(false);
    if (ok) {
      setDraft("");
    } else {
      setError(true);
    }
  }

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        Uwagi{active.length > 0 && ` (${active.length})`}
      </p>

      {active.length === 0 ? (
        <p className="text-xs text-muted/60">Brak zgłoszonych uwag.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {active.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-md bg-background px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground break-words">{note.text}</p>
                <p className="text-xs text-muted">
                  {format(new Date(note.createdAt), "d MMM yyyy, HH:mm", { locale: pl })}
                </p>
              </div>
              {canResolve && (
                <button
                  onClick={() => onResolve(note.id, true)}
                  className="shrink-0 rounded-md border border-border-subtle px-2 py-0.5 text-xs text-muted transition hover:border-accent hover:text-foreground"
                >
                  Załatwione
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canResolve && done.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowDone((prev) => !prev)}
            className="text-xs text-muted transition hover:text-foreground"
          >
            {showDone ? "Ukryj załatwione" : `Załatwione (${done.length})`}
          </button>
          {showDone && (
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {done.map((note) => (
                <li
                  key={note.id}
                  className="flex items-start justify-between gap-3 px-2.5 py-1 text-xs text-muted"
                >
                  <div className="min-w-0">
                    <p className="line-through break-words">{note.text}</p>
                    <p>
                      załatwiono{" "}
                      {format(new Date(note.resolvedAt as string), "d MMM yyyy", {
                        locale: pl,
                      })}
                    </p>
                  </div>
                  {canResolve && (
                    <button
                      onClick={() => onResolve(note.id, false)}
                      className="shrink-0 text-xs text-muted transition hover:text-accent-hover"
                    >
                      Przywróć
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={submit} className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_LENGTH}
          placeholder="Np. uszkodzona żarówka, wymagany serwis…"
          className="min-w-0 flex-1 rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || saving}
          className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover disabled:opacity-40"
        >
          Dodaj uwagę
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-danger">Nie udało się dodać uwagi.</p>}
    </div>
  );
}
