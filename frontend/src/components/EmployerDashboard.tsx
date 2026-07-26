"use client";
// EmployerDashboard — Employer verification & candidate management
// Extended: Supabase-backed bookmarks, candidate passport viewer, verification reports

import { useState, useCallback, useEffect } from "react";
import {
  Search, Bookmark, BookmarkCheck, Download, AlertTriangle,
  CheckCircle, XCircle, FileText, Eye, ExternalLink, User,
  Shield, Star, Clock, Building2, Loader2, Zap,
  Plus, Trash2, Users, BookOpen, ChevronRight
} from "lucide-react";
import { contractService } from "@/services/contract";
import { institutionService, type Institution } from "@/services/institutionContract";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeHybridFraud, HybridFraudAnalysisResult } from "@/services/ai/fraudEngine";
import { useStellar } from "@/hooks/useStellar";
import { supabase } from "@/lib/supabase";
import type { EmployerBookmark } from "@/lib/types";

interface VerificationRecord {
  id: string;
  certHash: string;
  ownerName: string | null;
  status: "valid" | "invalid" | "pending";
  verifiedAt: string;
  institution?: string;
  bookmarked: boolean;
  aiReport?: HybridFraudAnalysisResult;
}

const EMPLOYER_KEY = "certifyval_employer_verifications";

function getVerifications(): VerificationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EMPLOYER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveVerifications(records: VerificationRecord[]) {
  try { localStorage.setItem(EMPLOYER_KEY, JSON.stringify(records)); } catch { /* ignore */ }
}

async function generateImageReport(record: VerificationRecord) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 800;
  const height = 900;
  canvas.width = width;
  canvas.height = height;

  // Background - White for B&W professional look
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Border - Elegant thin black border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Inner border
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Draw Logo (Shield)
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(400, 80);
  ctx.lineTo(430, 80);
  ctx.lineTo(430, 110);
  ctx.bezierCurveTo(430, 130, 415, 150, 400, 160);
  ctx.bezierCurveTo(385, 150, 370, 130, 370, 110);
  ctx.lineTo(370, 80);
  ctx.closePath();
  ctx.fill();

  // Title
  ctx.fillStyle = "#000000";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CERTIFYVAL", width / 2, 210);

  ctx.fillStyle = "#4B5563"; // gray-600
  ctx.font = "bold 14px sans-serif";
  ctx.letterSpacing = "4px"; 
  ctx.fillText("OFFICIAL VERIFICATION REPORT", width / 2, 240);

  // Separator
  ctx.beginPath();
  ctx.moveTo(150, 280);
  ctx.lineTo(width - 150, 280);
  ctx.strokeStyle = "#D1D5DB";
  ctx.stroke();

  // Status Badge
  const isValid = record.status === "valid";
  ctx.textAlign = "center";
  ctx.fillStyle = isValid ? "#F0FDF4" : "#FEF2F2";
  ctx.beginPath();
  ctx.roundRect(width / 2 - 120, 310, 240, 44, 4);
  ctx.fill();
  
  ctx.strokeStyle = isValid ? "#166534" : "#991B1B";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = isValid ? "#166534" : "#991B1B";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`STATUS: ${record.status.toUpperCase()}`, width / 2, 338);

  // Content Labels
  let y = 420;
  const drawRow = (label: string, value: string) => {
    // Truncate to ensure it never exceeds available space (approx 40 chars max)
    const displayValue = value.length > 40 ? value.substring(0, 37) + "..." : value;
    
    ctx.textAlign = "left";
    ctx.fillStyle = "#6B7280"; // gray-500
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(label.toUpperCase(), 120, y);
    y += 24;
    ctx.fillStyle = "#111827"; // gray-900
    ctx.font = "16px monospace";
    // Max width 380 to absolutely prevent overlapping the QR code area
    ctx.fillText(displayValue, 120, y, 380); 
    y += 50;
  };

  drawRow("Verification ID", record.id);
  drawRow("Candidate Name", record.ownerName || "Unknown");
  drawRow("Document Hash (SHA-256)", record.certHash);
  drawRow("Verified At", record.verifiedAt);
  if (record.institution) {
    drawRow("Issuing Institution", record.institution);
  }

  // Footer text
  ctx.fillStyle = "#9CA3AF"; // gray-400
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Secured by Soroban Smart Contracts on the Stellar Network", width / 2, height - 70);

  // QR Code (Black on White)
  try {
    // Slightly smaller QR code (150x150) to give more breathing room to text
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(record.certHash)}&format=png&margin=0&color=000000&bgcolor=FFFFFF`;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = qrUrl;
    });
    
    if (img.width > 0) {
      ctx.drawImage(img, width - 120 - 150, 420, 150, 150);
      ctx.fillStyle = "#6B7280";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCAN TO VERIFY", width - 120 - 75, 595);
    }
  } catch (e) {
    console.warn("QR code generation failed:", e);
  }

  // Download
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `CertifyVal_Audit_${record.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error("Failed to export canvas", e);
    alert("Failed to generate image report. Please try again.");
  }
}

