import { NextResponse } from "next/server";
import { searchGoogle } from "@/lib/google";
export async function POST(req: Request) {
  const { query } = await req.json();
  const data = await searchGoogle(query);
  return NextResponse.json({ data });
}
