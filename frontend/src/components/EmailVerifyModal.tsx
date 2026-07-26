"use client";
// EmailVerifyModal — shown once per session when a student connects
// and has a linked email but hasn't verified it this session yet.

import { useState, useEffect } from "react";
import { Mail, Loader2, CheckCircle, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStellar } from "@/hooks/useStellar";
import { useAuth } from "@/hooks/useAuth";
import { dbGetUserEmail } from "@/lib/db";
import { generateOTP, sendOTPEmail } from "@/services/emailService";

const SESSION_KEY = "certifyval_email_verified";

export function EmailVerifyModal() {
  const { address, isConnected } = useStellar();
  const { isStudent } = useAuth();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "sending" | "otp" | "verifying" | "done">("idle");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState("");

  // Check once on connect whether we need to verify
  useEffect(() => {
    if (!isConnected || !address || !isStudent) return;

    // If already verified this session, skip
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY) === address) return;

    // Fetch linked email from DB
    dbGetUserEmail(address).then((savedEmail) => {
      if (savedEmail) {
        setEmail(savedEmail);
        setShow(true);
      }
    });
  }, [isConnected, address, isStudent]);

  const handleSendOtp = async () => {
    if (!email) return;
    setStep("sending");
    setError("");
    try {
      const otp = generateOTP();
      setGeneratedOtp(otp);
      await sendOTPEmail({ email, otp, institutionName: "CertifyVal Login Verification" });
      setStep("otp");
    } catch {
      setError("Failed to send OTP. Please try again.");
      setStep("idle");
    }
  };

  const handleVerify = () => {
    if (otpInput !== generatedOtp) {
      setError("Incorrect code — please check your inbox.");
      return;
    }
    setError("");
    setStep("verifying");
    // Mark verified for this session
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, address!);
    }
    setStep("done");
    setTimeout(() => setShow(false), 1800);
  };

  const handleSkip = () => {
    // Skip without verifying — modal won't reappear until page reload
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, address!);
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="card w-full max-w-sm p-6 shadow-2xl"
          >
            {step === "done" ? (
              <div className="text-center py-4">
                <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4 border border-success/20">
                  <CheckCircle size={28} className="text-success" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">Email Verified!</h3>
                <p className="text-xs text-foreground/50">Your identity is confirmed for this session.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <ShieldCheck size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Verify Your Email</h3>
                      <p className="text-[11px] text-foreground/50 mt-0.5">One-time check per session</p>
                    </div>
                  </div>
                  <button onClick={handleSkip} className="p-1.5 rounded hover:bg-secondary text-foreground/40 hover:text-foreground transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {step === "idle" && (
                  <div className="space-y-4">
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      We have your email <strong className="text-foreground">{email}</strong> on file. To confirm it&apos;s you, we&apos;ll send a quick OTP.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendOtp}
                        className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Mail size={13} /> Send OTP to {email?.split("@")[0]}...
                      </button>
                    </div>
                    <button onClick={handleSkip} className="w-full text-[10px] text-foreground/40 hover:underline text-center">
                      Skip for now (not recommended)
                    </button>
                  </div>
                )}

                {step === "sending" && (
                  <div className="flex items-center justify-center gap-2 py-6 text-foreground/50 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Sending OTP to {email}…
                  </div>
                )}

                {step === "otp" && (
                  <div className="space-y-3">
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      A 6-digit code was sent to <strong>{email}</strong>. Enter it below to verify.
                    </p>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => { setOtpInput(e.target.value); setError(""); }}
                      placeholder="● ● ● ● ● ●"
                      maxLength={6}
                      autoFocus
                      className="input-field w-full px-4 py-3 text-center text-xl font-mono tracking-[0.5em]"
                    />
                    {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
                    <button
                      onClick={handleVerify}
                      disabled={otpInput.length < 6}
                      className="w-full btn-primary py-2.5 text-xs font-bold disabled:opacity-40"
                    >
                      Confirm Identity
                    </button>
                    <button
                      onClick={() => { setStep("idle"); setOtpInput(""); setError(""); }}
                      className="w-full text-[10px] text-foreground/40 hover:underline text-center"
                    >
                      ← Resend or change email
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
