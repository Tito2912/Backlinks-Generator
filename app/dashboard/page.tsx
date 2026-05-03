import SearchPanel from "@/components/SearchPanel";
export default function Dashboard() {
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Dashboard Backlink OS</h1><div className="grid grid-cols-4 gap-4">{["Opportunités", "Réponses", "Backlinks", "Score moyen"].map((k,i)=><div className="card" key={k}><p className="text-slate-400">{k}</p><p className="text-3xl font-bold">{[0,0,0,"-"][i]}</p></div>)}</div><SearchPanel /></div>
}
