// src/lib/db.ts — All database operations (replaces localStorage everywhere)
// Every function is async and syncs to Supabase PostgreSQL in the cloud.

import { supabase } from "./supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Institution {
  id: string;
  name: string;
  country: string;
  wallet_address: string;
  website?: string;
  type?: string;
  status: "pending" | "approved" | "rejected";
  trust_score?: number;
  verification_badge?: boolean;
  certs_issued?: number;
  verifications_count?: number;
  disputes?: number;
  created_at?: string;
}

export interface Credential {
  id: string;
  wallet_address: string;
  title: string;
  institution: string;
  type: string;
  date: string;
  cert_hash?: string;
  skills?: string[];
  description?: string;
  grade?: string;
  created_at?: string;
}

export interface IssuanceRecord {
  hash: string;
  owner: string;
  issuer_wallet?: string;
  issued_at?: string;
  document_url?: string;
}

export interface Bond {
  id: string;
  cert_hash: string;
  institution?: string;
  amount_xlm?: number;
  status: "locked" | "released" | "slashed";
  locked_at?: string;
  released_at?: string;
}

export interface FeedbackEntry {
  id: string;
  wallet_address?: string;
  role: string;
  rating: number;
  category: string;
  message: string;
  created_at?: string;
}

export interface ActivityEntry {
  action: string;
  hash: string;
  wallet?: string;
  color?: string;
  created_at?: string;
}

export interface TransactionEntry {
  id?: string;
  hash: string;
  event_type: string;
  wallet_address: string;
  role?: string;
  network?: string;
  explorer_link?: string;
  status?: "success" | "failed" | "pending";
  created_at?: string;
}

// ── Institutions ──────────────────────────────────────────────────────────────
export async function dbGetInstitutions(): Promise<Institution[]> {
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("dbGetInstitutions:", error); return []; }
  return (data ?? []) as Institution[];
}

export async function dbInsertInstitution(inst: Institution): Promise<void> {
  const { error } = await supabase.from("institutions").insert(inst);
  if (error) console.error("dbInsertInstitution:", error);
}

export async function dbUpdateInstitutionStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<void> {
  const updates: Partial<Institution> = { status };
  if (status === "approved") updates.verification_badge = true;
  const { error } = await supabase.from("institutions").update(updates).eq("id", id);
  if (error) console.error("dbUpdateInstitutionStatus:", error);
}

export async function dbIncrementInstitutionCerts(walletAddress: string): Promise<void> {
  const { data, error } = await supabase
    .from("institutions")
    .select("id, certs_issued, verifications_count, disputes")
    .eq("wallet_address", walletAddress);
    
  if (error || !data || data.length === 0) {
    console.error("dbIncrementInstitutionCerts fetch error:", error);
    return;
  }
  
  // Update all matching institutions (in case user registered multiple test institutions with same wallet)
  for (const inst of data) {
    const newCerts = (inst.certs_issued ?? 0) + 1;
    const trustScore = Math.min(
      100,
      Math.max(0, 70 + Math.floor((inst.verifications_count ?? 0) / 10) - (inst.disputes ?? 0) * 5)
    );
    const { error: updateError } = await supabase
      .from("institutions")
      .update({ certs_issued: newCerts, trust_score: trustScore })
      .eq("id", inst.id);
      
    if (updateError) {
      console.error("dbIncrementInstitutionCerts update error:", updateError);
    }
  }
}

// ── Credentials (Passport) ────────────────────────────────────────────────────
export async function dbGetCredentials(walletAddress: string): Promise<Credential[]> {
  const { data, error } = await supabase
    .from("credentials")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false });
  if (error) { console.error("dbGetCredentials:", error); return []; }
  return (data ?? []) as Credential[];
}

export async function dbInsertCredential(cred: Credential): Promise<void> {
  const { error } = await supabase.from("credentials").insert(cred);
  if (error) console.error("dbInsertCredential:", error);
}

export async function dbDeleteCredential(id: string): Promise<void> {
  const { error } = await supabase.from("credentials").delete().eq("id", id);
  if (error) console.error("dbDeleteCredential:", error);
}

// ── Issuance History ──────────────────────────────────────────────────────────
export async function dbGetIssuanceHistory(): Promise<IssuanceRecord[]> {
  const { data, error } = await supabase
    .from("issuance_history")
    .select("*")
    .order("issued_at", { ascending: false })
    .limit(500);
  if (error) { console.error("dbGetIssuanceHistory:", error); return []; }
  return (data ?? []) as IssuanceRecord[];
}

export async function dbRecordIssuance(record: IssuanceRecord): Promise<void> {
  const { error } = await supabase.from("issuance_history").insert(record);
  if (error) console.error("dbRecordIssuance:", error);
}

export async function dbCheckDuplicateHash(hash: string): Promise<IssuanceRecord | null> {
  const { data } = await supabase
    .from("issuance_history")
    .select("*")
    .eq("hash", hash)
    .maybeSingle();
  return data as IssuanceRecord | null;
}

