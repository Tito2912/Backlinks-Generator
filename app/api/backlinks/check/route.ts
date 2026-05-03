import { NextResponse } from "next/server";
import { z } from "zod";

const checkSchema = z.object({
  sourceUrl: z.string().trim().url(),
  targetUrl: z.string().trim().url(),
});

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export async function POST(req: Request) {
  try {
    const parsed = checkSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid backlink check request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(parsed.data.sourceUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "BacklinkOS/1.0 (+manual backlink checker)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const html = await response.text();
    const target = normalizeUrl(parsed.data.targetUrl);
    const found =
      html.includes(parsed.data.targetUrl) || html.includes(target);

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      found,
      status: found ? "won" : "lost",
      statusCode: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Backlink check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
