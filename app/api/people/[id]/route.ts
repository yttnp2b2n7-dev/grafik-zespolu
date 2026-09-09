import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const data: { name: string; email?: string | null; phone?: string | null } = {
    name,
  };
  if ("email" in body) {
    data.email = typeof body.email === "string" ? body.email.trim() || null : null;
  }
  if ("phone" in body) {
    data.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  }

  const person = await prisma.person.update({ where: { id }, data });
  return NextResponse.json(person);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.person.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
