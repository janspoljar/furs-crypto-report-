import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prijava – DavkiNaDelnicah.si",
  description: "Prijavite se v svoj račun ali ustvarite novega na DavkiNaDelnicah.si.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
