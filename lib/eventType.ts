export type EventType = "MONTAZ" | "OBSLUGA" | "DEMONTAZ";

// Fixed rule: each event type always gets the same letter and the same
// one of three maximally contrasting colors, everywhere it's shown
// (event cards, legend, reports).
export const EVENT_TYPE_OPTIONS: EventType[] = ["MONTAZ", "OBSLUGA", "DEMONTAZ"];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  MONTAZ: "Montaż",
  OBSLUGA: "Obsługa",
  DEMONTAZ: "Demontaż",
};

export const EVENT_TYPE_LETTERS: Record<EventType, string> = {
  MONTAZ: "M",
  OBSLUGA: "O",
  DEMONTAZ: "D",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MONTAZ: "#22c55e", // green
  OBSLUGA: "#3b82f6", // blue
  DEMONTAZ: "#ef4444", // red
};

export function parseEventTypeInput(value: unknown): EventType | null {
  return typeof value === "string" &&
    (EVENT_TYPE_OPTIONS as string[]).includes(value)
    ? (value as EventType)
    : null;
}
