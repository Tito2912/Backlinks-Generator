"use client";

import { useState } from "react";

type Item = {
  source: string;
  title: string;
  url: string;
  snippet?: string;
  opportunity_score?: number;
};

function suggestLink(query: string) {
  const slug = query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  return `https://oryvalo.com/${slug}`;
}

async function safeJson(res: Response) {
  const text = await res.text();

  if (!text) {
    throw new Error("Réponse API vide");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text);
  }
}

export default function OpportunitiesPage() {
  const [query, setQuery] = useState("make money with ai");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(source: "reddit" | "google") {
    try {
      setLoading(true);
      setError("");

      const finalQuery =
        source === "reddit" ? `site:reddit.com ${query}` : query;

      const res = await fetch(`/api/search/${source}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: finalQuery }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(json.error || "Erreur API");
      }

      setItems(json.data || []);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const bestScore =
    items.length > 0
      ? Math.max(...items.map((i) => i.opportunity_score || 0))
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Opportunités</h1>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Recherche d'opportunités</h2>
            <p className="text-sm text-slate-400">
              Reddit passe par Google/SerpAPI pour éviter les blocages 403.
            </p>
          </div>

          {bestScore !== null && (
            <span className="badge">Meilleure opportunité : {bestScore}/100</span>
          )}
        </div>

        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ex: make money with ai"
        />

        <div className="flex gap-3">
          <button className="btn" onClick={() => run("reddit")} disabled={loading}>
            Chercher Reddit
          </button>

          <button className="btn" onClick={() => run("google")} disabled={loading}>
            Chercher Google
          </button>
        </div>

        {loading && <p className="text-slate-400">Recherche...</p>}

        {error && <p className="text-red-400">{error}</p>}

        <div className="space-y-4">
          {items
            .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
            .map((item) => (
              <OpportunityCard
                key={item.url}
                item={item}
                suggestedLink={suggestLink(query)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({
  item,
  suggestedLink,
}: {
  item: Item;
  suggestedLink: string;
}) {
  const [targetArticleUrl, setTargetArticleUrl] = useState(suggestedLink);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateReply() {
    try {
      setLoading(true);
      setError("");
      setReply("");

      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: item.source,
          opportunityTitle: item.title,
          opportunityUrl: item.url,
          targetArticleUrl,
        }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(json.error || json.details || "Erreur génération");
      }

      setReply(json.reply || "");
    } catch (err: any) {
      setError(err.message || "Erreur génération");
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    if (!reply) return;
    await navigator.clipboard.writeText(reply);
  }

  async function copyAndOpen() {
    if (reply) {
      await navigator.clipboard.writeText(reply);
    }
    window.open(item.url, "_blank");
  }

  return (
    <div className="rounded-xl border border-slate-800 p-4 space-y-3">
      <div className="flex justify-between gap-4">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold"
        >
          {item.title}
        </a>

        <span className="badge">Score {item.opportunity_score || 0}</span>
      </div>

      <p className="text-sm text-slate-400">
        {item.source}
        {item.snippet ? ` — ${item.snippet}` : ""}
      </p>

      <div className="rounded-xl border border-slate-800 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cyan-300">
              Lien suggéré automatiquement
            </p>
            <p className="text-xs text-slate-400">
              Basé sur le mot-clé recherché
            </p>
          </div>

          <button
            className="btn"
            onClick={() => setTargetArticleUrl(suggestedLink)}
          >
            Utiliser ce lien
          </button>
        </div>
      </div>

      <input
        className="input"
        value={targetArticleUrl}
        onChange={(e) => setTargetArticleUrl(e.target.value)}
        placeholder="URL de ton article à linker"
      />

      <div className="flex flex-wrap gap-3">
        <button className="btn" onClick={generateReply} disabled={loading}>
          {loading ? "Génération..." : "Générer réponse"}
        </button>

        <button className="btn" onClick={() => window.open(item.url, "_blank")}>
          Ouvrir opportunité
        </button>

        {reply && (
          <>
            <button className="btn" onClick={copyReply}>
              Copier réponse
            </button>

            <button className="btn" onClick={copyAndOpen}>
              Copier + ouvrir
            </button>
          </>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {reply && (
        <textarea
          className="input min-h-40"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
      )}
    </div>
  );
}