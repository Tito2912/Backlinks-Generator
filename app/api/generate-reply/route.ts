import { NextResponse } from "next/server";
import { generateBacklinkReply } from "@/lib/openai";
export async function POST(req: Request) {
  const body = await req.json();
  const reply = await generateBacklinkReply(body);
  return NextResponse.json({ reply });
}
