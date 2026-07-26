// fraudDetection.ts — Deprecated / Backwards compatibility wrapper
// This file now simply wraps the new Hybrid AI Fraud Detection pipeline.

import { dbRecordIssuance, dbIncrementInstitutionCerts } from "@/lib/db";
import { analyzeHybridFraud, HybridFraudAnalysisResult } from "./ai/fraudEngine";
import { FraudFlag, RiskLevel } from "./ai/heuristicEngine";

export type { RiskLevel, FraudFlag };
export type FraudAnalysisResult = HybridFraudAnalysisResult;

export async function recordIssuance(hash: string, owner: string, issuerWallet?: string, documentUrl?: string) {
  await dbRecordIssuance({ hash, owner, issuer_wallet: issuerWallet, document_url: documentUrl });
  if (issuerWallet) {
    await dbIncrementInstitutionCerts(issuerWallet);
  }
}

/**
 * Runs the full Hybrid AI fraud detection pipeline (Heuristics + Groq Llama 3).
 * Call this BEFORE issuing a certificate.
 */
export async function analyzeForFraud(
  certHash: string,
  ownerName: string,
  issuerWallet?: string,
): Promise<FraudAnalysisResult> {
  // Pass to new orchestrator
  return analyzeHybridFraud(certHash, ownerName, issuerWallet, undefined);
}
