"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";

type FunnelRow = { status: string; count: number };
type SourceRow = { source: string; total: number; won: number };
type ScoreBucket = { label: string; min: number; max: number; total: number; won: number };
type BacklinkStatus = { status: string; count: number };

type Analytics = {
  funnel: FunnelRow[];
  bySource: SourceRow[];
  scoreBuckets: ScoreBucket[];
  backlinkStatuses: BacklinkStatus[];
  totalOpportunities: number;
  totalWon: number;
};

const STATUSES = ["new", "replied", "submitted", "won", "lost", "ignored"];

function Bar({ value, max, color = "bg-cyan-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-sm text-slate-300">{value}</span>
    </div>
  );
}

function pct(num: number, den: number) {
  if (!den) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

export default function AnalyticsPanel() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const { activeSiteId } = useSite();
  const [data, setData] = useState<Analytics | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setFetching(true);
    setError("");

    try {
      let oppQuery = supabase
        .from("opportunities")
        .select("status, source, opportunity_score")
        .eq("user_id", user.id);
      if (activeSiteId) oppQuery = oppQuery.eq("project_id", activeSiteId);
      const { data: opps, error: oppErr } = await oppQuery;
      if (oppErr) throw oppErr;

      let blQuery = supabase
        .from("backlinks")
        .select("status")
        .eq("user_id", user.id);
      if (activeSiteId) blQuery = blQuery.eq("project_id", activeSiteId);
      const { data: bls, error: blErr } = await blQuery;
      if (blErr) throw blErr;

      const opportunities = opps || [];
      const backlinks = bls || [];

      // Funnel
      const statusCount: Record<string, number> = {};
      for (const s of STATUSES) statusCount[s] = 0;
      for (const o of opportunities) {
        const s = o.status || "new";
        if (s in statusCount) statusCount[s]++;
      }
      const funnel: FunnelRow[] = STATUSES.map((s) => ({ status: s, count: statusCount[s] }));

      // By source
      const sourceMap: Record<string, { total: number; won: number }> = {};
      for (const o of opportunities) {
        if (!sourceMap[o.source]) sourceMap[o.source] = { total: 0, won: 0 };
        sourceMap[o.source].total++;
        if (o.status === "won") sourceMap[o.source].won++;
      }
      const bySource: SourceRow[] = Object.entries(sourceMap).map(([source, v]) => ({
        source,
        ...v,
      }));

      // Score buckets
      const buckets: ScoreBucket[] = [
        { label: "Élevé (70–100)", min: 70, max: 100, total: 0, won: 0 },
        { label: "Moyen (40–69)", min: 40, max: 69, total: 0, won: 0 },
        { label: "Faible (0–39)", min: 0, max: 39, total: 0, won: 0 },
      ];
      for (const o of opportunities) {
        const score = o.opportunity_score ?? 0;
        const bucket = buckets.find((b) => score >= b.min && score <= b.max);
        if (bucket) {
          bucket.total++;
          if (o.status === "won") bucket.won++;
        }
      }

      // Backlink statuses
      const blStatusCount: Record<string, number> = {};
      for (const b of backlinks) {
        const s = b.status || "pending";
        blStatusCount[s] = (blStatusCount[s] || 0) + 1;
      }
      const backlinkStatuses: BacklinkStatus[] = Object.entries(blStatusCount).map(
        ([status, count]) => ({ status, count })
      );

      setData({
        funnel,
        bySource,
        scoreBuckets: buckets,
        backlinkStatuses,
        totalOpportunities: opportunities.length,
        totalWon: statusCount["won"],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setFetching(false);
    }
  }, [supabase, user, activeSiteId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!configured) {
    return <div className="card text-sm text-slate-400">Configure Supabase pour voir les analytics.</div>;
  }
  if (loading) return <div className="card text-sm text-slate-400">Chargement...</div>;
  if (!user) return <div className="card text-sm text-slate-400">Connecte-toi dans Settings.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="btn inline-flex items-center gap-2" onClick={load} disabled={fetching}>
          <RefreshCw size={16} className={fetching ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card text-center">
              <p className="text-sm text-slate-400">Total opportunités</p>
              <p className="text-4xl font-bold">{data.totalOpportunities}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-slate-400">Backlinks gagnés</p>
              <p className="text-4xl font-bold text-cyan-400">{data.totalWon}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-slate-400">Taux de conversion</p>
              <p className="text-4xl font-bold text-green-400">
                {pct(data.totalWon, data.totalOpportunities)}
              </p>
            </div>
          </div>

          {/* Funnel */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold">Funnel de conversion</h2>
            <div className="space-y-3">
              {data.funnel.map((row) => (
                <div key={row.status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-slate-300">{row.status}</span>
                    <span className="text-slate-500">{pct(row.count, data.totalOpportunities)}</span>
                  </div>
                  <Bar value={row.count} max={data.totalOpportunities} />
                </div>
              ))}
            </div>
          </div>

          {/* By source */}
          {data.bySource.length > 0 && (
            <div className="card space-y-4">
              <h2 className="text-lg font-bold">Performance par source</h2>
              <div className="space-y-4">
                {data.bySource.map((row) => (
                  <div key={row.source}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold capitalize">{row.source}</span>
                      <span className="text-sm text-slate-400">
                        {row.won} gagnés / {row.total} — {pct(row.won, row.total)}
                      </span>
                    </div>
                    <Bar value={row.won} max={row.total} color="bg-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score buckets */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold">Taux de gain par score</h2>
            <div className="space-y-4">
              {data.scoreBuckets.map((b) => (
                <div key={b.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-300">{b.label}</span>
                    <span className="text-sm text-slate-400">
                      {b.won} / {b.total} — {pct(b.won, b.total)}
                    </span>
                  </div>
                  <Bar value={b.won} max={b.total || 1} color="bg-cyan-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Backlinks */}
          {data.backlinkStatuses.length > 0 && (
            <div className="card space-y-4">
              <h2 className="text-lg font-bold">Statuts des backlinks</h2>
              <div className="grid gap-3 md:grid-cols-4">
                {data.backlinkStatuses.map((b) => (
                  <div key={b.status} className="rounded-xl border border-slate-800 p-4 text-center">
                    <p className="text-sm capitalize text-slate-400">{b.status}</p>
                    <p className="text-3xl font-bold">{b.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
