"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, List, X } from "@phosphor-icons/react";

const links = [
  { href: "#features", label: "Capabilities" },
  { href: "#how", label: "Workflow" },
  { href: "#security", label: "Security" },
];

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8 md:px-16 lg:px-24">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded border border-border bg-muted/60 font-mono text-xs font-semibold text-foreground transition-colors group-hover:border-foreground/40">
            k8
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
            k8sage
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs text-muted-foreground tracking-wide transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded border border-border bg-foreground px-3.5 py-1.5 font-mono text-xs font-medium text-background transition hover:bg-foreground/90 active:scale-[0.98]"
          >
            <span>Console</span>
            <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid size-8 place-items-center rounded border border-border text-muted-foreground transition hover:text-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-b border-border/80 bg-background/95 p-4 backdrop-blur-md md:hidden font-mono text-xs space-y-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
