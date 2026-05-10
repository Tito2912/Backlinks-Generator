"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AuthPanel from "@/components/AuthPanel";

type EnvStatus = {
  openai: boolean;
  serpapi: boolean;
  supabaseAnon: boolean;
  supabaseService: boolean;
  supabaseUrl: boolean;
  sendgrid: boolean;
  sendgridFrom: boolean;
  notificationEmail: boolean;
  cronSecret: boolean;
};

const groups: Array<{ title: string; keys: Array<[keyof EnvStatus, string]> }> = [
  {
    title: "Supabase",
    keys: [
      ["supabaseUrl", "NEXT_PUBLIC_SUPABASE_URL"],
      ["supabaseAnon", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      ["supabaseService", "SUPABASE_SERVICE_ROLE_KEY"],
    ],
  },
  {
    title: "APIs de recherche & IA",
    keys: [
      ["openai", "OPENAI_API_KEY"],
      ["serpapi", "SERPAPI_API_KEY"],
    ],
  },
  {
    title: "Notifications email (SendGrid)",
    keys: [
      ["sendgrid", "SENDGRID_API_KEY"],
      ["sendgridFrom", "SENDGRID_FROM_EMAIL"],
      ["notificationEmail", "NOTIFICATION_EMAIL"],
    ],
  },
  {
    title: "Cron Vercel",
    keys: [
      ["cronSecret", "CRON_SECRET"],
    ],
  },
];

export default function SettingsPanel() {
  const [status, setStatus] = useState<EnvStatus | null>(null);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    setError("");

    try {
      const response = await fetch("/api/settings/status", { cache: "no-store" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Statut indisponible");
      }

      setStatus(json);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Statut indisponible");
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return (
    <div className="space-y-6">
      <AuthPanel />

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Configuration</h2>
            <p className="text-sm text-slate-400">
              Variables necessaires au fonctionnement du SaaS.
            </p>
          </div>
          <button className="btn inline-flex items-center gap-2" onClick={loadStatus}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {group.keys.map(([key, label]) => (
                  <div
                    className="flex items-center justify-between rounded-xl border border-slate-800 p-3"
                    key={key}
                  >
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className={status?.[key] ? "badge text-cyan-200" : "badge text-red-200"}>
                      {status?.[key] ? "OK" : "Manquant"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
