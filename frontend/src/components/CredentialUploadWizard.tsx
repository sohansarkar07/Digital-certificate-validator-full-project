"use client";
// src/components/CredentialUploadWizard.tsx
// Multi-step wizard for credential upload with AI classification
// Used in both CredentialPassport (personal vault) and InstitutionDashboard (official issuance)

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Upload, Link, CheckCircle2,
  AlertTriangle, XCircle, Loader2, FileText, Globe,
  Sparkles, Shield, BookOpen, Briefcase, Award, User,
  X, Info
} from 'lucide-react';
import {
  CREDENTIAL_CATEGORY_LABELS,
  CREDENTIAL_TYPES_BY_CATEGORY,
  CREDENTIAL_TYPE_LABELS,
  EVIDENCE_TYPE_LABELS,
  EVIDENCE_TYPES_BY_CREDENTIAL,
  EXTERNAL_PLATFORM_LABELS,
} from '@/lib/types';
import type {
  CredentialCategory,
  CredentialType,
  EvidenceType,
  ExternalPlatform,
  AIClassificationResult,
  UserRole,
  InstitutionType,
} from '@/lib/types';
import {
  classifyCredential,
  extractTextFromFile,
  extractTextFromUrl,
  runHeuristicCheck,
} from '@/services/ai/classificationEngine';
import { getCategoriesForRole, canIssue, canSelfUpload } from '@/lib/credentialPermissions';

// ── Category icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<CredentialCategory, React.ElementType> = {
  academic: BookOpen,
  employment: Briefcase,
  professional: Award,
  personal: User,
};

