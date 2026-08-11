"use client";
// PublicVerifyClient — client-side public verification UI
// No wallet required. Works for anyone with the certificate URL.

import { useState, useEffect } from "react";
import {
  Shield, CheckCircle, XCircle, ExternalLink, Clock,
  Copy, Check, ArrowLeft, AlertTriangle, ZoomIn, ZoomOut
} from "lucide-react";

import { contractService, getTxHashLocal, getIssuerAddressLocal } from "@/services/contract";
import { recordTransaction } from "@/services/blockchain";
import { dbCheckDuplicateHash, dbRecordVerification } from "@/lib/db";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface VerifyResult {
  status: "valid" | "invalid" | "revoked";
  owner: string | null;
  verifiedAt: string;
  hash: string;
  documentUrl?: string | null;
}

export default function PublicVerifyClient({ certId }: { certId: string }) {
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [stellarTxHash, setStellarTxHash] = useState<string | null>(null);
  const [issuerAddress, setIssuerAddress] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const publicUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://certifyval.app/verify/${certId}`;

  useEffect(() => {
    async function verify() {
      setVerifying(true);
      try {
        const isValid = await contractService.verifyCertificate(certId, "PublicVerifier");
        const owner = isValid ? await contractService.getOwner(certId) : null;
        
        await dbRecordVerification(certId, undefined, isValid ? "valid" : "invalid").catch(() => {});
        
        // Fetch document URL from database
        let docUrl = null;
        if (isValid) {
           const record = await dbCheckDuplicateHash(certId);
           if (record?.document_url) docUrl = record.document_url;
        }

        setResult({
          status: isValid ? "valid" : "invalid",
          owner,
          verifiedAt: new Date().toLocaleString(),
          hash: certId,
          documentUrl: docUrl,
        });
        // Fetch the real Stellar transaction hash (what is actually on-chain)
        const txHash = getTxHashLocal(certId);
        if (txHash && !txHash.startsWith("local_") && !txHash.includes("demo")) {
          setStellarTxHash(txHash);
        }
        // Fetch the issuer's Stellar wallet address for blockchain link
        const addr = getIssuerAddressLocal(certId);
        if (addr) setIssuerAddress(addr);
      } catch (err) {
        console.error("[PublicVerify] Verification error:", err);
        // Still record the failed attempt
        await recordTransaction("CredentialVerificationFailed", "PublicVerifier", "Public", "failed").catch(() => {});
        setResult({
          status: "invalid",
          owner: null,
          verifiedAt: new Date().toLocaleString(),
          hash: certId,
        });
      } finally {
        setVerifying(false);
      }
    }
    if (certId) verify();
  }, [certId]);

  // Blockchain explorer link:
  // Links to the tx, then issuer account, then falls back to the known issuer account on testnet.
  const ISSUER_ACCOUNT = "GA5B7EJJ3SRB2VKWTCKTVWUV6R2UTLUJGRUXWSAAXI3BE4B5PUZZ4YCF";
  const blockchainUrl = stellarTxHash
    ? `https://stellar.expert/explorer/testnet/tx/${stellarTxHash}`
    : issuerAddress
    ? `https://stellar.expert/explorer/testnet/account/${issuerAddress}`
    : `https://stellar.expert/explorer/testnet/account/${ISSUER_ACCOUNT}`;

  const blockchainLabel = stellarTxHash
    ? "View Certificate Transaction on Stellar"
    : issuerAddress
    ? "View Issuer Account on Stellar"
    : "View On-Chain Activity on Stellar";

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen bg-background text-foreground font-sans overflow-y-auto">
      {/* Header */}
      <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-base tracking-tight hover:opacity-80 transition-opacity">
          <span className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
            <Shield size={14} strokeWidth={3} />
          </span>
          CertifyVal
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Public Verification</span>
        <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Platform
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Loading State */}
        {verifying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-16 flex flex-col items-center gap-5 text-center"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Shield size={22} className="absolute inset-0 m-auto text-primary/60" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight">Verifying Certificate</p>
              <p className="text-sm text-foreground/50 mt-1">Querying the Stellar Soroban blockchain...</p>
            </div>
            <code className="text-[10px] font-mono text-foreground/30 bg-secondary px-3 py-1.5 rounded max-w-full truncate">
              {certId}
            </code>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {!verifying && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Card */}
              <div className={`card overflow-hidden border-t-4 ${result.status === "valid" ? "border-t-success" : "border-t-danger"}`}>
                {/* Status Banner */}
                <div className={`p-6 flex items-start gap-4 ${result.status === "valid" ? "bg-success-bg/30" : "bg-danger-bg/30"}`}>
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${result.status === "valid" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                    {result.status === "valid"
                      ? <CheckCircle size={28} strokeWidth={2} />
                      : <XCircle size={28} strokeWidth={2} />}
                  </div>
                  <div className="flex-1">
                    <h1 className={`text-2xl font-black tracking-tight ${result.status === "valid" ? "text-success" : "text-danger"}`}>
                      {result.status === "valid" ? "✓ VERIFIED" : "✗ NOT FOUND"}
                    </h1>
                    <p className="text-sm text-foreground/60 mt-1">
                      {result.status === "valid"
                        ? "This certificate is authentic and anchored on the Stellar blockchain."
                        : "No record found for this certificate hash in the blockchain registry."}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                        Live Verification · {result.verifiedAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-6 space-y-5">
                  {result.status === "valid" && result.owner && (
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Certificate Owner</label>
                      <p className="text-base font-semibold text-foreground">{result.owner}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Certificate Hash (SHA-256)</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] font-mono text-foreground/70 bg-secondary px-3 py-2 rounded border border-border break-all">
                        {certId}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(certId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="p-2 bg-secondary border border-border rounded hover:bg-surface-hover transition-colors shrink-0"
                      >
                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-foreground/50" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1">Network</label>
                      <p className="text-sm font-semibold text-foreground">Stellar Testnet</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1">Verification Time</label>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Clock size={12} /> {result.verifiedAt}
                      </p>
                    </div>
                  </div>

                  {/* Blockchain Explorer Link */}
                  <div className="pt-4 border-t border-border">
                    <a
                      href={blockchainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-secondary border border-border rounded text-sm font-bold hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                    >
                      <ExternalLink size={14} />
                      {blockchainLabel}
                    </a>
                  </div>

                  {/* Invalid Warning */}
                  {result.status === "invalid" && (
                    <div className="flex items-start gap-3 p-4 bg-warning-bg border border-warning/30 rounded">
                      <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-warning">Certificate Not Registered</p>
                        <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                          This hash was not found in the on-chain registry. The certificate may be forged, the hash may be incorrect, or it may not have been issued through CertifyVal.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Preview */}
              {result.documentUrl && (
                <div className="card overflow-hidden">
                  <div className="p-4 bg-secondary/30 border-b border-border flex justify-between items-center">
                    <h3 className="text-sm font-bold text-foreground">Original Document</h3>
                    {!result.documentUrl.toLowerCase().includes('.pdf') && (
                      <button 
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded hover:bg-surface-hover transition-colors text-foreground/80"
                      >
                        {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
                        {isZoomed ? "Fit to Screen" : "Scroll & Zoom"}
                      </button>
                    )}
                  </div>
                  <div className={`p-0 bg-black/5 ${isZoomed ? 'overflow-auto max-h-[70vh]' : 'overflow-hidden'} border-b border-border relative`}>
                    {result.documentUrl.toLowerCase().includes('.pdf') ? (
                      <object data={result.documentUrl} type="application/pdf" className="w-full h-[600px]">
                        <p className="p-6 text-sm text-foreground/50">Your browser does not support PDFs. <a href={result.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download the PDF</a>.</p>
                      </object>
                    ) : (
                      <img 
                        src={result.documentUrl} 
                        alt="Certificate Document" 
                        className={isZoomed ? "max-w-none block" : "w-full h-auto object-contain"} 
                      />
                    )}
                  </div>
                </div>
              )}

              {/* QR Code + Share */}
              <div className="card p-6 flex flex-col sm:flex-row gap-6 items-center">
                <QRCodeDisplay 
                  value={publicUrl}
                  size={120} 
                  label="Scan to Verify"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">Share Verification Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] font-mono text-foreground/60 bg-secondary px-3 py-2 rounded border border-border truncate">
                      {publicUrl}
                    </code>
                    <button onClick={handleCopy} className="p-2 bg-secondary border border-border rounded hover:bg-surface-hover transition-colors shrink-0">
                      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-foreground/50" />}
                    </button>
                  </div>
                  <p className="text-xs text-foreground/40 mt-2 leading-relaxed">
                    Scan the QR code to view the raw SHA-256 anchor on the Stellar blockchain, or share the link above.
                  </p>
                </div>
              </div>

              {/* Platform Footer */}
              <div className="text-center">
                <p className="text-[10px] text-foreground/30 font-mono">
                  Powered by{" "}
                  <Link href="/" className="text-primary hover:underline font-bold">CertifyVal</Link>
                  {" "}· Stellar Soroban · Decentralized Credential Trust
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
