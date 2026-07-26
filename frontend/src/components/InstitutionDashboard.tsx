"use client";
// InstitutionDashboard — certificate issuance dashboard for verified institutions
// Extended: AI Fraud Detection + Stake-to-Issue mechanism integration

import { useState, useCallback, useEffect } from "react";
import { CheckCircle, Info, LockKeyhole, User, Copy, Check, ExternalLink, Download, Wallet, Lock, Upload, Award, Mail } from "lucide-react";
import { useStellar } from "@/hooks/useStellar";
import { contractService } from "@/services/contract";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@/components/Tooltip";
import { PDFDocument, rgb } from "pdf-lib";
import { FraudDetectionPanel } from "@/components/FraudDetectionPanel";
import { analyzeForFraud, recordIssuance, type FraudAnalysisResult } from "@/services/fraudDetection";
import { stakeService, type BondRecord } from "@/services/stakeContract";
import { dbGetIssuanceByWallet, dbInsertPendingClaim, type IssuanceRecord } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { createNotification, writeAuditLog } from "@/services/notificationService";
import { sendCredentialIssuedEmail } from "@/services/emailService";

export function InstitutionDashboard() {
  const { address, isConnected, sign, balance } = useStellar();

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [owner, setOwner] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentWallet, setStudentWallet] = useState("");
  const [credentialTitle, setCredentialTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "hashing" | "checking" | "submitting" | "success" | "error">("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [errorHeader, setErrorHeader] = useState("");
  const [copied, setCopied] = useState(false);
  const [stampedDocUrl, setStampedDocUrl] = useState<string | null>(null);
  // Fraud Detection state
  const [fraudResult, setFraudResult] = useState<FraudAnalysisResult | null>(null);
  // Stake Bond state
  const [bondRecord, setBondRecord] = useState<BondRecord | null>(null);
  // History state
  const [history, setHistory] = useState<IssuanceRecord[]>([]);

  const generateHash = useCallback(async (f: File) => {
    setStatus("hashing");
    const arrayBuffer = await f.arrayBuffer();
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

  // Step 1: Run fraud check before issuing
  const runFraudCheck = async () => {
    if (!address || !hash || !owner) return;
    setStatus("checking");
    setFraudResult(null);
    try {
      const result = await analyzeForFraud(hash, owner, address);
      setFraudResult(result);
    } catch {
      setStatus("idle");
    }
  };

  // Step 2: Actual issuance (called after fraud check approval)
  const handleIssue = async () => {
    if (!address || !hash || !owner) return;
    setStatus("submitting");
    try {
      const h = await contractService.issueCertificate(hash, owner, address, sign);
      setTxId(h);

      let documentUrl: string | undefined;
      // Upload file to Supabase Storage if it exists
      if (file && !isDemo) {
        try {
          const fileName = `${hash}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('documents')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });
          
          if (!error && data) {
            const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
            documentUrl = urlData.publicUrl;
          } else {
            console.warn("Storage upload failed, falling back to Base64:", error);
            documentUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }
        } catch (e) {
          console.warn("Storage exception, falling back to Base64:", e);
          documentUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
      }

      // Record in fraud detection history
      recordIssuance(hash, owner, address, documentUrl);

      // Lock stake bond (non-blocking)
      try {
        const bond = await stakeService.lockBond(hash, address);
        setBondRecord(bond);
      } catch {
        console.warn("Bond locking skipped");
      }

      // ── Credential Delivery Flow ──────────────────────────────────────
      const title = credentialTitle || owner || "Credential";
      const explorerLink = h ? `https://stellar.expert/explorer/testnet/tx/${h}` : undefined;
      const verifyLink = typeof window !== 'undefined' ? `${window.location.origin}/verify/${hash}` : '';

      // Get institution name from registry
      let institutionName = "Institution";
      try {
        const { data: instData } = await supabase
          .from('institutions')
          .select('name')
          .eq('wallet_address', address)
          .maybeSingle();
        if (instData?.name) institutionName = instData.name;
      } catch {}

      if (studentEmail.trim()) {
        // Store as pending claim (student may not have account yet)
        await dbInsertPendingClaim({
          id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          student_email: studentEmail.trim().toLowerCase(),
          student_wallet: studentWallet.trim() || undefined,
          institution_name: institutionName,
          credential_title: title,
          credential_type: 'certificate',
          issue_date: new Date().toISOString().split('T')[0],
          tx_hash: h,
          cert_hash: hash || undefined,
          explorer_link: explorerLink,
          status: 'pending',
        });

        // If student has a wallet, also create an in-app notification
        if (studentWallet.trim()) {
          await createNotification({
            walletAddress: studentWallet.trim(),
            type: 'credential_issued',
            title: `New Credential from ${institutionName}`,
            body: `"${title}" has been issued to you. Claim it in your Credential Passport.`,
            data: { tx_hash: h, cert_hash: hash, explorer_link: explorerLink },
          });
        }

        // Send email notification
        await sendCredentialIssuedEmail({
          studentEmail: studentEmail.trim(),
          studentName: owner,
          institutionName,
          credentialTitle: title,
          credentialType: 'Certificate',
          issueDate: new Date().toLocaleDateString(),
          txHash: h,
          explorerLink,
          verifyLink,
        });
      }

      // Write audit log
      await writeAuditLog({
        actor_wallet: address,
        actor_role: 'institution',
        action: 'CredentialIssued',
        credential_id: hash || undefined,
        tx_hash: h,
        details: {
          owner,
          student_email: studentEmail || undefined,
          institution: institutionName,
          title,
        },
      });

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
              color: rgb(0.06, 0.72, 0.5),
            });
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes.slice()], { type: "application/pdf" });
            setStampedDocUrl(URL.createObjectURL(blob));
          }
        } catch (e) {
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

  useEffect(() => {
    if (address) {
      dbGetIssuanceByWallet(address).then(setHistory);
    } else {
      setHistory([]);
    }
  }, [address, txId]);

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
      {/* Wallet Card */}
      <div className="card p-6 shadow-sm border border-border flex items-center justify-between mb-8 bg-surface gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Wallet size={24} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Wallet Connected</h3>
            <p className="text-xs text-foreground/50 font-mono mt-1" title={address || ""}>
              {address ? `${address.slice(0, 8)}...${address.slice(-8)}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Available Tokens</p>
          <p className="text-xl font-bold text-foreground">{balance ? `${balance} XLM` : 'Loading...'}</p>
        </div>
      </div>

      {/* Stake Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-stake-locked-bg border border-stake-locked/20 rounded text-xs">
        <Lock size={14} className="text-stake-locked shrink-0" />
        <p className="text-foreground/70">
          <strong className="text-stake-locked">Stake Mechanism Active:</strong> Issuing a certificate will lock a{" "}
          <strong>1 XLM bond</strong> for a 7-day challenge window. Bond is returned automatically if no dispute is raised.
        </p>
      </div>

      <div className="card p-8 shadow-sm border border-border">
        {/* Upload Block */}
        <div className="flex justify-between items-center mb-4">
          <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Target Document</label>

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
          {/* Credential Title */}
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Credential Title</label>
            <div className="relative">
              <Award size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" strokeWidth={2} />
              <input
                type="text"
                placeholder="e.g. Bachelor of Computer Science — 2024"
                value={credentialTitle}
                onChange={(e) => setCredentialTitle(e.target.value)}
                className="input-field w-full pl-11 pr-4 py-3 text-sm font-medium shadow-sm"
              />
            </div>
          </div>

          {/* Owner Details */}
          <div>
            <Tooltip content="The legal name or institutional ID of the credential recipient.">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5 cursor-help w-max inline-block">Recipient Full Name *</label>
            </Tooltip>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" strokeWidth={2} />
              <input
                type="text"
                placeholder="e.g. Elena Al-Farsi"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="input-field w-full pl-11 pr-4 py-3 text-sm font-medium shadow-sm"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Student Email */}
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">
              Student Email <span className="text-foreground/25 normal-case">(for automatic delivery)</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" strokeWidth={2} />
              <input
                type="email"
                placeholder="student@university.edu"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="input-field w-full pl-11 pr-4 py-3 text-sm font-medium shadow-sm"
              />
            </div>
            <p className="text-[10px] text-foreground/30 mt-1">The student will receive an email notification and the credential will appear in their Credential Passport.</p>
          </div>

          {/* Student Wallet (optional) */}
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">
              Student Wallet <span className="text-foreground/25 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="G... (Stellar wallet address)"
              value={studentWallet}
              onChange={(e) => setStudentWallet(e.target.value)}
              className="input-field w-full px-4 py-3 text-sm font-mono shadow-sm"
            />
          </div>

          <button
            onClick={runFraudCheck}
            disabled={status === "submitting" || status === "checking" || !hash || !owner}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-md text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {status === "submitting" ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin"></div>
                Generating Block Payload...
              </>
            ) : status === "checking" ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin"></div>
                Running AI Fraud Check...
              </>
            ) : "Anchor Record On-Chain"}
          </button>
        </div>
      </div>

      {/* Fraud Detection Panel */}
      <FraudDetectionPanel
        result={fraudResult}
        isAnalyzing={status === "checking" && !fraudResult}
        onProceed={handleIssue}
        onCancel={() => { setFraudResult(null); setStatus("idle"); }}
      />

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
              {/* Bond Status */}
              {bondRecord && (
                <div className="mt-3 p-3 bg-stake-locked-bg border border-stake-locked/20 rounded flex items-center gap-2">
                  <Lock size={12} className="text-stake-locked shrink-0" />
                  <p className="text-[10px] font-bold text-stake-locked">
                    Bond Locked: 1 XLM · Challenge window open until{" "}
                    {new Date(bondRecord.challengeWindowEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
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

      {/* Issuance History */}
      {history.length > 0 && (
        <div className="card p-6 shadow-sm border border-border mt-8">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award size={16} className="text-primary" /> My Issued Documents
          </h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((record, i) => (
              <div key={i} className="p-4 bg-surface border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/30 transition-colors shadow-sm">
                <div>
                  <p className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-[300px]">{record.owner}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-foreground/50 font-mono" title={record.hash}>Hash: {record.hash.substring(0, 24)}...</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(record.hash)} 
                      className="text-foreground/40 hover:text-primary transition-colors flex items-center gap-1"
                      title="Copy full hash"
                    >
                      <Copy size={10} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-foreground/40 bg-secondary px-2 py-1 rounded">
                    {record.issued_at ? new Date(record.issued_at).toLocaleDateString() : "Just now"}
                  </span>
                  {record.document_url && (
                    <a 
                      href={record.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:text-primary transition-colors flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded"
                    >
                      <ExternalLink size={10} /> View Document
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
