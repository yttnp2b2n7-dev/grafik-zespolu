"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "../session-context";
import { usePolling } from "@/lib/usePolling";
import type { Vehicle } from "@/lib/types";

const links = [
  { href: "/schedule", label: "Grafik" },
  { href: "/people", label: "Ludzie" },
  { href: "/fleet", label: "Flota" },
  { href: "/reports", label: "Raport" },
];

async function refreshFleetAlert(setHasOpenIssues: (value: boolean) => void) {
  const res = await fetch("/api/vehicles");
  if (!res.ok) return;
  const vehicles: Vehicle[] = await res.json();
  setHasOpenIssues(vehicles.some((v) => v.notes.some((n) => !n.resolvedAt)));
}

export function NavBar() {
  const pathname = usePathname();
  const { role } = useSession();
  const [fleetHasOpenIssues, setFleetHasOpenIssues] = useState(false);

  // Small red "!" next to Flota when any vehicle has an unresolved note,
  // so the admin sees the problem from every page, not only the fleet page.
  const watchFleet = role === "admin" && pathname !== "/login";
  useEffect(() => {
    if (watchFleet) refreshFleetAlert(setFleetHasOpenIssues);
  }, [watchFleet, pathname]);
  usePolling(
    () => refreshFleetAlert(setFleetHasOpenIssues),
    15000,
    watchFleet
  );

  if (pathname === "/login") return null;

  const visibleLinks =
    role === "visitor"
      ? links.filter((l) => l.href === "/schedule" || l.href === "/fleet")
      : links;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-border-subtle bg-surface/50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
        <span className="flex items-center gap-2 text-sm font-medium tracking-wide text-foreground">
          <img src="/logo.png" alt="ImpactVision" className="h-6 w-auto" />
          Grafik ImpactVision
        </span>
        <nav className="flex flex-1 gap-1">
          {visibleLinks.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-accent/15 text-accent-hover"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {link.label}
                {role === "admin" && link.href === "/fleet" && fleetHasOpenIssues && (
                  <span
                    title="Nienaprawione uwagi w flocie"
                    aria-label="Nienaprawione uwagi w flocie"
                    className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold leading-none text-white"
                  >
                    !
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {role && (
          <button
            onClick={handleLogout}
            className="text-xs text-muted transition hover:text-foreground"
          >
            Wyloguj
          </button>
        )}
      </div>
    </header>
  );
}
