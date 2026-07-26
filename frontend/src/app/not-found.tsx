// not-found.tsx — 404 page for CertifyVal
// Rendered when a user navigates to a URL that doesn't match any route
// (e.g. /verify/invalid-hash, /some-typo)

import Link from "next/link";
import { FileSearch, Home, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "404 — Page Not Found | CertifyVal",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-lg w-full">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <p
            className="text-[120px] font-black leading-none select-none"
            style={{
              background:
                "linear-gradient(135deg, var(--foreground) 0%, rgba(248,250,252,0.1) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </p>
          {/* Floating icon over the 404 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-surface border border-border flex items-center justify-center shadow-xl">
              <FileSearch size={28} className="text-foreground/40" />
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-sm text-foreground/50 leading-relaxed mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. If you&apos;re looking for a certificate, make sure you have
          the correct verification link.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Home size={15} />
            Go to Dashboard
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground/70 hover:text-foreground hover:border-border-strong transition-colors"
          >
            <ArrowLeft size={15} />
            Go Back
          </Link>
        </div>

        {/* Hint for verify links */}
        <div className="mt-10 p-4 rounded-xl bg-surface border border-border text-left">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5">
            Looking for a certificate?
          </p>
          <p className="text-xs text-foreground/60 leading-relaxed">
            Verification links follow the format{" "}
            <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">
              certifyval.app/verify/[hash]
            </code>
            . Make sure the full link was copied correctly.
          </p>
        </div>
      </div>
    </div>
  );
}
