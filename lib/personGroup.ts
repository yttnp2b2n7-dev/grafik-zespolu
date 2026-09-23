import type { Person } from "./types";

export type PersonGroup = {
  label: string;
  color: string;
  keyword: string;
};

// Checked in this order; the first skill match wins for people who qualify
// for more than one group.
export const PERSON_GROUPS: PersonGroup[] = [
  { label: "Technik Multimediów", color: "#8b5cf6", keyword: "multimedia" },
  { label: "Technik oświetlenia", color: "#f97316", keyword: "oswietlenia" },
  { label: "Technik dźwięku", color: "#06b6d4", keyword: "dzwieku" },
  { label: "Scenograf", color: "#ec4899", keyword: "scenograf" },
];

export const DEFAULT_PERSON_COLOR = "#7c9cff";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Derives the display color for a person from their skills instead of the
// stored `color` field, so everyone in the same specialization group (by
// skill name, e.g. "Technik oświetlenia") looks the same at a glance.
export function getPersonColor(
  person: Pick<Person, "skills">
): string {
  for (const group of PERSON_GROUPS) {
    const matches = person.skills.some((s) =>
      normalize(s.skill.name).includes(group.keyword)
    );
    if (matches) return group.color;
  }
  return DEFAULT_PERSON_COLOR;
}
