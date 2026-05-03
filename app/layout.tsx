import "./globals.css";
import Link from "next/link";

const nav = [
  ["dashboard", "Dashboard"],
  ["projects", "Projects"],
  ["campaigns", "Campaigns"],
  ["opportunities", "Opportunites"],
  ["backlinks", "Backlinks"],
  ["articles", "Articles"],
  ["templates", "Templates"],
  ["settings", "Settings"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
          <aside className="border-b border-slate-800 p-4 lg:border-b-0 lg:border-r lg:p-6">
            <h1 className="mb-4 text-xl font-bold lg:mb-8">Backlink OS</h1>
            <nav className="flex flex-wrap gap-2 lg:block lg:space-y-2">
              {nav.map(([href, label]) => (
                <Link
                  key={href}
                  className="block rounded-xl px-3 py-2 hover:bg-slate-900"
                  href={`/${href}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
