import { scoreOpportunity } from "./scoring";

export async function searchGoogle(query: string) {
  const key = process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY;

  if (!key) {
    throw new Error("Missing SERPAPI_API_KEY or SERPAPI_KEY");
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);
  url.searchParams.set("num", "10");
  url.searchParams.set("hl", "en");

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google search failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  return (data.organic_results || []).map((r: any) => {
    const item = {
      source: "google",
      title: r.title || "Untitled result",
      url: r.link,
      snippet: r.snippet || "",
      query,
    };

    return {
      ...item,
      opportunity_score: scoreOpportunity(item),
    };
  }).filter((item: any) => Boolean(item.url));
}
