import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  }

  const skill = await prisma.skill.upsert({
    where: { name },
    create: { name },
    update: {},
  });

  await prisma.personSkill.upsert({
    where: { personId_skillId: { personId: id, skillId: skill.id } },
    create: { personId: id, skillId: skill.id },
    update: {},
  });

  return NextResponse.json(skill, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");

  if (!skillId) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  }

  await prisma.personSkill.delete({
    where: { personId_skillId: { personId: id, skillId } },
  });

  return NextResponse.json({ ok: true });
}
