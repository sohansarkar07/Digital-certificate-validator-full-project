// stakeContract.ts — Stake Pool service (now Supabase-backed)
// Bonds are stored in PostgreSQL and sync across all devices.

import {
  dbGetBonds, dbInsertBond, dbUpdateBondStatus, dbGetBondByCertHash,
  dbInsertActivity, type Bond,
} from "@/lib/db";
import { recordTransaction } from "./blockchain";

export type BondStatus = 'locked' | 'released' | 'slashed' | 'challenged' | 'none';

export interface BondRecord {
  certHash: string;
  institution: string;
  amountXLM: number;
  lockedAt: string;
  challengeWindowEnd: string;
  status: BondStatus;
  challenger?: string;
}

const DEFAULT_BOND_XLM = 1;
const CHALLENGE_WINDOW_DAYS = 7;

function toDbBond(b: BondRecord): Bond {
  return {
    id: b.certHash,
    cert_hash: b.certHash,
    institution: b.institution,
    amount_xlm: b.amountXLM,
    status: b.status === 'challenged' ? 'locked' : (b.status === 'none' ? 'locked' : b.status as 'locked' | 'released' | 'slashed'),
    locked_at: b.lockedAt,
  };
}

function fromDbBond(b: Bond): BondRecord {
  const lockedAt = b.locked_at ?? new Date().toISOString();
  const challengeWindowEnd = new Date(
    new Date(lockedAt).getTime() + CHALLENGE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  return {
    certHash: b.cert_hash,
    institution: b.institution ?? '',
    amountXLM: b.amount_xlm ?? DEFAULT_BOND_XLM,
    lockedAt,
    challengeWindowEnd,
    status: b.status,
  };
}

export class StakeService {
  isChallengeWindowOpen(bond: BondRecord): boolean {
    return new Date() < new Date(bond.challengeWindowEnd);
  }

  getChallengeWindowRemaining(bond: BondRecord): string {
    const now = new Date();
    const end = new Date(bond.challengeWindowEnd);
    if (now >= end) return 'Closed';
    const diffMs = end.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  }

  /** Lock a bond when issuing a certificate */
  async lockBond(certHash: string, institution: string): Promise<BondRecord> {
    await new Promise(r => setTimeout(r, 800));
    const lockedAt = new Date().toISOString();
    const challengeWindowEnd = new Date(
      Date.now() + CHALLENGE_WINDOW_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const bond: BondRecord = {
      certHash, institution, amountXLM: DEFAULT_BOND_XLM,
      lockedAt, challengeWindowEnd, status: 'locked',
    };

    await dbInsertBond(toDbBond(bond));
    await dbInsertActivity({
      action: 'BOND_LOCKED',
      hash: certHash,
      wallet: institution,
      color: 'text-stake-locked',
    });
    await recordTransaction("StakeLocked", institution, "Institution", "success");

    return bond;
  }

  /** Release bond after challenge window expires */
  async releaseBond(certHash: string): Promise<void> {
    await new Promise(r => setTimeout(r, 500));
    const existing = await dbGetBondByCertHash(certHash);
    if (existing && existing.status === 'locked') {
      const windowEnd = new Date(
        new Date(existing.locked_at!).getTime() + CHALLENGE_WINDOW_DAYS * 24 * 60 * 60 * 1000
      );
      if (new Date() >= windowEnd) {
        await dbUpdateBondStatus(certHash, 'released');
        await recordTransaction("StakeReturned", existing.institution || "Unknown", "Institution", "success");
      }
    }
  }

  /** Challenge a certificate within the window */
  async challengeCertificate(certHash: string, challenger: string): Promise<void> {
    await new Promise(r => setTimeout(r, 600));
    // Challenged bonds stay locked until admin resolution — mark as slashed for UI
    await dbUpdateBondStatus(certHash, 'slashed');
    await recordTransaction("DisputeOpened", challenger, "Challenger", "success");
  }

  /** Slash bond on confirmed fraud */
  async slashBond(certHash: string): Promise<void> {
    await new Promise(r => setTimeout(r, 800));
    await dbUpdateBondStatus(certHash, 'slashed');
    await recordTransaction("StakeSlashed", "Admin", "Admin", "success");
  }

  /** Get bond for a certificate */
  async getBond(certHash: string): Promise<BondRecord | null> {
    const b = await dbGetBondByCertHash(certHash);
    return b ? fromDbBond(b) : null;
  }

  /** Get platform-wide bond statistics */
  async getStats(): Promise<{ totalLocked: number; totalSlashed: number; activeBonds: number }> {
    const bonds = await dbGetBonds();
    const totalLocked = bonds.filter(b => b.status === 'locked').reduce((s, b) => s + (b.amount_xlm ?? 0), 0);
    const totalSlashed = bonds.filter(b => b.status === 'slashed').reduce((s, b) => s + (b.amount_xlm ?? 0), 0);
    const activeBonds = bonds.filter(b => b.status === 'locked').length;
    return { totalLocked, totalSlashed, activeBonds };
  }

  /** Get all bonds (for analytics) */
  async getAllBonds(): Promise<BondRecord[]> {
    const bonds = await dbGetBonds();
    return bonds.map(fromDbBond);
  }
}

export const stakeService = new StakeService();
