import DashboardHeader from "@/components/DashboardHeader";
import DashboardStats from "@/components/DashboardStats";
import DashboardBody from "@/components/DashboardBody";

export default function DashboardPage() {
  return (
    <main className="flex h-dvh flex-col bg-ink-950">
      <DashboardHeader />
      <DashboardStats />
      <DashboardBody />
    </main>
  );
}
