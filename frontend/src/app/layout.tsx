import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertifyVal | Global Decentralized Credential Trust Platform",
  description: "Verify, issue, and manage digital credentials on the Stellar blockchain. Institution registry, credential passports, AI fraud detection, and employer verification.",
};

// Inline script: runs before React hydrates — purges old hardcoded demo data
// Version bump here triggers a one-time purge for all users
const DATA_VERSION = "v2_real";
const PURGE_SCRIPT = `
(function() {
  try {
    var v = localStorage.getItem('certifyval_data_version');
    if (v !== '${DATA_VERSION}') {
      // Remove all old hardcoded-demo-seeded keys
      ['certifyval_institutions', 'certifyval_feedback'].forEach(function(k) {
        localStorage.removeItem(k);
      });
      // Remove old per-wallet passport data that was demo-seeded
      Object.keys(localStorage).forEach(function(k) {
        if (k.startsWith('certifyval_passport_')) localStorage.removeItem(k);
      });
      localStorage.setItem('certifyval_data_version', '${DATA_VERSION}');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Purge old hardcoded demo localStorage data on first load */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: PURGE_SCRIPT }} />
      </head>
      <body className="h-full flex flex-col bg-background text-foreground overflow-hidden">{children}</body>
    </html>
  );
}
