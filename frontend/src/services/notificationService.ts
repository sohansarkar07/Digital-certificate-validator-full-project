// src/services/notificationService.ts
// Unified in-app notification creation service

import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "credential_issued"
  | "credential_claimed"
  | "credential_revoked"
  | "credential_updated"
  | "credential_expiring"
  | "institution_approved"
  | "institution_rejected"
  | "claim_available"
  | "dispute_raised"
  | "institution_message";

export interface AppNotification {
  id: string;
  wallet_address: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at?: string;
}

export interface CreateNotificationInput {
  walletAddress: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const entry = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    wallet_address: input.walletAddress,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data ?? null,
    read: false,
  };
  const { error } = await supabase.from("notifications").insert(entry);
  if (error) console.error("[NotificationService] Failed to create notification:", error);
}

export async function getNotifications(walletAddress: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) { console.error("[NotificationService] getNotifications:", error); return []; }
  return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(walletAddress: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("wallet_address", walletAddress)
    .eq("read", false);
  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllRead(walletAddress: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("wallet_address", walletAddress)
    .eq("read", false);
}

// ── Audit Log ──────────────────────────────────────────────────────────────────

export interface AuditEntry {
  actor_wallet?: string;
  actor_role?: string;
  action: string;
  target_id?: string;
  credential_id?: string;
  tx_hash?: string;
  details?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const { error } = await supabase.from("audit_log").insert(entry);
  if (error) console.error("[AuditLog] Failed to write:", error);
}

export async function getAuditLog(limit = 100): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as AuditEntry[];
}
