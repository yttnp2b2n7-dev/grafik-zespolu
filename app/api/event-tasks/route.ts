import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const assigneeId =
    typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : null;
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (!eventId || !text) {
    return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
  }
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const task = await prisma.eventTask.create({
    data: { eventId, text, assigneeId, dueDate },
    include: { assignee: true },
  });
  return NextResponse.json(task, { status: 201 });
}
