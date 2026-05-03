"use client";
import { useState } from "react";

type Item = { source:string; title:string; url:string; snippet?:string; opportunity_score:number; comments?:number; source_score?:number };

export default function SearchPanel() {
  const [query, setQuery] = useState("make money with ai");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  async function run(source: "reddit" | "google") {
    setLoading(true);
    const res = await fetch(`/api/search/${source}`, { method: "POST", body: JSON.stringify({ query }) });
    const json = await res.json();
    setItems(json.data || []);
    setLoading(false);
  }
  return <div className="card space-y-4">
    <h2 className="text-xl font-bold">Recherche d'opportunités</h2>
    <input className="input" value={query} onChange={e=>setQuery(e.target.value)} />
    <div className="flex gap-3"><button className="btn" onClick={()=>run("reddit")}>Chercher Reddit</button><button className="btn" onClick={()=>run("google")}>Chercher Google</button></div>
    {loading && <p>Recherche...</p>}
    <div className="space-y-3">
      {items.map(i => <div key={i.url} className="rounded-xl border border-slate-800 p-4">
        <div className="flex justify-between gap-4"><a href={i.url} target="_blank" className="font-semibold">{i.title}</a><span className="badge">Score {i.opportunity_score}</span></div>
        <p className="text-sm text-slate-400 mt-2">{i.source} {i.snippet ? `— ${i.snippet}` : ""}</p>
        <ReplyBox title={i.title} platform={i.source} url={i.url} />
      </div>)}
    </div>
  </div>
}

function ReplyBox({ title, platform, url }: { title:string; platform:string; url:string }) {
  const [targetArticleUrl, setTarget] = useState("https://oryvalo.com/");
  const [reply, setReply] = useState("");
  async function generate() {
    const res = await fetch("/api/generate-reply", { method: "POST", body: JSON.stringify({ platform, opportunityTitle:title, opportunityUrl:url, targetArticleUrl }) });
    const json = await res.json();
    setReply(json.reply || "");
  }
  return <div className="mt-4 space-y-2">
    <input className="input" value={targetArticleUrl} onChange={e=>setTarget(e.target.value)} placeholder="URL de ton article à linker" />
    <button className="btn" onClick={generate}>Générer réponse</button>
    {reply && <textarea className="input min-h-40" value={reply} onChange={e=>setReply(e.target.value)} />}
  </div>
}
