import DashboardHeader from "@/components/DashboardHeader";
import Chat from "@/components/Chat";
import ClusterPanel from "@/components/ClusterPanel";

export default function DashboardPage() {
  return (
    <main className="flex h-dvh flex-col bg-ink-950">
      <DashboardHeader />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_340px]">
        <Chat />
        <div className="hidden lg:block">
          <ClusterPanel />
        </div>
      </div>
    </main>
  );
}
