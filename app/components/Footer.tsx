"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <footer className="border-t border-border-subtle bg-surface/50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-4">
        <span className="text-xs text-muted">Własność</span>
        <img
          src="/focuscraft-logo.svg"
          alt="FocusCraft — Event & Concert Technical Support"
          className="h-24 w-auto"
        />
      </div>
    </footer>
  );
}
