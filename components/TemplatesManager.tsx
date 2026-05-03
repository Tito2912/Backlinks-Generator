"use client";

import { Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { ReplyTemplate } from "@/lib/supabase/types";

const emptyForm = { name: "", platform: "reddit", prompt: "" };

export default function TemplatesManager() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTemplates = useCallback(async () => {
    if (!supabase || !user) return;

    const { data, error: loadError } = await supabase
      .from("reply_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setTemplates((data || []) as ReplyTemplate[]);
  }, [supabase, user]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function saveTemplate() {
    if (!supabase || !user || !form.name || !form.prompt) return;

    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      platform: form.platform,
      prompt: form.prompt,
      user_id: user.id,
    };

    const result = editingId
      ? await supabase.from("reply_templates").update(payload).eq("id", editingId)
      : await supabase.from("reply_templates").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await loadTemplates();
  }

  function editTemplate(template: ReplyTemplate) {
    setEditingId(template.id);
    setForm({
      name: template.name,
      platform: template.platform,
      prompt: template.prompt,
    });
  }

  async function deleteTemplate(id: string) {
    if (!supabase) return;

    const { error: deleteError } = await supabase
      .from("reply_templates")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadTemplates();
  }

  if (!configured) {
    return (
      <div className="card text-sm text-slate-400">
        Configure Supabase dans `.env.local` pour activer les templates.
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="card text-sm text-slate-400">
        Connecte-toi dans Settings pour gerer tes templates.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            {editingId ? "Modifier le template" : "Nouveau template"}
          </h2>
          <p className="text-sm text-slate-400">
            Prompts reutilisables pour tes reponses manuelles.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nom"
          />
          <select
            className="input"
            value={form.platform}
            onChange={(event) =>
              setForm({ ...form, platform: event.target.value })
            }
          >
            <option value="reddit">reddit</option>
            <option value="google">google</option>
            <option value="forum">forum</option>
            <option value="quora">quora</option>
          </select>
          <textarea
            className="input min-h-40 md:col-span-2"
            value={form.prompt}
            onChange={(event) =>
              setForm({ ...form, prompt: event.target.value })
            }
            placeholder="Prompt ou consignes de reponse"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn inline-flex items-center gap-2"
            disabled={saving || !form.name || !form.prompt}
            onClick={saveTemplate}
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
          <h2 className="text-xl font-bold">Templates</h2>
          <button className="btn inline-flex items-center gap-2" onClick={loadTemplates}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        <div className="space-y-3">
          {templates.map((template) => (
            <div className="rounded-xl border border-slate-800 p-4" key={template.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-sm text-slate-400">{template.platform}</p>
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-slate-300">
                    {template.prompt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn inline-flex items-center gap-2" onClick={() => editTemplate(template)}>
                    <Pencil size={16} />
                    Modifier
                  </button>
                  <button className="btn inline-flex items-center gap-2" onClick={() => deleteTemplate(template.id)}>
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <p className="text-sm text-slate-400">Aucun template pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
