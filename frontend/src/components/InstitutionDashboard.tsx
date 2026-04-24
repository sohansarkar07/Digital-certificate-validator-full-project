"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, CheckCircle, Info, LockKeyhole, User, Copy, Check, ExternalLink, Download } from "lucide-react";
import { useStellar } from "@/hooks/useStellar";
import { contractService } from "@/services/contract";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@/components/Tooltip";
import { PDFDocument, rgb } from "pdf-lib";

export function InstitutionDashboard() {
  const { address, isConnected, sign } = useStellar();
  
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<"idle" | "hashing" | "submitting" | "success" | "error">("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [errorHeader, setErrorHeader] = useState("");
  const [copied, setCopied] = useState(false);
  const [stampedDocUrl, setStampedDocUrl] = useState<string | null>(null);

  const generateHash = useCallback(async (file: File) => {
    setStatus("hashing");
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    setHash(hashHex);
    setStatus("idle");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      generateHash(droppedFile);
    }
  }, [generateHash]);

  const [isDemo, setIsDemo] = useState(() => {
      if (typeof window === "undefined") return false;
      return window.location?.search?.includes('demo=true') ?? false;
  });

  const autoFillDemo = useCallback(() => {
      if (!window?.location?.search?.includes('demo=true')) {
          window.history.pushState({}, '', '?demo=true');
          setIsDemo(true);
      }
      const f = new File(["%PDF-1.4\n%DEMO_CREDENTIAL_PAYLOAD_X92\n"], "Verified_Diploma_Jane_Doe.pdf", { type: "application/pdf" });
      setFile(f);
      generateHash(f);
      setOwner("Jane Doe / License #0921");
  }, [generateHash]);

  const exitDemo = useCallback(() => {
      window.location.href = window.location.origin + window.location.pathname;
  }, []);

  const handleIssue = async () => {
    if (!address || !hash || !owner) return;
    setStatus("submitting");
    try {
      const h = await contractService.issueCertificate(hash, owner, address, sign);
      setTxId(h);
      
      // Perform PDF Stamping if the file is a PDF
      if (file && file.type === "application/pdf") {
          try {
              const arrayBuffer = await file.arrayBuffer();
              const pdfDoc = await PDFDocument.load(arrayBuffer);
              const pages = pdfDoc.getPages();
              if (pages.length > 0) {
                  const firstPage = pages[0];
                  
                  firstPage.drawText(`VERIFIED ANCHOR: ${h}`, {
                      x: 30,
                      y: 30,
                      size: 10,
                      color: rgb(0.06, 0.72, 0.5), // Subtle Green
                  });
                  
                  const pdfBytes = await pdfDoc.save();
                  const blob = new Blob([pdfBytes.slice()], { type: "application/pdf" });
                  setStampedDocUrl(URL.createObjectURL(blob));
              }
          } catch(e) {
              console.warn("Failed to stamp PDF.", e);
          }
      }
      
      setStatus("success");
    } catch (e: any) {
      setErrorHeader(e.message || "Failed to issue certificate.");
      setStatus("error");
    }
  };

  useEffect(() => {
      if (isDemo) {
          setTimeout(() => autoFillDemo(), 500);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isConnected) return (
    <div className="card max-w-xl mx-auto p-16 text-center shadow-sm relative">
      {isDemo && <button onClick={autoFillDemo} className="hidden" id="demo-btn">DEMO</button>}
      <div className="mb-6 flex justify-center">
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-foreground/40 border border-border">
          <LockKeyhole size={28} strokeWidth={1.5} />
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground tracking-tight">Wallet Disconnected</h2>
      <p className="text-sm text-foreground/50 max-w-[280px] mx-auto leading-relaxed">
        Please connect an authorized institutional wallet to anchor new states to the ledger.
      </p>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-32 relative">
      <div className="card p-8 shadow-sm border border-border">
        {/* Upload Block */}
        <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Target Document</label>
            {!isDemo ? (
                <button onClick={autoFillDemo} className="text-[10px] uppercase font-bold text-primary/70 hover:text-primary tracking-widest px-2 py-1 bg-primary/5 hover:bg-primary/10 rounded transition-colors shadow-sm">
                    Try Demo
                </button>
            ) : (
                <button onClick={exitDemo} className="text-[10px] uppercase font-bold text-danger hover:text-danger/80 tracking-widest px-2 py-1 bg-danger/10 hover:bg-danger/20 rounded transition-colors shadow-sm">
                    Exit Demo
                </button>
            )}
        </div>
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="relative group border-2 border-dashed border-border-strong rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary hover:bg-secondary/40 transition-colors"
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title=""
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFile(e.target.files[0]);
                generateHash(e.target.files[0]);
              }
              e.target.value = '';
            }}
          />
          <div className="h-12 w-12 rounded-full bg-surface shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Upload size={20} strokeWidth={2} />
          </div>
          <div className="text-center mt-2">
            <h3 className="text-sm font-semibold text-foreground">
              {file ? file.name : "Select or Drop Document"}
            </h3>
            {hash ? (
               <p className="text-xs text-primary/70 mt-1.5 font-mono px-2 py-0.5 bg-primary/5 rounded border border-primary/10">SHA: {hash.substring(0, 24)}...</p>
            ) : (
               <p className="text-xs text-foreground/40 mt-1 max-w-[200px] leading-relaxed mx-auto">Supports PDF, JPEG, or PNG formats.</p>
            )}
          </div>
        </label>

        <div className="mt-8 space-y-6">
          {/* Owner Details */}
          <div>
              <Tooltip content="The legal name or institutional ID of the credential recipient.">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5 cursor-help w-max inline-block">Recipient Identity</label>
              </Tooltip>
              <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="e.g. Elena Al-Farsi / License #0921"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="input-field w-full pl-11 pr-4 py-3 text-sm font-medium shadow-sm"
                    spellCheck={false}
                  />
              </div>
          </div>

          <button
            onClick={handleIssue}
            disabled={status === "submitting" || !hash || !owner}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-md text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {status === "submitting" ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin"></div>
                Generating Block Payload...
              </>
            ) : "Anchor Record On-Chain"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-lg border border-success/30 bg-success-bg/40 flex items-start gap-4 shadow-sm"
          >
            <div className="text-success mt-0.5">
              <CheckCircle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-success/90">Ledger Update Confirmed</h4>
              <p className="text-xs text-success/70 mt-1.5 leading-relaxed font-medium">
                The document hash was successfully anchored via your connected authority node.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                  {!txId?.startsWith('local_') ? (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${txId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 rounded text-[10px] font-bold text-success uppercase tracking-widest hover:bg-success/20 transition-colors"
                      >
                        View Stellar Explorer <ExternalLink size={10} />
                      </a>
                  ) : (
                      <Tooltip content="Explorer is disabled because the live testnet is offline and this record was anchored via your local offline registry.">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 rounded text-[10px] font-bold text-foreground/40 uppercase tracking-widest cursor-not-allowed">
                            Explorer Unavailable (Local Mode)
                          </span>
                      </Tooltip>
                  )}
                  <button onClick={() => { navigator.clipboard.writeText(txId || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 rounded text-[10px] font-bold text-success uppercase tracking-widest hover:bg-success/20 transition-colors">
                     {copied ? <Check size={10} /> : <Copy size={10} />}
                     {copied ? 'Copied' : 'Copy Tx Hash'}
                  </button>
                  {stampedDocUrl && (
                      <a href={stampedDocUrl} download={`Anchored_${file?.name || 'document.pdf'}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-sm">
                         <Download size={10} /> Download Anchored PDF
                      </a>
                  )}
              </div>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-lg border border-danger/30 bg-danger-bg/40 text-sm text-danger shadow-sm flex items-start gap-4"
          >
             <div className="mt-0.5"><Info size={20} strokeWidth={2} /></div>
             <div>
                <strong className="block mb-1">Transaction Rejected</strong> 
                <span className="opacity-80 text-xs font-medium leading-relaxed block">{errorHeader}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
