// institutionContract.ts — Institution Registry service layer (Supabase-backed)
// All institutions are stored in PostgreSQL and sync across all devices.

import {
  dbGetInstitutions, dbInsertInstitution, dbUpdateInstitutionStatus,
  dbIncrementInstitutionCerts, type Institution as DbInstitution,
} from "@/lib/db";
import { recordTransaction } from "./blockchain";
import { createNotification } from "./notificationService";
import { sendInstitutionApprovedEmail, sendInstitutionRejectedEmail } from "./emailService";
import { supabase } from "@/lib/supabase";

export interface Institution {
  id: string;
  name: string;
  country: string;
  walletAddress: string;
  website: string;
  trustScore: number;
  certsIssued: number;
  verifications: number;
  disputes: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verificationBadge: boolean;
  registeredAt: string;
  globalRank?: number;
  countryRank?: number;
}

// Map from DB snake_case to frontend camelCase
function fromDb(d: DbInstitution): Institution {
  return {
    id: d.id,
    name: d.name,
    country: d.country,
    walletAddress: d.wallet_address,
    website: d.website ?? '',
    trustScore: d.trust_score ?? computeTrustScore(d),
    certsIssued: d.certs_issued ?? 0,
    verifications: d.verifications_count ?? 0,
    disputes: d.disputes ?? 0,
    status: (d.status as Institution['status']),
    verificationBadge: d.verification_badge ?? false,
    registeredAt: d.created_at ?? new Date().toISOString(),
  };
}

// Map from frontend camelCase to DB snake_case
function toDb(inst: Institution): DbInstitution {
  return {
    id: inst.id,
    name: inst.name,
    country: inst.country,
    wallet_address: inst.walletAddress,
    website: inst.website,
    trust_score: inst.trustScore,
    certs_issued: inst.certsIssued,
    verifications_count: inst.verifications,
    disputes: inst.disputes,
    status: inst.status as DbInstitution['status'],
    verification_badge: inst.verificationBadge,
    created_at: inst.registeredAt,
  };
}

// Dynamically compute trust score from institution activity
function computeTrustScore(d: {
  verification_badge?: boolean | null;
  website?: string | null;
  certs_issued?: number | null;
  verifications_count?: number | null;
  disputes?: number | null;
}): number {
  let score = 50; // base for new institutions
  if (d.website) score += 5;
  if (d.verification_badge) score += 10;

  // Certs issued: up to +20 points (caps at 500 certs)
  const certs = d.certs_issued ?? 0;
  score += Math.min(20, Math.floor((certs / 500) * 20));

  // Verification success rate: up to +15 points
  const verifications = d.verifications_count ?? 0;
  const disputes = d.disputes ?? 0;
  if (verifications > 0) {
    const successRate = Math.max(0, (verifications - disputes) / verifications);
    score += Math.round(successRate * 15);
  }

  // Dispute penalty: -3 per dispute (capped at -15)
  score -= Math.min(15, disputes * 3);

  return Math.max(10, Math.min(100, score));
}

function withRanks(institutions: Institution[]): Institution[] {
  const sorted = [...institutions].sort((a, b) => b.trustScore - a.trustScore);
  sorted.forEach((inst, idx) => { inst.globalRank = idx + 1; });
  const countryGroups: Record<string, Institution[]> = {};
  sorted.forEach(inst => {
    if (!countryGroups[inst.country]) countryGroups[inst.country] = [];
    countryGroups[inst.country].push(inst);
  });
  Object.values(countryGroups).forEach(group => {
    group.forEach((inst, idx) => { inst.countryRank = idx + 1; });
  });
  return sorted;
}

export class InstitutionService {
  async getAllInstitutions(): Promise<Institution[]> {
    const dbData = await dbGetInstitutions();
    return withRanks(dbData.map(fromDb));
  }

  async getApprovedInstitutions(): Promise<Institution[]> {
    const all = await this.getAllInstitutions();
    return all.filter(i => i.status === 'approved');
  }

  async getPendingInstitutions(): Promise<Institution[]> {
    const all = await this.getAllInstitutions();
    return all.filter(i => i.status === 'pending');
  }

  async getInstitutionById(id: string): Promise<Institution | null> {
    const all = await this.getAllInstitutions();
    return all.find(i => i.id === id) ?? null;
  }