export async function dbGetIssuanceByWallet(walletAddress: string): Promise<IssuanceRecord[]> {
  const { data, error } = await supabase
    .from("issuance_history")
    .select("*")
    .eq("issuer_wallet", walletAddress);
  if (error) return [];
  return (data ?? []) as IssuanceRecord[];
}

export async function dbGetIssuanceByOwner(ownerName: string): Promise<IssuanceRecord[]> {
  const { data } = await supabase
    .from("issuance_history")
    .select("*")
    .ilike("owner", ownerName);
  return (data ?? []) as IssuanceRecord[];
}

// Count issuances from a wallet in the last N milliseconds
export async function dbCountRecentIssuances(
  walletAddress: string,
  windowMs: number
): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await supabase
    .from("issuance_history")
    .select("*", { count: "exact", head: true })
    .eq("issuer_wallet", walletAddress)
    .gte("issued_at", since);
  return count ?? 0;
}

// ── Verifications ─────────────────────────────────────────────────────────────
export async function dbRecordVerification(
  hash: string,
  verifierWallet?: string,
  status = "valid"
): Promise<void> {
  const { error } = await supabase
    .from("verifications")
    .insert({ hash, verifier_wallet: verifierWallet, status });
  if (error) console.error("dbRecordVerification:", error);
}

export async function dbGetVerificationCount(): Promise<number> {
  const { count } = await supabase
    .from("verifications")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

// ── Bonds ─────────────────────────────────────────────────────────────────────
export async function dbGetBonds(): Promise<Bond[]> {
  const { data, error } = await supabase
    .from("bonds")
    .select("*")
    .order("locked_at", { ascending: false });
  if (error) { console.error("dbGetBonds:", error); return []; }
  return (data ?? []) as Bond[];
}

export async function dbInsertBond(bond: Bond): Promise<void> {
  const { error } = await supabase.from("bonds").insert(bond);
  if (error) console.error("dbInsertBond:", error);
}

export async function dbUpdateBondStatus(
  id: string,
  status: "released" | "slashed"
): Promise<void> {
  const { error } = await supabase
    .from("bonds")
    .update({ status, released_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("dbUpdateBondStatus:", error);
}

export async function dbGetBondByCertHash(certHash: string): Promise<Bond | null> {
  const { data } = await supabase
    .from("bonds")
    .select("*")
    .eq("cert_hash", certHash)
    .maybeSingle();
  return data as Bond | null;
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export async function dbGetFeedback(): Promise<FeedbackEntry[]> {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("dbGetFeedback:", error); return []; }
  return (data ?? []) as FeedbackEntry[];
}

export async function dbInsertFeedback(entry: FeedbackEntry): Promise<void> {
  const { error } = await supabase.from("feedback").insert(entry);
  if (error) console.error("dbInsertFeedback:", error);
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
export async function dbGetActivityFeed(limit = 20): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("dbGetActivityFeed:", error); return []; }
  return (data ?? []) as ActivityEntry[];
}

export async function dbInsertActivity(entry: ActivityEntry): Promise<void> {
  const { error } = await supabase.from("activity_feed").insert(entry);
  if (error) console.error("dbInsertActivity:", error);
}

// ── Blockchain Transactions ───────────────────────────────────────────────────
export async function dbGetTransactions(limit = 100): Promise<TransactionEntry[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("dbGetTransactions:", error); return []; }
  return (data ?? []) as TransactionEntry[];
}

export async function dbInsertTransaction(entry: TransactionEntry): Promise<void> {
  const { error } = await supabase.from("transactions").insert(entry);
  if (error) console.error("dbInsertTransaction:", error);
}



export async function dbGetTransactionsByWallet(walletAddress: string, limit = 50): Promise<TransactionEntry[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("dbGetTransactionsByWallet:", error); return []; }
  return (data ?? []) as TransactionEntry[];
}

// ── Analytics Aggregation ─────────────────────────────────────────────────────
export interface PlatformStats {
  certsIssued: number;
  verificationsTotal: number;
  approvedInstitutions: number;
  activeBonds: number;
  xlmLocked: number;
  xlmSlashed: number;
  fraudAttempts: number;
  countries: number;
  successRate: number;
  avgRating: number;
  feedbackCount: number;
}