// ── Verification Search ────────────────────────────────────────────────────
function SearchPanel({ onVerify }: { onVerify: (record: VerificationRecord) => void }) {
  const [hashInput, setHashInput] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "done">("idle");
  const [result, setResult] = useState<{ valid: boolean; owner: string | null; aiReport?: HybridFraudAnalysisResult } | null>(null);
  const { address, sign } = useStellar();

  const handleVerify = async () => {
    if (!hashInput.trim() || status === "verifying") return;
    setStatus("verifying");
    setResult(null);

    try {
      const isValid = await contractService.verifyCertificate(hashInput.trim(), address || undefined, sign);
      const owner = isValid ? await contractService.getOwner(hashInput.trim()) : null;
      let aiReport;
      
      if (isValid && owner) {
        aiReport = await analyzeHybridFraud(hashInput.trim(), owner, undefined, undefined);
      }

      setResult({ valid: isValid, owner, aiReport });

      const record: VerificationRecord = {
        id: `VR-${Date.now().toString(36).toUpperCase()}`,
        certHash: hashInput.trim(),
        ownerName: owner,
        status: isValid ? "valid" : "invalid",
        verifiedAt: new Date().toLocaleString(),
        bookmarked: false,
        aiReport,
      };
      onVerify(record);
    } catch {
      setResult({ valid: false, owner: null });
    } finally {
      setStatus("done");
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
        <Search size={12} /> Verify Candidate Certificate
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={hashInput}
          onChange={e => setHashInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleVerify()}
          placeholder="Paste certificate hash (SHA-256)..."
          className="input-field flex-1 px-3 py-2.5 text-sm font-mono"
        />
        <button
          onClick={handleVerify}
          disabled={status === "verifying" || !hashInput.trim()}
          className="btn-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-40"
        >
          {status === "verifying" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {status === "verifying" ? "Verifying..." : "Verify"}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded border flex flex-col gap-3 ${result.valid ? "bg-success-bg border-success/30" : "bg-danger-bg border-danger/30"}`}
          >
            <div className="flex items-start gap-3">
              {result.valid
                ? <CheckCircle size={18} className="text-success shrink-0 mt-0.5" />
                : <XCircle size={18} className="text-danger shrink-0 mt-0.5" />}
              <div>
                <p className={`font-bold text-sm ${result.valid ? "text-success" : "text-danger"}`}>
                  {result.valid ? "Certificate Valid" : "Certificate Not Found"}
                </p>
                {result.owner && <p className="text-xs mt-1 text-foreground/70">Registered to: <strong>{result.owner}</strong></p>}
                {!result.valid && <p className="text-xs mt-1 text-danger/70">This hash was not found in the blockchain registry.</p>}
              </div>
            </div>
            
            {result.aiReport && (
              <div className="mt-2 pt-3 border-t border-success/20 w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-1 mb-2">
                  <Zap size={10} className="text-primary"/> AI Verification Summary
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background/50 p-2 rounded">
                     <p className="text-[9px] uppercase tracking-widest text-foreground/40">Risk Level</p>
                     <p className="font-bold uppercase" style={{ color: result.aiReport.riskLevel === 'safe' ? '#10B981' : result.aiReport.riskLevel === 'low' ? '#10B981' : result.aiReport.riskLevel === 'medium' ? '#F59E0B' : '#EF4444' }}>
                       {result.aiReport.riskLevel} ({result.aiReport.riskScore}/100)
                     </p>
                  </div>
                  <div className="bg-background/50 p-2 rounded">
                     <p className="text-[9px] uppercase tracking-widest text-foreground/40">AI Decision</p>
                     <p className="font-bold">{result.aiReport.aiDecision || "Heuristics Only"}</p>
                  </div>
                </div>
                {result.aiReport.aiRecommendation && (
                  <p className="text-[10px] mt-2 text-foreground/70 italic border-l-2 border-primary/30 pl-2">
                    {result.aiReport.aiRecommendation}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Verification Record Row ───────────────────────────────────────────────────
function VerificationRow({
  record,
  onBookmark,
  onDownload,
  onReport,
}: {
  record: VerificationRecord;
  onBookmark: (id: string) => void;
  onDownload: (record: VerificationRecord) => void;
  onReport: (id: string) => void;
}) {
  const isValid = record.status === "valid";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
    >
      {/* Status Indicator */}
      <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${isValid ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
        {isValid ? <CheckCircle size={14} /> : <XCircle size={14} />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">
            {record.ownerName || "Unknown Candidate"}
          </span>
          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isValid ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
            {record.status}
          </span>
          {record.bookmarked && <BookmarkCheck size={12} className="text-warning" />}
        </div>
        <p className="font-mono text-[10px] text-foreground/40 mt-0.5 truncate">{record.certHash.substring(0, 20)}...</p>
        <p className="text-[10px] text-foreground/30 mt-0.5 flex items-center gap-1">
          <Clock size={9} /> {record.verifiedAt}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onBookmark(record.id)}
          title={record.bookmarked ? "Remove bookmark" : "Bookmark candidate"}
          className={`p-2 rounded transition-colors ${record.bookmarked ? "text-warning hover:text-warning/70" : "text-foreground/30 hover:text-warning"}`}
        >
          {record.bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </button>
        <a
          href={`https://stellar.expert/explorer/testnet/search?term=${record.certHash}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Explorer"
          className="p-2 rounded text-foreground/30 hover:text-primary transition-colors"
        >
          <ExternalLink size={15} />
        </a>
        <button
          onClick={() => onDownload(record)}
          title="Download verification report"
          className="p-2 rounded text-foreground/30 hover:text-primary transition-colors"
        >
          <Download size={15} />
        </button>
        {isValid && (
          <button
            onClick={() => onReport(record.id)}
            title="Report suspected fraud"
            className="p-2 rounded text-foreground/30 hover:text-danger transition-colors"
          >
            <AlertTriangle size={15} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Institution Trust Panel ──────────────────────────────────────────────────
function InstitutionTrustPanel() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [searchInst, setSearchInst] = useState("");

  useEffect(() => {
    institutionService.getApprovedInstitutions().then(setInstitutions);
  }, []);

  const filtered = institutions.filter(i =>
    !searchInst || i.name.toLowerCase().includes(searchInst.toLowerCase())
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
          <Building2 size={12} /> Institution Trust Scores
        </p>
        <input
          type="text"
          value={searchInst}
          onChange={e => setSearchInst(e.target.value)}
          placeholder="Search..."
          className="input-field px-2 py-1 text-xs w-36"
        />
      </div>
      <div className="divide-y divide-border max-h-64 overflow-y-auto">
        {filtered.slice(0, 10).map(inst => (
          <div key={inst.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors">
            <Shield size={14} className="text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{inst.name}</p>
              <p className="text-[10px] text-foreground/40">{inst.country}</p>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={10} className={s <= institutionService.getTrustStars(inst.trustScore) ? "text-yellow-500 fill-yellow-500" : "text-foreground/20"} />
              ))}
            </div>
            <span className="text-xs font-bold text-foreground/60">{inst.trustScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Employer Dashboard ───────────────────────────────────────────────────
export function EmployerDashboard() {
  const { address } = useStellar();
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [filterView, setFilterView] = useState<"all" | "bookmarked">("all");
  const [reportedId, setReportedId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<EmployerBookmark[]>([]);
  const [candidateWallet, setCandidateWallet] = useState('');
  const [newBookmarkNotes, setNewBookmarkNotes] = useState('');
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);

  useEffect(() => { setVerifications(getVerifications()); }, []);

  // Load Supabase bookmarks
  useEffect(() => {
    if (!address) return;
    supabase.from('employer_bookmarks').select('*').eq('employer_wallet', address)
      .then(({ data }) => setBookmarks((data ?? []) as EmployerBookmark[]));
  }, [address]);

  const handleVerify = useCallback((record: VerificationRecord) => {
    setVerifications(prev => {
      const updated = [record, ...prev].slice(0, 50);
      saveVerifications(updated);
      return updated;
    });
  }, []);

  const handleBookmark = useCallback((id: string) => {
    setVerifications(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, bookmarked: !r.bookmarked } : r);
      saveVerifications(updated);
      return updated;
    });
  }, []);

  // Save a candidate to Supabase bookmarks
  const saveCandidate = useCallback(async () => {
    if (!address || !candidateWallet.trim()) return;
    const bookmark: EmployerBookmark = {
      id: '',
      employer_wallet: address,
      candidate_wallet: candidateWallet.trim(),
      notes: newBookmarkNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };
    const { data } = await supabase.from('employer_bookmarks').insert(bookmark).select().single();
    if (data) setBookmarks(prev => [data as EmployerBookmark, ...prev]);
    setCandidateWallet('');
    setNewBookmarkNotes('');
  }, [address, candidateWallet, newBookmarkNotes]);

  const removeBookmark = useCallback(async (id: string) => {
    await supabase.from('employer_bookmarks').delete().eq('id', id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleReport = useCallback((id: string) => {
    setReportedId(id);
    setTimeout(() => setReportedId(null), 3000);
  }, []);

  const displayed = filterView === "all" ? verifications : verifications.filter(r => r.bookmarked);
  const bookmarkCount = verifications.filter(r => r.bookmarked).length;


  const totalVerif = verifications.length;
  const totalValid = verifications.filter(r => r.status === 'valid').length;

  return (
    <div className="w-full space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Verifications", value: totalVerif, icon: Eye, color: "text-primary" },
          { label: "Verified Valid", value: totalValid, icon: CheckCircle, color: "text-success" },
          { label: "Bookmarked", value: bookmarkCount, icon: Bookmark, color: "text-warning" },
          { label: "Saved Candidates", value: bookmarks.length, icon: Users, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Bookmarks Panel */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between cursor-pointer"
          onClick={() => setShowBookmarkPanel(v => !v)}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
            <Users size={12} /> Candidate Bookmarks ({bookmarks.length})
          </p>
          <ChevronRight size={14} className={`text-foreground/40 transition-transform ${showBookmarkPanel ? 'rotate-90' : ''}`} />
        </div>
        <AnimatePresence>
          {showBookmarkPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Add bookmark */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Candidate wallet address (G...)"
                    value={candidateWallet}
                    onChange={e => setCandidateWallet(e.target.value)}
                    className="flex-1 input-field px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={newBookmarkNotes}
                    onChange={e => setNewBookmarkNotes(e.target.value)}
                    className="w-32 input-field px-3 py-2 text-xs"
                  />
                  <button
                    onClick={saveCandidate}
                    disabled={!candidateWallet.trim()}
                    className="btn-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded disabled:opacity-40"
                  >
                    <Plus size={12} /> Save
                  </button>
                </div>
                {/* Bookmark list */}
                {bookmarks.length === 0 ? (
                  <p className="text-xs text-foreground/40 text-center py-6">No candidates bookmarked yet. Add a wallet address above.</p>
                ) : (
                  <div className="space-y-2">
                    {bookmarks.map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                        <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <User size={12} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-foreground/80 truncate">{b.candidate_wallet}</p>
                          {b.notes && <p className="text-[10px] text-foreground/50 mt-0.5">{b.notes}</p>}
                        </div>
                        <button
                          onClick={() => removeBookmark(b.id)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-foreground/30 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Panel */}
      <SearchPanel onVerify={handleVerify} />

      {/* Fraud Report Toast */}
      <AnimatePresence>
        {reportedId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 bg-danger text-white px-4 py-3 rounded shadow-lg text-xs font-bold flex items-center gap-2"
          >
            <AlertTriangle size={14} /> Fraud report submitted for review.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Verification History */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
              <FileText size={12} /> Verification History
            </p>
            <div className="flex bg-secondary rounded overflow-hidden border border-border">
              {(["all", "bookmarked"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setFilterView(v)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${filterView === v ? "bg-primary text-primary-foreground" : "text-foreground/50 hover:text-foreground"}`}
                >
                  {v === "all" ? `All (${verifications.length})` : `Bookmarked (${bookmarkCount})`}
                </button>
              ))}
            </div>
          </div>
          {displayed.length === 0 ? (
            <div className="p-12 text-center opacity-40">
              <User size={32} className="mx-auto mb-3" strokeWidth={1} />
              <p className="text-sm font-medium">No verifications yet</p>
              <p className="text-xs mt-1">Search a certificate hash above to get started</p>
            </div>
          ) : (
            <div>
              {displayed.map(record => (
                <VerificationRow
                  key={record.id}
                  record={record}
                  onBookmark={handleBookmark}
                  onDownload={generateImageReport}
                  onReport={handleReport}
                />
              ))}
            </div>
          )}
        </div>

        {/* Institution Trust Panel */}
        <div>
          <InstitutionTrustPanel />
        </div>
      </div>
    </div>
  );
}
