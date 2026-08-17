export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="grid size-5 place-items-center rounded-sm border border-border bg-card font-mono text-[10px] text-foreground">
            k8
          </span>
          <span className="font-mono text-xs text-muted-foreground">k8sage</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
          <a
            href="https://github.com/abhinaverma97/k8sage"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            github
          </a>
          <span>read-only · rbac-scoped</span>
        </div>
      </div>
    </footer>
  );
}
