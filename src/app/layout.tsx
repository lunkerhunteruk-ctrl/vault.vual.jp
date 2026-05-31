import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "VAULT — VUAL",
  description: "IMPLANT yourself into the world of VUAL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={`${mono.variable}`}>
      <body className="font-mono" style={{ background: "var(--vault-bg)", color: "var(--vault-text)" }}>
        {children}
      </body>
    </html>
  );
}
