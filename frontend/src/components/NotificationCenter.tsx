"use client";
// NotificationCenter — Bell icon + slide-out notification panel
// Added to the main nav bar. Shows unread count badge.

import { useState, useEffect, useCallback } from "react";
import { Bell, X, CheckCheck, Award, Building2, ShieldCheck, Gift, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStellar } from "@/hooks/useStellar";
import {
  getNotifications, getUnreadCount,
  markNotificationRead, markAllRead,
  type AppNotification, type NotificationType,
} from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  credential_issued:   { icon: Award,       color: "text-emerald-500", bg: "bg-emerald-500/10" },
  credential_claimed:  { icon: Gift,        color: "text-blue-500",    bg: "bg-blue-500/10" },
  credential_revoked:  { icon: AlertTriangle,color: "text-red-500",    bg: "bg-red-500/10" },
  credential_updated:  { icon: Award,       color: "text-amber-500",   bg: "bg-amber-500/10" },
  credential_expiring: { icon: AlertTriangle,color: "text-orange-500", bg: "bg-orange-500/10" },
  institution_approved:{ icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  institution_rejected:{ icon: X,           color: "text-red-500",     bg: "bg-red-500/10" },
  claim_available:     { icon: Gift,        color: "text-purple-500",  bg: "bg-purple-500/10" },
  dispute_raised:      { icon: AlertTriangle,color: "text-red-500",    bg: "bg-red-500/10" },
  institution_message: { icon: Building2,   color: "text-blue-500",    bg: "bg-blue-500/10" },
};

export function NotificationCenter() {
  const { address, isConnected } = useStellar();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(address),
        getUnreadCount(address),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!isConnected || !address) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isConnected, address, fetchNotifications]);

  const handleOpen = () => {
    setOpen(true);
    fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!address) return;
    await markAllRead(address);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!isConnected) return null;

  return (
    <>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors text-foreground/60 hover:text-foreground"
        title="Notifications"
        id="notification-bell-btn"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Panel overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 320 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 320 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-surface border-l border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-foreground/60" />
                  <h2 className="font-bold text-sm tracking-tight">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded hover:bg-surface-hover text-foreground/50"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-foreground/40 text-sm">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-foreground/40 gap-3">
                    <Bell size={32} strokeWidth={1} />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map(notif => {
                      const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.credential_issued;
                      const Icon = cfg.icon;
                      const timeAgo = notif.created_at
                        ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })
                        : "";
                      return (
                        <motion.button
                          key={notif.id}
                          onClick={() => handleMarkRead(notif.id)}
                          className={`w-full text-left px-5 py-4 hover:bg-surface-hover transition-colors flex gap-3 ${
                            !notif.read ? "bg-primary/5" : ""
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon size={16} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold leading-snug ${notif.read ? "text-foreground/70" : "text-foreground"}`}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-foreground/50 mt-0.5 leading-relaxed">
                              {notif.body}
                            </p>
                            <p className="text-[10px] text-foreground/30 mt-1">{timeAgo}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
