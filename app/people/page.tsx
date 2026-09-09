"use client";

import { useEffect, useMemo, useState } from "react";
import type { Person, Skill } from "@/lib/types";
import { fetchJsonOrNull } from "@/lib/clientFetch";

const PALETTE = [
  "#6366f1",
  "#ec4899",
  "#22c55e",
  "#eab308",
  "#06b6d4",
  "#f97316",
  "#a855f7",
  "#ef4444",
];

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [peopleData, skillsData] = await Promise.all([
      fetchJsonOrNull<Person[]>("/api/people"),
      fetchJsonOrNull<Skill[]>("/api/skills"),
    ]);
    if (peopleData) setPeople(peopleData);
    if (skillsData) setSkills(skillsData);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const skillNames = useMemo(() => skills.map((s) => s.name), [skills]);

  async function addPerson(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        color: newColor,
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
      }),
    });
    if (!res.ok) {
      setError("Nie udało się dodać osoby");
      return;
    }
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    await loadAll();
  }

  async function removePerson(id: string) {
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }

  async function updatePersonDetails(
    id: string,
    data: { name: string; email: string | null; phone: string | null }
  ) {
    const res = await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return false;
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    return true;
  }

  async function addSkill(personId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await fetch(`/api/people/${personId}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    await loadAll();
  }

  async function removeSkill(personId: string, skillId: string) {
    await fetch(`/api/people/${personId}/skills?skillId=${skillId}`, {
      method: "DELETE",
    });
    await loadAll();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold text-foreground">Ludzie</h1>
      <p className="mt-1 text-sm text-muted">
        Dodawaj osoby i przypisuj im umiejętności, żeby móc przeciągać je
        później do wydarzeń w grafiku.
      </p>

      <form
        onSubmit={addPerson}
        className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-surface p-4"
      >
        <div className="flex gap-1.5">
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              className="h-6 w-6 rounded-full ring-offset-2 ring-offset-surface transition"
              style={{
                backgroundColor: color,
                boxShadow: newColor === color ? `0 0 0 2px ${color}` : "none",
              }}
              aria-label={`Wybierz kolor ${color}`}
            />
          ))}
        </div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Imię i nazwisko"
          className="min-w-[200px] flex-1 rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="E-mail (opcjonalnie)"
          className="min-w-[180px] flex-1 rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <input
          type="tel"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="Telefon (opcjonalnie)"
          className="min-w-[150px] flex-1 rounded-md border border-border-subtle bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Dodaj osobę
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <datalist id="skill-suggestions">
        {skillNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {loading && <p className="text-sm text-muted">Ładowanie…</p>}
        {!loading && people.length === 0 && (
          <p className="text-sm text-muted">Brak osób. Dodaj pierwszą powyżej.</p>
        )}
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onRemove={() => removePerson(person.id)}
            onSave={(data) => updatePersonDetails(person.id, data)}
            onAddSkill={(name) => addSkill(person.id, name)}
            onRemoveSkill={(skillId) => removeSkill(person.id, skillId)}
          />
        ))}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  onRemove,
  onSave,
  onAddSkill,
  onRemoveSkill,
}: {
  person: Person;
  onRemove: () => void;
  onSave: (data: {
    name: string;
    email: string | null;
    phone: string | null;
  }) => Promise<boolean>;
  onAddSkill: (name: string) => void;
  onRemoveSkill: (skillId: string) => void;
}) {
  const [skillInput, setSkillInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(person.name);
  const [emailInput, setEmailInput] = useState(person.email ?? "");
  const [phoneInput, setPhoneInput] = useState(person.phone ?? "");
  const [saveError, setSaveError] = useState(false);

  function submitSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!skillInput.trim()) return;
    onAddSkill(skillInput);
    setSkillInput("");
  }

  function startEditing() {
    setNameInput(person.name);
    setEmailInput(person.email ?? "");
    setPhoneInput(person.phone ?? "");
    setSaveError(false);
    setIsEditing(true);
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const ok = await onSave({
      name: trimmed,
      email: emailInput.trim() || null,
      phone: phoneInput.trim() || null,
    });
    if (ok) {
      setIsEditing(false);
    } else {
      setSaveError(true);
    }
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      {isEditing ? (
        <form onSubmit={submitDetails} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: person.color }}
            />
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Imię i nazwisko"
              autoFocus
              className="min-w-0 flex-1 rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Telefon"
            className="w-full rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="text-xs text-accent-hover transition hover:underline"
            >
              Zapisz
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-muted transition hover:text-foreground"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: person.color }}
              />
              <span className="text-sm font-medium text-foreground">
                {person.name}
              </span>
            </div>
            {(person.email || person.phone) && (
              <div className="mt-1 flex flex-col gap-0.5 pl-5 text-xs text-muted">
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="hover:text-accent-hover hover:underline"
                  >
                    {person.email}
                  </a>
                )}
                {person.phone && (
                  <a
                    href={`tel:${person.phone}`}
                    className="hover:text-accent-hover hover:underline"
                  >
                    {person.phone}
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={startEditing}
              className="text-xs text-muted transition hover:text-accent-hover"
            >
              Edytuj
            </button>
            <button
              onClick={onRemove}
              className="text-xs text-muted transition hover:text-danger"
            >
              Usuń
            </button>
          </div>
        </div>
      )}
      {saveError && (
        <p className="mt-1 text-xs text-danger">Nie udało się zapisać zmiany.</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {person.skills.map(({ skill }) => (
          <span
            key={skill.id}
            className="flex items-center gap-1 rounded-full border border-border-subtle bg-background px-2 py-0.5 text-xs text-muted"
          >
            {skill.name}
            <button
              onClick={() => onRemoveSkill(skill.id)}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted/70 hover:bg-danger/20 hover:text-danger"
              aria-label={`Usuń umiejętność ${skill.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={submitSkill} className="mt-3 flex gap-2">
        <input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          placeholder="Dodaj umiejętność…"
          list="skill-suggestions"
          className="flex-1 rounded-md border border-border-subtle bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md border border-border-subtle px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-foreground"
        >
          Dodaj
        </button>
      </form>
    </div>
  );
}
