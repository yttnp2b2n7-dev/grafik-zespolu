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
      body: JSON.stringify({ name, color: newColor }),
    });
    if (!res.ok) {
      setError("Nie udało się dodać osoby");
      return;
    }
    setNewName("");
    setNewColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    await loadAll();
  }

  async function removePerson(id: string) {
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    setPeople((prev) => prev.filter((p) => p.id !== id));
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
  onAddSkill,
  onRemoveSkill,
}: {
  person: Person;
  onRemove: () => void;
  onAddSkill: (name: string) => void;
  onRemoveSkill: (skillId: string) => void;
}) {
  const [skillInput, setSkillInput] = useState("");

  function submitSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!skillInput.trim()) return;
    onAddSkill(skillInput);
    setSkillInput("");
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: person.color }}
          />
          <span className="text-sm font-medium text-foreground">
            {person.name}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-muted transition hover:text-danger"
        >
          Usuń
        </button>
      </div>

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
