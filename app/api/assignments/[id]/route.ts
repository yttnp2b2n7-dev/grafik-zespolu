import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const isLead = body.isLead === true;

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.assignment.update({
      where: { id },
      data: { isLead },
      include: { person: true },
    }),
    // Only one commander per event: clearing the flag on every other
    // assignment for the same event when marking a new one.
    ...(isLead
      ? [
          prisma.assignment.updateMany({
            where: { eventId: assignment.eventId, NOT: { id } },
            data: { isLead: false },
          }),
        ]
      : []),
  ]);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.assignment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
