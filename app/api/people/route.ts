import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const people = await prisma.person.findMany({
    include: { skills: { include: { skill: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(people);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color : "#7c9cff";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const person = await prisma.person.create({ data: { name, color } });
  return NextResponse.json(person, { status: 201 });
}
