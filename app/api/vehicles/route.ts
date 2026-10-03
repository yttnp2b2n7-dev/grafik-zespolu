import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestRole } from "@/lib/requestRole";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { name: "asc" },
    include: {
      serviceBlocks: { orderBy: { startDate: "asc" } },
      notes: { orderBy: { createdAt: "asc" } },
    },
  });

  // Visitors see the fleet to report problems, not to manage it: inspection
  // and insurance dates, service blocks and the admin's own note stay hidden.
  // Filtered here, not only in the UI, so the data never leaves the server.
  if ((await getRequestRole()) === "visitor") {
    return NextResponse.json(
      vehicles.map((v) => ({
        id: v.id,
        name: v.name,
        plateNumber: v.plateNumber,
        type: v.type,
        capacity: v.capacity,
        createdAt: v.createdAt,
        inspectionDate: null,
        insuranceDate: null,
        note: null,
        serviceBlocks: [],
        // Done issues are the manager's history, not the visitor's concern.
        notes: v.notes.filter((n) => !n.resolvedAt),
      }))
    );
  }

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Invalid vehicle data" }, { status: 400 });
  }

  const plateNumber =
    typeof body.plateNumber === "string" ? body.plateNumber.trim() || null : null;
  const type = typeof body.type === "string" ? body.type.trim() || null : null;
  const capacity = typeof body.capacity === "string" ? body.capacity.trim() || null : null;
  const note = typeof body.note === "string" ? body.note.trim() || null : null;
  const inspectionDate = body.inspectionDate ? new Date(body.inspectionDate) : null;
  const insuranceDate = body.insuranceDate ? new Date(body.insuranceDate) : null;

  if (
    (inspectionDate && Number.isNaN(inspectionDate.getTime())) ||
    (insuranceDate && Number.isNaN(insuranceDate.getTime()))
  ) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.create({
    data: { name, plateNumber, type, capacity, note, inspectionDate, insuranceDate },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
