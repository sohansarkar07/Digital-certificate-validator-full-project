"use client";
// src/components/Onboarding.tsx
// First-login role selection modal — appears once, stores role permanently

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Briefcase, Building2, Shield,
  ArrowRight, CheckCircle2, X, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStellar } from '@/hooks/useStellar';
import { dbSetUserEmail } from '@/lib/db';
import type { UserRole } from '@/lib/types';

interface RoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  features: string[];
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    label: 'Student / Individual',
    description: 'Own and manage your credentials. Build your decentralized credential passport.',
    icon: GraduationCap,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    features: [
      'Credential Passport',
      'Upload personal documents',
      'Import external certificates',
      'Share credentials via QR',
    ],
  },
  {
    id: 'employer',
    label: 'Employer / HR',
    description: 'Verify candidate credentials instantly. Build trust in your hiring process.',
    icon: Briefcase,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    features: [
      'Instant verification',
      'Bookmark candidates',
      'Generate verification reports',
      'View institution trust scores',
    ],
  },
  {
    id: 'institution',
    label: 'Institution',
    description: 'Issue verifiable credentials anchored to the Stellar blockchain.',
    icon: Building2,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    features: [
      'Issue official credentials',
      'Manage credential registry',
      'Earn trust score',
      'Global institution ranking',
    ],
  },
];

interface OnboardingProps {
  onComplete: (role: UserRole) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { address } = useStellar();
  const { completeOnboarding } = useAuth();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'choose' | 'name'>('choose');

  const handleContinue = async () => {
    if (!selected) return;
    if (step === 'choose') {
      setStep('name');
      return;
    }
    setSubmitting(true);
    await completeOnboarding(selected, displayName || undefined);
    // Save email for pending claim matching (students)
    if (email.trim() && address) {
      await dbSetUserEmail(address, email.trim().toLowerCase());
    }
    onComplete(selected);
    setSubmitting(false);
  };

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                <Shield size={16} strokeWidth={3} />
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-foreground/40">
                CertifyVal
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-3">
              {step === 'choose' ? 'Welcome to CertifyVal' : 'Almost there!'}
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              {step === 'choose'
                ? 'Choose your role to get started. This will personalize your experience.'
                : 'Add a display name (optional) to personalize your profile.'
              }
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-foreground/40 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected: {shortAddr}
            </div>
          </div>

          {/* Step 1: Role Selection */}
          {step === 'choose' && (
            <div className="p-6 grid gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selected === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelected(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? `${opt.bgColor} ${opt.borderColor} shadow-lg`
                        : 'border-border bg-surface hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg ${opt.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon size={20} className={opt.color} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">{opt.label}</h3>
                          {isSelected && (
                            <CheckCircle2 size={16} className={opt.color} />
                          )}
                        </div>
                        <p className="text-xs text-foreground/60 mt-0.5 leading-relaxed">
                          {opt.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {opt.features.map(f => (
                            <span
                              key={f}
                              className={`text-[10px] px-2 py-0.5 rounded-full ${opt.bgColor} ${opt.color} font-medium`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Step 2: Display Name */}
          {step === 'name' && (
            <div className="p-6">
              <div className="mb-4">
                {(() => {
                  const opt = ROLE_OPTIONS.find(o => o.id === selected)!;
                  const Icon = opt?.icon;
                  return (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${opt?.bgColor} ${opt?.color} text-xs font-bold`}>
                      {Icon && <Icon size={12} />}
                      {opt?.label}
                    </div>
                  );
                })()}
              </div>
              <label className="block text-xs font-semibold text-foreground/70 mb-2 uppercase tracking-wider">
                Display Name (optional)
              </label>
              <input
                type="text"
                placeholder={
                  selected === 'institution'
                    ? 'e.g. MIT, Harvard, Google...'
                    : 'e.g. Jane Doe, John Smith...'
                }
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                maxLength={80}
              />
              <p className="text-[11px] text-foreground/40 mt-2">
                You can change this anytime in your wallet profile.
              </p>

              {/* Email field — for students only, enables pending claim matching */}
              {selected === 'student' && (
                <>
                  <label className="block text-xs font-semibold text-foreground/70 mb-2 mt-5 uppercase tracking-wider">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. jane@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    maxLength={200}
                  />
                  <p className="text-[11px] text-foreground/40 mt-1.5">
                     Add your email to automatically receive credentials issued by institutions to you.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            {step === 'name' ? (
              <button
                onClick={() => setStep('choose')}
                className="text-xs text-foreground/50 hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleContinue}
              disabled={!selected || submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : step === 'choose' ? (
                <>
                  Continue <ArrowRight size={14} />
                </>
              ) : (
                <>
                  Get Started <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
