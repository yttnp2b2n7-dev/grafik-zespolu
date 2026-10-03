import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestRole } from "@/lib/requestRole";

// Marking a note as done is admin-only. Visitors can report problems, but
// closing them out is the manager's call.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if ((await getRequestRole()) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  if (typeof body.resolved !== "boolean") {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const note = await prisma.vehicleNote.update({
    where: { id },
    data: { resolvedAt: body.resolved ? new Date() : null },
  });
  return NextResponse.json(note);
}
