import { NextRequest, NextResponse } from "next/server";
import { verifySessionValue } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout", "/api/session"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("session")?.value;
  const role = await verifySessionValue(cookie);

  if (pathname.startsWith("/api")) {
    if (!role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (role === "visitor") {
      const isAllowedRead = req.method === "GET" && pathname.startsWith("/api/events");
      if (!isAllowedRead) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (role === "visitor" && pathname !== "/" && pathname !== "/schedule") {
    const url = req.nextUrl.clone();
    url.pathname = "/schedule";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
