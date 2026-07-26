"use client";
// LandingPage.tsx — Marketing Landing Page with Spline Integration

import React from "react";

import {
  ArrowRight,
  Shield,
  Search,
  Fingerprint,
  Building2,
  CheckCircle2,
  FileText,
  Lock,
  ExternalLink,
  BrainCircuit,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigate: (tabId: string) => void;
}

export function LandingPage({ onGetStarted, onNavigate }: LandingPageProps) {
  return (
    <div className="h-screen overflow-y-auto bg-[#000000] text-white font-sans selection:bg-white/20 overflow-x-hidden">
      
      {/* ── Background Effects ── */}
      <div className="fixed inset-0 z-0 opacity-100 flex items-center justify-center bg-[#000000]">
        
        {/* 
          WEBGL ASPECT RATIO HACK:
          Restored to 250vw to guarantee text NEVER hides/clips. 
        */}
        <div className="absolute flex items-center justify-center w-[250vw] h-[130vh] scale-[0.4] origin-center -translate-y-[4%] md:w-full md:h-full md:inset-0 md:scale-[1.25] md:-translate-y-[12%]">
          <iframe
            src="https://my.spline.design/prismcoin-0LEOm7tWbmZ2Ygsv5NhrYcuV/?v=4"
            frameBorder="0"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="CertifyVal 3D"
          />
          {/* Watermark Cover */}
          <div className="absolute bottom-0 right-0 w-[400px] h-[150px] md:w-[180px] md:h-[60px] bg-[#000000] z-50 pointer-events-none" />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/80 via-transparent to-[#000000] z-10 pointer-events-none" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-6 py-4 max-w-7xl mx-auto mt-2 md:mt-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 mx-2 md:mx-auto">
        <div className="flex items-center gap-2 text-lg md:text-xl font-bold tracking-tight">
          CertifyVal
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-white/60">
          <button onClick={() => onNavigate("verify")} className="hover:text-white transition-colors border-b border-white pb-1 text-white">Verify Portal</button>
          <button onClick={() => onNavigate("issue")} className="hover:text-white transition-colors">Issuance Portal</button>
          <button onClick={() => onNavigate("registry")} className="hover:text-white transition-colors">Institution Registry</button>
          <button onClick={() => onNavigate("documentation")} className="hover:text-white transition-colors">Documentation</button>
        </nav>
        <button 
          onClick={onGetStarted}
          className="bg-white text-black px-4 py-2 rounded text-xs font-bold hover:bg-white/90 transition-colors"
        >
          Connect Wallet
        </button>
      </header>

      <main className="relative z-20">
        
        {/* ── Hero Section ── */}
        <section className="flex flex-col items-center justify-center text-center px-4 h-[100svh] md:h-auto md:min-h-[88vh] max-w-4xl mx-auto relative z-20 pointer-events-none">
          
          {/* Top Pill - Absolutely positioned on mobile to hug the ring */}
          <div 
            className="mt-6 md:mt-4 mb-auto inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/90 animate-in fade-in slide-in-from-top-4 duration-700 shadow-2xl pointer-events-auto"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
            Testnet: Live on Stellar
          </div>
            
          {/* Bottom Buttons - Absolutely positioned on mobile to hug the text */}
          <div 
            className="absolute top-[62dvh] md:relative md:top-auto md:mt-auto md:mb-[6vh] flex flex-col sm:flex-row items-center gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 w-full justify-center pointer-events-auto z-50"
          >
            <button 
              onClick={onGetStarted}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/20 hover:scale-105 transition-all w-full sm:w-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              Get Started <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => onNavigate("verify")}
              className="bg-black/20 backdrop-blur-2xl border border-white/10 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/5 hover:scale-105 transition-all w-full sm:w-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              Verify Document <Shield size={14} />
            </button>
          </div>
        </section>

        {/* ── Stats Bar ── */}
      <div className="relative z-20 border-t border-white/5 bg-black/60 backdrop-blur-xl py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-white/5">
            <div className="text-center md:text-left px-4">
              <p className="text-[9px] font-bold tracking-widest uppercase text-white/40 mb-2">Total Institutions</p>
              <p className="text-2xl font-bold tracking-tight">1,250+</p>
            </div>
            <div className="text-center md:text-left px-4">
              <p className="text-[9px] font-bold tracking-widest uppercase text-white/40 mb-2">Certificates Issued</p>
              <p className="text-2xl font-bold tracking-tight">842,000+</p>
            </div>
            <div className="text-center md:text-left px-4">
              <p className="text-[9px] font-bold tracking-widest uppercase text-white/40 mb-2">Validation Latency</p>
              <p className="text-2xl font-bold tracking-tight">&lt; 3.2s</p>
            </div>
            <div className="text-center md:text-left px-4">
              <p className="text-[9px] font-bold tracking-widest uppercase text-white/40 mb-2">On-Chain Transactions</p>
              <p className="text-2xl font-bold tracking-tight">4.1M+</p>
            </div>
          </div>
        </div>

        {/* ── Ecosystem ── */}
        <section className="max-w-7xl mx-auto px-6 py-24 bg-[#000000]">
          <h2 className="text-2xl font-semibold mb-10 tracking-tight">The Ecosystem</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-white/10 bg-[#0f0f0f] p-8 rounded flex flex-col relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-5 -translate-y-1/4 translate-x-1/4 transition-transform group-hover:scale-110">
                <Shield size={240} strokeWidth={1} />
              </div>
              <div className="h-10 w-10 border border-white/10 rounded flex items-center justify-center bg-white/5 mb-6">
                <Fingerprint size={20} />
              </div>
              <h3 className="text-lg font-semibold mb-3">Issuance Portal</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm">
                Authorized entities can mint non-transferable verification tokens (SBTs) directly onto the Stellar blockchain. Automated workflows for bulk issuance.
              </p>
              <button onClick={() => onNavigate("issue")} className="mt-auto inline-flex items-center gap-2 text-xs font-bold hover:text-white/80 transition-colors">
                Access Portal <ExternalLink size={12} />
              </button>
            </div>
            
            <div className="border border-white/10 bg-[#0f0f0f] p-8 rounded flex flex-col relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-5 -translate-y-1/4 translate-x-1/4 transition-transform group-hover:scale-110">
                <Search size={240} strokeWidth={1} />
              </div>
              <div className="h-10 w-10 border border-white/10 rounded flex items-center justify-center bg-white/5 mb-6">
                <Search size={20} />
              </div>
              <h3 className="text-lg font-semibold mb-3">Verify Portal</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm">
                Public-facing tool for instant credential validation. Drag-and-drop hash matching against the immutable Soroban smart contract registry.
              </p>
              <button onClick={() => onNavigate("verify")} className="mt-auto inline-flex items-center gap-2 text-xs font-bold hover:text-white/80 transition-colors">
                Access Portal <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Journey ── */}
        <section className="bg-[#0f0f0f] border-y border-white/5 py-24">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-semibold mb-2 tracking-tight">The Verification Journey</h2>
            <p className="text-white/50 text-sm mb-16">Simple, decentralized, and mathematically indisputable.</p>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Animated Pipeline Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-[2px] bg-white/5 overflow-hidden z-0">
                <div 
                  className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" 
                  style={{ animation: 'pipeline-flow 3s ease-in-out infinite' }} 
                />
              </div>

              {/* Animated Pipeline Connecting Line (Mobile) */}
              <div className="md:hidden absolute top-[10%] bottom-[10%] left-1/2 -translate-x-1/2 w-[2px] bg-white/5 overflow-hidden z-0">
                <div 
                  className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent" 
                  style={{ animation: 'pipeline-flow-vertical 3s ease-in-out infinite' }} 
                />
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes pipeline-flow {
                  0% { transform: translateX(-100%); opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { transform: translateX(300%); opacity: 0; }
                }
                @keyframes pipeline-flow-vertical {
                  0% { transform: translateY(-100%); opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { transform: translateY(300%); opacity: 0; }
                }
              `}} />
              
              <div className="flex flex-col items-center relative z-10 group">
                <div className="h-16 w-16 border border-white/10 bg-[#000000] rounded flex items-center justify-center mb-6 transition-all duration-500 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <FileText size={20} className="text-white/70 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="font-semibold mb-3 text-sm group-hover:text-emerald-400 transition-colors">1. Upload & Hash</h3>
                <p className="text-[11px] text-white/50 leading-relaxed max-w-[220px]">
                  Document content is locally hashed (SHA-256). No sensitive data ever leaves your browser or enters the chain.
                </p>
              </div>

              {/* Step 2: AI Fraud Analysis */}
              <div className="flex flex-col items-center relative z-10 group">
                <div className="h-16 w-16 border border-white/10 bg-[#000000] rounded flex items-center justify-center mb-6 transition-all duration-500 group-hover:border-rose-500/50 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                  <BrainCircuit size={20} className="text-white/70 group-hover:text-rose-400 transition-colors" />
                </div>
                <h3 className="font-semibold mb-3 text-sm group-hover:text-rose-400 transition-colors">2. AI Fraud Analysis</h3>
                <p className="text-[11px] text-white/50 leading-relaxed max-w-[220px]">
                  Our AI engine scans for document tampering, heuristic anomalies, and metadata inconsistencies in real-time.
                </p>
              </div>
              <div className="flex flex-col items-center relative z-10 group">
                <div className="h-16 w-16 border border-white/10 bg-[#000000] rounded flex items-center justify-center mb-6 transition-all duration-500 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <Lock size={20} className="text-white/70 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="font-semibold mb-3 text-sm group-hover:text-blue-400 transition-colors">3. Soroban Lockup</h3>
                <p className="text-[11px] text-white/50 leading-relaxed max-w-[220px]">
                  Our smart contracts query the global registry for a matching hash-institution pair on the Stellar network.
                </p>
              </div>
              <div className="flex flex-col items-center relative z-10 group">
                <div className="h-16 w-16 border border-white/10 bg-[#000000] rounded flex items-center justify-center mb-6 transition-all duration-500 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <CheckCircle2 size={20} className="text-white/70 group-hover:text-purple-400 transition-colors" />
                </div>
                <h3 className="font-semibold mb-3 text-sm group-hover:text-purple-400 transition-colors">4. On-Chain Verdict</h3>
                <p className="text-[11px] text-white/50 leading-relaxed max-w-[220px]">
                  Instant cryptographic proof of validity. Issuer identity and issuance date is returned with a signed receipt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Institution Registry ── */}
        <section className="max-w-7xl mx-auto px-6 py-24 bg-[#0a0a0a]">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-4 tracking-tight">Global Institution Registry</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-md">
                The Institution Registry is a vetted whitelist of global authorities. Only registered institutions can mint certificates, ensuring that every on-chain record originates from a trusted source.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 size={16} className="text-white/50" /> Decentralized Governance Approval
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 size={16} className="text-white/50" /> Anti-Phishing Fraud Verification
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 size={16} className="text-white/50" /> Multi-sig Administrative Controls
                </li>
              </ul>
              
              <button 
                onClick={() => onNavigate("registry")}
                className="bg-transparent text-white px-5 py-2.5 rounded text-xs font-bold border border-white/20 hover:bg-white/5 transition-all"
              >
                Apply for Registry
              </button>
            </div>
            
            <div className="border border-white/10 bg-[#0f0f0f] rounded p-1">
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/40">Verified Institutions</p>
                <p className="text-[9px] text-white/40">Real-time Feed</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { name: "Standard Chartered Bank", cty: "SGP", hash: "...4A9X" },
                  { name: "University of Oxford", cty: "GBR", hash: "...09MA" },
                  { name: "WHO Global Registry", cty: "CHE", hash: "...F72E" }
                ].map((inst, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-white/5 bg-[#141414] rounded">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{inst.name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{inst.cty} • {inst.hash}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#0f0f0f] border-t border-white/5 py-32 text-center px-4">
          <h2 className="text-3xl font-semibold mb-4 tracking-tight">Ready to Secure Your Institution?</h2>
          <p className="text-white/50 text-sm max-w-md mx-auto mb-10 leading-relaxed">
            Join the global network of trusted verifiers. Implement CertifyVal&apos;s protocol in hours and eliminate credential fraud forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="bg-white text-black px-6 py-3 rounded text-sm font-bold hover:bg-white/90 transition-all w-full sm:w-auto"
            >
              Request API Access
            </button>
            <button 
              onClick={onGetStarted}
              className="bg-transparent text-white px-6 py-3 rounded text-sm font-bold border border-white/20 hover:bg-white/5 transition-all w-full sm:w-auto"
            >
              Schedule a Demo
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/5 bg-[#0a0a0a] py-8 px-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold tracking-tight mb-1">CertifyVal.</div>
            <p className="text-[10px] text-white/40">© 2026 CertifyVal Protocol. Secure On-Chain Verification.</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold tracking-wider uppercase text-white/40">
            <a href="#" className="hover:text-white transition-colors">Term of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Security Audit</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