export async function dbGetPlatformStats(): Promise<PlatformStats> {
  const [issuanceRes, verifRes, instRes, bondsRes, feedbackRes] = await Promise.all([
    supabase.from("issuance_history").select("*", { count: "exact", head: true }),
    supabase.from("verifications").select("*", { count: "exact", head: true }),
    supabase.from("institutions").select("country, status, disputes"),
    supabase.from("bonds").select("status, amount_xlm"),
    supabase.from("feedback").select("rating"),
  ]);

  const certsIssued = issuanceRes.count ?? 0;
  const verificationsTotal = verifRes.count ?? 0;
  const institutions = (instRes.data ?? []) as { country: string; status: string; disputes: number }[];
  const bonds = (bondsRes.data ?? []) as { status: string; amount_xlm: number }[];
  const feedbackData = (feedbackRes.data ?? []) as { rating: number }[];

  const approvedInstitutions = institutions.filter(i => i.status === "approved").length;
  const activeBonds = bonds.filter(b => b.status === "locked").length;
  const xlmLocked = bonds.filter(b => b.status === "locked").reduce((s, b) => s + (b.amount_xlm ?? 0), 0);
  const xlmSlashed = bonds.filter(b => b.status === "slashed").reduce((s, b) => s + (b.amount_xlm ?? 0), 0);
  const fraudAttempts = institutions.reduce((s, i) => s + (i.disputes ?? 0), 0);
  const countries = new Set(institutions.map(i => i.country)).size;
  const successRate = verificationsTotal > 0 ? Math.round((verificationsTotal / (verificationsTotal + fraudAttempts)) * 100) : 100;
  const avgRating = feedbackData.length > 0
    ? Math.round((feedbackData.reduce((s, f) => s + f.rating, 0) / feedbackData.length) * 10) / 10
    : 0;

  return {
    certsIssued, verificationsTotal, approvedInstitutions,
    activeBonds, xlmLocked, xlmSlashed, fraudAttempts,
    countries, successRate, avgRating, feedbackCount: feedbackData.length,
  };
}

// Weekly issuance counts (last 7 days)
export async function dbGetWeeklyIssuance(): Promise<number[]> {
  const result: number[] = [0, 0, 0, 0, 0, 0, 0];
  const { data } = await supabase
    .from("issuance_history")
    .select("issued_at")
    .gte("issued_at", new Date(Date.now() - 7 * 86400000).toISOString());

  (data ?? []).forEach((r: { issued_at: string }) => {
    const daysAgo = Math.floor((Date.now() - new Date(r.issued_at).getTime()) / 86400000);
    if (daysAgo < 7) result[6 - daysAgo]++;
  });
  return result;
}

// ── Email Verification ─────────────────────────────────────────────────────────

export interface EmailVerification {
  id: string;
  email: string;
  otp: string;
  purpose: string;
  expires_at: string;
  verified: boolean;
  created_at?: string;
}

export async function dbInsertEmailVerification(entry: EmailVerification): Promise<void> {
  const { error } = await supabase.from("email_verifications").insert(entry);
  if (error) console.error("dbInsertEmailVerification:", error);
}

export async function dbGetEmailVerification(email: string, purpose: string): Promise<EmailVerification | null> {
  const { data } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("email", email)
    .eq("purpose", purpose)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as EmailVerification | null;
}

export async function dbMarkEmailVerified(id: string): Promise<void> {
  const { error } = await supabase.from("email_verifications").update({ verified: true }).eq("id", id);
  if (error) console.error("dbMarkEmailVerified:", error);
}

export async function dbCheckDuplicateInstitution(
  name: string, email: string, website: string
): Promise<boolean> {
  const { data } = await supabase
    .from("institutions")
    .select("id, status, email_verified")
    .or(`name.ilike.${name},official_email.eq.${email},website.eq.${website}`);

  if (!data || data.length === 0) return false;
  
  // It's a true duplicate if it's already verified, or if it's approved
  return data.some(inst => inst.email_verified === true || inst.status === 'approved');
}

// ── Pending Claims ─────────────────────────────────────────────────────────────

export interface PendingClaim {
  id: string;
  student_email: string;
  student_wallet?: string;
  institution_id?: string;
  institution_name: string;
  credential_title: string;
  credential_type: string;
  credential_category?: string;
  issue_date: string;
  tx_hash?: string;
  cert_hash?: string;
  explorer_link?: string;
  status: "pending" | "claimed" | "rejected";
  claimed_at?: string;
  created_at?: string;
}

export async function dbInsertPendingClaim(claim: PendingClaim): Promise<void> {
  const { error } = await supabase.from("pending_claims").insert(claim);
  if (error) console.error("dbInsertPendingClaim:", error);
}

export async function dbGetPendingClaimsByEmail(email: string): Promise<PendingClaim[]> {
  const { data, error } = await supabase
    .from("pending_claims")
    .select("*")
    .eq("student_email", email.toLowerCase())
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) { console.error("dbGetPendingClaimsByEmail:", error); return []; }
  return (data ?? []) as PendingClaim[];
}

export async function dbClaimPendingCredential(id: string, walletAddress: string): Promise<void> {
  const { error } = await supabase
    .from("pending_claims")
    .update({ status: "claimed", student_wallet: walletAddress, claimed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("dbClaimPendingCredential:", error);
}

export async function dbRejectPendingCredential(id: string): Promise<void> {
  const { error } = await supabase
    .from("pending_claims")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) console.error("dbRejectPendingCredential:", error);
}

// ── User Profile Email ─────────────────────────────────────────────────────────

export async function dbGetUserEmail(walletAddress: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("email")
    .eq("wallet_address", walletAddress)
    .maybeSingle();
  return (data as any)?.email ?? null;
}

export async function dbSetUserEmail(walletAddress: string, email: string): Promise<void> {
  const { error } = await supabase
    .from("user_profiles")
    .update({ email: email.toLowerCase() })
    .eq("wallet_address", walletAddress);
  if (error) console.error("dbSetUserEmail:", error);
}

