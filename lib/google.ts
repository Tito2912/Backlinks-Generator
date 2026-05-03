import { scoreOpportunity } from "./scoring";

export async function searchGoogle(query: string) {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) throw new Error("Missing SERPAPI_API_KEY");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);
  url.searchParams.set("num", "10");
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Google search failed");
  const data = await res.json();
  return (data.organic_results || []).map((r: any) => {
    const item = { source: "google", title: r.title, url: r.link, snippet: r.snippet, query };
    return { ...item, opportunity_score: scoreOpportunity(item) };
  });
}
