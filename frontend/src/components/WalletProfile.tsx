"use client";
// WalletProfile — Slide-out profile panel tied to the connected wallet
// Shows: wallet identity, XLM balance, on-chain activity stats, quick actions

import { useState, useEffect, useCallback } from "react";
import {
  X, Copy, Check, ExternalLink, LogOut, Wallet,
  Award, ShieldCheck, Activity, Lock, Star,
  User, QrCode, ChevronRight, Anchor, Globe, Hexagon, Smartphone
} from "lucide-react";
import { useStellar } from "@/hooks/useStellar";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { dbGetIssuanceByWallet, dbGetBonds, dbGetCredentials, dbGetFeedback, dbGetTransactionsByWallet, type TransactionEntry } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { institutionService } from "@/services/institutionContract";

interface WalletStats {
  certsIssued: number;
  certsVerified: number;
  activeBonds: number;
  xlmLocked: number;
  credentialCount: number;
  feedbackGiven: number;
  institutionRegistered: boolean;
  transactionsCount: number;
  recentTransactions: TransactionEntry[];
  displayName: string | null;
  email: string | null;
}

const WALLET_ICON_MAP: Record<string, any> = {
  freighter: Anchor,
  albedo: Globe,
  xbull: ShieldCheck,
  metamask: Hexagon,
  lobstr: Smartphone,
};

const WALLET_COLOR_MAP: Record<string, string> = {
  freighter: "bg-[#1A1A1A] text-white",
  albedo: "bg-sky-500/10 text-sky-500",
  xbull: "bg-blue-500/10 text-blue-500",
  metamask: "bg-orange-500/10 text-orange-500",
  lobstr: "bg-red-500/10 text-red-500",
};

async function loadWalletStats(address: string): Promise<WalletStats> {
  if (!address) return { certsIssued: 0, certsVerified: 0, activeBonds: 0, xlmLocked: 0, credentialCount: 0, feedbackGiven: 0, institutionRegistered: false, transactionsCount: 0, recentTransactions: [], displayName: null, email: null };

  try {
    // Parallel fetch from Supabase
    const [
      issuance,
      credentials,
      bondsRes,
      instRes,
      fbRes,
      verifRes,
      txRes,
      profileRes
    ] = await Promise.all([
      dbGetIssuanceByWallet(address),
      dbGetCredentials(address),
      dbGetBonds(),
      institutionService.getAllInstitutions(),
      dbGetFeedback(),
      supabase.from("verifications").select("*", { count: "exact", head: true }).eq("verifier_wallet", address),
      dbGetTransactionsByWallet(address, 5),
      supabase.from("user_profiles").select("display_name, email").eq("wallet_address", address).maybeSingle()
    ]);

    const certsIssued = issuance.length;
    const certsVerified = verifRes.count ?? 0;
    const credentialCount = credentials.length;
    const institutionRegistered = instRes.some(i => i.walletAddress === address);
    const feedbackGiven = fbRes.filter(f => f.wallet_address === address).length;
    
    const myBonds = bondsRes.filter(b => b.institution === address);
    const activeBonds = myBonds.filter(b => b.status === "locked").length;
    const xlmLocked = myBonds.filter(b => b.status === "locked").reduce((s, b) => s + (b.amount_xlm ?? 0), 0);

    return { 
      certsIssued, 
      certsVerified, 
      activeBonds, 
      xlmLocked, 
      credentialCount, 
      feedbackGiven, 
      institutionRegistered,
      transactionsCount: txRes.length > 0 ? txRes.length : 0, 
      recentTransactions: txRes,
      displayName: profileRes.data?.display_name ?? null,
      email: profileRes.data?.email ?? null
    };
  } catch (e) {
    console.error("Failed to load wallet stats from DB", e);
    return { certsIssued: 0, certsVerified: 0, activeBonds: 0, xlmLocked: 0, credentialCount: 0, feedbackGiven: 0, institutionRegistered: false, transactionsCount: 0, recentTransactions: [], displayName: null, email: null };
  }
}

