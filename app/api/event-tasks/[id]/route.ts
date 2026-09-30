import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: {
    text?: string;
    done?: boolean;
    assigneeId?: string | null;
    dueDate?: Date | null;
  } = {};

  if ("done" in body) {
    data.done = body.done === true;
  }
  if ("text" in body) {
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    data.text = text;
  }
  if ("assigneeId" in body) {
    data.assigneeId =
      typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : null;
  }
  if ("dueDate" in body) {
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    data.dueDate = dueDate;
  }

  const task = await prisma.eventTask.update({
    where: { id },
    data,
    include: { assignee: true },
  });
  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.eventTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
