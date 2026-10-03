import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_LENGTH = 500;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!vehicleId || !text || text.length > MAX_LENGTH) {
    return NextResponse.json({ error: "Nieprawidłowe dane uwagi" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    return NextResponse.json({ error: "Nie znaleziono pojazdu" }, { status: 404 });
  }

  const note = await prisma.vehicleNote.create({
    data: { vehicleId, text },
  });
  return NextResponse.json(note, { status: 201 });
}
