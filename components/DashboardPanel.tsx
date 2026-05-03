"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Opportunity } from "@/lib/supabase/types";

type Stats = {
  articles: number;
  backlinks: number;
  campaigns: number;
  opportunities: number;
};

const emptyStats: Stats = {
  articles: 0,
  backlinks: 0,
  campaigns: 0,
  opportunities: 0,
};

export default function DashboardPanel() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [stats, setStats] = useState(emptyStats);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState("");

  const averageScore = useMemo(() => {
    if (!opportunities.length) return "-";
    const total = opportunities.reduce(
      (sum, opportunity) => sum + (opportunity.opportunity_score || 0),
      0
    );
    return Math.round(total / opportunities.length);
  }, [opportunities]);

  const countTable = useCallback(async (table: keyof Stats) => {
    if (!supabase) return 0;

    const { count, error: countError } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;
    return count || 0;
  }, [supabase]);

  const loadDashboard = useCallback(async () => {
    if (!supabase || !user) return;

    setError("");

    try {
      const [articles, backlinks, campaigns, opportunitiesCount, opportunitiesResult] =
        await Promise.all([
          countTable("articles"),
          countTable("backlinks"),
          countTable("campaigns"),
          countTable("opportunities"),
          supabase
            .from("opportunities")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (opportunitiesResult.error) {
        throw opportunitiesResult.error;
      }

      setStats({
        articles,
        backlinks,
        campaigns,
        opportunities: opportunitiesCount,
      });
      setOpportunities((opportunitiesResult.data || []) as Opportunity[]);
    } catch (dashboardError) {
      setError(
        dashboardError instanceof Error
          ? dashboardError.message
          : "Chargement impossible"
      );
    }
  }, [countTable, supabase, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!configured) {
    return (
      <div className="card text-sm text-slate-400">
        Configure Supabase dans `.env.local` pour activer le dashboard.
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="card text-sm text-slate-400">
        Connecte-toi dans Settings pour afficher tes statistiques.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Opportunites", stats.opportunities],
          ["Campagnes", stats.campaigns],
          ["Articles", stats.articles],
          ["Backlinks", stats.backlinks],
        ].map(([label, value]) => (
          <div className="card" key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Resume pipeline</h2>
            <p className="text-sm text-slate-400">
              Score moyen des opportunites : {averageScore}
            </p>
          </div>
          <button className="btn inline-flex items-center gap-2" onClick={loadDashboard}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="space-y-3">
          {opportunities.map((opportunity) => (
            <div className="rounded-xl border border-slate-800 p-4" key={opportunity.id}>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <a href={opportunity.url} target="_blank" rel="noreferrer" className="font-semibold">
                  {opportunity.title}
                </a>
                <span className="badge">
                  {opportunity.status || "new"} - {opportunity.opportunity_score || 0}/100
                </span>
              </div>
            </div>
          ))}

          {opportunities.length === 0 && (
            <p className="text-sm text-slate-400">
              Aucune opportunite sauvegardee pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
