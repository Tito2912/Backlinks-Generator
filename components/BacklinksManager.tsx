"use client";

import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Save, SearchCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Backlink, Opportunity, Project } from "@/lib/supabase/types";

const emptyForm = {
  anchor_text: "",
  opportunity_id: "",
  project_id: "",
  source_url: "",
  status: "submitted",
  target_url: "",
};

const statuses = ["submitted", "won", "lost", "pending"];
const PAGE_SIZE = 25;

export default function BacklinksManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const loadData = useCallback(async (currentPage = 0) => {
    if (!supabase || !user) return;

    const [backlinksResult, opportunitiesResult, projectsResult] = await Promise.all([
      supabase
        .from("backlinks")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1),
      supabase.from("opportunities").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("projects").select("*").eq("user_id", user.id).order("name", { ascending: true }),
    ]);

    if (backlinksResult.error) {
      setError(backlinksResult.error.message);
      return;
    }

    if (opportunitiesResult.error) {
      setError(opportunitiesResult.error.message);
      return;
    }

    if (projectsResult.error) {
      setError(projectsResult.error.message);
      return;
    }

    setBacklinks((backlinksResult.data || []) as Backlink[]);
    setTotal(backlinksResult.count || 0);
    setOpportunities((opportunitiesResult.data || []) as Opportunity[]);
    setProjects((projectsResult.data || []) as Project[]);
  }, [supabase, user]);

  useEffect(() => {
    loadData(page);
  }, [loadData, page]);

  async function saveBacklink() {
    if (!supabase || !user || !form.source_url || !form.target_url) return;

    setSaving(true);
    setError("");

    const payload = {
      anchor_text: form.anchor_text || null,
      opportunity_id: form.opportunity_id || null,
      project_id: form.project_id || null,
      source_url: form.source_url,
      status: form.status,
      target_url: form.target_url,
      user_id: user.id,
    };

    const result = editingId
      ? await supabase.from("backlinks").update(payload).eq("id", editingId)
      : await supabase.from("backlinks").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await loadData(page);
  }

  function editBacklink(backlink: Backlink) {
    setEditingId(backlink.id);
    setForm({
      anchor_text: backlink.anchor_text || "",
      opportunity_id: backlink.opportunity_id || "",
      project_id: backlink.project_id || "",
      source_url: backlink.source_url,
      status: backlink.status || "submitted",
      target_url: backlink.target_url,
    });
  }

  async function deleteBacklink(id: string) {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("backlinks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const newPage = backlinks.length === 1 && page > 0 ? page - 1 : page;
    setPage(newPage);
    await loadData(newPage);
  }

  async function checkBacklink(backlink: Backlink) {
    if (!supabase) return;

    setCheckingId(backlink.id);
    setError("");

    try {
      const response = await fetch("/api/backlinks/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: backlink.source_url,
          targetUrl: backlink.target_url,
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Verification impossible");
      }

      const { error: updateError } = await supabase
        .from("backlinks")
        .update({
          last_checked_at: json.checkedAt,
          status: json.status,
        })
        .eq("id", backlink.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await loadData(page);
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Verification impossible");
    } finally {
      setCheckingId(null);
    }
  }

  function opportunityTitle(id: string | null) {
    return opportunities.find((opportunity) => opportunity.id === id)?.title || "Sans opportunite";
  }

  if (!configured) {
    return (
      <div className="card text-sm text-slate-400">
        Configure Supabase dans `.env.local` pour activer le suivi backlinks.
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="card text-sm text-slate-400">
        Connecte-toi dans Settings pour suivre tes backlinks.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            {editingId ? "Modifier le backlink" : "Nouveau backlink"}
          </h2>
          <p className="text-sm text-slate-400">
            Source publiee, cible et statut de validation.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="input"
            value={form.project_id}
            onChange={(event) =>
              setForm({ ...form, project_id: event.target.value })
            }
          >
            <option value="">Sans projet</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={form.opportunity_id}
            onChange={(event) =>
              setForm({ ...form, opportunity_id: event.target.value })
            }
          >
            <option value="">Sans opportunite</option>
            {opportunities.map((opportunity) => (
              <option key={opportunity.id} value={opportunity.id}>
                {opportunity.title}
              </option>
            ))}
          </select>
          <input
            className="input"
            value={form.source_url}
            onChange={(event) =>
              setForm({ ...form, source_url: event.target.value })
            }
            placeholder="URL ou le lien est poste"
          />
          <input
            className="input"
            value={form.target_url}
            onChange={(event) =>
              setForm({ ...form, target_url: event.target.value })
            }
            placeholder="URL cible"
          />
          <input
            className="input"
            value={form.anchor_text}
            onChange={(event) =>
              setForm({ ...form, anchor_text: event.target.value })
            }
            placeholder="Ancre"
          />
          <select
            className="input"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn inline-flex items-center gap-2"
            disabled={saving || !form.source_url || !form.target_url}
            onClick={saveBacklink}
          >
            <Save size={16} />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          {editingId && (
            <button
              className="btn"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Annuler
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Backlinks</h2>
          <button className="btn inline-flex items-center gap-2" onClick={loadData}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        {Math.ceil(total / PAGE_SIZE) > 1 && (
          <div className="flex items-center justify-between">
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
                disabled={page + 1 >= Math.ceil(total / PAGE_SIZE)}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {backlinks.map((backlink) => (
            <div className="rounded-xl border border-slate-800 p-4" key={backlink.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <a href={backlink.source_url} target="_blank" rel="noreferrer" className="font-semibold">
                    {backlink.source_url}
                  </a>
                  <p className="truncate text-sm text-slate-400">
                    {opportunityTitle(backlink.opportunity_id)} - {backlink.status}
                  </p>
                  <p className="truncate text-xs text-cyan-200">{backlink.target_url}</p>
                  {backlink.last_checked_at && (
                    <p className="text-xs text-slate-500">
                      Verifie le {new Date(backlink.last_checked_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn inline-flex items-center gap-2" onClick={() => checkBacklink(backlink)}>
                    <SearchCheck size={16} />
                    {checkingId === backlink.id ? "Check..." : "Verifier"}
                  </button>
                  <button className="btn inline-flex items-center gap-2" onClick={() => editBacklink(backlink)}>
                    <Pencil size={16} />
                    Modifier
                  </button>
                  <button className="btn inline-flex items-center gap-2" onClick={() => deleteBacklink(backlink.id)}>
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {backlinks.length === 0 && (
            <p className="text-sm text-slate-400">Aucun backlink pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
