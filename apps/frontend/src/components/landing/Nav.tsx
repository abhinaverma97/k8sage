import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

const links = [
  { href: "#features", label: "Capabilities" },
  { href: "#how", label: "Workflow" },
  { href: "#security", label: "Security" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-8 md:px-16 lg:px-24">
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

        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 rounded border border-border bg-foreground px-3.5 py-1.5 font-mono text-xs font-medium text-background transition hover:bg-foreground/90 active:scale-[0.98]"
        >
          <span>Console</span>
          <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
