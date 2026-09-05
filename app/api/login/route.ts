import { NextRequest, NextResponse } from "next/server";
import { signRole, type Role } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const password = typeof body.password === "string" ? body.password : "";

  let role: Role | null = null;
  if (password && password === process.env.ADMIN_PASSWORD) {
    role = "admin";
  } else if (password && password === process.env.VISITOR_PASSWORD) {
    role = "visitor";
  }

  if (!role) {
    return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
  }

  const token = await signRole(role);
  const res = NextResponse.json({ role });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
