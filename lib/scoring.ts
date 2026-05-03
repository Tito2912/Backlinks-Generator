export type ScoreInput = {
  source: string;
  title: string;
  url: string;
  snippet?: string;
  comments?: number;
  score?: number;
  query?: string;
};

export function scoreOpportunity(input: ScoreInput) {
  let score = 20;
  const title = (input.title || "").toLowerCase();
  const snippet = (input.snippet || "").toLowerCase();
  const text = `${title} ${snippet}`;
  const url = (input.url || "").toLowerCase();

  const intentKeywords = [
    "how", "best", "recommend", "recommendation", "alternative", "tool", "tools",
    "review", "compare", "worth it", "anyone", "help", "question", "guide",
    "make money", "earn", "beginner", "start", "need advice"
  ];
  score += intentKeywords.filter((keyword) => text.includes(keyword)).length * 7;

  const badKeywords = ["coupon", "promo code", "download crack", "torrent", "nsfw"];
  score -= badKeywords.filter((keyword) => text.includes(keyword)).length * 12;

  if (input.comments) score += Math.min(25, Math.round(input.comments / 2));
  if (input.score) score += Math.min(15, Math.round(input.score / 5));

  if (input.source === "reddit") score += 12;
  if (url.includes("/comments/") || url.includes("reddit.com/r/")) score += 10;
  if (url.includes("quora.com")) score += 8;
  if (url.includes("medium.com")) score += 3;

  if (input.query) {
    const queryWords = input.query.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    const matches = queryWords.filter((word) => text.includes(word)).length;
    score += Math.min(20, matches * 4);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
