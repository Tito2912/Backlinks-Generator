"use client";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { suggestTargetLink } from "@/lib/linkSuggestions";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Campaign, Project } from "@/lib/supabase/types";

type Item = {
  source: string;
  title: string;
  url: string;
  snippet?: string;
  opportunity_score: number;
  comments?: number;
  source_score?: number;
};

function sortByScore(items: Item[]) {
  return [...items].sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
}

export default function SearchPanel() {
  const { configured, supabase, user } = useSupabaseSession();
  const { activeSiteId } = useSite();
  const [query, setQuery] = useState("make money with ai");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<"reddit" | "google" | null>(null);
  const [error, setError] = useState("");
  const [lastSource, setLastSource] = useState<"reddit" | "google" | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [savingUrl, setSavingUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [saveError, setSaveError] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (!supabase || !user) return;

    const [projectsResult, campaignsResult] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", user.id).order("name", { ascending: true }),
      supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (projectsResult.error) {
      setSaveError(projectsResult.error.message);
      return;
    }

    if (campaignsResult.error) {
      setSaveError(campaignsResult.error.message);
      return;
    }

    setProjects((projectsResult.data || []) as Project[]);
    setCampaigns((campaignsResult.data || []) as Campaign[]);

    if (activeSiteId) {
      setSelectedProjectId(activeSiteId);
    }
  }, [supabase, user, activeSiteId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  async function run(source: "reddit" | "google") {
    setLoading(source);
    setError("");
    setItems([]);
    setLastSource(source);

    try {
      const res = await fetch(`/api/search/${source}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Erreur ${res.status}`);
      }

      setItems(sortByScore(json.data || []));
      setSavedUrl("");
    } catch (err: any) {
      setError(err?.message || "Erreur pendant la recherche");
    } finally {
      setLoading(null);
    }
  }

  async function saveOpportunity(
    item: Item,
    targetArticleUrl: string,
    reply: string
  ) {
    if (!supabase || !user) return;

    setSavingUrl(item.url);
    setSavedUrl("");
    setSaveError("");

    const { error: upsertError } = await supabase.from("opportunities").upsert(
      {
        campaign_id: selectedCampaignId || null,
        opportunity_score: item.opportunity_score || 0,
        project_id: selectedProjectId || null,
        reply: reply || null,
        snippet: item.snippet || null,
        source: item.source,
        status: "new",
        target_article_url: targetArticleUrl,
        title: item.title,
        url: item.url,
        user_id: user.id,
      },
      { onConflict: "user_id,url" }
    );

    setSavingUrl("");

    if (upsertError) {
      setSaveError(upsertError.message);
      return;
    }

    setSavedUrl(item.url);
  }

  const scoreLabel = useMemo(() => {
    if (!items.length) return "";
    const best = items[0]?.opportunity_score || 0;
    return `Meilleure opportunité : ${best}/100`;
  }, [items]);

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Recherche d&apos;opportunités</h2>
          <p className="text-sm text-slate-400">Reddit passe par Google/SerpAPI pour éviter les blocages 403.</p>
        </div>
        {scoreLabel && <span className="badge">{scoreLabel}</span>}
      </div>

      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ex: make money with ai"
      />

      <div className="flex flex-wrap gap-3">
        <button className="btn" onClick={() => run("reddit")} disabled={Boolean(loading)}>
          {loading === "reddit" ? "Recherche Reddit..." : "Chercher Reddit"}
        </button>
        <button className="btn" onClick={() => run("google")} disabled={Boolean(loading)}>
          {loading === "google" ? "Recherche Google..." : "Chercher Google"}
        </button>
      </div>

      {configured && user && (
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="input"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
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
            value={selectedCampaignId}
            onChange={(event) => setSelectedCampaignId(event.target.value)}
          >
            <option value="">Sans campagne</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {configured && !user && (
        <p className="text-sm text-slate-400">
          Connecte-toi dans Settings pour sauvegarder les opportunites.
        </p>
      )}

      {!configured && (
        <p className="text-sm text-slate-400">
          Configure Supabase pour sauvegarder les opportunites.
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {saveError && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {saveError}
        </div>
      )}

      {!loading && !error && lastSource && items.length === 0 && (
        <p className="text-sm text-slate-400">
          Aucun résultat trouvé pour {lastSource === "reddit" ? "Reddit" : "Google"}.
        </p>
      )}

      <div className="space-y-3">
        {items.map((i, index) => (
          <div key={`${i.url}-${index}`} className="rounded-xl border border-slate-800 p-4">
            <div className="flex justify-between gap-4">
              <a href={i.url} target="_blank" className="font-semibold" rel="noreferrer">
                {i.title}
              </a>
              <span className="badge">Score {i.opportunity_score}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {i.source} {i.snippet ? `— ${i.snippet}` : ""}
            </p>
            <ReplyBox
              item={i}
              onSave={user ? saveOpportunity : undefined}
              query={query}
              saved={savedUrl === i.url}
              saving={savingUrl === i.url}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplyBox({
  item,
  onSave,
  query,
  saved,
  saving,
}: {
  item: Item;
  onSave?: (item: Item, targetArticleUrl: string, reply: string) => Promise<void>;
  query: string;
  saved: boolean;
  saving: boolean;
}) {
  const suggested = useMemo(() => suggestTargetLink(`${query} ${item.title}`), [query, item.title]);
  const [targetArticleUrl, setTarget] = useState(suggested.url);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: item.source,
          opportunityTitle: item.title,
          opportunityUrl: item.url,
          targetArticleUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Erreur ${res.status}`);
      }

      setReply(json.reply || "");
    } catch (err: any) {
      setError(err?.message || "Erreur pendant la génération");
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    if (!reply) return;
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function openOpportunity() {
    window.open(item.url, "_blank", "noopener,noreferrer");
  }

  function copyAndOpen() {
    copyReply();
    openOpportunity();
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Lien suggéré automatiquement</p>
            <p className="text-xs text-slate-400">{suggested.label} · {suggested.reason}</p>
          </div>
          <button className="btn text-sm" type="button" onClick={() => setTarget(suggested.url)}>
            Utiliser ce lien
          </button>
        </div>
      </div>

      <input
        className="input"
        value={targetArticleUrl}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="URL de ton article à linker"
      />

      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={generate} disabled={loading}>
          {loading ? "Génération..." : "Générer réponse"}
        </button>
        <button className="btn" type="button" onClick={openOpportunity}>
          Ouvrir opportunité
        </button>
        {reply && (
          <>
            <button className="btn" type="button" onClick={copyReply}>
              {copied ? "Copie" : "Copier reponse"}
            </button>
            <button className="btn" type="button" onClick={copyAndOpen}>
              Copier + ouvrir
            </button>
          </>
        )}
        {onSave && (
          <button
            className="btn inline-flex items-center gap-2"
            type="button"
            disabled={saving}
            onClick={() => onSave(item, targetArticleUrl, reply)}
          >
            <Save size={16} />
            {saving ? "Sauvegarde..." : saved ? "Sauvegarde OK" : "Sauvegarder"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {reply && <textarea className="input min-h-40" value={reply} onChange={(e) => setReply(e.target.value)} />}
    </div>
  );
}
