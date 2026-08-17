import Link from "next/link";

const links = [
  { href: "#features", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#security", label: "Security" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md border border-ink-500 bg-ink-800 font-mono text-[11px] font-medium text-ink-50">
            k8
          </span>
          <span className="font-mono text-sm font-medium tracking-tight text-ink-50">
            k8sage
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-300 transition-colors hover:text-ink-50"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Link
          href="/dashboard"
          className="rounded-full border border-ink-500 bg-ink-50 px-4 py-1.5 text-sm font-medium text-ink-950 transition hover:bg-ink-100 active:scale-[0.98]"
        >
          Open dashboard
        </Link>
      </div>
    </header>
  );
}
