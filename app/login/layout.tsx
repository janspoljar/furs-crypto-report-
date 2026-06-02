import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prijava – DavkiNaDelnicah.si",
  description: "Prijavite se v svoj račun ali ustvarite novega na DavkiNaDelnicah.si.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
