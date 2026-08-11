"use client";
// Main page — Universal Decentralized Credential Infrastructure
// Extended with Role System, Onboarding, Admin Panel, Auth Context, and URL-based tab routing

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { InstitutionDashboard } from "@/components/InstitutionDashboard";
import { BlockchainVerifier } from "@/components/BlockchainVerifier";
import { InstitutionRegistry } from "@/components/InstitutionRegistry";
import { CredentialPassport } from "@/components/CredentialPassport";
import { EmployerDashboard } from "@/components/EmployerDashboard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import BlockchainActivity from "@/components/BlockchainActivity";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { AdminPanel } from "@/components/AdminPanel";
import { Onboarding } from "@/components/Onboarding";
import {
  Shield, Search, Fingerprint, Settings, HelpCircle, Menu, X,
  Building2, Award, Briefcase, BarChart2, MessageSquare, BookOpen,
  ShieldCheck, Crown, GraduationCap, Activity, ChevronRight, Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StellarProvider } from "@/hooks/useStellar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { WalletProfile, WalletProfileButton } from "@/components/WalletProfile";
import { LandingPage } from "@/components/LandingPage";
import { Documentation } from "@/components/Documentation";
import { NotificationCenter } from "@/components/NotificationCenter";
import { EmailVerifyModal } from "@/components/EmailVerifyModal";
import type { UserRole } from "@/lib/types";

type TabId =
  | "verify"
  | "issue"
  | "registry"
  | "passport"
  | "employer"
  | "analytics"
  | "activity"
  | "feedback"
  | "documentation"
  | "admin";

const VALID_TABS: TabId[] = [
  "verify", "issue", "registry", "passport", "employer",
  "analytics", "activity", "feedback", "documentation", "admin"
];

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  group: "main" | "platform" | "admin";
}

const NAV_ITEMS: NavItem[] = [
  { id: "verify",        label: "Verify Portal",        icon: Search,        group: "main" },
  { id: "issue",         label: "Issuance Portal",      icon: Fingerprint,   group: "main",     roles: ["institution", "employer", "admin", "owner"] },
  { id: "registry",      label: "Institution Registry", icon: Building2,     group: "main" },
  { id: "passport",      label: "Credential Passport",  icon: Award,         group: "main",     roles: ["student", "employer", "institution", "admin", "owner"] },
  { id: "employer",      label: "Employer Dashboard",   icon: Briefcase,     group: "platform", roles: ["employer", "admin", "owner"] },
  { id: "analytics",     label: "Analytics",            icon: BarChart2,     group: "platform" },
  { id: "activity",      label: "Blockchain Activity",  icon: Activity,      group: "platform" },
  { id: "feedback",      label: "Feedback",             icon: MessageSquare, group: "platform" },
  { id: "documentation", label: "Documentation",        icon: BookOpen,      group: "platform" },
  { id: "admin",         label: "Admin Panel",          icon: ShieldCheck,   group: "admin",    roles: ["admin", "owner"] },
];

const PAGE_META: Record<TabId, { title: string; subtitle: string; description: string }> = {
  verify: {
    title: "Verify Document",
    subtitle: "Digital Certificate Validator",
    description: "Upload a digital document to verify its cryptographic hash against the Soroban immutable ledger.",
  },
  issue: {
    title: "Issue Credential",
    subtitle: "Institution Portal",
    description: "Formally anchor new certified digital assets directly to the immutable Soroban decentralized ledger. Requires active institutional wallet authorization.",
  },
  registry: {
    title: "Institution Registry",
    subtitle: "Global Trust Platform",
    description: "Browse approved institutions, search by country or trust score, and register your institution for credential issuance authority.",
  },
  passport: {
    title: "Credential Passport",
    subtitle: "Global Trust Platform",
    description: "Your universal decentralized credential profile. Own your degrees, certificates, badges, and achievements — anchored to your wallet forever.",
  },
  employer: {
    title: "Employer Dashboard",
    subtitle: "Global Trust Platform",
    description: "Search and verify candidate certificates, bookmark profiles, download verification reports, and view institution trust scores.",
  },
  analytics: {
    title: "Platform Analytics",
    subtitle: "Global Trust Platform",
    description: "Live insights into certificate issuance, verification activity, fraud detection, XLM staking, and global adoption metrics.",
  },
  activity: {
    title: "Blockchain Activity",
    subtitle: "Immutable Ledger",
    description: "Real-time feed of all state-changing events recorded on the Stellar testnet, providing absolute transparency and auditability.",
  },
  feedback: {
    title: "User Feedback",
    subtitle: "Global Trust Platform",
    description: "Rate your experience, share suggestions, and help improve the platform. Your feedback is stored on-chain and drives future development.",
  },
  documentation: {
    title: "Documentation",
    subtitle: "Developer & User Guide",
    description: "Comprehensive guides, architecture diagrams, smart contract reference, and API documentation for CertifyVal.",
  },
  admin: {
    title: "Admin Panel",
    subtitle: "Platform Management",
    description: "Manage institutions, admins, credential categories, and platform-wide settings. Restricted to authorized administrators.",
  },
};

