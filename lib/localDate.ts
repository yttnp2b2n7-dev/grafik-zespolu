// `<input type="date">` values parse to UTC midnight via `new Date(string)`,
// which can land on the wrong day once shifted to local time - this keeps it
// anchored to local midnight instead.
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
