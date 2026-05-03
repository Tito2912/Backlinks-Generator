import { NextResponse } from "next/server";
import { z } from "zod";
import { generateBacklinkReply } from "@/lib/openai";

export const runtime = "nodejs";

const replyRequestSchema = z.object({
  platform: z.string().trim().min(1).default("reddit"),
  opportunityTitle: z.string().trim().min(1, "Opportunity title is required"),
  opportunityUrl: z.string().trim().url().optional(),
  targetArticleUrl: z.string().trim().url("Target article URL must be valid"),
  targetArticleTitle: z.string().trim().optional(),
  tone: z.string().trim().optional(),
});

function normalizeBody(body: unknown) {
  if (!body || typeof body !== "object") return body;

  const data = body as Record<string, unknown>;

  return {
    ...data,
    opportunityTitle: data.opportunityTitle ?? data.title,
    targetArticleUrl: data.targetArticleUrl ?? data.link,
  };
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = normalizeBody(await req.json());
    const parsed = replyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reply request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const reply = await generateBacklinkReply(parsed.data);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("OpenAI reply API error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate reply",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
