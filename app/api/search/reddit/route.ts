import { NextResponse } from "next/server";
import { searchReddit } from "@/lib/reddit";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const { allowed } = rateLimit(req, "/api/search/reddit");
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes, réessaie dans 1 minute." }, { status: 429 });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const data = await searchReddit(query);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Reddit search API error:", error);
    return NextResponse.json(
      { error: error?.message || "Reddit search failed" },
      { status: 500 }
    );
  }
}
