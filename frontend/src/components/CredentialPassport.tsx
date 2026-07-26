"use client";
// CredentialPassport — Universal Decentralized Credential Profile
// Extended: Two sections (Official + Personal Vault), AI upload wizard, external import

import { useState, useEffect, useCallback } from "react";
import {
  User, GraduationCap, Code, BookOpen, Trophy, Briefcase,
  Award, Star, Plus, QrCode, ExternalLink, Shield, Calendar,
  ChevronDown, ChevronUp, Wallet, X, Check, Upload,
  Download, Link, Globe, FileText, Import, Lock, Unlock,
  Sparkles
} from "lucide-react";
import { useStellar } from "@/hooks/useStellar";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { dbGetCredentials, dbInsertCredential, dbDeleteCredential } from "@/lib/db";
import { CredentialUploadWizard } from "@/components/CredentialUploadWizard";
import { VerificationHistory } from "@/components/VerificationHistory";
import type { WizardResult } from "@/components/CredentialUploadWizard";
import { contractService } from "@/services/contract";
import { PendingClaims } from "@/components/PendingClaims";
import { writeAuditLog } from "@/services/notificationService";
import { supabase } from "@/lib/supabase";
import {
  CREDENTIAL_CATEGORY_LABELS,
  CREDENTIAL_TYPE_LABELS,
  UPLOAD_TYPE_LABELS,
} from "@/lib/types";
import type { CredentialCategory, UploadType } from "@/lib/types";

// ── Credential Types (legacy + new) ─────────────────────────────────────────
export type CredentialType =
  | "degree" | "certificate" | "hackathon" | "research"
  | "bootcamp" | "internship" | "badge" | "license";

export interface Credential {
  id: string;
  type: CredentialType;
  title: string;
  issuer: string;
  issuerCountry?: string;
  issuedAt: string;
  expiresAt?: string;
  certHash?: string;
  txHash?: string;
  description?: string;
  skills?: string[];
  verified: boolean;
  // New extended fields
  category?: CredentialCategory;
  upload_type?: UploadType;
  source_platform?: string;
  is_public?: boolean;
  share_token?: string;
  file_url?: string;
  evidence_type?: string;
}

const CREDENTIAL_TYPE_CONFIG: Record<CredentialType, { icon: any; label: string; color: string }> = {
  degree:      { icon: GraduationCap, label: "Degree",        color: "text-info bg-info-bg" },
  certificate: { icon: Award,         label: "Certificate",   color: "text-success bg-success-bg" },
  hackathon:   { icon: Code,          label: "Hackathon",     color: "text-purple-600 bg-purple-50" },
  research:    { icon: BookOpen,      label: "Research",      color: "text-amber-600 bg-amber-50" },
  bootcamp:    { icon: Trophy,        label: "Bootcamp",      color: "text-orange-600 bg-orange-50" },
  internship:  { icon: Briefcase,     label: "Internship",    color: "text-teal-600 bg-teal-50" },
  badge:       { icon: Star,          label: "Skill Badge",   color: "text-warning bg-warning-bg" },
  license:     { icon: Shield,        label: "License",       color: "text-danger bg-danger-bg" },
};

// ── Upload type badge ────────────────────────────────────────────────────────
function UploadBadge({ uploadType }: { uploadType?: UploadType }) {
  if (!uploadType || uploadType === 'official') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
        <Shield size={8} /> Blockchain
      </span>
    );
  }
  if (uploadType === 'imported') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20">
        <Globe size={8} /> Imported
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
      <User size={8} /> Self-Published
    </span>
  );
}

const PASSPORT_KEY = "certifyval_passport_";

