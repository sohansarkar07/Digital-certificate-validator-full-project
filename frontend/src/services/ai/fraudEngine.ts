import { runHeuristicEngine, RiskLevel, FraudFlag } from "./heuristicEngine";
import { evaluateFraudWithAI, GroqFraudResponse } from "./groqService";

export interface HybridFraudAnalysisResult {
  riskLevel: RiskLevel;
  riskScore: number; // Final blended score
  heuristicScore: number;
  aiScore: number | null;
  aiConfidence: number | null;
  aiDecision: "SAFE" | "REVIEW" | "HIGH_RISK" | "FRAUD" | null;
  flags: FraudFlag[];
  aiReasons: string[];
  aiRecommendation: string | null;
  approved: boolean;
  requiresManualReview: boolean;
  analysisId: string;
  timestamp: string;
  usedAI: boolean;
}

export async function analyzeHybridFraud(
  certHash: string,
  ownerName: string,
  issuerWallet?: string,
  institution?: string,
): Promise<HybridFraudAnalysisResult> {
  // Layer 1: Run fast offline heuristics
  const heuristic = await runHeuristicEngine(certHash, ownerName, issuerWallet);

  let finalScore = heuristic.riskScore;
  let riskLevel = heuristic.riskLevel;
  let aiData: GroqFraudResponse | null = null;
  let usedAI = false;

  // Layer 2: Only call Groq AI if heuristic score > 20 (not safe) or institution is missing
  if (heuristic.riskScore > 20 || !institution) {
    // This securely calls the Next.js Server Action
    aiData = await evaluateFraudWithAI(certHash, ownerName, heuristic.riskScore, institution, issuerWallet);
    if (aiData) {
      usedAI = true;
      // Blend scores (AI has stronger weight 70%)
      finalScore = Math.round((heuristic.riskScore * 0.3) + (aiData.riskScore * 0.7));
      
      // Map AI decision to RiskLevel
      if (aiData.decision === "SAFE") riskLevel = 'safe';
      else if (aiData.decision === "REVIEW") riskLevel = 'low';
      else if (aiData.decision === "HIGH_RISK") riskLevel = 'medium';
      else riskLevel = 'high';
    }
  }

  return {
    riskLevel,
    riskScore: finalScore,
    heuristicScore: heuristic.riskScore,
    aiScore: aiData?.riskScore ?? null,
    aiConfidence: aiData?.confidence ?? null,
    aiDecision: aiData?.decision ?? null,
    flags: heuristic.flags,
    aiReasons: aiData?.reasons ?? [],
    aiRecommendation: aiData?.recommendation ?? null,
    approved: riskLevel === 'safe' || riskLevel === 'low',
    requiresManualReview: riskLevel === 'medium' || riskLevel === 'high',
    analysisId: `HFA-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    usedAI,
  };
}
