export type WorkType = "OSWIETLENIE" | "MULTIMEDIA" | "DZWIEK" | "SCENOGRAFIA";

export const WORK_TYPE_OPTIONS: WorkType[] = [
  "OSWIETLENIE",
  "MULTIMEDIA",
  "DZWIEK",
  "SCENOGRAFIA",
];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  OSWIETLENIE: "Oświetlenie",
  MULTIMEDIA: "Multimedia",
  DZWIEK: "Dźwięk",
  SCENOGRAFIA: "Scenografia i konstrukcje",
};

// Matches the colors already used for the same specializations in
// lib/personGroup.ts, so a person's manual work-type tags line up
// visually with their automatic skill-based color.
export const WORK_TYPE_COLORS: Record<WorkType, string> = {
  OSWIETLENIE: "#f97316",
  MULTIMEDIA: "#8b5cf6",
  DZWIEK: "#06b6d4",
  SCENOGRAFIA: "#ec4899",
};

// The commander star is a separate boolean field (`isLead`), not part of
// the WorkType enum, but it's shown and toggled the same way - as a 5th
// icon alongside the 4 work types.
export const LEAD_COLOR = "#eab308";
export const LEAD_LABEL = "Dowódca";

export function LeadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5 14.9 8.9 22 9.6 16.6 14.2 18.2 21.1 12 17.4 5.8 21.1 7.4 14.2 2 9.6 9.1 8.9 12 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function isWorkType(value: unknown): value is WorkType {
  return (
    typeof value === "string" && (WORK_TYPE_OPTIONS as string[]).includes(value)
  );
}

export function parseWorkTypesInput(value: unknown): WorkType[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set(value.filter(isWorkType));
  return WORK_TYPE_OPTIONS.filter((type) => unique.has(type));
}

export function WorkTypeIcon({ type, className }: { type: WorkType; className?: string }) {
  switch (type) {
    case "OSWIETLENIE":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M12 2a7 7 0 0 0-4 12.74c.36.26.5.6.5 1v.26a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-.26c0-.4.14-.74.5-1A7 7 0 0 0 12 2Z"
            fill="currentColor"
          />
          <rect x="9.5" y="19" width="5" height="1.4" rx="0.7" fill="currentColor" />
          <rect x="10" y="21" width="4" height="1.4" rx="0.7" fill="currentColor" />
        </svg>
      );
    case "MULTIMEDIA":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 8.3v7.4l6.2-3.7L10 8.3Z" fill="currentColor" />
        </svg>
      );
    case "DZWIEK":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
          <path
            d="M6 11a6 6 0 0 0 12 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "SCENOGRAFIA":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="2" y="2" width="2.2" height="20" fill="currentColor" />
          <rect x="19.8" y="2" width="2.2" height="20" fill="currentColor" />
          <path
            d="M4.2 3 19.8 21M19.8 3 4.2 21"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}
