import { NextRequest, NextResponse } from "next/server";
import { verifySessionValue } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("session")?.value;
  const role = await verifySessionValue(cookie);
  return NextResponse.json({ role });
}
