"use client";

import { Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Campaign, Project } from "@/lib/supabase/types";

const emptyForm = {
  project_id: "",
  name: "",
  keywords: "",
  sources: ["reddit", "google"],
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CampaignsManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const { activeSiteId } = useSite();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!supabase || !user) return;

    let campQ = supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (activeSiteId) campQ = campQ.eq("project_id", activeSiteId);

    const [campaignsResult, projectsResult] = await Promise.all([
      campQ,
      supabase.from("projects").select("*").eq("user_id", user.id).order("name", { ascending: true }),
    ]);

    if (campaignsResult.error) {
      setError(campaignsResult.error.message);
      return;
    }

    if (projectsResult.error) {
      setError(projectsResult.error.message);
      return;
    }

    setCampaigns((campaignsResult.data || []) as Campaign[]);
    setProjects((projectsResult.data || []) as Project[]);
  }, [supabase, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveCampaign() {
    if (!supabase || !user || !form.name) return;

    setSaving(true);
    setError("");

    const payload = {
      project_id: form.project_id || null,
      name: form.name,
      keywords: splitList(form.keywords),
      sources: form.sources,
      user_id: user.id,
    };

    const result = editingId
      ? await supabase.from("campaigns").update(payload).eq("id", editingId)
      : await supabase.from("campaigns").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await loadData();
  }

  function editCampaign(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      project_id: campaign.project_id || "",
      name: campaign.name,
      keywords: (campaign.keywords || []).join(", "),
      sources: campaign.sources?.length ? campaign.sources : ["reddit", "google"],
    });
  }

  function toggleSource(source: string) {
    setForm((current) => ({
      ...current,
      sources: current.sources.includes(source)
        ? current.sources.filter((item) => item !== source)
        : [...current.sources, source],
    }));
  }

  async function deleteCampaign(id: string) {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadData();
  }

  function projectName(projectId: string | null) {
    return projects.find((project) => project.id === projectId)?.name || "Sans projet";
  }

  if (!configured) {
    return (
      <div className="card text-sm text-slate-400">
        Configure Supabase dans `.env.local` pour activer les campagnes.
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="card text-sm text-slate-400">
        Connecte-toi dans Settings pour gerer tes campagnes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            {editingId ? "Modifier la campagne" : "Nouvelle campagne"}
          </h2>
          <p className="text-sm text-slate-400">
            Mots-cles et sources a surveiller.
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
          <input
            className="input"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nom de la campagne"
          />
          <input
            className="input md:col-span-2"
            value={form.keywords}
            onChange={(event) =>
              setForm({ ...form, keywords: event.target.value })
            }
            placeholder="make money with ai, best ai tools"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {["reddit", "google"].map((source) => (
            <label
              key={source}
              className="flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={form.sources.includes(source)}
                onChange={() => toggleSource(source)}
              />
              {source}
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn inline-flex items-center gap-2"
            disabled={saving || !form.name || form.sources.length === 0}
            onClick={saveCampaign}
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
          <h2 className="text-xl font-bold">Campagnes</h2>
          <button className="btn inline-flex items-center gap-2" onClick={loadData}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div className="rounded-xl border border-slate-800 p-4" key={campaign.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{campaign.name}</p>
                  <p className="text-sm text-slate-400">
                    {projectName(campaign.project_id)} - {(campaign.sources || []).join(", ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(campaign.keywords || []).join(", ") || "Aucun mot-cle"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn inline-flex items-center gap-2" onClick={() => editCampaign(campaign)}>
                    <Pencil size={16} />
                    Modifier
                  </button>
                  <button className="btn inline-flex items-center gap-2" onClick={() => deleteCampaign(campaign.id)}>
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <p className="text-sm text-slate-400">
              Aucune campagne pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
