"use client";

import { LogOut, Mail } from "lucide-react";
import { useState } from "react";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";

export default function AuthPanel() {
  const { configured, loading, supabase, user } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function signIn() {
    if (!supabase || !email) return;

    setSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
      },
    });

    setSubmitting(false);
    setMessage(
      error
        ? error.message
        : "Lien de connexion envoye. Verifie ta boite mail."
    );
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage("Session fermee.");
  }

  if (!configured) {
    return (
      <div className="card space-y-2">
        <h2 className="text-xl font-bold">Connexion Supabase</h2>
        <p className="text-sm text-slate-400">
          Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
          dans `.env.local` pour activer les donnees.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="card text-sm text-slate-400">Chargement...</div>;
  }

  if (user) {
    return (
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Session active</h2>
          <p className="text-sm text-slate-400">{user.email}</p>
          {message && <p className="mt-2 text-sm text-cyan-200">{message}</p>}
        </div>
        <button className="btn inline-flex items-center gap-2" onClick={signOut}>
          <LogOut size={16} />
          Deconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-xl font-bold">Connexion</h2>
        <p className="text-sm text-slate-400">
          Connecte-toi avec un lien magique Supabase pour sauvegarder tes
          donnees.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@domaine.com"
        />
        <button
          className="btn inline-flex items-center justify-center gap-2"
          disabled={submitting || !email}
          onClick={signIn}
        >
          <Mail size={16} />
          {submitting ? "Envoi..." : "Recevoir le lien"}
        </button>
      </div>

      {message && <p className="text-sm text-cyan-200">{message}</p>}
    </div>
  );
}
