"use client";

import { Download, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { rowsToCsv } from "@/lib/csv";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Opportunity } from "@/lib/supabase/types";

const statuses = ["new", "replied", "submitted", "won", "lost", "ignored"];

export default function OpportunitiesManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [error, setError] = useState("");

  const filtered = useMemo(
    () =>
      opportunities.filter((opportunity) => {
        const statusMatch =
          statusFilter === "all" || opportunity.status === statusFilter;
        const sourceMatch =
          sourceFilter === "all" || opportunity.source === sourceFilter;
        return statusMatch && sourceMatch;
      }),
    [opportunities, sourceFilter, statusFilter]
  );

  const loadOpportunities = useCallback(async () => {
    if (!supabase || !user) return;

    const { data, error: loadError } = await supabase
      .from("opportunities")
      .select("*")
      .order("opportunity_score", { ascending: false })
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setOpportunities((data || []) as Opportunity[]);
  }, [supabase, user]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  async function updateStatus(id: string, status: string) {
    if (!supabase) return;

    const { error: updateError } = await supabase
      .from("opportunities")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadOpportunities();
  }

  async function updateNotes(id: string, notes: string) {
    if (!supabase) return;

    const { error: updateError } = await supabase
      .from("opportunities")
      .update({ notes })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
  }

  async function deleteOpportunity(id: string) {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadOpportunities();
  }

  function exportCsv() {
    const csv = rowsToCsv(
      [
        "source",
        "title",
        "url",
        "target_article_url",
        "score",
        "status",
        "notes",
      ],
      filtered.map((opportunity) => [
        opportunity.source,
        opportunity.title,
        opportunity.url,
        opportunity.target_article_url,
        opportunity.opportunity_score,
        opportunity.status,
        opportunity.notes,
      ])
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "opportunities.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!configured) {
    return (
      <div className="card text-sm text-slate-400">
        Configure Supabase pour sauvegarder et suivre les opportunites.
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="card text-sm text-slate-400">
        Connecte-toi dans Settings pour voir tes opportunites sauvegardees.
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Opportunites sauvegardees</h2>
          <p className="text-sm text-slate-400">
            Pipeline manuel de prospection, reponse et backlink gagne.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn inline-flex items-center gap-2" onClick={loadOpportunities}>
            <RefreshCw size={16} />
            Actualiser
          </button>
          <button className="btn inline-flex items-center gap-2" onClick={exportCsv}>
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <select
          className="input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Tous les statuts</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
        >
          <option value="all">Toutes les sources</option>
          <option value="reddit">reddit</option>
          <option value="google">google</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="space-y-3">
        {filtered.map((opportunity) => (
          <div className="rounded-xl border border-slate-800 p-4" key={opportunity.id}>
            <div className="flex flex-col gap-3 md:flex-row md:justify-between">
              <div className="min-w-0">
                <a href={opportunity.url} target="_blank" rel="noreferrer" className="font-semibold">
                  {opportunity.title}
                </a>
                <p className="mt-1 text-sm text-slate-400">
                  {opportunity.source} - Score {opportunity.opportunity_score || 0}
                </p>
                {opportunity.target_article_url && (
                  <p className="mt-1 truncate text-xs text-cyan-200">
                    {opportunity.target_article_url}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="input min-w-36"
                  value={opportunity.status || "new"}
                  onChange={(event) =>
                    updateStatus(opportunity.id, event.target.value)
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  className="btn inline-flex items-center gap-2"
                  onClick={() => deleteOpportunity(opportunity.id)}
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>

            <textarea
              className="input mt-3 min-h-20"
              defaultValue={opportunity.notes || ""}
              onBlur={(event) => updateNotes(opportunity.id, event.target.value)}
              placeholder="Notes internes"
            />
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400">
            Aucune opportunite ne correspond aux filtres.
          </p>
        )}
      </div>
    </div>
  );
}
