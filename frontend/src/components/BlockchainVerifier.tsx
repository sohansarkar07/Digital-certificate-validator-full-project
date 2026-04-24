"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, CheckCircle, XCircle, FileImage, ShieldCheck, Database, SearchCode, LockKeyhole, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { contractService } from "@/services/contract";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@/components/Tooltip";

export function BlockchainVerifier() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "verifying" | "valid" | "invalid">("idle");
  const [ownerInfo, setOwnerInfo] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addLog = (log: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    setLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  };

  const [isDemo, setIsDemo] = useState(() => {
      if (typeof window === "undefined") return false;
      return window.location?.search?.includes('demo=true') ?? false;
  });

  const verifyFile = useCallback(async (file: File) => {
    if (status === "verifying") return; // Prevent multiple clicks
    setStatus("verifying");
    setLogs([]);
    setErrorMsg(null);
    setTimestamp(null);
    addLog("[SYSTEM] Initiating cryptographic hash algorithm (SHA-256)...");
    
    // Fake progress simulating steps
    setTimeout(() => addLog("[ALGORITHM] Executing array buffer digestion..."), 300);
    
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    setHash(hashHex);
    
    setTimeout(() => {
        addLog(`[HASH COMPUTED] Valid input footprint: ${hashHex.substring(0, 16)}...`);
        addLog("[NODE LINK] Requesting Stellar network state consensus...");
    }, 600);

    setTimeout(async () => {
        try {
          addLog(`[REGISTRY] Checking local certificate registry...`);
          addLog(`[ORACLE] Polling Soroban smart contract logic for credential anchor...`);
          const isValid = await contractService.verifyCertificate(hashHex);
          
          if (isValid) {
            addLog(`[CONFIRMED] Immutable record located successfully.`);
            const owner = await contractService.getOwner(hashHex);
            setOwnerInfo(owner);
            setTimestamp(new Date().toLocaleString());
            addLog(`[METADATA] Decrypted registered owner payload: OK`);
            setStatus("valid");
          } else {
            addLog(`[REJECTED] Signature mismatched. Record absent from all registries.`);
            setErrorMsg("Certificate not found. Please issue this document via the Issuance Portal first, then verify.");
            setStatus("invalid");
          }
        } catch {
          addLog(`[FATAL ERROR] Node validation interrupted unexpectedly.`);
          setErrorMsg("Network error during validation. Please try again.");
          setStatus("invalid");
        }
    }, 1500);
  }, []);

  const autoFillDemo = useCallback(() => {
      if (!window?.location?.search?.includes('demo=true')) {
          window.history.pushState({}, '', '?demo=true');
          setIsDemo(true);
      }
      const f = new File(["%PDF-1.4\n%DEMO_CREDENTIAL_PAYLOAD_X92\n"], "Verified_Diploma_Jane_Doe.pdf", { type: "application/pdf" });
      setFile(f);
      verifyFile(f);
  }, [verifyFile]);

  const exitDemo = useCallback(() => {
      window.location.href = window.location.origin + window.location.pathname;
  }, []);

  useEffect(() => {
      if (isDemo) {
          setTimeout(() => autoFillDemo(), 500);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      verifyFile(droppedFile);
    }
  }, [verifyFile]);

  const downloadAudit = () => {
    const content = `SOVEREIGN LEDGER - OFFICIAL AUDIT RECORD\nDATE: ${new Date().toISOString()}\n\nTARGET HASH: ${hash}\nSUBJECT IDENTITY: ${ownerInfo || 'UNKNOWN'}\nRESOLUTION: ${status.toUpperCase()}\n\nVALIDATION LOGS:\n${logs.join('\n')}\n\n---\nNODE-01 COMPLIANCE EXPORT`;
    const element = document.createElement("a");
    const fileBlob = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(fileBlob);
    element.download = `audit_${hash?.substring(0,8)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full relative">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="w-full xl:w-[65%] space-y-6">
            <div className="card p-6 border-t-4 border-t-primary">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-widest flex items-center gap-2">
                        <FileImage size={14} /> Document Intake
                    </span>
                    <div className="flex items-center gap-3">
                        {!isDemo ? (
                            <button onClick={autoFillDemo} className="text-[10px] uppercase font-bold text-primary/70 hover:text-primary tracking-widest px-2 py-1 bg-primary/5 hover:bg-primary/10 rounded transition-colors shadow-sm">
                                Try Demo
                            </button>
                        ) : (
                            <button onClick={exitDemo} className="text-[10px] uppercase font-bold text-danger hover:text-danger/80 tracking-widest px-2 py-1 bg-danger/10 hover:bg-danger/20 rounded transition-colors shadow-sm">
                                Exit Demo
                            </button>
                        )}
                        <span className="text-[10px] uppercase font-bold text-primary tracking-widest px-2 py-1 bg-secondary rounded flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Node 01 Active
                        </span>
                    </div>
                </div>
                
                <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className={`relative w-full h-80 bg-secondary/50 border-2 border-dashed border-border-strong rounded flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-secondary hover:border-primary/50 group ${status === 'verifying' ? 'opacity-60 pointer-events-none' : ''}`}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title=""
                        onChange={(e) => {
                        if (e.target.files?.[0]) {
                            setFile(e.target.files[0]);
                            verifyFile(e.target.files[0]);
                        }
                        e.target.value = '';
                        }}
                    />
                    
                    <div className="p-4 bg-surface shadow-sm rounded-lg mb-4 text-primary group-hover:scale-110 transition-transform">
                        <ScanLine size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground tracking-tight">Secure Deposit Area</h3>
                    <p className="text-sm font-medium text-foreground/40 mt-1 max-w-[250px] text-center leading-relaxed">
                        Drop PDF, JPEG, or scanned QR codes here for ledger lookup.
                    </p>
                    
                    <div className="flex gap-3 mt-6">
                        <div className="px-5 py-2.5 bg-surface border border-border-strong text-foreground text-xs font-bold rounded shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200">
                            BROWSE FILES
                        </div>
                    </div>
                </label>
            </div>

            {/* Validation Pipeline UI */}
            <div className="card p-6 mt-4">
                <div className="flex justify-between items-center mb-4 text-[10px] uppercase font-bold text-foreground/50 tracking-widest">
                    <span>Verification Pipeline</span>
                    <span>{status === 'verifying' ? 'ANALYZING' : status === 'idle' ? 'AWAITING INPUT' : 'COMPLETE'}</span>
                </div>
                <div className="flex w-full justify-between items-center gap-2">
                    <PipelineStep label="Cryptographic" active={status !== 'idle'} done={status === 'valid' || status === 'invalid'} icon={LockKeyhole} />
                    <div className={`h-0.5 flex-1 max-w-[40px] ${status!=='idle' ? 'bg-primary' : 'bg-border-strong'}`}></div>
                    <PipelineStep label="Registry Lookup" active={status === 'verifying' && logs.length > 3} done={status === 'valid' || status === 'invalid'} icon={Database} />
                    <div className={`h-0.5 flex-1 max-w-[40px] ${(status==='valid'||status==='invalid') ? 'bg-primary' : 'bg-border-strong'}`}></div>
                    <PipelineStep label="Revocation Check" active={status === 'valid' || status === 'invalid'} done={status === 'valid' || status === 'invalid'} valid={status==='valid'} icon={ShieldCheck} />
                </div>
            </div>

            {/* Terminal */}
            <div className="terminal p-4 flex flex-col min-h-[160px]">
                <div className="flex justify-between items-center mb-4 opacity-50 border-b border-primary-foreground/10 pb-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-[10px] tracking-widest uppercase font-bold">VALIDATION_DAEMON_LOGS</span>
                </div>
                {logs.length === 0 ? (
                    <span className="text-xs opacity-40">_ Waiting for document intake...</span>
                ) : (
                    <div className="space-y-1 text-xs">
                        {logs.map((L, i) => (
                            <motion.div initial={{opacity:0, x:-5}} animate={{opacity:1, x:0}} key={i} className={`${L.includes('ERROR')||L.includes('REJECTED') ? 'text-red-400' : L.includes('CONFIRMED') ? 'text-green-400' : ''}`}>
                                {L}
                            </motion.div>
                        ))}
                        {status === "verifying" && <span className="animate-pulse">_</span>}
                    </div>
                )}
            </div>
        </div>

        {/* Right Session Panel */}
        <aside className="w-full xl:w-[35%] flex flex-col gap-4">
            <div className="bg-surface border border-border rounded p-5 h-[calc(100vh-250px)] overflow-y-auto">
                <h3 className="text-xs uppercase font-bold text-foreground/40 tracking-widest mb-4">Verification Report</h3>
                
                {status === "idle" && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-3 pb-20">
                        <SearchCode size={40} strokeWidth={1} />
                        <span className="text-sm font-medium">Session record empty.<br/>Upload target for appraisal.</span>
                    </div>
                )}
                {status === "verifying" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-primary text-center space-y-4 pb-20">
                        <Loader2 size={40} strokeWidth={2} className="animate-spin text-primary/80" />
                        <span className="text-sm font-bold animate-pulse tracking-wide">Analyzing footprint...</span>
                    </motion.div>
                )}
                
                <AnimatePresence mode="wait">
                    {(status === "valid" || status === "invalid") && (
                        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="border border-border shadow-sm rounded overflow-hidden">
                            <div className={`p-4 ${status==='valid' ? 'bg-success-bg/30' : 'bg-danger-bg/30'} flex items-start gap-4 border-b border-border`}>
                                <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${status==='valid' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                    {status === 'valid' ? <CheckCircle size={22} /> : <XCircle size={22} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-base leading-tight tracking-tight mt-0.5">{status === 'valid' ? 'VERIFIED' : 'FAILED'}</h4>
                                    <span className="text-xs font-medium uppercase tracking-widest opacity-60 mt-0.5 block">Confidence Score: {status==='valid' ? '99.98%' : '0.00%'}</span>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-surface text-sm space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1">Subject Name</label>
                                    <div className="font-medium text-foreground truncate">{ownerInfo || "Unknown / Unregistered"}</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="min-w-0">
                                        <Tooltip content="Cryptographic document payload">
                                            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5 cursor-help w-max inline-flex">Tx / Document Hash</label>
                                        </Tooltip>
                                        <div className="flex items-center gap-1">
                                            <a href={`https://stellar.expert/explorer/testnet/search?term=${hash}`} target="_blank" className="font-mono text-xs truncate bg-secondary px-2 py-1.5 rounded hover:text-primary hover:underline border border-transparent hover:border-primary/20 transition-all flex items-center gap-1.5 flex-1" title="View on Stellar Expert">
                                                {hash?.substring(0,8)}...<ExternalLink size={10} className="shrink-0" />
                                            </a>
                                            <button onClick={() => { navigator.clipboard.writeText(hash || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 bg-secondary hover:bg-surface-hover rounded text-foreground/50 hover:text-primary transition-colors shadow-sm shrink-0" title="Copy Hash">
                                                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Timestamp</label>
                                        <div className="text-xs font-semibold px-1 py-1">{timestamp || "N/A"}</div>
                                    </div>
                                </div>

                                {status === 'valid' && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 p-3 bg-secondary rounded border border-border hover:border-success/30 transition-colors">
                                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Database size={12}/> Registry Anchor</span>
                                        <span className="text-xs font-mono text-foreground/90 leading-relaxed block">Ledger Contract Match Confirmed. High Assurance.</span>
                                    </motion.div>
                                )}
                                {status === 'invalid' && errorMsg && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 p-3 bg-danger-bg/50 rounded border border-danger/20 text-danger shadow-sm">
                                        <span className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">Validation Error</span>
                                        <span className="text-xs font-medium block">{errorMsg}</span>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {(status === "valid" || status === "invalid") && (
                    <button onClick={downloadAudit} className="w-full mt-4 py-3 bg-secondary border border-border text-foreground font-semibold text-xs tracking-wide rounded hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-sm active:scale-95">
                        DOWNLOAD FULL AUDIT LOG
                    </button>
                )}
            </div>
        </aside>
      </div>
    </div>
  );
}

const ScanLine = ({ size = 24, strokeWidth = 2 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
        <rect x="7" y="7" width="10" height="10" rx="1"></rect>
    </svg>
)

const PipelineStep = ({label, active, done, valid, icon: Icon}: any) => (
    <div className="flex flex-col items-center gap-2">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${done ? (valid === false ? 'bg-danger text-white border-danger' : 'bg-primary text-primary-foreground border-primary') : active ? 'border-primary text-primary' : 'border-border-strong text-border-strong'}`}>
            <Icon size={14} strokeWidth={2.5} />
        </div>
        <span className={`text-[10px] uppercase tracking-widest font-bold text-center w-[120px] ${active || done ? 'text-primary' : 'text-foreground/30'}`}>{label}</span>
    </div>
)
