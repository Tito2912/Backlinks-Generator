import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_API_KEY),
    serpapi: Boolean(process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseService: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sendgrid: Boolean(process.env.SENDGRID_API_KEY),
    sendgridFrom: Boolean(process.env.SENDGRID_FROM_EMAIL),
    notificationEmail: Boolean(process.env.NOTIFICATION_EMAIL),
    cronSecret: Boolean(process.env.CRON_SECRET),
  });
}
