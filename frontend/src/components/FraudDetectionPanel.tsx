"use client";
// FraudDetectionPanel — AI Fraud Analysis UI (Feature 5)
// Displays risk analysis results before certificate issuance

import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, XCircle, Zap, Eye, Info } from "lucide-react";
import type { FraudAnalysisResult, FraudFlag, RiskLevel } from "@/services/fraudDetection";

interface FraudDetectionPanelProps {
  result: FraudAnalysisResult | null;
  isAnalyzing: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

const RISK_CONFIG: Record<RiskLevel, {
  color: string; bg: string; border: string; label: string; icon: any; textColor: string;
}> = {
  safe:   { color: "text-success",  bg: "bg-success-bg",   border: "border-success/30",   label: "SAFE",        icon: CheckCircle,    textColor: "#10B981" },
  low:    { color: "text-success",  bg: "bg-success-bg",   border: "border-success/20",   label: "LOW RISK",    icon: Shield,         textColor: "#10B981" },
  medium: { color: "text-warning",  bg: "bg-warning-bg",   border: "border-warning/30",   label: "MEDIUM RISK", icon: AlertTriangle,  textColor: "#F59E0B" },
  high:   { color: "text-danger",   bg: "bg-danger-bg",    border: "border-danger/30",    label: "HIGH RISK",   icon: XCircle,        textColor: "#EF4444" },
};

const SEVERITY_CONFIG: Record<RiskLevel, { color: string; bg: string }> = {
  safe:   { color: "text-success", bg: "bg-success-bg" },
  low:    { color: "text-success", bg: "bg-success-bg" },
  medium: { color: "text-warning", bg: "bg-warning-bg" },
  high:   { color: "text-danger",  bg: "bg-danger-bg" },
};

// Animated risk meter arc
function RiskMeter({ score }: { score: number }) {
  const radius = 44;
  const circumference = Math.PI * radius; // semicircle
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "#EF4444" : score >= 40 ? "#F59E0B" : "#10B981";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 110, height: 60 }}>
        <svg width="110" height="60" viewBox="0 0 110 60">
          {/* Background track */}
          <path
            d="M 10 55 A 45 45 0 0 1 100 55"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-border-strong"
          />
          {/* Progress arc */}
          <motion.path
            d="M 10 55 A 45 45 0 0 1 100 55"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-black"
            style={{ color }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Risk Score</p>
    </div>
  );
}

// Flag item
function FlagItem({ flag }: { flag: FraudFlag }) {
  const cfg = SEVERITY_CONFIG[flag.severity];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded border ${cfg.bg} border-transparent`}
    >
      <AlertTriangle size={14} className={`${cfg.color} shrink-0 mt-0.5`} />
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{flag.code.replace(/_/g, " ")}</p>
        <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">{flag.message}</p>
      </div>
    </motion.div>
  );
}

export function FraudDetectionPanel({
  result,
  isAnalyzing,
  onProceed,
  onCancel,
}: FraudDetectionPanelProps) {
  if (!isAnalyzing && !result) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="card border-t-4 border-t-primary overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">AI Fraud Detection Analysis</span>
        </div>

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Eye size={20} className="absolute inset-0 m-auto text-primary/60" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Running Hybrid Risk Analysis...</p>
              <p className="text-xs text-foreground/50 mt-1">Checking local heuristics and running Groq AI models...</p>
            </div>
          </div>
        )}

        {/* Result */}
        {!isAnalyzing && result && (() => {
          const cfg = RISK_CONFIG[result.riskLevel];
          const Icon = cfg.icon;
          return (
            <div className="p-5 space-y-5">
              {/* Score + Level */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded border ${cfg.border} ${cfg.bg}`}>
                <div className="flex items-center gap-5">
                  <RiskMeter score={result.riskScore} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={18} className={cfg.color} />
                      <span className={`text-sm font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-[10px] text-foreground/60 leading-relaxed font-mono">
                      Heuristic: {result.heuristicScore}/100
                      {result.usedAI && ` • AI Confidence: ${result.aiConfidence}%`}
                    </p>
                    <p className="text-[9px] font-mono text-foreground/30 mt-1.5">Analysis ID: {result.analysisId}</p>
                  </div>
                </div>
                {result.usedAI && (
                  <div className="sm:text-right bg-background/50 p-2 rounded border border-border/50">
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center sm:justify-end gap-1">
                      <Zap size={10} /> AI Decision
                    </p>
                    <div className="text-xs font-bold font-mono">
                      {result.aiDecision} (Score: {result.aiScore})
                    </div>
                  </div>
                )}
              </div>

              {/* AI Details */}
              {result.usedAI && result.aiReasons && result.aiReasons.length > 0 && (
                <div className="space-y-3 p-4 bg-secondary/20 rounded border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Groq Llama-3 AI Auditor</span>
                  </div>
                  <div className="space-y-2">
                    {result.aiReasons.map((reason, idx) => (
                      <p key={idx} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span> {reason}
                      </p>
                    ))}
                  </div>
                  {result.aiRecommendation && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/50 mb-1">AI Recommendation</p>
                      <p className="text-xs font-semibold text-foreground/90">{result.aiRecommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Flags */}
              {result.flags.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle size={10} /> Local Heuristic Flags ({result.flags.length})
                  </p>
                  {result.flags.map(flag => <FlagItem key={flag.code} flag={flag} />)}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-success-bg rounded border border-success/20">
                  <CheckCircle size={14} className="text-success" />
                  <p className="text-xs text-success font-medium">No local deterministic fraud indicators detected.</p>
                </div>
              )}

              {/* Manual Review Notice */}
              {result.requiresManualReview && (
                <div className="flex items-start gap-2 p-3 bg-warning-bg rounded border border-warning/20">
                  <Info size={14} className="text-warning mt-0.5 shrink-0" />
                  <p className="text-xs text-warning/90 leading-relaxed">
                    <strong>Manual Review Required:</strong> Due to detected risk indicators, this issuance has been flagged for review. You may still proceed, but it will be logged for compliance auditing.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 btn-secondary py-2.5 text-xs font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={onProceed}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 shadow-sm
                    ${result.approved
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-warning/90 text-white hover:bg-warning"}`}
                >
                  {result.approved ? (
                    <><CheckCircle size={12} /> Proceed to Issue</>
                  ) : (
                    <><AlertTriangle size={12} /> Proceed with Caution</>
                  )}
                </button>
              </div>
            </div>
          );
        })()}
      </motion.div>
    </AnimatePresence>
  );
}