const CATEGORY_COLORS: Record<CredentialCategory, string> = {
  academic: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  employment: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  professional: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  personal: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

// ── Wizard step type ─────────────────────────────────────────────────────────
type WizardStep = 'category' | 'type' | 'evidence' | 'upload' | 'analyzing' | 'result';

export interface WizardResult {
  category: CredentialCategory;
  credentialType: CredentialType;
  evidenceType: EvidenceType;
  file?: File;
  url?: string;
  title: string;
  institution?: string;
  externalPlatform?: ExternalPlatform;
  aiResult: AIClassificationResult;
  isImport: boolean;
}

interface CredentialUploadWizardProps {
  mode: 'official' | 'personal' | 'import';
  role: UserRole;
  institutionType?: InstitutionType | null;
  onComplete: (result: WizardResult) => void;
  onCancel: () => void;
}

export function CredentialUploadWizard({
  mode,
  role,
  institutionType,
  onComplete,
  onCancel,
}: CredentialUploadWizardProps) {
  const [step, setStep] = useState<WizardStep>('category');
  const [category, setCategory] = useState<CredentialCategory | null>(null);
  const [credType, setCredType] = useState<CredentialType | null>(null);
  const [evidenceType, setEvidenceType] = useState<EvidenceType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [externalPlatform, setExternalPlatform] = useState<ExternalPlatform>('other');
  const [isDragging, setIsDragging] = useState(false);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [heuristicWarnings, setHeuristicWarnings] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const availableCategories = getCategoriesForRole(role).filter(cat => {
    if (mode === 'personal') return cat === 'personal' || cat === 'professional';
    if (mode === 'import') return true;
    return true;
  });

  const availableTypes = category
    ? CREDENTIAL_TYPES_BY_CATEGORY[category].filter(t => {
        if (mode === 'official') return canIssue(role, institutionType ?? null, t);
        return canSelfUpload(role, t) || mode === 'import';
      })
    : [];

  const availableEvidence = credType ? EVIDENCE_TYPES_BY_CREDENTIAL[credType] : [];

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    const { warnings } = runHeuristicCheck(selected);
    setHeuristicWarnings(warnings);
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, [handleFileSelect]);

  const runAnalysis = async () => {
    if (!category || !credType) return;
    setStep('analyzing');

    let content = '';
    if (evidenceType === 'url') {
      content = extractTextFromUrl(url, credType);
    } else if (file) {
      content = await extractTextFromFile(file);
    }

    try {
      const result = await classifyCredential(content, category, credType);
      setAiResult(result);
    } catch (error) {
      console.error("AI Classification failed:", error);
      // Fallback result so the user isn't stuck buffering forever
      setAiResult({
        detectedCategory: null,
        detectedType: null,
        confidence: 0,
        reasons: ["AI analysis service is temporarily unavailable or failed."],
        recommendation: "reject",
        riskScore: 100,
        forgerySigns: []
      });
    }
    setStep('result');
  };

  const stepIndex: Record<WizardStep, number> = {
    category: 0, type: 1, evidence: 2, upload: 3, analyzing: 4, result: 4,
  };
  const totalSteps = 5;
  const progress = ((stepIndex[step] + 1) / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-lg flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span className="text-sm font-bold">
                {mode === 'official' ? 'Issue Official Credential' :
                 mode === 'import' ? 'Import External Credential' :
                 'Upload Personal Document'}
              </span>
            </div>
            <button onClick={onCancel} className="p-1.5 rounded hover:bg-surface-hover text-foreground/50 hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Category */}
            {step === 'category' && (
              <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-base font-semibold mb-1">Select Category</h3>
                <p className="text-xs text-foreground/60 mb-4">Choose the category that best describes this credential.</p>
                <div className="grid grid-cols-2 gap-3">
                  {availableCategories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? CATEGORY_COLORS[cat] + ' border-current shadow-lg'
                            : 'border-border bg-surface hover:bg-surface-hover'
                        }`}
                      >
                        <Icon size={20} className={isSelected ? '' : 'text-foreground/50'} />
                        <p className="text-sm font-semibold mt-2">{CREDENTIAL_CATEGORY_LABELS[cat]}</p>
                        <p className="text-[10px] text-foreground/60 mt-0.5">
                          {CREDENTIAL_TYPES_BY_CATEGORY[cat].length} types available
                        </p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Type */}
            {step === 'type' && (
              <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-base font-semibold mb-1">Select Credential Type</h3>
                <p className="text-xs text-foreground/60 mb-4">Choose the specific type of credential.</p>
                {availableTypes.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                    <AlertTriangle size={20} className="text-amber-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-amber-400">No credential types available</p>
                    <p className="text-xs text-foreground/60 mt-1">Your role or institution type does not support issuing credentials in this category.</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {availableTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setCredType(t)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                          credType === t
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-border/80 hover:bg-surface-hover'
                        }`}
                      >
                        {CREDENTIAL_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Evidence Type */}
            {step === 'evidence' && (
              <motion.div key="evidence" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-base font-semibold mb-1">Select Evidence Format</h3>
                <p className="text-xs text-foreground/60 mb-4">Choose how you will provide proof for this credential.</p>
                <div className="grid gap-2">
                  {availableEvidence.map((ev) => (
                    <button
                      key={ev}
                      onClick={() => setEvidenceType(ev)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium flex items-center gap-3 transition-all ${
                        evidenceType === ev
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-surface-hover'
                      }`}
                    >
                      {ev === 'url' ? <Globe size={16} /> : <FileText size={16} />}
                      {EVIDENCE_TYPE_LABELS[ev]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Upload */}
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-base font-semibold mb-1">
                  {evidenceType === 'url' ? 'Enter URL' : 'Upload File'}
                </h3>
                <p className="text-xs text-foreground/60 mb-4">
                  {evidenceType === 'url'
                    ? 'Paste the URL for your credential or profile.'
                    : 'Upload your credential document for AI verification.'}
                </p>

                {/* Title and institution */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wider">
                      Credential Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Bachelor of Computer Science"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  {mode !== 'personal' && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wider">
                        {mode === 'import' ? 'Issuing Organization' : 'Recipient Name'}
                      </label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder={mode === 'import' ? 'e.g. Coursera, Google...' : 'e.g. John Doe'}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  )}
                  {mode === 'import' && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wider">
                        Source Platform
                      </label>
                      <select
                        value={externalPlatform}
                        onChange={(e) => setExternalPlatform(e.target.value as ExternalPlatform)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      >
                        {Object.entries(EXTERNAL_PLATFORM_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {evidenceType === 'url' ? (
                  <div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-surface">
                      <Globe size={16} className="text-foreground/40 shrink-0" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : file
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-border hover:border-border/60 hover:bg-surface-hover'
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip,.mp4,.webm"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                    />
                    {file ? (
                      <>
                        <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-emerald-400">{file.name}</p>
                        <p className="text-xs text-foreground/50 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <Upload size={28} className="text-foreground/30 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Drop file here or click to browse</p>
                        <p className="text-xs text-foreground/50 mt-1">PDF, Images, Word, ZIP, Video</p>
                      </>
                    )}
                  </div>
                )}

                {heuristicWarnings.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                    {heuristicWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-400 flex items-start gap-1.5">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        {w}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: AI Analyzing */}
            {step === 'analyzing' && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                <div className="relative mx-auto w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse" />
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Sparkles size={24} className="text-primary" />
                  </div>
                </div>
                <h3 className="text-base font-bold">AI Classification Running</h3>
                <p className="text-xs text-foreground/60 mt-2">Extracting metadata, verifying category, checking for forgery indicators...</p>
                <div className="mt-4 space-y-1.5">
                  {['Extracting document text', 'Classifying credential type', 'Checking forgery indicators', 'Generating risk score'].map((label, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.5 }}
                      className="flex items-center gap-2 text-xs text-foreground/50"
                    >
                      <Loader2 size={10} className="animate-spin text-primary" />
                      {label}...
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 6: AI Result */}
            {step === 'result' && aiResult && (
              <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-base font-semibold mb-4">AI Analysis Complete</h3>

                {/* Risk indicator */}
                <div className={`p-4 rounded-xl border mb-4 ${
                  aiResult.recommendation === 'proceed'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : aiResult.recommendation === 'review'
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-rose-500/30 bg-rose-500/10'
                }`}>
                  <div className="flex items-center gap-3">
                    {aiResult.recommendation === 'proceed'
                      ? <CheckCircle2 size={20} className="text-emerald-400" />
                      : aiResult.recommendation === 'review'
                      ? <AlertTriangle size={20} className="text-amber-400" />
                      : <XCircle size={20} className="text-rose-400" />
                    }
                    <div>
                      <p className={`text-sm font-bold ${
                        aiResult.recommendation === 'proceed' ? 'text-emerald-400' :
                        aiResult.recommendation === 'review' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {aiResult.recommendation === 'proceed' ? 'Verified — Safe to Submit' :
                         aiResult.recommendation === 'review' ? 'Needs Review' :
                         'Rejected — Cannot Submit'}
                      </p>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Confidence: {aiResult.confidence}% · Risk Score: {aiResult.riskScore}/100
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-foreground/50">Detected</p>
                      <p className="text-xs font-bold">{aiResult.detectedType ? CREDENTIAL_TYPE_LABELS[aiResult.detectedType] : 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                {aiResult.reasons.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {aiResult.reasons.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                        <Info size={12} className="shrink-0 mt-0.5 text-foreground/40" />
                        {r}
                      </div>
                    ))}
                  </div>
                )}

                {/* Forgery signs */}
                {aiResult.forgerySigns && aiResult.forgerySigns.length > 0 && (
                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1 mb-4">
                    <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Forgery Indicators Detected
                    </p>
                    {aiResult.forgerySigns.map((s, i) => (
                      <p key={i} className="text-xs text-foreground/60 pl-4">• {s}</p>
                    ))}
                  </div>
                )}

                {aiResult.extractedInstitution && (
                  <p className="text-xs text-foreground/60 mb-1">
                    <span className="font-semibold">Institution detected:</span> {aiResult.extractedInstitution}
                  </p>
                )}
                {aiResult.extractedDate && (
                  <p className="text-xs text-foreground/60 mb-4">
                    <span className="font-semibold">Date detected:</span> {aiResult.extractedDate}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="p-5 border-t border-border flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 'category') { onCancel(); return; }
              const prev: Record<WizardStep, WizardStep> = {
                category: 'category', type: 'category', evidence: 'type',
                upload: 'evidence', analyzing: 'upload', result: 'upload',
              };
              setStep(prev[step]);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} /> {step === 'category' ? 'Cancel' : 'Back'}
          </button>

          {step !== 'analyzing' && step !== 'result' && (
            <button
              onClick={() => {
                const next: Partial<Record<WizardStep, WizardStep>> = {
                  category: 'type', type: 'evidence', evidence: 'upload', upload: 'analyzing',
                };
                if (step === 'upload') { runAnalysis(); return; }
                if (next[step]) setStep(next[step]!);
              }}
              disabled={
                (step === 'category' && !category) ||
                (step === 'type' && (!credType || availableTypes.length === 0)) ||
                (step === 'evidence' && !evidenceType) ||
                (step === 'upload' && !title) ||
                (step === 'upload' && evidenceType !== 'url' && !file) ||
                (step === 'upload' && evidenceType === 'url' && !url)
              }
              className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 'upload' ? (
                <><Sparkles size={13} /> Analyze with AI</>
              ) : (
                <>Continue <ChevronRight size={14} /></>
              )}
            </button>
          )}

          {step === 'result' && aiResult && (
            <div className="flex gap-2">
              {aiResult.recommendation !== 'reject' && (
                <button
                  onClick={() => {
                    if (!category || !credType || !evidenceType || !aiResult) return;
                    onComplete({
                      category, credentialType: credType, evidenceType,
                      file: file ?? undefined, url: url || undefined,
                      title, institution: institution || undefined,
                      externalPlatform: mode === 'import' ? externalPlatform : undefined,
                      aiResult, isImport: mode === 'import',
                    });
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Shield size={13} />
                  {mode === 'official' ? 'Issue Credential' : 'Save to Vault'}
                </button>
              )}
              {aiResult.recommendation === 'reject' && (
                <div className="flex gap-2">
                  {mode !== 'official' && (
                    <button
                      onClick={() => {
                        if (!category || !credType || !evidenceType || !aiResult) return;
                        onComplete({
                          category, credentialType: credType, evidenceType,
                          file: file ?? undefined, url: url || undefined,
                          title, institution: institution || undefined,
                          externalPlatform: mode === 'import' ? externalPlatform : undefined,
                          aiResult, isImport: mode === 'import',
                        });
                      }}
                      className="flex items-center gap-1.5 px-5 py-2 bg-foreground/10 text-foreground text-xs font-bold rounded-lg hover:bg-foreground/20 transition-colors border border-border"
                    >
                      <Upload size={13} /> Upload Anyway
                    </button>
                  )}
                  <button
                    onClick={onCancel}
                    className="flex items-center gap-1.5 px-5 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <XCircle size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