interface WalletProfileProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export function WalletProfile({ open, onClose, onNavigate }: WalletProfileProps) {
  const { address, isConnected, balance, walletType, disconnect } = useStellar();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [stats, setStats] = useState<WalletStats>({
    certsIssued: 0, certsVerified: 0, activeBonds: 0,
    xlmLocked: 0, credentialCount: 0, feedbackGiven: 0, institutionRegistered: false,
    transactionsCount: 0, recentTransactions: [], displayName: null, email: null
  });

  const refreshStats = useCallback(async () => {
    if (address) {
      const dbStats = await loadWalletStats(address);
      setStats(dbStats);
    }
  }, [address]);

  useEffect(() => {
    if (open && address) refreshStats();
  }, [open, address, refreshStats]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const WalletIcon = walletType && WALLET_ICON_MAP[walletType] ? WALLET_ICON_MAP[walletType] : Wallet;
  const walletColorClass = walletType ? (WALLET_COLOR_MAP[walletType] || "bg-primary/10 text-primary") : "bg-primary/10 text-primary";

  const formattedBalance = balance
    ? parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : "—";

  const shortAddress = address
    ? `${address.slice(0, 8)} ... ${address.slice(-8)}`
    : "Not connected";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Slide-out Panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[320px] bg-surface border-r border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Wallet Profile</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-secondary transition-colors text-foreground/50 hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Identity Card */}
              <div className="card p-5 border-t-4 border-t-primary bg-gradient-to-b from-primary/5 to-transparent">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${walletColorClass} shadow-sm`}>
                    <WalletIcon size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate max-w-[120px]">
                        {stats.displayName || (walletType ? walletType.charAt(0).toUpperCase() + walletType.slice(1) : "Wallet")}
                      </p>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success-bg px-1.5 py-0.5 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
                          Connected
                        </span>
                      )}
                    </div>
                    {stats.email && (
                      <p className="text-[11px] font-medium text-foreground/70 mt-1 truncate">
                        {stats.email}
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-foreground/40 mt-1 break-all leading-relaxed">
                      {shortAddress}
                    </p>
                    {/* Copy + Explorer */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-[10px] font-bold text-foreground/50 hover:text-primary transition-colors"
                      >
                        {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                      <span className="text-foreground/20">·</span>
                      <button
                        onClick={() => setShowQR(v => !v)}
                        className="flex items-center gap-1 text-[10px] font-bold text-foreground/50 hover:text-primary transition-colors"
                      >
                        <QrCode size={11} /> QR
                      </button>
                      {address && (
                        <>
                          <span className="text-foreground/20">·</span>
                          <a
                            href={`https://stellar.expert/explorer/testnet/account/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold text-foreground/50 hover:text-primary transition-colors"
                          >
                            <ExternalLink size={11} /> Explorer
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <AnimatePresence>
                  {showQR && address && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border flex justify-center"
                    >
                      <QRCodeDisplay value={address} size={120} label="Scan wallet address" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Balance */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">XLM Balance</span>
                  <span className="text-lg font-black text-foreground">{formattedBalance} <span className="text-xs font-bold text-foreground/40">XLM</span></span>
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">On-Chain Activity</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Transactions", value: stats.transactionsCount, icon: Activity, color: "text-brand-primary" },
                    { label: "Certs Issued", value: stats.certsIssued, icon: Award, color: "text-primary" },
                    { label: "Verifications", value: stats.certsVerified, icon: ShieldCheck, color: "text-success" },
                    { label: "Active Bonds", value: stats.activeBonds, icon: Lock, color: "text-stake-locked" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card p-3">
                      <div className={`${color} mb-1`}><Icon size={14} /></div>
                      <p className="text-base font-black text-foreground">{(value as number).toLocaleString()}</p>
                      <p className="text-[10px] text-foreground/40 uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passport Stats */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Platform Profile</p>
                <div className="space-y-1">
                  {[
                    {
                      label: "Credential Passport",
                      value: `${stats.credentialCount} credential${stats.credentialCount !== 1 ? "s" : ""}`,
                      icon: Award,
                      tab: "passport",
                    },
                    {
                      label: "Institution Status",
                      value: stats.institutionRegistered ? "Registered" : "Not Registered",
                      icon: Building2,
                      tab: "registry",
                      valueColor: stats.institutionRegistered ? "text-success" : "text-foreground/40",
                    },
                    {
                      label: "Feedback Submitted",
                      value: `${stats.feedbackGiven} review${stats.feedbackGiven !== 1 ? "s" : ""}`,
                      icon: Star,
                      tab: "feedback",
                    },
                  ].map(({ label, value, icon: Icon, tab, valueColor }) => (
                    <button
                      key={label}
                      onClick={() => { onNavigate(tab); onClose(); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors group text-left"
                    >
                      <div className="h-8 w-8 rounded bg-secondary group-hover:bg-surface flex items-center justify-center text-foreground/40 group-hover:text-primary transition-colors shrink-0">
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{label}</p>
                        <p className={`text-[10px] font-medium ${valueColor || "text-foreground/40"}`}>{value}</p>
                      </div>
                      <ChevronRight size={12} className="text-foreground/20 group-hover:text-foreground/50 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              {stats.recentTransactions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Recent Transactions</p>
                    <button 
                      onClick={() => { onNavigate("activity"); onClose(); }}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {stats.recentTransactions.map((tx, idx) => {
                      const isLink = !!tx.explorer_link;
                      const Wrapper = isLink ? "a" : "div";
                      const props = isLink ? {
                        href: tx.explorer_link,
                        target: "_blank",
                        rel: "noopener noreferrer"
                      } : {};
                      
                      return (
                        <Wrapper 
                          key={tx.id || idx}
                          {...props}
                          className={`block p-3 rounded-lg border border-border bg-surface-hover transition-colors group ${isLink ? 'hover:border-primary/50 cursor-pointer' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-success" />
                              <p className="text-xs font-semibold text-foreground">{tx.event_type}</p>
                            </div>
                            {isLink && <ExternalLink size={12} className="text-foreground/30 group-hover:text-primary" />}
                          </div>
                          <p className="text-[10px] font-mono text-foreground/50 mt-1 truncate">
                            {tx.hash.substring(0, 16)}...
                          </p>
                        </Wrapper>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Quick Actions</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => { onNavigate("passport"); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    <Award size={14} /> View Credential Passport
                  </button>
                  <button
                    onClick={() => { onNavigate("issue"); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-secondary border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <ShieldCheck size={14} /> Issue a Certificate
                  </button>
                  {address && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-2.5 bg-secondary border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface-hover transition-colors"
                    >
                      <ExternalLink size={14} /> View on Stellar Explorer
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Footer — Disconnect */}
            <div className="p-4 border-t border-border bg-surface shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-mono text-foreground/30 truncate">{address}</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-danger/30 text-danger text-xs font-bold hover:bg-danger/10 transition-colors"
              >
                <LogOut size={14} /> Disconnect Wallet
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Compact Profile Button (for sidebar) ──────────────────────────────────────
export function WalletProfileButton({ onClick }: { onClick: () => void }) {
  const { address, isConnected, balance, walletType } = useStellar();
  if (!isConnected || !address) return null;

  const WalletIcon = walletType && WALLET_ICON_MAP[walletType] ? WALLET_ICON_MAP[walletType] : Wallet;
  const formattedBalance = balance
    ? parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary hover:border-primary/30 transition-all group text-left"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <WalletIcon size={16} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">
          {walletType ? walletType.charAt(0).toUpperCase() + walletType.slice(1) : "Wallet"}
        </p>
        <p className="text-[10px] text-foreground/40 font-mono truncate">
          {address.slice(0, 6)}...{address.slice(-6)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold text-foreground">{formattedBalance}</p>
        <p className="text-[9px] text-foreground/30 uppercase">XLM</p>
      </div>
    </button>
  );
}

// need Building2 for the platform profile section
function Building2({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

