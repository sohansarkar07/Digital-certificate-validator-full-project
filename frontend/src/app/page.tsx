"use client";

import { useState, useEffect } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { InstitutionDashboard } from "@/components/InstitutionDashboard";
import { BlockchainVerifier } from "@/components/BlockchainVerifier";
import { Shield, Search, Fingerprint, Settings, HelpCircle, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { ThemeToggle } from "@/components/ThemeToggle";
import { StellarProvider } from "@/hooks/useStellar";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"verify" | "issue">("verify");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when tab changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  return (
    <StellarProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-[280px] bg-surface border-r border-border shrink-0 flex flex-col z-40 shadow-xl lg:shadow-sm transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Branding & Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <h1 className="text-lg font-bold tracking-tight text-primary flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Shield size={14} strokeWidth={3} />
            </span>
            CertifyVal
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-foreground/50 hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Authority Card */}
        <div className="p-5 flex-shrink-0">
          <div className="p-3 bg-primary text-primary-foreground rounded flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary-foreground/10 flex items-center justify-center">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight uppercase tracking-wider">Validator Node</p>
              <p className="text-[10px] text-primary-foreground/50 font-mono tracking-widest mt-0.5">STELLAR-SOROBAN</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("verify")}
            className="w-full mt-3 py-2 px-4 bg-primary text-primary-foreground font-medium text-xs rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
          >
            <Search size={14} /> Verify Document
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab("verify")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
              activeTab === "verify" 
                ? "bg-secondary text-primary border-l-4 border-primary pl-2 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]" 
                : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            <Search size={16} className={activeTab === "verify" ? "text-primary" : "text-foreground/40"} />
            Verify Portal
          </button>
          
          <button
            onClick={() => setActiveTab("issue")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
              activeTab === "issue" 
                ? "bg-secondary text-primary border-l-4 border-primary pl-2 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]" 
                : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            <Fingerprint size={16} className={activeTab === "issue" ? "text-primary" : "text-foreground/40"} />
            Issuance Portal
          </button>
        </nav>

        {/* Footer Nav */}
        <div className="p-4 border-t border-border space-y-1 shrink-0 bg-surface">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors cursor-not-allowed">
            <Settings size={14} /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors cursor-not-allowed">
            <HelpCircle size={14} /> Support
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-background overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-border flex justify-between items-center px-4 md:px-8 shrink-0 relative z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-foreground/50 hover:text-foreground hover:bg-secondary rounded transition-colors"
            >
              <Menu size={20} />
            </button>
            <nav className="hidden md:flex items-center gap-6">
              <span className={`text-sm tracking-wide font-medium cursor-pointer transition-colors hover:-translate-y-[1px] ${activeTab==='verify' ? 'text-primary' : 'text-foreground/50 hover:text-foreground'}`} onClick={()=>setActiveTab("verify")}>Verify Portal</span>
              <span className={`text-sm tracking-wide font-medium cursor-pointer transition-colors hover:-translate-y-[1px] ${activeTab==='issue' ? 'text-primary' : 'text-foreground/50 hover:text-foreground'}`} onClick={()=>setActiveTab("issue")}>Issuance Portal</span>
            </nav>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <ThemeToggle />
            <div className="scale-90 md:scale-100 origin-right">
              <ConnectWallet />
            </div>
          </div>
        </header>

        {/* Scrollable Stage */}
        <div className="flex-1 overflow-y-auto w-full relative">
          <AnimatePresence mode="wait">
             {activeTab === "verify" ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="p-8 pb-32"
              >
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase">Digital Certificate Validator</span>
                        <h2 className="text-2xl font-semibold tracking-tight text-primary mt-1">Verify Document</h2>
                        <p className="text-sm text-foreground/60 mt-2 max-w-2xl leading-relaxed">
                            Upload a digital document to verify its cryptographic hash against the Soroban immutable ledger.
                        </p>
                    </div>
                    <BlockchainVerifier />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="issue"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="p-8 pb-32"
              >
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase">Digital Certificate Validator</span>
                        <h2 className="text-2xl font-semibold tracking-tight text-primary mt-1">Issue Credential</h2>
                        <p className="text-sm text-foreground/60 mt-2 max-w-2xl leading-relaxed">
                            Formally anchor new certified digital assets directly to the immutable Soroban decentralized ledger. Requires active institutional wallet authorization.
                        </p>
                    </div>
                    <InstitutionDashboard />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
    </StellarProvider>
  );
}
