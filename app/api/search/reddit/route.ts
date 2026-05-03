import { NextResponse } from "next/server";
import { searchReddit } from "@/lib/reddit";
export async function POST(req: Request) {
  const { query } = await req.json();
  const data = await searchReddit(query);
  return NextResponse.json({ data });
}