// ── Role indicator badge ─────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole | null }) {
  if (!role) return null;
  const config: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
    owner:       { label: 'Owner',       color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',      icon: Crown },
    admin:       { label: 'Admin',       color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',          icon: ShieldCheck },
    institution: { label: 'Institution', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',    icon: Building2 },
    employer:    { label: 'Employer',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',           icon: Briefcase },
    student:     { label: 'Student',     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',  icon: GraduationCap },
  };
  const { label, color, icon: Icon } = config[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Icon size={9} />
      {label}
    </span>
  );
}

// ── Reusable sidebar nav button ───────────────────────────────────────────────
function SidebarNavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={item.label}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
        isActive
          ? "bg-secondary text-primary border-l-4 border-primary pl-2 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]"
          : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      <Icon size={16} className={isActive ? "text-primary" : "text-foreground/40"} />
      {item.label}
    </button>
  );
}

// ── Inner app (needs AuthContext + Router) ────────────────────────────────────
function AppContent() {
  const { role, isPrivileged, needsOnboarding, loadingProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showApp, setShowApp] = useState(false);

  // Derive active tab from URL, with fallback to "verify"
  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "verify";

  // Navigate to a tab by updating the URL query parameter
  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
    setIsSidebarOpen(false);
  };

  // Update browser tab title whenever the active tab changes
  useEffect(() => {
    const meta = PAGE_META[activeTab];
    document.title = `${meta.title} | CertifyVal`;
    return () => {
      document.title = "CertifyVal | Global Decentralized Credential Trust Platform";
    };
  }, [activeTab]);

  // If a valid tab is already in the URL on mount, skip the landing page
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setShowApp(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter nav items based on role
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    if (!role) return !item.roles || item.roles.length === 0;
    return item.roles.includes(role);
  });

  const mainNavItems     = visibleNavItems.filter(i => i.group === "main");
  const platformNavItems = visibleNavItems.filter(i => i.group === "platform");
  const adminNavItems    = visibleNavItems.filter(i => i.group === "admin");
  const topNavItems      = visibleNavItems.filter(i => i.group !== "admin");

  const meta = { ...PAGE_META[activeTab] };
  if (activeTab === "registry" && role === "employer") {
    meta.title = "Trusted Issuers";
    meta.description = "Directory of verified institutions issuing credentials on the platform.";
  }

  if (!showApp) {
    return (
      <LandingPage
        onGetStarted={() => setShowApp(true)}
        onNavigate={(tab) => {
          setActiveTab(tab as TabId);
          setShowApp(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">

      {/* Onboarding Modal */}
      <AnimatePresence>
        {needsOnboarding && !loadingProfile && (
          <Onboarding
            onComplete={(newRole) => {
              if (newRole === 'institution') setActiveTab('registry');
              else if (newRole === 'employer') setActiveTab('employer');
              else setActiveTab('passport');
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-[280px] bg-surface border-r border-border shrink-0 flex flex-col z-40 shadow-xl lg:shadow-sm transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>

        {/* Branding */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <h1 className="text-lg font-bold tracking-tight text-primary flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Shield size={14} strokeWidth={3} />
            </span>
            CertifyVal
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-foreground/50 hover:text-foreground rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Authority Card */}
        <div className="p-5 shrink-0">
          <div className="p-3 bg-primary text-primary-foreground rounded flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary-foreground/10 flex items-center justify-center shrink-0">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight uppercase tracking-wider">Trust Platform</p>
              <p className="text-[10px] text-primary-foreground/50 font-mono tracking-widest mt-0.5">STELLAR-SOROBAN</p>
            </div>
          </div>
          {role && (
            <div className="mt-2 flex justify-center">
              <RoleBadge role={role} />
            </div>
          )}
          <button
            onClick={() => setActiveTab("verify")}
            className="w-full mt-3 py-2 px-4 bg-primary text-primary-foreground font-medium text-xs rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
          >
            <Search size={14} /> Verify Document
          </button>
        </div>

        {/* Navigation — grouped sections */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">

          {/* MAIN section */}
          {mainNavItems.length > 0 && (
            <>
              <div className="pt-1 pb-1.5 px-3">
                <p className="text-[9px] font-bold tracking-widest uppercase text-foreground/30">Main</p>
              </div>
              {mainNavItems.map(item => (
                <SidebarNavButton
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </>
          )}

          {/* PLATFORM section */}
          {platformNavItems.length > 0 && (
            <>
              <div className="pt-3 pb-1.5 px-3">
                <p className="text-[9px] font-bold tracking-widest uppercase text-foreground/30">Platform</p>
              </div>
              {platformNavItems.map(item => (
                <SidebarNavButton
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </>
          )}

          {/* ADMINISTRATION section */}
          {adminNavItems.length > 0 && (
            <>
              <div className="pt-3 pb-1.5 px-3">
                <p className="text-[9px] font-bold tracking-widest uppercase text-foreground/30">Administration</p>
              </div>
              {adminNavItems.map(item => (
                <SidebarNavButton
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </>
          )}
        </nav>

        {/* Wallet Profile Summary */}
        <div className="px-3 pb-3 shrink-0">
          <WalletProfileButton onClick={() => setIsProfileOpen(true)} />
        </div>

        {/* Footer — Settings & Support (now functional) */}
        <div className="p-4 border-t border-border space-y-1 shrink-0 bg-surface">
          <button
            onClick={() => setActiveTab("documentation")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === "documentation"
                ? "text-primary bg-secondary"
                : "text-foreground/60 hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <Settings size={14} /> Settings & Docs
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === "feedback"
                ? "text-primary bg-secondary"
                : "text-foreground/60 hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <HelpCircle size={14} /> Support & Feedback
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-background overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-border flex justify-between items-center px-4 md:px-6 shrink-0 relative z-10 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 text-foreground/50 hover:text-foreground hover:bg-secondary rounded transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>

            {/* Horizontal scrollable top nav — all visible non-admin tabs */}
            <nav
              className="hidden md:flex items-center gap-0.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {topNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                      isActive
                        ? "text-primary bg-secondary"
                        : "text-foreground/50 hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
              {/* Admin tab — shown in top nav when privileged */}
              {isPrivileged && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`relative whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded transition-all ml-1 border ${
                    activeTab === "admin"
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                      : "text-foreground/40 border-transparent hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  Admin
                  {activeTab === "admin" && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-rose-400 rounded-full" />
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Right side: role, notifications, theme, wallet */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {role && <RoleBadge role={role} />}
            <NotificationCenter />
            <ThemeToggle />
            <div className="scale-90 md:scale-100 origin-right">
              <ConnectWallet />
            </div>
          </div>
        </header>

        {/* Scrollable Stage */}
        <div className="flex-1 overflow-y-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="p-6 md:p-8 pb-32"
            >
              <div className="max-w-6xl mx-auto">

                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-foreground/40 mb-5 font-medium">
                  <button
                    onClick={() => setShowApp(false)}
                    className="flex items-center gap-1 hover:text-foreground/70 transition-colors"
                  >
                    <Home size={11} />
                    Home
                  </button>
                  <ChevronRight size={11} className="shrink-0" />
                  <span className="text-foreground/60 truncate">{meta.title}</span>
                </nav>

                {/* Page Header */}
                <div className="mb-8">
                  <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase">
                    {meta.subtitle}
                  </span>
                  <h2 className="text-2xl font-semibold tracking-tight text-primary mt-1">
                    {meta.title}
                  </h2>
                  <p className="text-sm text-foreground/60 mt-2 max-w-2xl leading-relaxed">
                    {meta.description}
                  </p>
                </div>

                {/* Tab Content */}
                {activeTab === "verify"        && <BlockchainVerifier />}
                {activeTab === "issue"         && <InstitutionDashboard />}
                {activeTab === "registry"      && <InstitutionRegistry />}
                {activeTab === "passport"      && <CredentialPassport />}
                {activeTab === "employer"      && <EmployerDashboard />}
                {activeTab === "analytics"     && <AnalyticsDashboard />}
                {activeTab === "activity"      && <BlockchainActivity />}
                {activeTab === "feedback"      && <FeedbackPanel />}
                {activeTab === "documentation" && <Documentation />}
                {activeTab === "admin"         && <AdminPanel />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <WalletProfile
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onNavigate={(tab) => setActiveTab(tab as TabId)}
      />
    </div>
  );
}

// ── Root export (providers + Suspense for useSearchParams) ────────────────────
export default function Home() {
  return (
    <StellarProvider>
      <AuthProvider>
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
            </div>
          </div>
        }>
          <AppContent />
        </Suspense>
        <EmailVerifyModal />
      </AuthProvider>
    </StellarProvider>
  );
}
