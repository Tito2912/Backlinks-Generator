import { describe, expect, it } from "vitest";
import { scoreOpportunity } from "./scoring";

describe("scoreOpportunity", () => {
  it("rewards high-intent Reddit discussions", () => {
    const score = scoreOpportunity({
      comments: 40,
      query: "best ai tools",
      source: "reddit",
      title: "Best AI tools for beginners?",
      url: "https://www.reddit.com/r/SaaS/comments/abc/best_ai_tools/",
    });

    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("penalizes low-quality risky keywords", () => {
    const score = scoreOpportunity({
      source: "google",
      title: "Download crack promo code torrent",
      url: "https://example.com/download",
    });

    expect(score).toBeLessThan(20);
  });
});
