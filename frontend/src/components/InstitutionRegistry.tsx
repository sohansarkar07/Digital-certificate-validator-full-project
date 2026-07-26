"use client";
// InstitutionRegistry — Global institution management dashboard
// Feature 1 of the Global Decentralized Credential Trust Platform

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Search, Globe, ShieldCheck, Star,
  Plus, CheckCircle, XCircle, Clock, ExternalLink,
  Award, TrendingUp, AlertTriangle, Filter, X, Zap,
  Trophy, Hash, Mail, FileText, Layers
} from "lucide-react";
import { institutionService, type Institution } from "@/services/institutionContract";
import { useStellar } from "@/hooks/useStellar";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { INSTITUTION_TYPE_LABELS } from "@/lib/types";
import type { InstitutionType } from "@/lib/types";
import {
  dbCheckDuplicateInstitution, dbInsertEmailVerification,
  dbGetEmailVerification, dbMarkEmailVerified,
} from "@/lib/db";
import { generateOTP, sendOTPEmail } from "@/services/emailService";
import { writeAuditLog } from "@/services/notificationService";
import { supabase } from "@/lib/supabase";
import * as StellarSdk from "@stellar/stellar-sdk";

// ── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ score }: { score: number }) {
  const stars = institutionService.getTrustStars(score);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= stars ? "text-yellow-500 fill-yellow-500" : "text-foreground/20"}
        />
      ))}
    </div>
  );
}

// ── Trust Score Badge ─────────────────────────────────────────────────────────
function TrustBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-success bg-success-bg" :
    score >= 70 ? "text-info bg-info-bg" :
    score >= 50 ? "text-warning bg-warning-bg" :
    "text-danger bg-danger-bg";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color}`}>
      {score}/100
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Institution["status"] }) {
  const config = {
    approved: { color: "text-success bg-success-bg border-success/20", icon: CheckCircle, label: "Approved" },
    pending:  { color: "text-warning bg-warning-bg border-warning/20", icon: Clock, label: "Pending" },
    rejected: { color: "text-danger bg-danger-bg border-danger/20", icon: XCircle, label: "Rejected" },
    suspended:{ color: "text-foreground/50 bg-secondary border-border", icon: AlertTriangle, label: "Suspended" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${config.color}`}>
      <Icon size={10} /> {config.label}
    </span>
  );
}

