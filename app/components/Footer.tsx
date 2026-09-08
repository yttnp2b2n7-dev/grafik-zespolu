"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <footer className="border-t border-border-subtle bg-surface/50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-4">
        <span className="text-xs text-muted">Pomysł i koncepcja</span>
        <img
          src="/focuscraft-logo.png"
          alt="FocusCraft — Event & Concert Technical Support"
          className="h-6 w-auto rounded-sm"
        />
      </div>
    </footer>
  );
}
