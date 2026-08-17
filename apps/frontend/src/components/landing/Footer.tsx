export default function Footer() {
  return (
    <footer className="border-t border-ink-600">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="grid size-5 place-items-center rounded border border-ink-500 bg-ink-800 font-mono text-[10px] text-ink-50">
            k8
          </span>
          <span className="font-mono text-xs text-ink-300">k8sage</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs text-ink-400">
          <a
            href="https://github.com/abhinaverma97/k8sage"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink-50"
          >
            github
          </a>
          <span>read-only · rbac-scoped</span>
        </div>
      </div>
    </footer>
  );
}
