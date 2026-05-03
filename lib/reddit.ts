import { searchGoogle } from "./google";
import { scoreOpportunity } from "./scoring";

export async function searchReddit(query: string) {
  const redditQuery = `site:reddit.com/r/ ${query}`;

  const results = await searchGoogle(redditQuery);

  return results.map((item: any) => ({
    ...item,
    source: "reddit",
    opportunity_score: scoreOpportunity({
      title: item.title,
      url: item.url,
      source: "reddit",
      score: item.source_score || 0,
      comments: item.comments || 0,
    }),
  }));
}