import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserNav from "@/components/user-nav";
import { getUserFromServer } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DavkiNaDelnice.si — Davčno poročanje za delnice in ETF",
  description: "Naloži CSV iz Trading212, eToro, Revolut ali Interactive Brokers. Avtomatski FIFO izračun in DOH-KDVP XML za eDavke.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getUserFromServer();

  const initialUser = user
    ? { id: user.id, email: user.email ?? undefined }
    : null;

  return (
    <html
      lang="sl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2 font-bold text-lg text-blue-700 hover:text-blue-600 transition-colors no-underline">
                <span className="text-2xl">🇸🇮</span>
                <span>DavkiNaDelnice</span>
              </a>
              <nav className="hidden sm:flex items-center gap-1">
                <NavLink href="/navodila">Navodila</NavLink>
                <NavLink href="/cenik">Cenik</NavLink>
                {initialUser && (
                  <>
                    <NavLink href="/dashboard">Nadzorna plošča</NavLink>
                    <NavLink href="/upload">Uvoz CSV</NavLink>
                    <NavLink href="/transactions">Transakcije</NavLink>
                    <NavLink href="/reports">Poročila</NavLink>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {!initialUser && (
                <>
                  <a href="/cenik" className="hidden sm:block text-sm text-slate-600 hover:text-blue-700 font-medium transition-colors">
                    Cenik
                  </a>
                  <a href="/login" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    Prijava / Registracija
                  </a>
                </>
              )}
              <UserNav initialUser={initialUser} />
            </div>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-slate-200 bg-slate-50 py-6">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
            <span>© 2025 DavkiNaDelnice.si — Davčno poročanje za delnice in ETF</span>
            <span>Ni davčni nasvet. Preverite z računovodjem.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-1.5 text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md font-medium transition-colors no-underline"
    >
      {children}
    </a>
  );
}
