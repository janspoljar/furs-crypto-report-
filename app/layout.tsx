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
  title: "FURS Crypto Report",
  description: "MVP za kripto davčno poročanje za Slovenijo",
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
        <header style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <a href="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: "none", color: "inherit" }}>
                FURS Crypto Report
              </a>
              <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <a href="/dashboard" style={{ color: "#333", textDecoration: "none" }}>Dashboard</a>
                <a href="/upload" style={{ color: "#333", textDecoration: "none" }}>Upload</a>
                <a href="/transactions" style={{ color: "#333", textDecoration: "none" }}>Transakcije</a>
                <a href="/reports" style={{ color: "#333", textDecoration: "none" }}>Reports</a>
                <a href="/profile" style={{ color: "#333", textDecoration: "none" }}>Profil</a>
              </nav>
            </div>
            <div>
              {/* @ts-expect-error server -> client prop */}
              <UserNav initialUser={initialUser} />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}