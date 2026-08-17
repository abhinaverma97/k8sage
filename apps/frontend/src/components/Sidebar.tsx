"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircle, SquaresFour } from "@phosphor-icons/react";

const items = [
  { href: "/dashboard", label: "Ask", icon: ChatCircle, exact: true },
  { href: "/dashboard/cluster", label: "Cluster", icon: SquaresFour, exact: false },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon size={18} weight={active ? "fill" : "regular"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border p-3">
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          read-only
          <br />
          rbac-scoped
        </p>
      </div>
    </aside>
  );
}
