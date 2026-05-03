import { scoreOpportunity } from "./scoring";

export async function searchReddit(query: string) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=25&sort=relevance&t=month`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BacklinkOS/1.0)",
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Reddit error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();

  return (data.data?.children || []).map((p: any) => {
    const item = {
      source: "reddit",
      title: p.data.title,
      url: `https://reddit.com${p.data.permalink}`,
      comments: p.data.num_comments || 0,
      source_score: p.data.score || 0,
      subreddit: p.data.subreddit,
      query,
    };

    return {
      ...item,
      opportunity_score: scoreOpportunity({
        ...item,
        score: item.source_score,
      }),
    };
  });
}