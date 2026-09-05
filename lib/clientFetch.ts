export async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.href = "/login";
    return null;
  }
  if (!res.ok) return null;
  return res.json();
}
