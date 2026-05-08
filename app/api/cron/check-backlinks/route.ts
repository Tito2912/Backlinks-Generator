import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendBacklinkWonEmail } from "@/lib/sendgrid";
import type { Backlink } from "@/lib/supabase/types";

export const maxDuration = 300;

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

async function checkUrl(sourceUrl: string, targetUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: { "User-Agent": "BacklinkOS/1.0 (+backlink-checker)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const html = await response.text();
    const target = normalizeUrl(targetUrl);
    return html.includes(targetUrl) || html.includes(target);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: backlinks, error } = await supabase
    .from("backlinks")
    .select("*")
    .eq("status", "submitted")
    .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (backlinks || []) as Backlink[];
  let won = 0;
  let checked = 0;

  for (const backlink of items) {
    const found = await checkUrl(backlink.source_url, backlink.target_url);
    const newStatus = found ? "won" : "submitted";

    await supabase
      .from("backlinks")
      .update({ last_checked_at: new Date().toISOString(), status: newStatus })
      .eq("id", backlink.id);

    checked++;

    if (found) {
      won++;
      const userEmail = process.env.NOTIFICATION_EMAIL;
      if (userEmail) {
        try {
          await sendBacklinkWonEmail({
            to: userEmail,
            sourceUrl: backlink.source_url,
            targetUrl: backlink.target_url,
            siteName: backlink.project_id || "votre site",
          });
        } catch {
          // Email failure shouldn't break the cron
        }
      }
    }
  }

  return NextResponse.json({ checked, won });
}
