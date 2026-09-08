import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDaysInput } from "@/lib/eventDaysValidation";
import { randomEventColor } from "@/lib/eventColors";
import { parseLoadingTransportInput } from "@/lib/eventLoadingTransport";
import { parseEventTypeInput } from "@/lib/eventType";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { person: { include: { skills: { include: { skill: true } } } } },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
  }

  const loadingTransport = parseLoadingTransportInput(body);
  const eventType = parseEventTypeInput(body.eventType);

  // Turning a single event into a multi-day range on edit: keep this
  // event as one day of the series and create independent events for the
  // other new days, same as multi-day creation.
  if (Array.isArray(body.days) && body.days.length > 1) {
    const days = parseDaysInput(body.days);
    if (!days) {
      return NextResponse.json({ error: "Invalid days data" }, { status: 400 });
    }
    const existing = await prisma.event.findUnique({ where: { id } });
    const color = existing?.color ?? randomEventColor();
    // Reuse the event's existing groupId (if it already belonged to a
    // series) instead of minting a new one every edit - otherwise days
    // that aren't part of this particular edit get orphaned into a stale,
    // disconnected group that no longer lines up with the rest of the
    // series (e.g. editing day 2 of a 3-day event to also cover day 4
    // used to strand day 1 behind with the old groupId).
    const groupId = existing?.groupId ?? crypto.randomUUID();
    const newDateKeys = new Set(days.map((d) => d.startsAt.toDateString()));
    const oldSiblings = existing?.groupId
      ? await prisma.event.findMany({
          where: { groupId: existing.groupId, NOT: { id } },
        })
      : [];
    // A sibling whose day is covered by the newly submitted range is being
    // replaced by it; a sibling on a day outside that range is untouched
    // and stays part of the (same) group.
    const staleSiblings = oldSiblings.filter((s) =>
      newDateKeys.has(new Date(s.startsAt).toDateString())
    );
    const keptSiblings = oldSiblings.filter(
      (s) => !newDateKeys.has(new Date(s.startsAt).toDateString())
    );

    const [selfDay, ...newDays] = days;
    const entries = [
      { startsAt: selfDay.startsAt, endsAt: selfDay.endsAt, existingId: id },
      ...newDays.map((d) => ({ startsAt: d.startsAt, endsAt: d.endsAt, existingId: null as string | null })),
      ...keptSiblings.map((s) => ({ startsAt: s.startsAt, endsAt: s.endsAt, existingId: s.id })),
    ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const total = entries.length;

    const events = await prisma.$transaction([
      ...staleSiblings.map((s) => prisma.event.delete({ where: { id: s.id } })),
      ...entries.map((entry, i) => {
        const label = `${title} ${i + 1}/${total}`;
        if (entry.existingId === id) {
          return prisma.event.update({
            where: { id },
            data: {
              title: label,
              startsAt: entry.startsAt,
              endsAt: entry.endsAt,
              groupId,
              eventType,
              ...loadingTransport,
            },
          });
        }
        if (entry.existingId) {
          // Untouched sibling: keep its own schedule/assignments, just
          // fix its numbering and confirm it's still in this group.
          return prisma.event.update({
            where: { id: entry.existingId },
            data: { title: label, groupId },
          });
        }
        return prisma.event.create({
          data: {
            title: label,
            startsAt: entry.startsAt,
            endsAt: entry.endsAt,
            groupId,
            color,
            eventType,
            ...loadingTransport,
          },
        });
      }),
    ]);
    return NextResponse.json(events);
  }

  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;

  if (
    !startsAt ||
    !endsAt ||
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
  }
  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    );
  }

  const event = await prisma.event.update({
    where: { id },
    data: { title, startsAt, endsAt, eventType, ...loadingTransport },
  });
  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
