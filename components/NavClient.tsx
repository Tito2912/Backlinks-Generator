"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import type { Project } from "@/lib/supabase/types";

const links = [
  ["/dashboard", "Dashboard"],
  ["/analytics", "Analytics"],
  ["/projects", "Sites"],
  ["/campaigns", "Campagnes"],
  ["/opportunities", "Opportunites"],
  ["/backlinks", "Backlinks"],
  ["/articles", "Articles"],
  ["/templates", "Templates"],
  ["/settings", "Settings"],
];

export default function NavClient() {
  const pathname = usePathname();
  const { supabase, user } = useSupabaseSession();
  const { activeSiteId, setActiveSiteId } = useSite();
  const [projects, setProjects] = useState<Project[]>([]);

  const loadProjects = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase
      .from("projects")
      .select("id, name, domain")
      .eq("user_id", user.id)
      .order("name", { ascending: true });
    setProjects((data || []) as Project[]);
  }, [supabase, user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, pathname]);

  const activeSite = projects.find((p) => p.id === activeSiteId);

  return (
    <>
      <h1 className="mb-4 text-xl font-bold lg:mb-6">Backlink OS</h1>

      {projects.length > 0 && (
        <div className="mb-4 lg:mb-6">
          <p className="mb-1 text-xs text-slate-500 uppercase tracking-wider">Site actif</p>
          <select
            className="input text-sm"
            value={activeSiteId}
            onChange={(e) => setActiveSiteId(e.target.value)}
          >
            <option value="">Tous les sites</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {activeSite && (
            <p className="mt-1 truncate text-xs text-slate-500">{activeSite.domain}</p>
          )}
        </div>
      )}

      <nav className="flex flex-wrap gap-2 lg:block lg:space-y-1">
        {links.map(([href, label]) => (
          <Link
            key={href}
            className={`block rounded-xl px-3 py-2 text-sm hover:bg-slate-800 ${
              pathname === href ? "bg-slate-800 text-cyan-300 font-semibold" : ""
            }`}
            href={href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
