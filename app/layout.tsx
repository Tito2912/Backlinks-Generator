import "./globals.css";
import Link from "next/link";

const nav = ["dashboard", "projects", "campaigns", "opportunities", "backlinks", "articles", "templates", "settings"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen grid grid-cols-[240px_1fr]">
          <aside className="border-r border-slate-800 p-6">
            <h1 className="text-xl font-bold mb-8">Backlink OS</h1>
            <nav className="space-y-2">
              {nav.map(n => <Link key={n} className="block rounded-xl px-3 py-2 hover:bg-slate-900 capitalize" href={`/${n}`}>{n}</Link>)}
            </nav>
          </aside>
          <main className="p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
