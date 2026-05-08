"use client";

import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Download, RefreshCw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { rowsToCsv } from "@/lib/csv";
import { useSite } from "@/contexts/SiteContext";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Opportunity } from "@/lib/supabase/types";

const statuses = ["new", "replied", "submitted", "won", "lost", "ignored"];
const PAGE_SIZE = 25;

export default function OpportunitiesManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const { activeSiteId } = useSite();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("won");
  const [expandedReply, setExpandedReply] = useState<string | null>(null);
  const [error, setError] = useState("");

  const buildQuery = useCallback(() => {
    if (!supabase || !user) return null;
    let q = supabase
      .from("opportunities")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("opportunity_score", { ascending: false })
      .order("created_at", { ascending: false });
    if (activeSiteId) q = q.eq("project_id", activeSiteId);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (sourceFilter !== "all") q = q.eq("source", sourceFilter);
    if (searchQuery.trim()) q = q.ilike("title", `%${searchQuery.trim()}%`);
    return q;
  }, [supabase, user, activeSiteId, statusFilter, sourceFilter, searchQuery]);

  const loadOpportunities = useCallback(async (currentPage = 0) => {
    const q = buildQuery();
    if (!q) return;

    const { data, count, error: loadError } = await q.range(
      currentPage * PAGE_SIZE,
      (currentPage + 1) * PAGE_SIZE - 1
    );

    if (loadError) { setError(loadError.message); return; }
    setOpportunities((data || []) as Opportunity[]);
    setTotal(count || 0);
    setSelected(new Set());
  }, [buildQuery]);

  useEffect(() => {
    loadOpportunities(page);
  }, [loadOpportunities, page]);

  useEffect(() => {
    setPage(0);
    loadOpportunities(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, searchQuery, activeSiteId]);

  async function updateStatus(id: string, status: string) {
    if (!supabase || !user) return;
    await supabase.from("opportunities").update({ status }).eq("id", id).eq("user_id", user.id);
    await loadOpportunities(page);
  }

  async function updateNotes(id: string, notes: string) {
    if (!supabase || !user) return;
    await supabase.from("opportunities").update({ notes }).eq("id", id).eq("user_id", user.id);
  }

  async function deleteOpportunity(id: string) {
    if (!supabase || !user) return;
    const { error: e } = await supabase.from("opportunities").delete().eq("id", id).eq("user_id", user.id);
    if (e) { setError(e.message); return; }
    const newPage = opportunities.length === 1 && page > 0 ? page - 1 : page;
    setPage(newPage);
    await loadOpportunities(newPage);
  }

  async function applyBulkStatus() {
    if (!supabase || !user || selected.size === 0) return;
    await supabase
      .from("opportunities")
      .update({ status: bulkStatus })
      .in("id", [...selected])
      .eq("user_id", user.id);
    await loadOpportunities(page);
  }

  async function deleteBulk() {
    if (!supabase || !user || selected.size === 0) return;
    await supabase.from("opportunities").delete().in("id", [...selected]).eq("user_id", user.id);
    const newPage = opportunities.length === selected.size && page > 0 ? page - 1 : page;
    setPage(newPage);
    await loadOpportunities(newPage);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === opportunities.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(opportunities.map((o) => o.id)));
    }
  }

  function exportCsv() {
    const csv = rowsToCsv(
      ["source", "title", "url", "target_article_url", "score", "status", "notes"],
      opportunities.map((o) => [o.source, o.title, o.url, o.target_article_url, o.opportunity_score, o.status, o.notes])
    );
    download(csv, "opportunities.csv", "text/csv;charset=utf-8");
  }

  function exportJson() {
    const json = JSON.stringify(opportunities, null, 2);
    download(json, "opportunities.json", "application/json");
  }

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!configured) return <div className="card text-sm text-slate-400">Configure Supabase pour sauvegarder les opportunites.</div>;
  if (loading) return <div className="card text-sm text-slate-400">Chargement...</div>;
  if (!user) return <div className="card text-sm text-slate-400">Connecte-toi dans Settings.</div>;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Opportunites sauvegardees</h2>
          <p className="text-sm text-slate-400">Pipeline manuel de prospection, reponse et backlink gagne.</p>
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
          <button className="btn inline-flex items-center gap-2" onClick={exportJson}>
            <Download size={16} />
            JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input
            className="input pl-8"
            placeholder="Rechercher par titre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="all">Toutes les sources</option>
          <option value="reddit">reddit</option>
          <option value="google">google</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3">
          <span className="text-sm text-slate-300">{selected.size} sélectionnée(s)</span>
          <select
            className="input w-auto"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn text-sm" onClick={applyBulkStatus}>Appliquer</button>
          <button
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            onClick={deleteBulk}
          >
            Supprimer
          </button>
          <button className="text-sm text-slate-400 hover:text-slate-200" onClick={() => setSelected(new Set())}>
            Annuler
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      {/* Table header */}
      {opportunities.length > 0 && (
        <div className="flex items-center gap-3 px-1 text-xs text-slate-500">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={selected.size === opportunities.length && opportunities.length > 0}
            onChange={toggleSelectAll}
          />
          <span>Tout sélectionner</span>
        </div>
      )}

      <div className="space-y-3">
        {opportunities.map((opportunity) => (
          <div className="rounded-xl border border-slate-800 p-4" key={opportunity.id}>
            <div className="flex flex-col gap-3 md:flex-row md:justify-between">
              <div className="flex min-w-0 gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 flex-shrink-0"
                  checked={selected.has(opportunity.id)}
                  onChange={() => toggleSelect(opportunity.id)}
                />
                <div className="min-w-0">
                  <a href={opportunity.url} target="_blank" rel="noreferrer" className="font-semibold">
                    {opportunity.title}
                  </a>
                  <p className="mt-1 text-sm text-slate-400">
                    {opportunity.source} — Score {opportunity.opportunity_score || 0}
                  </p>
                  {opportunity.target_article_url && (
                    <p className="mt-1 truncate text-xs text-cyan-200">{opportunity.target_article_url}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="input min-w-36"
                  value={opportunity.status || "new"}
                  onChange={(e) => updateStatus(opportunity.id, e.target.value)}
                >
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn inline-flex items-center gap-2" onClick={() => deleteOpportunity(opportunity.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Reply preview */}
            {opportunity.reply && (
              <div className="mt-3">
                <button
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                  onClick={() => setExpandedReply(expandedReply === opportunity.id ? null : opportunity.id)}
                >
                  {expandedReply === opportunity.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Réponse générée
                </button>
                {expandedReply === opportunity.id && (
                  <p className="mt-2 rounded-lg bg-slate-800 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                    {opportunity.reply}
                  </p>
                )}
              </div>
            )}

            <textarea
              className="input mt-3 min-h-16"
              defaultValue={opportunity.notes || ""}
              onBlur={(e) => updateNotes(opportunity.id, e.target.value)}
              placeholder="Notes internes"
            />
          </div>
        ))}

        {opportunities.length === 0 && (
          <p className="text-sm text-slate-400">Aucune opportunite ne correspond aux filtres.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}
          </p>
          <div className="flex gap-2">
            <button className="btn inline-flex items-center gap-1" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />Précédent
            </button>
            <button className="btn inline-flex items-center gap-1" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant<ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