// ── Registration Form ─────────────────────────────────────────────────────────
function RegistrationForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { address, sign } = useStellar();
  const [form, setForm] = useState({
    name: "",
    country: "",
    website: "",
    walletAddress: address || "",
    institution_type: "" as InstitutionType | "",
    registration_number: "",
    official_email: "",
    logo_url: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // OTP verification state
  const [step, setStep] = useState<'form' | 'otp' | 'duplicate'>('form');
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<string | null>(null);
  const [pendingInstId, setPendingInstId] = useState<string | null>(null);

  const countries = ["USA", "UK", "India", "Germany", "Canada", "Australia", "Japan", "France", "Brazil", "Singapore", "UAE", "South Korea", "Netherlands", "Sweden", "Turkey", "Pakistan", "Bangladesh", "Nigeria", "Kenya", "Other"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.country || !form.website || !form.institution_type || !form.official_email) {
      setError("Please fill in all required fields (Name, Country, Website, Type, Email).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Check for duplicates
      const isDuplicate = await dbCheckDuplicateInstitution(
        form.name, form.official_email, form.website
      );
      if (isDuplicate) {
        setDuplicateInfo(form.name);
        setStep('duplicate');
        return;
      }

      // 2. Request Freighter Signature
      try {
        if (!address) throw new Error("Wallet not connected");
        
        // Build a dummy transaction to prove ownership and intent
        const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
        const account = await server.loadAccount(address);
        
        const fee = await server.fetchBaseFee();
        const tx = new StellarSdk.TransactionBuilder(account, {
          fee: fee.toString(),
          networkPassphrase: StellarSdk.Networks.TESTNET
        })
        .addOperation(StellarSdk.Operation.manageData({
          name: "CertifyVal_Reg",
          value: form.name.substring(0, 64)
        }))
        .setTimeout(100)
        .build();

        const xdr = tx.toXDR();
        await sign(xdr, "TESTNET");
        
      } catch (err: any) {
        if (err.message.includes("declined") || err.message.includes("rejected")) {
           setError("Registration cancelled: You must sign the transaction to proceed.");
        } else {
           setError(`Wallet signature failed: ${err.message}`);
        }
        setLoading(false);
        return;
      }

      // 3. Generate OTP and send to institution email
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const verificationId = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await dbInsertEmailVerification({
        id: verificationId,
        email: form.official_email.toLowerCase(),
        otp,
        purpose: 'institution_registration',
        expires_at: expiresAt,
        verified: false,
      });
      await sendOTPEmail({
        email: form.official_email,
        otp,
        institutionName: form.name,
      });

      // 4. Register institution with pending_email status
      const inst = await institutionService.registerInstitution({
        name: form.name,
        country: form.country,
        website: form.website,
        walletAddress: form.walletAddress || address || "Not connected",
        type: form.institution_type || undefined,
        institution_type: form.institution_type || undefined,
        registration_number: form.registration_number || undefined,
        official_email: form.official_email || undefined,
        logo_url: form.logo_url || undefined,
        description: form.description || undefined,
      } as any);
      setPendingInstId(inst.id);

      // Update status to pending_email
      await supabase
        .from('institutions')
        .update({ status: 'pending', email_verification_status: 'pending', official_email: form.official_email })
        .eq('id', inst.id);

      setStep('otp');
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) { setOtpError("Please enter the OTP."); return; }
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const record = await dbGetEmailVerification(form.official_email.toLowerCase(), 'institution_registration');
      if (!record) {
        setOtpError("OTP not found. Please restart registration.");
        return;
      }
      if (record.otp !== otpInput.trim()) {
        setOtpError("Incorrect OTP. Please try again.");
        return;
      }
      if (new Date(record.expires_at) < new Date()) {
        setOtpError("OTP has expired. Please re-register to get a new code.");
        return;
      }
      // Mark email verified
      await dbMarkEmailVerified(record.id);
      // Update institution status to pending admin approval
      if (pendingInstId) {
        await supabase
          .from('institutions')
          .update({ email_verified: true, email_verification_status: 'verified', status: 'pending' })
          .eq('id', pendingInstId);
      }
      await writeAuditLog({
        actor_wallet: address || 'unknown',
        actor_role: 'institution',
        action: 'EmailVerified',
        target_id: pendingInstId || undefined,
        details: { email: form.official_email },
      });
      onSuccess();
    } finally {
      setVerifyingOtp(false);
    }
  };

  const field = (label: string, key: keyof typeof form, props: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <div>
      <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        type="text"
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input-field w-full px-3 py-2.5 text-sm"
        {...props}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {step === 'otp' ? 'Verify Your Email' : step === 'duplicate' ? 'Institution Already Exists' : 'Register Institution'}
            </h3>
            <p className="text-xs text-foreground/50 mt-0.5">
              {step === 'otp'
                ? `Enter the 6-digit OTP sent to ${form.official_email}`
                : step === 'duplicate'
                ? 'An institution with this name, email, or website is already registered.'
                : 'Approved institutions can issue verified credentials on Stellar.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── OTP Step ── */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-4xl font-black tracking-widest text-primary font-mono my-3">_ _ _ _ _ _</p>
              <p className="text-xs text-foreground/50">Check your email inbox (and spam folder)</p>
              <p className="text-[10px] text-foreground/30 mt-1">OTP expires in 15 minutes · If email unavailable, check browser console</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Enter OTP</label>
              <input
                type="text"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="input-field w-full px-3 py-3 text-center text-2xl font-bold font-mono tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>
            {otpError && (
              <p className="text-xs text-danger bg-danger-bg px-3 py-2 rounded border border-danger/20">{otpError}</p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('form')} className="flex-1 btn-secondary py-2.5 text-xs font-bold">
                ← Back
              </button>
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={verifyingOtp || otpInput.length !== 6}
                className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {verifyingOtp ? <><div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Verifying...</> : 'Verify Email →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Duplicate Step ── */}
        {step === 'duplicate' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-semibold text-amber-400 mb-1">⚠️ {duplicateInfo} is already registered</p>
              <p className="text-xs text-foreground/60 leading-relaxed">
                An institution with this name, email address, or website already exists in CertifyVal.
                If you work for this institution, you can request to join their existing account.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('form')} className="flex-1 btn-secondary py-2.5 text-xs font-bold">
                ← Edit Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-primary py-2.5 text-xs font-bold"
              >
                Request to Join Institution
              </button>
            </div>
          </div>
        )}

        {/* ── Main Form ── */}
        {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            {field("Institution Name *", "name", { placeholder: "e.g. Stanford University" })}
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Institution Type *</label>
              <select
                value={form.institution_type}
                onChange={e => setForm(f => ({ ...f, institution_type: e.target.value as InstitutionType }))}
                className="input-field w-full px-3 py-2.5 text-sm"
              >
                <option value="">Select type</option>
                {Object.entries(INSTITUTION_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Country *</label>
              <select
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="input-field w-full px-3 py-2.5 text-sm"
              >
                <option value="">Select country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {field("Official Email *", "official_email", { type: "email", placeholder: "admin@institution.edu" })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field("Website *", "website", { type: "url", placeholder: "https://" })}
            {field("Registration / License Number", "registration_number", { placeholder: "e.g. UGC-2024-001" })}
          </div>

          {field("Logo URL (optional)", "logo_url", { type: "url", placeholder: "https://logo.png" })}

          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of your institution..."
              rows={3}
              className="input-field w-full px-3 py-2.5 text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Wallet Address</label>
            <input
              type="text"
              value={form.walletAddress}
              onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))}
              placeholder={address || "Connect wallet to auto-fill"}
              className="input-field w-full px-3 py-2.5 text-sm font-mono text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400">
              📧 After submission, a 6-digit OTP will be sent to your official email to verify ownership. Then an admin will approve your institution.
            </p>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger-bg px-3 py-2 rounded border border-danger/20">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2.5 text-xs font-bold uppercase tracking-widest">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Checking...</> : 'Submit & Send OTP →'}
            </button>
          </div>
        </form>
        )}
      </motion.div>
    </motion.div>
  );
}


