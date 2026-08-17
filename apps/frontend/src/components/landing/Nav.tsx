import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#security", label: "Security" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-sm border border-border bg-card font-mono text-[11px] font-medium text-foreground">
            k8
          </span>
          <span className="font-mono text-sm font-medium tracking-tight text-foreground">
            k8sage
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Button asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    </header>
  );
}
