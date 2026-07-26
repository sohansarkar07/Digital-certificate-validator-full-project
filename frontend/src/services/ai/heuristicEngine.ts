import {
  dbCheckDuplicateHash,
  dbGetIssuanceByOwner,
  dbCountRecentIssuances,
} from "@/lib/db";

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high';

export interface FraudFlag {
  code: string;
  message: string;
  severity: RiskLevel;
}

export interface HeuristicAnalysisResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  flags: FraudFlag[];
}

const MASS_ISSUE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MASS_ISSUE_THRESHOLD = 10;

/**
 * Runs the deterministic AI fraud detection pipeline (Layer 1).
 * Calculates a local fraud score instantly based on heuristics.
 */
export async function runHeuristicEngine(
  certHash: string,
  ownerName: string,
  issuerWallet?: string,
): Promise<HeuristicAnalysisResult> {
  const flags: FraudFlag[] = [];
  let riskScore = 0;

  // ── Rule 1: Duplicate Certificate Hash (cloud query) ─────────────────────
  const duplicateHash = await dbCheckDuplicateHash(certHash);
  if (duplicateHash) {
    flags.push({
      code: 'DUPLICATE_HASH',
      message: `This certificate hash was already issued on ${new Date(duplicateHash.issued_at!).toLocaleString()}.`,
      severity: 'high',
    });
    riskScore += 80;
  }

  // ── Rule 2: Duplicate Owner — same name, different hash ──────────────────
  const normalizedOwner = ownerName.trim().toLowerCase();
  const ownerHistory = await dbGetIssuanceByOwner(normalizedOwner);
  if (ownerHistory.length >= 3) {
    flags.push({
      code: 'REPEATED_OWNER',
      message: `Owner "${ownerName}" has received ${ownerHistory.length} certificates. Possible duplicate issuance.`,
      severity: ownerHistory.length >= 5 ? 'high' : 'medium',
    });
    riskScore += ownerHistory.length >= 5 ? 60 : 30;
  }

  // ── Rule 3: Mass Issuance velocity (cloud query) ─────────────────────────
  if (issuerWallet) {
    const recentCount = await dbCountRecentIssuances(issuerWallet, MASS_ISSUE_WINDOW_MS);
    if (recentCount >= MASS_ISSUE_THRESHOLD) {
      flags.push({
        code: 'MASS_ISSUANCE',
        message: `${recentCount} certificates issued from this wallet in the last hour. Possible spam activity.`,
        severity: 'high',
      });
      riskScore += 70;
    } else if (recentCount >= 5) {
      flags.push({
        code: 'HIGH_FREQUENCY',
        message: `${recentCount} certificates issued from this wallet in the last hour.`,
        severity: 'medium',
      });
      riskScore += 25;
    }
  }

  // ── Rule 4: Suspicious Owner Pattern ─────────────────────────────────────
  if (normalizedOwner.length < 3) {
    flags.push({
      code: 'INVALID_OWNER_NAME',
      message: `Owner name "${ownerName}" is unusually short. May indicate a test or fake entry.`,
      severity: 'medium',
    });
    riskScore += 20;
  }

  const suspiciousPatterns = ['test', 'fake', 'admin', 'null', 'undefined', 'unknown', 'example'];
  if (suspiciousPatterns.some(p => normalizedOwner.includes(p))) {
    flags.push({
      code: 'SUSPICIOUS_OWNER_PATTERN',
      message: `Owner name matches a suspicious pattern ("${ownerName}"). May indicate a synthetic certificate.`,
      severity: 'low',
    });
    riskScore += 15;
  }

  // ── Rule 5: Invalid Certificate Hash ─────────────────────────────────────
  if (!certHash || certHash.length < 32) {
    flags.push({
      code: 'INVALID_HASH',
      message: 'Certificate hash is missing or malformed. Cannot issue without a valid hash.',
      severity: 'high',
    });
    riskScore += 90;
  }

  // ── Rule 6: Low entropy hash ──────────────────────────────────────────────
  if (certHash && certHash.length >= 32) {
    const uniqueChars = new Set(certHash.split('')).size;
    if (uniqueChars < 4) {
      flags.push({
        code: 'LOW_HASH_ENTROPY',
        message: 'Certificate hash has extremely low entropy — may be synthetically generated.',
        severity: 'high',
      });
      riskScore += 75;
    }
  }

  // ── Determine Risk Level ──────────────────────────────────────────────────
  const clampedScore = Math.min(100, riskScore);
  let riskLevel: RiskLevel;
  if (clampedScore <= 20) riskLevel = 'safe';
  else if (clampedScore <= 50) riskLevel = 'low';
  else if (clampedScore <= 75) riskLevel = 'medium';
  else riskLevel = 'high';

  return {
    riskLevel,
    riskScore: clampedScore,
    flags,
  };
}
