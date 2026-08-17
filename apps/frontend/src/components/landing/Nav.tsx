import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        <Button asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    </header>
  );
}