// Legacy localStorage helpers used ONLY as offline fallback
function getPassportCredentials(walletAddress: string): Credential[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PASSPORT_KEY + walletAddress);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Add Credential Form ────────────────────────────────────────────────────
function AddCredentialForm({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Credential) => void }) {
  const [form, setForm] = useState({
    type: "certificate" as CredentialType,
    title: "", issuer: "", issuerCountry: "",
    issuedAt: "", expiresAt: "", description: "",
    certHash: "", skills: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.issuer) return;
    const cred: Credential = {
      id: `cred-${Date.now()}`,
      type: form.type,
      title: form.title,
      issuer: form.issuer,
      issuerCountry: form.issuerCountry || undefined,
      issuedAt: form.issuedAt || new Date().toISOString().split("T")[0],
      expiresAt: form.expiresAt || undefined,
      description: form.description || undefined,
      certHash: form.certHash || undefined,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      verified: !!form.certHash,
    };
    onAdd(cred);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold">Add Credential</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CredentialType }))} className="input-field w-full px-3 py-2.5 text-sm">
              {Object.entries(CREDENTIAL_TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Bachelor of Computer Science" className="input-field w-full px-3 py-2.5 text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Issuer *</label>
              <input type="text" value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} placeholder="e.g. MIT" className="input-field w-full px-3 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Country</label>
              <input type="text" value={form.issuerCountry} onChange={e => setForm(f => ({ ...f, issuerCountry: e.target.value }))} placeholder="USA" className="input-field w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Issue Date</label>
              <input type="date" value={form.issuedAt} onChange={e => setForm(f => ({ ...f, issuedAt: e.target.value }))} className="input-field w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="input-field w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Certificate Hash (optional — blockchain link)</label>
            <input type="text" value={form.certHash} onChange={e => setForm(f => ({ ...f, certHash: e.target.value }))} placeholder="SHA-256 hash..." className="input-field w-full px-3 py-2.5 text-sm font-mono text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Skills (comma-separated)</label>
            <input type="text" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="e.g. Rust, Soroban, Smart Contracts" className="input-field w-full px-3 py-2.5 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2.5 text-xs font-bold uppercase tracking-widest">Cancel</button>
            <button type="submit" className="flex-1 btn-primary py-2.5 text-xs font-bold uppercase tracking-widest">Add to Passport</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Credential Card ────────────────────────────────────────────────────────
function CredentialCard({ cred, onRemove }: { cred: Credential; onRemove: (id: string) => void }) {
  const { address } = useStellar();
  const [expanded, setExpanded] = useState(false);
  const config = CREDENTIAL_TYPE_CONFIG[cred.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      <div
        className="p-4 flex items-start gap-3 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">{cred.title}</p>
              <p className="text-xs text-foreground/50 mt-0.5 truncate">{cred.issuer}{cred.issuerCountry ? ` · ${cred.issuerCountry}` : ""}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <UploadBadge uploadType={cred.upload_type} />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.color}`}>{config.label}</span>
              {expanded ? <ChevronUp size={14} className="text-foreground/30" /> : <ChevronDown size={14} className="text-foreground/30" />}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-foreground/40 flex items-center gap-1">
              <Calendar size={9} /> {cred.issuedAt}
            </span>
            {cred.expiresAt && (
              <span className="text-[10px] text-foreground/40">Expires: {cred.expiresAt}</span>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-4 bg-secondary/30 space-y-3">
              {cred.description && <p className="text-xs text-foreground/70 leading-relaxed">{cred.description}</p>}
              {cred.skills && cred.skills.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {cred.skills.map(s => (
                      <span key={s} className="text-[10px] font-medium px-2 py-0.5 bg-secondary border border-border rounded text-foreground/70">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {cred.certHash && (
                <div>
                  <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Blockchain Proof</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-foreground/60 bg-secondary px-2 py-1 rounded border border-border">{cred.certHash.substring(0, 24)}...</span>
                    <a href={(() => {
                      const match = cred.description?.match(/TX:\s*([a-fA-F0-9]+)/);
                      const txHash = match ? match[1] : null;
                      return txHash 
                        ? `https://stellar.expert/explorer/testnet/tx/${txHash}` 
                        : `https://stellar.expert/explorer/testnet/account/${address}`;
                    })()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" title="View on Stellar Expert">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
              {(cred.certHash || cred.file_url) && (
                <div className="pt-1">
                  <a
                    href={cred.file_url || (cred.certHash ? `/verify/${cred.certHash}` : '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded transition-colors"
                  >
                    <FileText size={14} /> View Certificate
                  </a>
                </div>
              )}
              <button
                onClick={() => onRemove(cred.id)}
                className="text-[10px] font-bold text-danger/60 hover:text-danger transition-colors flex items-center gap-1 pt-2"
              >
                <X size={10} /> Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Passport Component ─────────────────────────────────────────
type PassportSection = 'official' | 'vault' | 'history';

export function CredentialPassport() {
  const { address, isConnected, sign } = useStellar();
  const { role, institutionType } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [section, setSection] = useState<PassportSection>('official');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWizard, setShowWizard] = useState<'personal' | 'import' | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CredentialCategory | 'all'>('all');

  useEffect(() => {
    if (!address) return;
    dbGetCredentials(address).then(dbCreds => {
      if (dbCreds.length > 0) {
        setCredentials(dbCreds.map(d => ({
          id: d.id,
          type: d.type as CredentialType,
          title: d.title,
          issuer: d.institution,
          issuedAt: d.date,
          certHash: d.cert_hash,
          description: d.description,
          skills: d.skills,
          verified: !!d.cert_hash,
          category: (d as any).category,
          upload_type: (d as any).upload_type || 'official',
          source_platform: (d as any).source_platform,
          is_public: (d as any).is_public ?? true,
          share_token: (d as any).share_token,
          file_url: (d as any).file_url,
          evidence_type: (d as any).evidence_type,
        })));
      } else {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('certifyval_passport_' + address) : null;
        if (raw) setCredentials(JSON.parse(raw));
      }
    }).catch(() => {});
  }, [address]);

  const addFromWizard = async (result: WizardResult) => {
    if (!address) return;
    const shareToken = `cv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // Trigger blockchain transaction for the upload
    const txHash = await contractService.publishCredential(result.title, address, sign);

    let documentUrl = result.url || undefined;
    if (result.file) {
      const fileName = `vault-${Date.now()}-${result.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, result.file, { cacheControl: '3600', upsert: false });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
        documentUrl = urlData.publicUrl;
      }
    }

    const newCred: Credential = {
      id: `cred-${Date.now()}`,
      type: 'certificate' as CredentialType,
      title: result.title,
      issuer: result.institution || (result.externalPlatform ?? 'Self'),
      issuedAt: new Date().toISOString().split('T')[0],
      verified: result.aiResult.recommendation === 'proceed',
      description: `${CREDENTIAL_TYPE_LABELS[result.credentialType]} — AI Confidence: ${result.aiResult.confidence}%`,
      category: result.category,
      upload_type: result.isImport ? 'imported' : 'self_published',
      source_platform: result.externalPlatform,
      is_public: true,
      share_token: shareToken,
      txHash: txHash,
      file_url: documentUrl,
      evidence_type: result.evidenceType,
    };
    setCredentials(prev => [newCred, ...prev]);
    await dbInsertCredential({
      id: newCred.id,
      wallet_address: address,
      title: newCred.title,
      institution: newCred.issuer,
      type: newCred.type,
      date: newCred.issuedAt,
      description: newCred.description,
      ...({
        category: result.category,
        credential_type: result.credentialType,
        evidence_type: result.evidenceType,
        upload_type: newCred.upload_type,
        source_platform: result.externalPlatform,
        is_public: true,
        share_token: shareToken,
        ai_risk_score: result.aiResult.riskScore,
        ai_classification: result.aiResult.detectedType,
        file_url: documentUrl,
      } as any),
    });
    setShowWizard(null);
  };

  const addCredential = async (cred: Credential) => {
    if (!address) return;
    setCredentials(prev => [cred, ...prev]);
    await dbInsertCredential({
      id: cred.id,
      wallet_address: address,
      title: cred.title,
      institution: cred.issuer,
      type: cred.type,
      date: cred.issuedAt,
      cert_hash: cred.certHash,
      skills: cred.skills,
      description: cred.description,
    });
    setShowAddForm(false);
  };

  const removeCredential = async (id: string) => {
    if (!address) return;
    setCredentials(prev => prev.filter(c => c.id !== id));
    await dbDeleteCredential(id);
  };

  const passportUrl = address ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify/passport/${address}` : "";

  // Split into sections
  const officialCreds = credentials.filter(c => !c.upload_type || c.upload_type === 'official');
  const vaultCreds = credentials.filter(c => c.upload_type === 'imported' || c.upload_type === 'self_published');
  const displayCreds = section === 'official' ? officialCreds : vaultCreds;
  const filtered = activeCategory === 'all' ? displayCreds : displayCreds.filter(c => c.category === activeCategory);

  const verifiedCount = officialCreds.filter(c => c.verified).length;
  const allSkills = [...new Set(credentials.flatMap(c => c.skills || []))];

  if (!isConnected) {
    return (
      <div className="card max-w-xl mx-auto p-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5 text-foreground/40 border border-border">
          <Wallet size={28} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold mb-2 tracking-tight">Connect Your Wallet</h2>
        <p className="text-sm text-foreground/50 max-w-[280px] mx-auto leading-relaxed">
          Your Credential Passport is tied to your wallet address. Connect to view and manage your decentralized credential profile.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Pending Claims Banner */}
      <PendingClaims onClaimed={() => {
        // Refresh credentials after a claim
        if (address) dbGetCredentials(address).then(dbCreds => {
          if (dbCreds.length > 0) setCredentials(dbCreds.map(d => ({
            id: d.id,
            type: d.type as CredentialType,
            title: d.title,
            issuer: d.institution,
            issuedAt: d.date,
            certHash: d.cert_hash,
            description: d.description,
            skills: d.skills,
            verified: !!d.cert_hash,
            category: (d as any).category,
            upload_type: (d as any).upload_type || 'official',
            source_platform: (d as any).source_platform,
            is_public: (d as any).is_public ?? true,
            share_token: (d as any).share_token,
            file_url: (d as any).file_url,
            evidence_type: (d as any).evidence_type,
          })));
        }).catch(() => {});
      }} />

      {/* Profile Card */}
      <div className="card p-6 flex flex-col sm:flex-row gap-5 items-start">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <User size={28} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-foreground">My Credential Passport</h2>
              <p className="text-xs font-mono text-foreground/50 mt-0.5 break-all">
                {address?.substring(0, 12)}...{address?.slice(-8)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowQR(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors ${showQR ? "bg-primary text-primary-foreground border-primary" : "btn-secondary"}`}
              >
                <QrCode size={12} /> QR
              </button>
              <button
                onClick={() => setShowWizard('import')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded border border-border text-foreground/70 hover:bg-surface-hover transition-colors"
              >
                <Globe size={12} /> Import
              </button>
              <button
                onClick={() => setShowWizard('personal')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded border border-border text-foreground/70 hover:bg-surface-hover transition-colors"
              >
                <Upload size={12} /> Upload
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-secondary/30 border border-border/50 rounded-lg p-3 flex flex-col items-center justify-center transition-all hover:bg-secondary/50 hover:border-border">
              <p className="text-xl font-black text-foreground">{credentials.length}</p>
              <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mt-0.5">Total</p>
            </div>
            <div className="bg-success/5 border border-success/10 rounded-lg p-3 flex flex-col items-center justify-center transition-all hover:bg-success/10 hover:border-success/20">
              <p className="text-xl font-black text-success">{verifiedCount}</p>
              <p className="text-[9px] font-bold text-success/60 uppercase tracking-widest mt-0.5">Verified</p>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex flex-col items-center justify-center transition-all hover:bg-primary/10 hover:border-primary/20">
              <p className="text-xl font-black text-primary">{officialCreds.length}</p>
              <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest mt-0.5">Official</p>
            </div>
            <div className="bg-secondary/30 border border-border/50 rounded-lg p-3 flex flex-col items-center justify-center transition-all hover:bg-secondary/50 hover:border-border">
              <p className="text-xl font-black text-foreground">{vaultCreds.length}</p>
              <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mt-0.5">In Vault</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Switcher — 3 tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setSection('official')}
          className={`p-4 rounded-xl border text-left transition-all ${section === 'official' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border hover:bg-surface-hover'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className={section === 'official' ? 'text-emerald-400' : 'text-foreground/40'} />
            <span className="text-xs font-bold">Official</span>
          </div>
          <p className="text-[11px] text-foreground/50 hidden sm:block">Blockchain-verified credentials</p>
          <p className="text-lg font-bold mt-2 text-emerald-400">{officialCreds.length}</p>
        </button>
        <button
          onClick={() => setSection('vault')}
          className={`p-4 rounded-xl border text-left transition-all ${section === 'vault' ? 'border-blue-500/40 bg-blue-500/5' : 'border-border hover:bg-surface-hover'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className={section === 'vault' ? 'text-blue-400' : 'text-foreground/40'} />
            <span className="text-xs font-bold">Personal Vault</span>
          </div>
          <p className="text-[11px] text-foreground/50 hidden sm:block">Uploaded &amp; self-published</p>
          <p className="text-lg font-bold mt-2 text-blue-400">{vaultCreds.length}</p>
        </button>
        <button
          onClick={() => setSection('history')}
          className={`p-4 rounded-xl border text-left transition-all ${section === 'history' ? 'border-violet-500/40 bg-violet-500/5' : 'border-border hover:bg-surface-hover'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className={section === 'history' ? 'text-violet-400' : 'text-foreground/40'} />
            <span className="text-xs font-bold">Verify History</span>
          </div>
          <p className="text-[11px] text-foreground/50 hidden sm:block">Past verifications &amp; QR access</p>
          <p className="text-lg font-bold mt-2 text-violet-400">↗</p>
        </button>
      </div>

      {/* Section Header */}
      {section !== 'history' && (
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold">
            {section === 'official' ? '🛡 Official Credentials' : '🗂 Personal Vault'}
          </h3>
          <p className="text-xs text-foreground/50 mt-0.5">
            {section === 'official'
              ? 'Credentials issued by verified institutions, anchored on Stellar Soroban.'
              : 'Your personal documents, imported certificates, and self-published credentials.'}
          </p>
        </div>
        {section === 'vault' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowWizard('import')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded border border-border hover:bg-surface-hover transition-colors"
            >
              <Globe size={11} /> Import External
            </button>
            <button
              onClick={() => setShowWizard('personal')}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded"
            >
              <Upload size={11} /> Upload Document
            </button>
          </div>
        )}
      </div>
      )}



      {/* Verification History Section */}
      {section === 'history' && <VerificationHistory />}

      {/* QR Code Panel */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-6 flex flex-col sm:flex-row items-center gap-6"
          >
            <QRCodeDisplay value={passportUrl} label="Scan to view passport" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1.5">Passport URL</p>
              <code className="text-xs font-mono text-foreground/80 bg-secondary px-3 py-2 rounded border border-border block break-all">{passportUrl}</code>
              <p className="text-xs text-foreground/50 mt-3 leading-relaxed">
                Share this QR code or URL to let employers and institutions instantly verify your entire credential history.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credential List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-16 text-center opacity-40">
            <Award size={40} className="mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm font-medium">
              {section === 'official' ? 'No official credentials yet' : 'Your personal vault is empty'}
            </p>
            <p className="text-xs mt-1">
              {section === 'official' ? 'Official credentials appear here once issued by an institution' : 'Upload documents or import external certificates'}
            </p>
          </div>
        ) : (
          filtered.map(cred => (
            <motion.div
              key={cred.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                  <Award size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold truncate">{cred.title}</p>
                    <UploadBadge uploadType={cred.upload_type} />
                    {cred.verified && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Verified</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/60">{cred.issuer}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] text-foreground/40 flex items-center gap-1">
                      <Calendar size={9} /> {cred.issuedAt}
                    </span>
                    {cred.source_platform && (
                      <span className="text-[10px] text-foreground/40">via {cred.source_platform}</span>
                    )}
                    {cred.certHash && (
                      <a
                        href={(() => {
                          const match = cred.description?.match(/TX:\s*([a-fA-F0-9]+)/);
                          const txHash = match ? match[1] : null;
                          return txHash 
                            ? `https://stellar.expert/explorer/testnet/tx/${txHash}` 
                            : `https://stellar.expert/explorer/testnet/account/${address}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                        title="View on Stellar Expert"
                      >
                        <ExternalLink size={9} /> View on chain
                      </a>
                    )}
                    {(cred.certHash || cred.file_url) && (
                      <a
                        href={cred.file_url || (cred.certHash ? `/verify/${cred.certHash}` : '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        {cred.evidence_type === 'url' ? <Globe size={9} /> : <FileText size={9} />}
                        {cred.evidence_type === 'url' ? 'View Portfolio' : 'View Document'}
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeCredential(cred.id)}
                  className="p-1.5 rounded hover:bg-rose-500/10 text-foreground/30 hover:text-rose-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
              {cred.description && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-foreground/50 leading-relaxed">{cred.description}</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddForm && <AddCredentialForm onClose={() => setShowAddForm(false)} onAdd={addCredential} />}
      </AnimatePresence>

      {/* Upload Wizard */}
      <AnimatePresence>
        {showWizard && role && (
          <CredentialUploadWizard
            mode={showWizard}
            role={role}
            institutionType={institutionType}
            onComplete={addFromWizard}
            onCancel={() => setShowWizard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