  async searchInstitutions(query: string, country?: string): Promise<Institution[]> {
    const all = await this.getAllInstitutions();
    const q = query.toLowerCase();
    return all.filter(i => {
      const matchesQuery = !q || i.name.toLowerCase().includes(q) || i.country.toLowerCase().includes(q);
      const matchesCountry = !country || i.country === country;
      return matchesQuery && matchesCountry;
    });
  }

  async registerInstitution(data: {
    name: string;
    country: string;
    walletAddress: string;
    website?: string;
    type?: string;
  }): Promise<Institution> {
    const id = `INST-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const inst: Institution = {
      id,
      name: data.name,
      country: data.country,
      walletAddress: data.walletAddress,
      website: data.website ?? '',
      trustScore: computeTrustScore({ website: data.website }),
      certsIssued: 0,
      verifications: 0,
      disputes: 0,
      status: 'pending',
      verificationBadge: false,
      registeredAt: new Date().toISOString(),
    };
    await dbInsertInstitution({ ...toDb(inst), type: data.type ?? 'University' });
    await recordTransaction("InstitutionRegistered", data.walletAddress, "Institution", "success");
    return inst;
  }

  async approveInstitution(id: string): Promise<void> {
    const inst = await this.getInstitutionById(id);
    const { data: dbInst } = await supabase.from('institutions').select('official_email').eq('id', id).maybeSingle();
    await dbUpdateInstitutionStatus(id, 'approved');
    await recordTransaction("InstitutionApproved", "Admin", "Admin", "success");
    if (inst?.walletAddress) {
      await createNotification({
        walletAddress: inst.walletAddress,
        type: 'institution_approved',
        title: 'Registration Approved',
        body: 'Your institution has been verified and approved. You can now issue official credentials.',
      });
    }
    if (inst && dbInst?.official_email) {
      await sendInstitutionApprovedEmail(dbInst.official_email, inst.name);
    }
  }

  async rejectInstitution(id: string): Promise<void> {
    const inst = await this.getInstitutionById(id);
    const { data: dbInst } = await supabase.from('institutions').select('official_email').eq('id', id).maybeSingle();
    await dbUpdateInstitutionStatus(id, 'rejected');
    await recordTransaction("InstitutionRejected", "Admin", "Admin", "success");
    if (inst?.walletAddress) {
      await createNotification({
        walletAddress: inst.walletAddress,
        type: 'institution_rejected',
        title: 'Registration Rejected',
        body: 'Your institution registration was not approved. Please contact support for more details.',
      });
    }
    if (inst && dbInst?.official_email) {
      await sendInstitutionRejectedEmail(dbInst.official_email, inst.name);
    }
  }

  async suspendInstitution(id: string): Promise<void> {
    // Requires adding 'suspended' to DB check constraint eventually, but works in TS for now
    await dbUpdateInstitutionStatus(id as any, 'suspended' as any);
    await recordTransaction("InstitutionSuspended", "Admin", "Admin", "success");
  }

  async restoreInstitution(id: string): Promise<void> {
    await dbUpdateInstitutionStatus(id, 'approved');
    await recordTransaction("InstitutionRestored", "Admin", "Admin", "success");
  }

  async recordCertificateIssued(walletAddress: string): Promise<void> {
    await dbIncrementInstitutionCerts(walletAddress);
  }

  async getTrustScore(id: string): Promise<number> {
    const inst = await this.getInstitutionById(id);
    return inst?.trustScore ?? 50;
  }

  getTrustStars(score: number): number {
    return Math.max(1, Math.min(5, Math.ceil(score / 20)));
  }

  async getUniqueCountries(): Promise<string[]> {
    const all = await this.getAllInstitutions();
    return [...new Set(all.map(i => i.country))].sort();
  }

  async getStats(): Promise<{
    totalInstitutions: number;
    approvedCount: number;
    pendingCount: number;
    countries: string[];
  }> {
    const all = await this.getAllInstitutions();
    return {
      totalInstitutions: all.length,
      approvedCount: all.filter(i => i.status === 'approved').length,
      pendingCount: all.filter(i => i.status === 'pending').length,
      countries: [...new Set(all.map(i => i.country))],
    };
  }
}

export const institutionService = new InstitutionService();
