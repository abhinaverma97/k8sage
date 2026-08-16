import Chat from "@/components/Chat";
import ClusterPanel from "@/components/ClusterPanel";

export default function Home() {
  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">◆</span>
          <h1 className="text-sm font-semibold tracking-tight text-slate-100">K8Sage</h1>
          <span className="text-xs text-slate-500">AI SRE · reads the cluster, answers in plain English</span>
        </div>
        <span className="rounded border border-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
          read-only · rbac-scoped
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        <Chat />
        <div className="hidden lg:block">
          <ClusterPanel />
        </div>
      </div>
    </main>
  );
}
