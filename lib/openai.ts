import OpenAI from "openai";

let client: OpenAI | null = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export async function generateBacklinkReply(args: {
  platform: string;
  opportunityTitle: string;
  opportunityUrl?: string;
  targetArticleUrl: string;
  targetArticleTitle?: string;
  tone?: string;
}) {
  const prompt = `Write a helpful human reply for ${args.platform}.
Opportunity title: ${args.opportunityTitle}
Opportunity URL: ${args.opportunityUrl || "N/A"}
Target guide to mention naturally: ${args.targetArticleTitle || args.targetArticleUrl} (${args.targetArticleUrl})
Tone: ${args.tone || "helpful, natural, non promotional"}
Rules:
- Do not sound like an ad.
- Add the link only if it is genuinely useful.
- Give practical advice first.
- Keep it under 180 words.
- Avoid fake claims.`;

  const response = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });
  return response.choices[0]?.message?.content?.trim() || "";
}
