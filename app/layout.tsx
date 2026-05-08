import "./globals.css";
import NavClient from "@/components/NavClient";
import { SiteProvider } from "@/contexts/SiteContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SiteProvider>
          <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
            <aside className="border-b border-slate-800 p-4 lg:border-b-0 lg:border-r lg:p-6">
              <NavClient />
            </aside>
            <main className="p-4 lg:p-8">{children}</main>
          </div>
        </SiteProvider>
      </body>
    </html>
  );
}
