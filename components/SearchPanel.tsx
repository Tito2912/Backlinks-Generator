"use client";
import { useState } from "react";

type Item = {
  source: string;
  title: string;
  url: string;
  snippet?: string;
  opportunity_score: number;
  comments?: number;
  source_score?: number;
};

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

      setItems(json.data || []);
    } catch (err: any) {
      setError(err?.message || "Erreur pendant la recherche");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-bold">Recherche d'opportunités</h2>

      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ex: make money with ai"
      />

      <div className="flex gap-3">
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
        {items.map((i) => (
          <div key={i.url} className="rounded-xl border border-slate-800 p-4">
            <div className="flex justify-between gap-4">
              <a href={i.url} target="_blank" className="font-semibold" rel="noreferrer">
                {i.title}
              </a>
              <span className="badge">Score {i.opportunity_score}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {i.source} {i.snippet ? `— ${i.snippet}` : ""}
            </p>
            <ReplyBox title={i.title} platform={i.source} url={i.url} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplyBox({ title, platform, url }: { title: string; platform: string; url: string }) {
  const [targetArticleUrl, setTarget] = useState("https://oryvalo.com/");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");

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

  return (
    <div className="mt-4 space-y-2">
      <input
        className="input"
        value={targetArticleUrl}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="URL de ton article à linker"
      />
      <button className="btn" onClick={generate} disabled={loading}>
        {loading ? "Génération..." : "Générer réponse"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {reply && <textarea className="input min-h-40" value={reply} onChange={(e) => setReply(e.target.value)} />}
    </div>
  );
}
