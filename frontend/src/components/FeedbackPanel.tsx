"use client";
// FeedbackPanel — User feedback collection and analytics (Feature 9)
// Now Supabase-backed: feedback syncs across all devices.

import { useState, useEffect, useCallback } from "react";
import { Star, Send, MessageSquare, Users, BarChart2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dbGetFeedback, dbInsertFeedback } from "@/lib/db";
import { useStellar } from "@/hooks/useStellar";

type Role = "student" | "employer" | "institution" | "other";
type Rating = 1 | 2 | 3 | 4 | 5;

interface FeedbackEntry {
  id: string;
  role: Role;
  rating: Rating;
  message: string;
  feature?: string;
  submittedAt: string;
}


const FEATURES = ["Certificate Verification", "Issuance Portal", "Institution Registry", "Credential Passport", "Employer Dashboard", "Analytics", "Overall Platform"];
const ROLE_LABELS: Record<Role, string> = {
  student: "Student / Learner",
  employer: "Employer / HR",
  institution: "Institution / Issuer",
  other: "Other",
};

// ── Star Selector ─────────────────────────────────────────────────────────────
function StarSelector({ value, onChange }: { value: Rating; onChange: (r: Rating) => void }) {
  const [hovered, setHovered] = useState<number>(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i as Rating)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={24}
            className={`transition-colors ${i <= (hovered || value) ? "text-yellow-500 fill-yellow-500" : "text-foreground/20"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Analytics Summary ────────────────────────────────────────────────────────
function FeedbackAnalytics({ entries }: { entries: FeedbackEntry[] }) {
  const avgRating = entries.length
    ? (entries.reduce((s, e) => s + e.rating, 0) / entries.length).toFixed(1)
    : "0.0";

  const roleCounts = entries.reduce((acc, e) => {
    acc[e.role] = (acc[e.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: entries.filter(e => e.rating === r).length,
  }));
  const maxCount = Math.max(...ratingCounts.map(r => r.count), 1);

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className="card p-5 flex items-center gap-5">
        <div className="text-center">
          <p className="text-4xl font-black text-foreground">{avgRating}</p>
          <div className="flex justify-center gap-0.5 mt-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={12} className={i <= Math.round(parseFloat(avgRating)) ? "text-yellow-500 fill-yellow-500" : "text-foreground/20"} />
            ))}
          </div>
          <p className="text-[10px] text-foreground/40 mt-1">{entries.length} reviews</p>
        </div>
        {/* Rating breakdown */}
        <div className="flex-1 space-y-1.5">
          {ratingCounts.map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-foreground/50 w-4">{rating}</span>
              <Star size={9} className="text-yellow-500 fill-yellow-500 shrink-0" />
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-yellow-500 rounded-full"
                />
              </div>
              <span className="text-[9px] text-foreground/30 w-4">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-3 flex items-center gap-2">
          <Users size={11} /> By Role
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between p-2.5 bg-secondary rounded">
              <span className="text-xs font-medium text-foreground/70">{ROLE_LABELS[role as Role]}</span>
              <span className="text-xs font-bold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feedback Card ─────────────────────────────────────────────────────────────
function FeedbackCard({ entry }: { entry: FeedbackEntry }) {
  let displayMessage = entry.message;
  let username = undefined;
  
  const match = displayMessage.match(/^\[From:\s*(.*?)\]\s*(.*)$/s);
  if (match) {
    username = match[1];
    displayMessage = match[2];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-foreground/40">
            <Users size={12} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {username ? <span className="font-bold text-primary mr-1">{username}</span> : null}
              <span className="text-foreground/70">{ROLE_LABELS[entry.role]}</span>
            </p>
            {entry.feature && <p className="text-[9px] text-foreground/40">{entry.feature}</p>}
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={10} className={i <= entry.rating ? "text-yellow-500 fill-yellow-500" : "text-foreground/15"} />
          ))}
        </div>
      </div>
      {displayMessage && <p className="text-xs text-foreground/70 leading-relaxed">&ldquo;{displayMessage}&rdquo;</p>}
      <p className="text-[9px] text-foreground/30">{new Date(entry.submittedAt).toLocaleDateString()}</p>
    </motion.div>
  );
}

// ── Main Feedback Panel ───────────────────────────────────────────────────────
export function FeedbackPanel() {
  const { address } = useStellar();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    username: "",
    role: "student" as Role,
    rating: 5 as Rating,
    message: "",
    feature: "",
  });

  useEffect(() => {
    dbGetFeedback().then(data => {
      setEntries(data.map(d => ({
        id: d.id,
        role: d.role as Role,
        rating: d.rating as Rating,
        message: d.message,
        feature: d.category !== 'Overall Platform' ? d.category : undefined,
        submittedAt: d.created_at ?? new Date().toISOString(),
      })));
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMessage = form.username.trim() 
      ? `[From: ${form.username.trim()}] ${form.message}` 
      : form.message;

    const entry: FeedbackEntry = {
      id: `fb-${Date.now()}`,
      role: form.role,
      rating: form.rating,
      message: finalMessage,
      feature: form.feature || undefined,
      submittedAt: new Date().toISOString(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    // Save to Supabase cloud
    await dbInsertFeedback({
      id: entry.id,
      wallet_address: address ?? undefined,
      role: entry.role,
      rating: entry.rating,
      category: entry.feature || 'Overall Platform',
      message: entry.message,
    });
    setSubmitted(true);
    setShowForm(false);
    setForm({ username: "", role: "student", rating: 5, message: "", feature: "" });
    setTimeout(() => setSubmitted(false), 4000);
  }, [form, entries, address]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase">Community Voice</span>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
        >
          <MessageSquare size={13} /> {showForm ? "Cancel" : "Leave Feedback"}
        </button>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-success-bg border border-success/30 rounded"
          >
            <Check size={16} className="text-success" />
            <p className="text-sm font-medium text-success">Thank you for your feedback! Your response has been recorded.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-secondary/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Share Your Experience</p>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Name (optional)</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="How should we call you?"
                    className="input-field w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">I am a...</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))} className="input-field w-full px-3 py-2.5 text-sm">
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Feature</label>
                  <select value={form.feature} onChange={e => setForm(f => ({ ...f, feature: e.target.value }))} className="input-field w-full px-3 py-2.5 text-sm">
                    <option value="">Overall Platform</option>
                    {FEATURES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-2">Overall Rating</label>
                <StarSelector value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block mb-1.5">Message (optional)</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Share your experience, suggestions, or how we can improve..."
                  rows={3}
                  className="input-field w-full px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Send size={13} /> Submit Feedback
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics */}
        <div className="lg:col-span-1">
          <FeedbackAnalytics entries={entries} />
        </div>

        {/* Feedback Cards */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
            <BarChart2 size={11} /> Recent Feedback ({entries.length})
          </p>
          {entries.slice(0, 10).map(entry => (
            <FeedbackCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
