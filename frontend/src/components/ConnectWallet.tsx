"use client";

import { useState } from "react";
import { useStellar, WalletType } from "@/hooks/useStellar";
import { Wallet, LogOut, ChevronRight, Check, Shield, Globe, Hexagon, Smartphone, Anchor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WALLETS = [
  { id: 'freighter' as const, name: 'Freighter', icon: Anchor, color: '#FFFFFF', bg: 'bg-[#1A1A1A]' },
  { id: 'albedo' as const, name: 'Albedo', icon: Globe, color: '#38bdf8', bg: 'bg-[#0ea5e9]/10' },
  { id: 'xbull' as const, name: 'xBull', icon: Shield, color: '#3b82f6', bg: 'bg-[#3b82f6]/10' },
  { id: 'metamask' as const, name: 'MetaMask', icon: Hexagon, color: '#f97316', bg: 'bg-[#f97316]/10' },
  { id: 'lobstr' as const, name: 'LOBSTR', icon: Smartphone, color: '#ef4444', bg: 'bg-[#ef4444]/10' }
];

export function ConnectWallet() {
  const { address, connect, disconnect, isConnected, connecting, walletType, error, balance } = useStellar();
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="flex items-center gap-3 relative z-50">
      {isConnected ? (
        <div className="flex items-center gap-2 p-1 rounded-full border border-border bg-surface hover:bg-surface-hover shadow-sm transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet size={14} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col px-2 items-start justify-center py-1">
            <span className="text-sm font-semibold text-foreground leading-tight">
              {address?.slice(0, 4)}...{address?.slice(-4)}
            </span>
            {balance && (
                <span className="text-[10px] font-bold text-primary/80 leading-none mt-0.5">
                    {balance} XLM
                </span>
            )}
          </div>
          <button
            onClick={disconnect}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-foreground/40 hover:text-foreground mr-0.5"
            title="Disconnect"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowSelector(!showSelector)}
            disabled={connecting}
            className="group flex items-center gap-2 pl-5 pr-3 py-2.5 rounded-full bg-foreground text-background font-medium text-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
          >
           <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
            <span className="bg-background/10 text-background p-1 rounded-full">
              <ChevronRight size={14} strokeWidth={3} className={showSelector ? "rotate-90 transition-transform" : "transition-transform"} />
            </span>
          </button>

          <AnimatePresence>
            {showSelector && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-64 p-2 rounded-2xl bg-surface border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.8)] z-50 backdrop-blur-xl"
              >
                <div className="px-3 pt-3 pb-2 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.15em]">Select Provider</span>
                </div>
                
                <div className="space-y-0.5">
                  {WALLETS.map((w) => {
                    const Icon = w.icon;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          connect(w.id);
                          setShowSelector(false);
                        }}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${w.bg} border border-white/5`}>
                                <Icon size={16} strokeWidth={2.5} color={w.color} />
                            </div>
                            <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">{w.name}</span>
                        </div>
                        {walletType === w.id && (
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                                <Check size={12} strokeWidth={3} className="text-primary" />
                            </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-3 w-64 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-400 z-40 shadow-xl"
            >
              <span className="font-semibold block mb-0.5 text-red-300">Connection Failed</span>
              <span className="opacity-90 leading-tight">{error}</span>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
