"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "../session-context";

const links = [
  { href: "/schedule", label: "Grafik" },
  { href: "/people", label: "Ludzie" },
  { href: "/reports", label: "Raport" },
];

export function NavBar() {
  const pathname = usePathname();
  const { role } = useSession();

  if (pathname === "/login") return null;

  const visibleLinks =
    role === "visitor" ? links.filter((l) => l.href === "/schedule") : links;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-border-subtle bg-surface/50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
        <span className="text-sm font-medium tracking-wide text-foreground">
          Grafik zespołu
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
