import { searchGoogle } from "./google";
import { scoreOpportunity } from "./scoring";

function buildRedditQuery(query: string) {
  const cleanQuery = query.trim();

  // If the user already typed a Reddit footprint, do not duplicate it.
  if (cleanQuery.toLowerCase().includes("site:reddit.com")) {
    return cleanQuery;
  }

  return `site:reddit.com ${cleanQuery}`;
}

function isRedditResult(url?: string) {
  if (!url) return false;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "reddit.com" || host.endsWith(".reddit.com");
  } catch {
    return url.includes("reddit.com");
  }
}

export async function searchReddit(query: string) {
  const redditQuery = buildRedditQuery(query);
  const results = await searchGoogle(redditQuery);

  return results
    .filter((item: any) => isRedditResult(item.url))
    .map((item: any) => ({
      ...item,
      source: "reddit",
      query: redditQuery,
      opportunity_score: scoreOpportunity({
        title: item.title,
        url: item.url,
        source: "reddit",
        query: redditQuery,
      }),
    }));
}
