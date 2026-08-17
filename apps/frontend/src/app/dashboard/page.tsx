import DashboardHeader from "@/components/DashboardHeader";
import DashboardStats from "@/components/DashboardStats";
import Chat from "@/components/Chat";
import ClusterPanel from "@/components/ClusterPanel";

export default function DashboardPage() {
  return (
    <main className="flex h-dvh flex-col bg-ink-950">
      <DashboardHeader />
      <DashboardStats />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_400px]">
        <Chat />
        <div className="hidden lg:block">
          <ClusterPanel />
        </div>
      </div>
    </main>
  );
}
