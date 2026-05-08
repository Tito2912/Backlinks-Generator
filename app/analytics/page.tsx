import AnalyticsPanel from "@/components/AnalyticsPanel";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-slate-400">Performances de tes campagnes et backlinks.</p>
      </div>
      <AnalyticsPanel />
    </div>
  );
}
