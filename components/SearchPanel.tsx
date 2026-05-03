"use client";
import { useMemo, useState } from "react";
import { suggestTargetLink } from "@/lib/linkSuggestions";

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
  const [query, setQuery] = useState("make money with ai");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<"reddit" | "google" | null>(null);
  const [error, setError] = useState("");
  const [lastSource, setLastSource] = useState<"reddit" | "google" | null>(null);

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
    } catch (err: any) {
      setError(err?.message || "Erreur pendant la recherche");
    } finally {
      setLoading(null);
    }
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
          <h2 className="text-xl font-bold">Recherche d'opportunités</h2>
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

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
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
            <ReplyBox title={i.title} platform={i.source} url={i.url} query={query} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplyBox({ title, platform, url, query }: { title: string; platform: string; url: string; query: string }) {
  const suggested = useMemo(() => suggestTargetLink(`${query} ${title}`), [query, title]);
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
        body: JSON.stringify({ platform, opportunityTitle: title, opportunityUrl: url, targetArticleUrl }),
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
    window.open(url, "_blank", "noopener,noreferrer");
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
              {copied ? "Copié ✅" : "Copier réponse"}
            </button>
            <button className="btn" type="button" onClick={copyAndOpen}>
              Copier + ouvrir
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {reply && <textarea className="input min-h-40" value={reply} onChange={(e) => setReply(e.target.value)} />}
    </div>
  );
}