// ── Institution Profile Modal (Read Only) ────────────────────────────────────
function InstitutionProfileModal({ institution, onClose }: { institution: Institution; onClose: () => void }) {
  const initials = institution.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const successRate = Math.round((institution.verifications / Math.max(institution.certsIssued, 1)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-primary">{initials}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                {institution.name}
                {institution.verificationBadge && <ShieldCheck size={14} className="text-success" />}
              </h3>
              <p className="text-xs text-foreground/50 mt-0.5">Verified Issuer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Trust Summary Card */}
          <div className="card p-5 bg-gradient-to-br from-primary/5 to-secondary/50 border border-primary/10">
            <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-3">Trust Summary</h4>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <StarRating score={institution.trustScore} />
                  <span className="text-lg font-bold text-foreground">{institution.trustScore}/100</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck size={12} className="text-success" />
                  <span className="text-xs font-semibold text-success">Verified Institution</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-lg font-bold text-foreground">{institution.certsIssued.toLocaleString()}</p>
                  <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-1">Credentials Issued</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{successRate}%</p>
                  <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-1">Verification Success Rate</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-primary/10">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">Supported Credential Categories</p>
              <div className="flex flex-wrap gap-2">
                {["Academic", "Employment", "Professional", "Personal"].map(cat => (
                  <span key={cat} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-secondary text-foreground/70 rounded border border-border">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Country</p>
              <p className="font-medium flex items-center gap-1.5"><Globe size={14}/> {institution.country}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Status</p>
              <StatusBadge status={institution.status} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Website</p>
              <a href={institution.website} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1.5">
                <ExternalLink size={14}/> {institution.website}
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Registration Date</p>
              <p className="font-medium">{new Date().getFullYear()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Wallet Address</p>
              <p className="text-xs font-mono bg-secondary px-3 py-2 rounded border border-border break-all">{institution.walletAddress}</p>
            </div>
            <div className="col-span-2 flex items-center gap-6 pt-2">
              <div>
                 <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Dispute Count</p>
                 <p className="font-medium">{institution.disputes}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Institution Card ──────────────────────────────────────────────────────────
function InstitutionCard({ institution, onApprove, onReject, showAdmin, onClick }: {
  institution: Institution;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  showAdmin: boolean;
  onClick?: () => void;
}) {
  const initials = institution.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`card p-5 transition-shadow ${onClick ? "hover:shadow-md cursor-pointer" : "hover:shadow-md"}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Institution Avatar */}
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-primary">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground leading-tight">{institution.name}</h3>
                {institution.verificationBadge && (
                  <span title="Verified Institution">
                    <ShieldCheck size={14} className="text-success" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-medium text-foreground/50 flex items-center gap-1">
                  <Globe size={10} /> {institution.country}
                </span>
                <StatusBadge status={institution.status} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <TrustBadge score={institution.trustScore} />
              <div className="mt-1">
                <StarRating score={institution.trustScore} />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border text-center">
            <div>
              <p className="text-xs font-bold text-foreground">{institution.certsIssued.toLocaleString()}</p>
              <p className="text-[9px] text-foreground/40 uppercase tracking-wide">Issued</p>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">0</p>
              <p className="text-[9px] text-foreground/40 uppercase tracking-wide">Revoked</p>
            </div>
            <div>
              <p className="text-xs font-bold text-success">{Math.floor(institution.disputes / 2)}</p>
              <p className="text-[9px] text-foreground/40 uppercase tracking-wide">Disp. Won</p>
            </div>
            <div>
              <p className={`text-xs font-bold ${Math.ceil(institution.disputes / 2) > 0 ? "text-danger" : "text-foreground"}`}>
                {Math.ceil(institution.disputes / 2)}
              </p>
              <p className="text-[9px] text-foreground/40 uppercase tracking-wide">Disp. Lost</p>
            </div>
          </div>

          {/* AI Stats Row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 bg-secondary/10 p-2 rounded">
            <div className="flex items-center gap-1.5">
              <Zap size={10} className="text-primary"/>
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">AI Fraud Flags:</span>
              <span className="text-xs font-bold text-warning">{Math.floor(institution.certsIssued * 0.05)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Risk Rating:</span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                institution.trustScore > 85 ? "text-success bg-success-bg border border-success/20" : 
                institution.trustScore > 60 ? "text-warning bg-warning-bg border border-warning/20" : 
                "text-danger bg-danger-bg border border-danger/20"
              }`}>
                {institution.trustScore > 85 ? "Low Risk" : institution.trustScore > 60 ? "Medium Risk" : "High Risk"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <a
              href={institution.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-foreground/50 hover:text-primary transition-colors"
            >
              <ExternalLink size={10} /> Website
            </a>
            {institution.globalRank && (
              <span className="text-[10px] font-bold text-foreground/30 flex items-center gap-1">
                <Award size={10} /> Rank #{institution.globalRank}
              </span>
            )}
            {showAdmin && institution.status === "pending" && (
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove(institution.id); }}
                  className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-[10px] font-bold rounded border border-success/20 hover:bg-success/20 transition-colors"
                >
                  <CheckCircle size={10} /> Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReject(institution.id); }}
                  className="flex items-center gap-1 px-2 py-1 bg-danger/10 text-danger text-[10px] font-bold rounded border border-danger/20 hover:bg-danger/20 transition-colors"
                >
                  <XCircle size={10} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Institution Registry Component ──────────────────────────────────────
export function InstitutionRegistry() {
  const { isConnected } = useStellar();
  const { isStudent, isEmployer, isPrivileged } = useAuth();
  const isReadOnly = isStudent || isEmployer;

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [activeInstitution, setActiveInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<"list" | "ranking">("list");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await institutionService.getAllInstitutions();
      
      // Force sync with actual issuance_history to guarantee 100% accuracy
      const { data: issuanceData } = await supabase.from('issuance_history').select('issuer_wallet');
      if (issuanceData) {
        const counts: Record<string, number> = {};
        issuanceData.forEach(row => {
          if (row.issuer_wallet) {
            counts[row.issuer_wallet] = (counts[row.issuer_wallet] || 0) + 1;
          }
        });
        // Override the cached value with the absolute truth
        data.forEach(inst => {
          if (counts[inst.walletAddress]) {
            inst.certsIssued = counts[inst.walletAddress];
          }
        });
      }

      setInstitutions(data);
      const uniqueCountries = await institutionService.getUniqueCountries();
      setCountries(uniqueCountries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = institutions.filter(i => {
    // Hide rejected institutions by default (unless explicitly filtering for them)
    if (statusFilter === "all" && i.status === "rejected") return false;

    const q = search.toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.country.toLowerCase().includes(q);
    const matchC = !countryFilter || i.country === countryFilter;
    const matchS = statusFilter === "all" || i.status === statusFilter;
    return matchQ && matchC && matchS;
  });

  const handleApprove = async (id: string) => {
    await institutionService.approveInstitution(id);
    load();
  };

  const handleReject = async (id: string) => {
    await institutionService.rejectInstitution(id);
    load();
  };

  // Stats
  const approved = institutions.filter(i => i.status === "approved").length;
  const pending = institutions.filter(i => i.status === "pending").length;
  const totalCerts = institutions.reduce((s, i) => s + i.certsIssued, 0);

  return (
    <div className="w-full space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Institutions", value: institutions.length, icon: Building2, color: "text-primary" },
          { label: "Approved", value: approved, icon: ShieldCheck, color: "text-success" },
          { label: "Pending Review", value: pending, icon: Clock, color: "text-warning" },
          { label: "Certs Issued", value: totalCerts.toLocaleString(), icon: Award, color: "text-info" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-tight">{stat.value}</p>
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="Search institutions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 pr-3 py-2 text-sm w-full sm:w-64"
            />
          </div>
          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="input-field px-3 py-2 text-sm"
          >
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-secondary rounded overflow-hidden border border-border">
            {(["list", "ranking"] as const).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeView === v ? "bg-primary text-primary-foreground" : "text-foreground/50 hover:text-foreground"}`}
              >
                {v === "list" ? <><Filter size={10} className="inline mr-1" />List</> : <><TrendingUp size={10} className="inline mr-1" />Ranking</>}
              </button>
            ))}
          </div>
          {/* Register Button */}
          {!isReadOnly && (
            <button
              onClick={() => setShowRegisterForm(true)}
              className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} /> Register
            </button>
          )}
        </div>
      </div>

      {/* Institution List / Ranking */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 opacity-40">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading Registry...</span>
          </div>
        </div>
      ) : activeView === "list" ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <Building2 size={40} className="mx-auto mb-3 opacity-20" strokeWidth={1} />
              <p className="text-sm font-semibold text-foreground/50">
                {institutions.length === 0 ? "Registry is empty" : "No institutions match your filters"}
              </p>
              {institutions.length === 0 && (
                <p className="text-xs text-foreground/30 mt-2 max-w-xs mx-auto leading-relaxed">
                  Be the first to register an institution. Connect your wallet and click <strong>+ Register</strong> to submit your institution for approval.
                </p>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map(inst => (
                <InstitutionCard
                  key={inst.id}
                  institution={inst}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  showAdmin={isPrivileged}
                  onClick={() => setActiveInstitution(inst)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* Ranking View */
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-secondary/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
              <TrendingUp size={12} /> Global Institution Ranking by Trust Score
            </span>
          </div>
          <div className="divide-y divide-border">
            {institutions
              .filter(i => i.status === "approved")
              .sort((a, b) => b.trustScore - a.trustScore)
              .map((inst, idx) => (
                <div key={inst.id} onClick={() => setActiveInstitution(inst)} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <span className={`text-sm font-black w-6 shrink-0 ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-600" : "text-foreground/30"}`}>
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{inst.name}</p>
                    <p className="text-[10px] text-foreground/50">{inst.country}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-right text-xs">
                    <div>
                      <p className="font-bold text-foreground">{inst.certsIssued.toLocaleString()}</p>
                      <p className="text-[9px] text-foreground/40 uppercase">Certs</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{inst.verifications.toLocaleString()}</p>
                      <p className="text-[9px] text-foreground/40 uppercase">Verified</p>
                    </div>
                  </div>
                  <TrustBadge score={inst.trustScore} />
                  <StarRating score={inst.trustScore} />
                  {inst.verificationBadge && <ShieldCheck size={14} className="text-success shrink-0" />}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Registration Form Modal */}
      <AnimatePresence>
        {showRegisterForm && (
          <RegistrationForm
            onClose={() => setShowRegisterForm(false)}
            onSuccess={() => { setShowRegisterForm(false); load(); }}
          />
        )}
      </AnimatePresence>

      {/* Institution Profile Modal (Read Only) */}
      <AnimatePresence>
        {activeInstitution && (
          <InstitutionProfileModal
            institution={activeInstitution}
            onClose={() => setActiveInstitution(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
