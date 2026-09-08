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

export function parseEventTypeInput(value: unknown): EventType | null {
  return typeof value === "string" &&
    (EVENT_TYPE_OPTIONS as string[]).includes(value)
    ? (value as EventType)
    : null;
}
