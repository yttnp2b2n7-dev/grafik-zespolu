export type EventType = "MONTAZ" | "OBSLUGA" | "DEMONTAZ" | "ZALADUNEK";

// Fixed rule: each event type always gets the same letter and the same
// one of four maximally contrasting colors, everywhere it's shown
// (event cards, legend, reports).
export const EVENT_TYPE_OPTIONS: EventType[] = [
  "MONTAZ",
  "OBSLUGA",
  "DEMONTAZ",
  "ZALADUNEK",
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  MONTAZ: "Montaż",
  OBSLUGA: "Realizacja",
  DEMONTAZ: "Demontaż",
  ZALADUNEK: "Załadunek",
};

export const EVENT_TYPE_LETTERS: Record<EventType, string> = {
  MONTAZ: "M",
  OBSLUGA: "R",
  DEMONTAZ: "D",
  ZALADUNEK: "Z",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MONTAZ: "#22c55e", // green
  OBSLUGA: "#3b82f6", // blue
  DEMONTAZ: "#ef4444", // red
  ZALADUNEK: "#eab308", // yellow
};

function isEventType(value: unknown): value is EventType {
  return (
    typeof value === "string" && (EVENT_TYPE_OPTIONS as string[]).includes(value)
  );
}

// An event can now carry any combination of the four types at once.
export function parseEventTypesInput(value: unknown): EventType[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set(value.filter(isEventType));
  return EVENT_TYPE_OPTIONS.filter((type) => unique.has(type));
}
