import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Vercel's default Hobby function timeout (~10s) was too short once the
// dataset grew - this route does several sequential DB + Blob round trips.
export const maxDuration = 60;

// One week of history at 4 backups/day (triggered externally by a GitHub
// Actions schedule - Vercel's Hobby plan only allows once-daily crons).
const RETENTION_COUNT = 28;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [people, skills, personSkills, events, assignments] =
    await Promise.all([
      prisma.person.findMany(),
      prisma.skill.findMany(),
      prisma.personSkill.findMany(),
      prisma.event.findMany(),
      prisma.assignment.findMany(),
    ]);

  const backup = { people, skills, personSkills, events, assignments };
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backups/backup-${stamp}.json`;

  const blob = await put(filename, JSON.stringify(backup, null, 2), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });

  const { blobs } = await list({ prefix: "backups/backup-" });
  const sorted = blobs.sort((a, b) => a.pathname.localeCompare(b.pathname));
  const toDelete = sorted.slice(0, Math.max(0, sorted.length - RETENTION_COUNT));
  if (toDelete.length > 0) {
    await del(toDelete.map((b) => b.url));
  }

  return NextResponse.json({
    status: "ok",
    url: blob.url,
    people: people.length,
    events: events.length,
    assignments: assignments.length,
    deleted: toDelete.length,
    kept: sorted.length - toDelete.length,
  });
}
