export type EventDayInput = { startsAt: Date; endsAt: Date };

export function parseDaysInput(raw: unknown): EventDayInput[] | null {
  if (!Array.isArray(raw)) return null;
  const result: EventDayInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const startsAt = new Date(record.startsAt as string);
    const endsAt = new Date(record.endsAt as string);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return null;
    }
    if (endsAt <= startsAt) return null;
    result.push({ startsAt, endsAt });
  }
  return result;
}
