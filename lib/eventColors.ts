export const EVENT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#22c55e",
  "#eab308",
  "#06b6d4",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#f43f5e",
];

export function randomEventColor(): string {
  return EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)];
}

export const DEFAULT_EVENT_COLOR = "#71717a";
