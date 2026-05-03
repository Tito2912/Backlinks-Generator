export type ScoreInput = {
  source: string;
  title: string;
  url: string;
  comments?: number;
  score?: number;
  query?: string;
};

export function scoreOpportunity(input: ScoreInput) {
  let score = 30;
  const title = input.title.toLowerCase();
  const commercial = ["best", "tool", "alternative", "how", "recommend", "review", "compare"];
  score += commercial.filter(k => title.includes(k)).length * 10;
  if (input.comments) score += Math.min(25, input.comments / 2);
  if (input.score) score += Math.min(20, input.score / 5);
  if (input.source === "reddit") score += 8;
  if (input.source === "google") score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}
