export type Role = "admin" | "visitor";

const encoder = new TextEncoder();

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signRole(role: Role): Promise<string> {
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(role));
  return `${role}.${toHex(signature)}`;
}

export async function verifySessionValue(
  value: string | undefined | null
): Promise<Role | null> {
  if (!value) return null;
  const [role, signature] = value.split(".");
  if (role !== "admin" && role !== "visitor") return null;
  if (!signature) return null;

  const key = await getKey();
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(role));
  if (toHex(expected) !== signature) return null;

  return role;
}
