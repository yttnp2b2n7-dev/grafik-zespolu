"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/schedule", label: "Grafik" },
  { href: "/people", label: "Ludzie" },
  { href: "/reports", label: "Raport" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border-subtle bg-surface/50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
        <span className="text-sm font-medium tracking-wide text-foreground">
          Grafik zespołu
        </span>
        <nav className="flex gap-1">
          {links.map((link) => {
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
      </div>
    </header>
  );
}
