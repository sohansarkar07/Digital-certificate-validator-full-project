"use client";
// src/components/AdminPanel.tsx
// Platform Owner and Admin management panel
// Visible only to privileged roles (admin/owner)

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, UserCog, Building2, CheckCircle2, XCircle, Clock,
  AlertTriangle, Eye, Ban, RotateCcw, Plus, Trash2,
  ChevronDown, ChevronUp, Search, Activity, Loader2,
  Crown, Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStellar } from '@/hooks/useStellar';
import { supabase } from '@/lib/supabase';
import type { ExtendedInstitution, UserProfile, AdminAuditEntry } from '@/lib/types';
import { INSTITUTION_TYPE_LABELS } from '@/lib/types';

type AdminTab = 'institutions' | 'admins' | 'audit';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ElementType }> = {
    pending:   { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Clock },
    approved:  { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
    rejected:  { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: XCircle },
    suspended: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: Ban },
  };
  const { color, icon: Icon } = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Icon size={10} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function AdminPanel() {
  const { isOwner, isAdmin } = useAuth();
  const { address } = useStellar();
  const [tab, setTab] = useState<AdminTab>('institutions');
  const [institutions, setInstitutions] = useState<ExtendedInstitution[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newAdminWallet, setNewAdminWallet] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, adminRes, auditRes] = await Promise.all([
        supabase.from('institutions').select('*').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('*').eq('role', 'admin'),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setInstitutions((instRes.data ?? []) as ExtendedInstitution[]);
      setAdmins((adminRes.data ?? []) as UserProfile[]);
      setAuditLog((auditRes.data ?? []) as AdminAuditEntry[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Log an admin action ────────────────────────────────────────────────────
  const logAction = async (action: string, targetId?: string, details?: Record<string, unknown>) => {
    if (!address) return;
    await supabase.from('admin_audit_log').insert({
      admin_wallet: address,
      action,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    });
  };

  // ── Institution actions ───────────────────────────────────────────────────
  const approveInstitution = async (inst: ExtendedInstitution) => {
    setActionLoading(inst.id);
    await supabase.from('institutions').update({
      status: 'approved',
      verification_badge: true,
      trust_score: 70,
    }).eq('id', inst.id);
    await logAction('APPROVE_INSTITUTION', inst.id, { name: inst.name });
    await fetchData();
    setActionLoading(null);
  };

  const rejectInstitution = async (inst: ExtendedInstitution) => {
    setActionLoading(inst.id);
    await supabase.from('institutions').update({ status: 'rejected' }).eq('id', inst.id);
    await logAction('REJECT_INSTITUTION', inst.id, { name: inst.name });
    await fetchData();
    setActionLoading(null);
  };

  const suspendInstitution = async (inst: ExtendedInstitution) => {
    setActionLoading(inst.id);
    const reason = suspendReason[inst.id] || 'Suspended by administrator.';
    await supabase.from('institutions').update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: reason,
    }).eq('id', inst.id);
    await logAction('SUSPEND_INSTITUTION', inst.id, { name: inst.name, reason });
    await fetchData();
    setActionLoading(null);
  };

  const restoreInstitution = async (inst: ExtendedInstitution) => {
    setActionLoading(inst.id);
    await supabase.from('institutions').update({
      status: 'approved',
      suspended_at: null,
      suspension_reason: null,
    }).eq('id', inst.id);
    await logAction('RESTORE_INSTITUTION', inst.id, { name: inst.name });
    await fetchData();
    setActionLoading(null);
  };

  // ── Admin management (owner only) ─────────────────────────────────────────
  const addAdmin = async () => {
    if (!newAdminWallet.trim()) return;
    setActionLoading('new-admin');
    await supabase.from('user_profiles').upsert({
      wallet_address: newAdminWallet.trim(),
      role: 'admin',
      created_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' });
    await logAction('ADD_ADMIN', newAdminWallet.trim());
    setNewAdminWallet('');
    await fetchData();
    setActionLoading(null);
  };

  const removeAdmin = async (wallet: string) => {
    setActionLoading(wallet);
    await supabase.from('user_profiles').update({ role: 'employer' }).eq('wallet_address', wallet);
    await logAction('REMOVE_ADMIN', wallet);
    await fetchData();
    setActionLoading(null);
  };

  // ── Filtered institutions ──────────────────────────────────────────────────
  const filtered = institutions.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.country.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = institutions.filter(i => i.status === 'pending').length;

  const TABS: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'institutions', label: 'Institutions', icon: Building2, badge: pendingCount || undefined },
    { id: 'admins', label: 'Admin Management', icon: UserCog },
    { id: 'audit', label: 'Audit Log', icon: Activity },
  ];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield size={40} className="text-foreground/20 mb-4" />
        <p className="text-sm text-foreground/50">You do not have access to this panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        {isOwner ? (
          <Crown size={20} className="text-primary" />
        ) : (
          <Shield size={20} className="text-primary" />
        )}
        <div>
          <p className="text-sm font-bold text-primary">
            {isOwner ? 'Platform Owner' : 'Platform Admin'}
          </p>
          <p className="text-xs text-foreground/60 font-mono mt-0.5">
            {address?.slice(0, 12)}...{address?.slice(-6)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-foreground/50">{institutions.length} institutions</p>
          <p className="text-xs text-foreground/50">{pendingCount} pending approval</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          // Hide admin management from non-owners
          if (t.id === 'admins' && !isOwner) return null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-all ${
                isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <Icon size={13} />
              {t.label}
              {t.badge && t.badge > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-primary-foreground/20' : 'bg-amber-500 text-black'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-foreground/40" />
        </div>
      ) : (
        <>
          {/* Institutions Tab */}
          {tab === 'institutions' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-lg px-3">
                  <Search size={14} className="text-foreground/40" />
                  <input
                    type="text"
                    placeholder="Search institutions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-3">
                {filtered.map((inst) => (
                  <div key={inst.id} className="border border-border rounded-xl overflow-hidden">
                    <div className="p-4 flex items-start gap-3">
                      {/* Logo / placeholder */}
                      <div className="h-10 w-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {inst.logo_url ? (
                          <img src={inst.logo_url} alt={inst.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={16} className="text-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold truncate">{inst.name}</p>
                          <StatusBadge status={inst.status} />
                          {inst.institution_type && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-foreground/60">
                              {INSTITUTION_TYPE_LABELS[inst.institution_type as keyof typeof INSTITUTION_TYPE_LABELS] || inst.institution_type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/60 mt-0.5">{inst.country} · {inst.official_email || inst.website}</p>
                        {inst.registration_number && (
                          <p className="text-[10px] text-foreground/40 font-mono mt-0.5">Reg: {inst.registration_number}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedId(expandedId === inst.id ? null : inst.id)}
                          className="p-2 rounded hover:bg-surface-hover text-foreground/50 transition-colors"
                        >
                          {expandedId === inst.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {expandedId === inst.id && (
                      <div className="border-t border-border p-4 space-y-3">
                        {/* Details */}
                        {inst.description && (
                          <p className="text-xs text-foreground/70 leading-relaxed">{inst.description}</p>
                        )}
                        {inst.suspension_reason && (
                          <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                            <p className="text-xs text-orange-400">
                              <strong>Suspension reason:</strong> {inst.suspension_reason}
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {inst.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveInstitution(inst)}
                                disabled={actionLoading === inst.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                              >
                                {actionLoading === inst.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                Approve
                              </button>
                              <button
                                onClick={() => rejectInstitution(inst)}
                                disabled={actionLoading === inst.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                              >
                                <XCircle size={11} /> Reject
                              </button>
                            </>
                          )}
                          {inst.status === 'approved' && isOwner && (
                            <>
                              <input
                                type="text"
                                placeholder="Suspension reason..."
                                value={suspendReason[inst.id] || ''}
                                onChange={(e) => setSuspendReason(prev => ({ ...prev, [inst.id]: e.target.value }))}
                                className="flex-1 text-xs bg-surface border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary min-w-[160px]"
                              />
                              <button
                                onClick={() => suspendInstitution(inst)}
                                disabled={actionLoading === inst.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                              >
                                <Ban size={11} /> Suspend
                              </button>
                            </>
                          )}
                          {inst.status === 'suspended' && isOwner && (
                            <button
                              onClick={() => restoreInstitution(inst)}
                              disabled={actionLoading === inst.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {actionLoading === inst.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="text-center py-12 text-foreground/40">
                    <Building2 size={32} className="mx-auto mb-3" />
                    <p className="text-sm">No institutions found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admins Tab (owner only) */}
          {tab === 'admins' && isOwner && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Stellar wallet address (G...)"
                  value={newAdminWallet}
                  onChange={(e) => setNewAdminWallet(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <button
                  onClick={addAdmin}
                  disabled={!newAdminWallet.trim() || actionLoading === 'new-admin'}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {actionLoading === 'new-admin' ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add Admin
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                  Current Admins ({admins.length})
                </p>
                {admins.map((admin) => (
                  <div key={admin.wallet_address} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{admin.display_name || 'Admin'}</p>
                      <p className="text-[10px] text-foreground/40 font-mono truncate">{admin.wallet_address}</p>
                    </div>
                    <button
                      onClick={() => removeAdmin(admin.wallet_address)}
                      disabled={actionLoading === admin.wallet_address}
                      className="p-2 rounded hover:bg-rose-500/10 text-foreground/40 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {admins.length === 0 && (
                  <p className="text-sm text-foreground/40 text-center py-8">No admins added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {tab === 'audit' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                Recent Actions ({auditLog.length})
              </p>
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="h-6 w-6 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Activity size={10} className="text-foreground/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {entry.action}
                      </span>
                      {entry.target_id && (
                        <span className="text-[10px] text-foreground/50 font-mono truncate max-w-[200px]">
                          {entry.target_id}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-foreground/40 font-mono mt-0.5">
                      by {entry.admin_wallet.slice(0, 8)}... · {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))}
              {auditLog.length === 0 && (
                <p className="text-sm text-foreground/40 text-center py-8">No admin actions recorded yet.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
