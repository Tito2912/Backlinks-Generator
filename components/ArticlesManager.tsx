"use client";

import { Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Article, Project } from "@/lib/supabase/types";

const emptyForm = { project_id: "", title: "", url: "", keyword: "" };

export default function ArticlesManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!supabase || !user) return;

    const [articlesResult, projectsResult] = await Promise.all([
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("name", { ascending: true }),
    ]);

    if (articlesResult.error) {
      setError(articlesResult.error.message);
      return;
    }

    if (projectsResult.error) {
      setError(projectsResult.error.message);
      return;
    }

    setArticles((articlesResult.data || []) as Article[]);
    setProjects((projectsResult.data || []) as Project[]);
  }, [supabase, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveArticle() {
    if (!supabase || !user || !form.title || !form.url) return;

    setSaving(true);
    setError("");

    const payload = {
      project_id: form.project_id || null,
      title: form.title,
      url: form.url,
      keyword: form.keyword || null,
      user_id: user.id,
    };

    const result = editingId
      ? await supabase.from("articles").update(payload).eq("id", editingId)
      : await supabase.from("articles").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await loadData();
  }

  function editArticle(article: Article) {
    setEditingId(article.id);
    setForm({
      project_id: article.project_id || "",
      title: article.title,
      url: article.url,
      keyword: article.keyword || "",
    });
  }

  async function deleteArticle(id: string) {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("articles")
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
        Configure Supabase dans `.env.local` pour activer les articles.
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="card text-sm text-slate-400">
        Connecte-toi dans Settings pour gerer tes articles.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            {editingId ? "Modifier l&apos;article" : "Nouvel article"}
          </h2>
          <p className="text-sm text-slate-400">
            URL cible que les reponses peuvent mentionner.
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
            value={form.keyword}
            onChange={(event) =>
              setForm({ ...form, keyword: event.target.value })
            }
            placeholder="Mot-cle principal"
          />
          <input
            className="input"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Titre"
          />
          <input
            className="input"
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            placeholder="https://monsite.com/article"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn inline-flex items-center gap-2"
            disabled={saving || !form.title || !form.url}
            onClick={saveArticle}
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
          <h2 className="text-xl font-bold">Articles</h2>
          <button className="btn inline-flex items-center gap-2" onClick={loadData}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        <div className="space-y-3">
          {articles.map((article) => (
            <div className="rounded-xl border border-slate-800 p-4" key={article.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <a href={article.url} target="_blank" rel="noreferrer" className="font-semibold">
                    {article.title}
                  </a>
                  <p className="text-sm text-slate-400">
                    {projectName(article.project_id)}
                    {article.keyword ? ` - ${article.keyword}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn inline-flex items-center gap-2" onClick={() => editArticle(article)}>
                    <Pencil size={16} />
                    Modifier
                  </button>
                  <button className="btn inline-flex items-center gap-2" onClick={() => deleteArticle(article.id)}>
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {articles.length === 0 && (
            <p className="text-sm text-slate-400">Aucun article pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
