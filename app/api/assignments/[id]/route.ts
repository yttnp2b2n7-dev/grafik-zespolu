import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEventTypesInput, type EventType } from "@/lib/eventType";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: { isLead?: boolean; roles?: EventType[] } = {};
  if ("isLead" in body) {
    data.isLead = body.isLead === true;
  }
  if ("roles" in body) {
    // A person can only be tagged with roles the event itself carries.
    const allowed = new Set(assignment.event.eventTypes);
    data.roles = parseEventTypesInput(body.roles).filter((r) => allowed.has(r));
  }

  const [updated] = await prisma.$transaction([
    prisma.assignment.update({
      where: { id },
      data,
      include: { person: true },
    }),
    // Only one commander per event: clearing the flag on every other
    // assignment for the same event when marking a new one.
    ...(data.isLead === true
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
