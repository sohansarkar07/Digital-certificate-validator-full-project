"use client";
// error.tsx — Global error boundary for the CertifyVal app
// Renders when any React component throws an unhandled error

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error — swap this for Sentry/LogRocket in production
    console.error("[CertifyVal Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#F8FAFC",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px 32px",
            maxWidth: "480px",
            background: "rgba(14,14,14,0.95)",
            border: "1px solid #262626",
            borderRadius: "20px",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <AlertTriangle size={28} color="#F87171" />
          </div>

          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "10px",
              letterSpacing: "-0.3px",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "rgba(248,250,252,0.5)",
              lineHeight: 1.6,
              marginBottom: "32px",
            }}
          >
            An unexpected error occurred. Your blockchain records and
            credentials are safe. Please try again or return to the home page.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: "11px",
                color: "rgba(248,250,252,0.3)",
                fontFamily: "monospace",
                marginBottom: "24px",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                border: "1px solid #1e1e1e",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "#EDEDED",
                color: "#050505",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCcw size={14} />
              Try Again
            </button>

            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "transparent",
                color: "#F8FAFC",
                border: "1px solid #262626",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Home size={14} />
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
