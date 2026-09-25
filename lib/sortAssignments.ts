// Postgres' default column collation doesn't sort Polish diacritics
// correctly (e.g. it puts "Ł" after "Z" instead of near "L"), so
// `orderBy: { person: { name: "asc" } }` at the DB level produces a
// visibly wrong order for names like "Łukasz". Sorting here in JS with
// `localeCompare(..., "pl")` matches the same logic already used
// client-side for optimistic updates (see `sortByPersonName` in
// app/schedule/page.tsx) and gives a correct, consistent order everywhere.
export function sortAssignmentsByPersonName<T extends { person: { name: string } }>(
  assignments: T[]
): T[] {
  return [...assignments].sort((a, b) =>
    a.person.name.localeCompare(b.person.name, "pl")
  );
}
