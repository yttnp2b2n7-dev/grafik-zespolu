import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const managerNote =
    typeof body.managerNote === "string" ? body.managerNote.trim() || null : null;

  const event = await prisma.event.update({
    where: { id },
    data: { managerNote },
    select: { id: true, managerNote: true },
  });
  return NextResponse.json(event);
}
