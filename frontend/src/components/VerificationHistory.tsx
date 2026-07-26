"use client";
// VerificationHistory — Student verification history panel
// Reads from localStorage and displays all past verifications with rich UI

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, ExternalLink, Copy, Check,
  QrCode, Trash2, RefreshCw, History, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

interface VerificationRecord {
  hash: string;
  status: "valid" | "invalid";
  timestamp: string;
  owner?: string;
}

export function VerificationHistory() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [openQR, setOpenQR] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem("recent_verifications");
      if (raw) {
        const parsed = JSON.parse(raw) as VerificationRecord[];
        setRecords(parsed);
      }
    } catch {
      setRecords([]);
    }
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem("recent_verifications");
    setRecords([]);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function copyLink(hash: string) {
    const url = `${window.location.origin}/verify/${hash}`;
    navigator.clipboard.writeText(url);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  }

  const verifyUrl = (hash: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${hash}`;

  if (records.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
          <History size={28} className="text-foreground/30" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground/60">No Verification History</p>
          <p className="text-sm text-foreground/40 mt-1">
            Documents you verify will appear here for quick access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">
            {records.length} Verification{records.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-foreground/40">stored locally</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="p-1.5 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-danger/70 hover:text-danger hover:bg-danger/10 rounded transition-colors"
          >
            <Trash2 size={12} /> Clear All
          </button>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-3">
        <AnimatePresence>
          {records.map((rec, idx) => (
            <motion.div
              key={rec.hash}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`card p-4 border-l-4 ${
                rec.status === "valid" ? "border-l-success" : "border-l-danger"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Status + Hash */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      rec.status === "valid"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {rec.status === "valid" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        rec.status === "valid" ? "text-success" : "text-danger"
                      }`}
                    >
                      {rec.status === "valid" ? "✓ Verified" : "✗ Not Found"}
                    </span>
                    <code className="text-[11px] font-mono text-foreground/60 bg-secondary px-2 py-0.5 rounded truncate block max-w-[200px] sm:max-w-none mt-1">
                      {rec.hash}
                    </code>
                    {rec.owner && (
                      <p className="text-xs text-foreground/50 mt-1 font-medium">Owner: {rec.owner}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={10} className="text-foreground/30" />
                      <span className="text-[10px] text-foreground/40">{rec.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setOpenQR(openQR === rec.hash ? null : rec.hash)}
                    className={`p-1.5 rounded transition-colors ${
                      openQR === rec.hash
                        ? "bg-primary/15 text-primary"
                        : "text-foreground/40 hover:text-primary hover:bg-primary/10"
                    }`}
                    title="Show QR Code"
                  >
                    <QrCode size={14} />
                  </button>
                  <button
                    onClick={() => copyLink(rec.hash)}
                    className="p-1.5 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Copy verification link"
                  >
                    {copied === rec.hash ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <a
                    href={verifyUrl(rec.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Open public verification page"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* QR Code Expand */}
              <AnimatePresence>
                {openQR === rec.hash && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-4">
                      <QRCodeDisplay value={verifyUrl(rec.hash)} size={100} label="Scan to Verify" />
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-xs font-bold text-foreground/60 mb-1">Public Verification Link</p>
                        <code className="text-[10px] font-mono text-foreground/50 bg-secondary px-2 py-1 rounded block break-all">
                          {verifyUrl(rec.hash)}
                        </code>
                        <p className="text-[10px] text-foreground/40 mt-2 leading-relaxed">
                          Share this QR or link with anyone to prove authenticity — no account needed.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-foreground/30 text-center flex items-center justify-center gap-1.5 pt-2">
        <Shield size={10} /> Verification history is stored locally on this device only.
      </p>
    </div>
  );
}
