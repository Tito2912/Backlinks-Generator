import { scoreOpportunity } from "./scoring";

export async function searchReddit(query: string) {
  const subreddits = ["SEO", "Entrepreneur", "AffiliateMarketing", "sidehustle", "ChatGPT"];
  const results: any[] = [];

  for (const subreddit of subreddits) {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(
      query
    )}&restrict_sr=1&sort=new&t=month&limit=10`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "BacklinkOS/1.0 by Tito2912",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) continue;

    const data = await res.json();

    for (const p of data.data?.children || []) {
      const item = {
        source: "reddit",
        title: p.data.title,
        url: `https://reddit.com${p.data.permalink}`,
        comments: p.data.num_comments || 0,
        source_score: p.data.score || 0,
        subreddit: p.data.subreddit,
        query,
      };

      results.push({
        ...item,
        opportunity_score: scoreOpportunity({
          ...item,
          score: item.source_score,
        }),
      });
    }
  }

  return results;
}