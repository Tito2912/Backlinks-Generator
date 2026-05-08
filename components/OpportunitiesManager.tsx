"use client";

import { ChevronLeft, ChevronRight, Download, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { rowsToCsv } from "@/lib/csv";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Opportunity } from "@/lib/supabase/types";

const statuses = ["new", "replied", "submitted", "won", "lost", "ignored"];
const PAGE_SIZE = 25;

export default function OpportunitiesManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const loadOpportunities = useCallback(async (currentPage = 0, status = statusFilter, source = sourceFilter) => {
    if (!supabase || !user) return;

    let query = supabase
      .from("opportunities")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("opportunity_score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (status !== "all") query = query.eq("status", status);
    if (source !== "all") query = query.eq("source", source);

    const { data, count, error: loadError } = await query;

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setOpportunities((data || []) as Opportunity[]);
    setTotal(count || 0);
  }, [supabase, user, statusFilter, sourceFilter]);

  useEffect(() => {
    loadOpportunities(page, statusFilter, sourceFilter);
  }, [loadOpportunities, page, statusFilter, sourceFilter]);

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(0);
    loadOpportunities(0, value, sourceFilter);
  }

  function handleSourceFilter(value: string) {
    setSourceFilter(value);
    setPage(0);
    loadOpportunities(0, statusFilter, value);
  }

  async function updateStatus(id: string, status: string) {
    if (!supabase) return;

    const { error: updateError } = await supabase
      .from("opportunities")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user!.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadOpportunities(page);
  }

  async function updateNotes(id: string, notes: string) {
    if (!supabase) return;

    await supabase
      .from("opportunities")
      .update({ notes })
      .eq("id", id)
      .eq("user_id", user!.id);
  }

  async function deleteOpportunity(id: string) {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const newPage = opportunities.length === 1 && page > 0 ? page - 1 : page;
    setPage(newPage);
    await loadOpportunities(newPage);
  }

  function exportCsv() {
    const csv = rowsToCsv(
      ["source", "title", "url", "target_article_url", "score", "status", "notes"],
      opportunities.map((opportunity) => [
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

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
          <button className="btn inline-flex items-center gap-2" onClick={() => loadOpportunities(page)}>
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
          onChange={(event) => handleStatusFilter(event.target.value)}
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
          onChange={(event) => handleSourceFilter(event.target.value)}
        >
          <option value="all">Toutes les sources</option>
          <option value="reddit">reddit</option>
          <option value="google">google</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="space-y-3">
        {opportunities.map((opportunity) => (
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
                  onChange={(event) => updateStatus(opportunity.id, event.target.value)}
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

        {opportunities.length === 0 && (
          <p className="text-sm text-slate-400">
            Aucune opportunite ne correspond aux filtres.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}
          </p>
          <div className="flex gap-2">
            <button
              className="btn inline-flex items-center gap-1"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            <button
              className="btn inline-flex items-center gap-1"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
