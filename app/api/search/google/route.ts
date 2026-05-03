import { NextResponse } from "next/server";
import { searchGoogle } from "@/lib/google";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const data = await searchGoogle(query);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Google search API error:", error);
    return NextResponse.json(
      { error: error?.message || "Google search failed" },
      { status: 500 }
    );
  }
}
