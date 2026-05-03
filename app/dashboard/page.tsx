import DashboardPanel from "@/components/DashboardPanel";
import SearchPanel from "@/components/SearchPanel";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Backlink OS</h1>
      <DashboardPanel />
      <SearchPanel />
    </div>
  );
}
