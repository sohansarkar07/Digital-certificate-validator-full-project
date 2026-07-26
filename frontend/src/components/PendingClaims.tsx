"use client";
// PendingClaims — Shows credentials issued to student's email that haven't been claimed yet
// Displayed as a banner inside CredentialPassport

import { useState, useEffect, useCallback } from "react";
import { Gift, CheckCircle, X, ExternalLink, Building2, Calendar, Hash, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStellar } from "@/hooks/useStellar";
import {
  dbGetPendingClaimsByEmail, dbClaimPendingCredential,
  dbRejectPendingCredential, dbInsertCredential, dbGetUserEmail,
  dbSetUserEmail, type PendingClaim,
} from "@/lib/db";
import { createNotification } from "@/services/notificationService";
import { writeAuditLog } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

interface PendingClaimsProps {
  onClaimed?: () => void; // callback to refresh passport
}

export function PendingClaims({ onClaimed }: PendingClaimsProps) {
  const { address } = useStellar();
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  // showEmailForm: replaces linkingEmail — never gets "stuck" because Cancel always resets it
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpStep, setOtpStep] = useState<'email' | 'otp'>('email');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const fetchClaims = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const email = await dbGetUserEmail(address);
      setUserEmail(email);
      if (email) {
        const pending = await dbGetPendingClaimsByEmail(email);
        setClaims(pending);
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleClaim = async (claim: PendingClaim) => {
    if (!address || claimingId) return;
    setClaimingId(claim.id);
    try {
      // 1. Mark as claimed in pending_claims
      await dbClaimPendingCredential(claim.id, address);

      // 2. Insert into credentials table (passport)
      await dbInsertCredential({
        id: claim.id,
        wallet_address: address,
        title: claim.credential_title,
        institution: claim.institution_name,
        type: claim.credential_type as any,
        date: claim.issue_date,
        cert_hash: claim.cert_hash,
        tx_hash: claim.tx_hash,
        description: `${claim.credential_category ?? ""} credential issued by ${claim.institution_name}. TX: ${claim.tx_hash ?? ""}`,
        ...(({
          upload_type: "official",
          category: claim.credential_category,
          is_public: true,
        }) as any),
      });

      // 3. Create notification
      await createNotification({
        walletAddress: address,
        type: "credential_claimed",
        title: "Credential Claimed!",
        body: `You've claimed "${claim.credential_title}" from ${claim.institution_name}.`,
        data: { claim_id: claim.id, tx_hash: claim.tx_hash },
      });

      // 4. Write audit log
      await writeAuditLog({
        actor_wallet: address,
        actor_role: "student",
        action: "CredentialClaimed",
        target_id: claim.institution_id,
        credential_id: claim.id,
        tx_hash: claim.tx_hash,
        details: { credential_title: claim.credential_title },
      });

      // 5. Remove from local list
      setClaims(prev => prev.filter(c => c.id !== claim.id));
      onClaimed?.();
    } catch (err) {
      console.error("Claim failed:", err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleReject = async (claim: PendingClaim) => {
    if (!address || rejectingId) return;
    setRejectingId(claim.id);
    try {
      await dbRejectPendingCredential(claim.id);
      setClaims(prev => prev.filter(c => c.id !== claim.id));
    } finally {
      setRejectingId(null);
    }
  };

  const resetEmailForm = () => {
    setShowEmailForm(false);
    setOtpStep('email');
    setOtpInput('');
    setOtpError('');
    setGeneratedOtp(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !emailInput || !emailInput.includes("@")) return;
    setSendingOtp(true);
    try {
      const { generateOTP, sendOTPEmail } = await import('@/services/emailService');
      const otp = generateOTP();
      setGeneratedOtp(otp);
      await sendOTPEmail({ email: emailInput, otp, institutionName: "CertifyVal Student Link" });
      setOtpStep('otp');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput !== generatedOtp) {
      setOtpError("Incorrect OTP — please check your email and try again.");
      return;
    }
    setOtpError('');
    setVerifyingOtp(true);
    try {
      await dbSetUserEmail(address!, emailInput);
      const pending = await dbGetPendingClaimsByEmail(emailInput);
      setClaims(pending);
      setUserEmail(emailInput);
      resetEmailForm();
    } catch (err) {
      console.error(err);
      setOtpError('Failed to save email. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) return null;

  // Email form: shown when no email is saved yet, OR when user clicks "Change Linked Email"
  if (!userEmail || showEmailForm) {
    return (
      <div className="border border-primary/30 bg-primary/5 rounded-xl overflow-hidden mb-6 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {otpStep === 'email' ? 'Link your Student Email' : 'Verify your Email'}
            </h4>
            <p className="text-xs text-foreground/60 mt-0.5">
              {otpStep === 'email'
                ? 'Enter your email to find credentials institutions have sent to you.'
                : `We sent a 6-digit code to ${emailInput}. Check your inbox.`
              }
            </p>
          </div>
        </div>

        {otpStep === 'email' ? (
          <form onSubmit={handleSendOtp} className="flex gap-2 w-full md:max-w-sm">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. student@university.edu"
              required
              className="input-field px-3 py-1.5 text-xs flex-1"
            />
            <button type="submit" disabled={sendingOtp} className="btn-primary text-xs px-4 whitespace-nowrap">
              {sendingOtp ? <Loader2 size={14} className="animate-spin" /> : "Send OTP"}
            </button>
            {/* Cancel only if already has an email (i.e. this is "Change" mode) */}
            {userEmail && (
              <button type="button" onClick={resetEmailForm} className="text-xs text-foreground/50 hover:underline px-2">
                Cancel
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-1 w-full md:max-w-xs">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => { setOtpInput(e.target.value); setOtpError(''); }}
                placeholder="6-digit code"
                required
                maxLength={6}
                autoFocus
                className="input-field px-3 py-1.5 text-xs font-mono tracking-[0.3em] flex-1 text-center"
              />
              <button type="submit" disabled={verifyingOtp || otpInput.length < 6} className="btn-primary text-xs px-4 whitespace-nowrap">
                {verifyingOtp ? <Loader2 size={14} className="animate-spin" /> : "Verify & Link"}
              </button>
            </div>
            {otpError && <p className="text-[10px] text-rose-500 font-semibold">{otpError}</p>}
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => { setOtpStep('email'); setOtpInput(''); setOtpError(''); }}
                className="text-[10px] text-foreground/50 hover:underline">
                ← Change email / Resend
              </button>
              {userEmail && (
                <button type="button" onClick={resetEmailForm}
                  className="text-[10px] text-foreground/50 hover:underline">
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    );
  }
  
  if (claims.length === 0) {
    return (
      <div className="border border-border/50 bg-surface rounded-xl overflow-hidden mb-6 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <CheckCircle size={16} className="text-foreground/40" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">No Pending Claims</p>
            <p className="text-xs text-foreground/50">
              No new credentials for <strong className="text-foreground/70">{userEmail}</strong>.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEmailInput(userEmail ?? '');
            setOtpStep('email');
            setShowEmailForm(true);
          }}
          className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
        >
          Change Email
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-primary/30 bg-primary/5 rounded-xl overflow-hidden mb-6"
    >
      {/* Banner header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Gift size={16} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">
              {claims.length} Credential{claims.length > 1 ? "s" : ""} Waiting to be Claimed
            </p>
            <p className="text-xs text-foreground/50">
              Issued to {userEmail} — click to review and claim
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            {claims.length} New
          </span>
          {expanded ? <ChevronUp size={16} className="text-foreground/40" /> : <ChevronDown size={16} className="text-foreground/40" />}
        </div>
      </button>

      {/* Claims list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              {claims.map(claim => (
                <motion.div
                  key={claim.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-surface border border-border rounded-xl p-4"
                >
                  {/* Claim card header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{claim.credential_title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 size={11} className="text-foreground/40" />
                        <span className="text-xs text-foreground/50">{claim.institution_name}</span>
                        {claim.credential_category && (
                          <>
                            <span className="text-foreground/20">·</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground/50 capitalize">
                              {claim.credential_category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                      Pending
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                      <Calendar size={11} />
                      <span>{claim.issue_date}</span>
                    </div>
                    {claim.tx_hash && (
                      <div className="flex items-center gap-1.5 text-[11px] text-foreground/50 min-w-0">
                        <Hash size={11} />
                        <span className="font-mono truncate">{claim.tx_hash.slice(0, 12)}...</span>
                        {claim.explorer_link && (
                          <a href={claim.explorer_link} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline shrink-0">
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClaim(claim)}
                      disabled={claimingId === claim.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {claimingId === claim.id ? (
                        <><Loader2 size={12} className="animate-spin" /> Claiming...</>
                      ) : (
                        <><CheckCircle size={12} /> Claim Credential</>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(claim)}
                      disabled={rejectingId === claim.id}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground/60 hover:bg-surface-hover transition-colors disabled:opacity-50"
                    >
                      {rejectingId === claim.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
