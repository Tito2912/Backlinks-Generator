"use client";

import { Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Project } from "@/lib/supabase/types";

const emptyForm = { name: "", domain: "", niche: "" };

export default function ProjectsManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    if (!supabase || !user) return;

    const { data, error: loadError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setProjects((data || []) as Project[]);
  }, [supabase, user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function saveProject() {
    if (!supabase || !user || !form.name || !form.domain) return;

    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      domain: form.domain,
      niche: form.niche || null,
      user_id: user.id,
    };

    const result = editingId
      ? await supabase.from("projects").update(payload).eq("id", editingId)
      : await supabase.from("projects").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await loadProjects();
  }

  function editProject(project: Project) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      domain: project.domain,
      niche: project.niche || "",
    });
  }

  async function deleteProject(id: string) {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadProjects();
  }

  if (!configured) {
    return (
      <div className="card text-sm text-slate-400">
        Configure Supabase dans `.env.local` pour activer les projets.
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="card text-sm text-slate-400">
        Connecte-toi dans Settings pour gerer tes projets.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            {editingId ? "Modifier le projet" : "Nouveau projet"}
          </h2>
          <p className="text-sm text-slate-400">
            Domaine, niche et contexte de linking.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nom du projet"
          />
          <input
            className="input"
            value={form.domain}
            onChange={(event) =>
              setForm({ ...form, domain: event.target.value })
            }
            placeholder="https://monsite.com"
          />
          <input
            className="input"
            value={form.niche}
            onChange={(event) => setForm({ ...form, niche: event.target.value })}
            placeholder="Niche"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn inline-flex items-center gap-2"
            disabled={saving || !form.name || !form.domain}
            onClick={saveProject}
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
          <h2 className="text-xl font-bold">Projets</h2>
          <button
            className="btn inline-flex items-center gap-2"
            onClick={loadProjects}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <div
              className="rounded-xl border border-slate-800 p-4"
              key={project.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-slate-400">
                    {project.domain}
                    {project.niche ? ` - ${project.niche}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn inline-flex items-center gap-2"
                    onClick={() => editProject(project)}
                  >
                    <Pencil size={16} />
                    Modifier
                  </button>
                  <button
                    className="btn inline-flex items-center gap-2"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <p className="text-sm text-slate-400">Aucun projet pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
