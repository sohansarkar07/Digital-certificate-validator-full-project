"use client";
// Main page — Universal Decentralized Credential Infrastructure
// Extended with Role System, Onboarding, Admin Panel, and Auth Context

import { useState, useEffect } from "react";
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
  ShieldCheck, Crown, GraduationCap, ChevronDown, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StellarProvider } from "@/hooks/useStellar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { WalletProfile, WalletProfileButton } from "@/components/WalletProfile";
import { LandingPage } from "@/components/LandingPage";
import { Documentation } from "@/components/Documentation";
import { NotificationCenter } from "@/components/NotificationCenter";
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

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[]; // undefined = visible to all
}

const NAV_ITEMS: NavItem[] = [
  { id: "verify",        label: "Verify Portal",        icon: Search },
  { id: "issue",         label: "Issuance Portal",      icon: Fingerprint, roles: ["institution", "employer", "admin", "owner"] },
  { id: "registry",      label: "Institution Registry", icon: Building2 },
  { id: "passport",      label: "Credential Passport",  icon: Award,        roles: ["student", "employer", "institution", "admin", "owner"] },
  { id: "employer",      label: "Employer Dashboard",   icon: Briefcase,    roles: ["employer", "admin", "owner"] },
  { id: "analytics",     label: "Analytics",            icon: BarChart2 },
  { id: "activity",      label: "Blockchain Activity",  icon: Activity },
  { id: "feedback",      label: "Feedback",             icon: MessageSquare },
  { id: "documentation", label: "Documentation",        icon: BookOpen },
  { id: "admin",         label: "Admin Panel",          icon: ShieldCheck,  roles: ["admin", "owner"] },
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
    owner:       { label: 'Owner',       color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',   icon: Crown },
    admin:       { label: 'Admin',       color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',       icon: ShieldCheck },
    institution: { label: 'Institution', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: Building2 },
    employer:    { label: 'Employer',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       icon: Briefcase },
    student:     { label: 'Student',     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: GraduationCap },
  };
  const { label, color, icon: Icon } = config[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Icon size={9} />
      {label}
    </span>
  );
}

// ── Inner app (needs AuthContext) ─────────────────────────────────────────────
function AppContent() {
  const { role, isPrivileged, needsOnboarding, loadingProfile, completeOnboarding } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("verify");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  // Filter nav items based on role
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true; // visible to all
    if (!role) return !item.roles || item.roles.length === 0; // no role = only public items
    return item.roles.includes(role);
  });

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
              // If institution, redirect to registry to register
              if (newRole === 'institution') {
                setActiveTab('registry');
              } else if (newRole === 'employer') {
                setActiveTab('employer');
              } else {
                setActiveTab('passport');
              }
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

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-[280px] bg-surface border-r border-border shrink-0 flex flex-col z-40 shadow-xl lg:shadow-sm transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Branding */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <h1 className="text-lg font-bold tracking-tight text-primary flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Shield size={14} strokeWidth={3} />
            </span>
            CertifyVal
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-foreground/50 hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Authority Card */}
        <div className="p-5 flex-shrink-0">
          <div className="p-3 bg-primary text-primary-foreground rounded flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary-foreground/10 flex items-center justify-center">
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {/* Regular nav items */}
          {visibleNavItems.filter(i => i.id !== 'admin').map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
          })}

          {/* Admin section (privileged users only) */}
          {isPrivileged && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-[9px] font-bold tracking-widest uppercase text-foreground/30">Administration</p>
              </div>
              <button
                onClick={() => setActiveTab("admin")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  activeTab === "admin"
                    ? "bg-secondary text-primary border-l-4 border-primary pl-2"
                    : "text-foreground/70 hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <ShieldCheck size={16} className={activeTab === "admin" ? "text-primary" : "text-foreground/40"} />
                Admin Panel
              </button>
            </>
          )}
        </nav>

        {/* Wallet Profile Summary (Sidebar) */}
        <div className="px-3 pb-3">
          <WalletProfileButton onClick={() => setIsProfileOpen(true)} />
        </div>

        {/* Footer Nav */}
        <div className="p-4 border-t border-border space-y-1 shrink-0 bg-surface">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors cursor-not-allowed">
            <Settings size={14} /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors cursor-not-allowed">
            <HelpCircle size={14} /> Support
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-background overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-border flex justify-between items-center px-4 md:px-8 shrink-0 relative z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-foreground/50 hover:text-foreground hover:bg-secondary rounded transition-colors"
            >
              <Menu size={20} />
            </button>
            <nav className="hidden md:flex items-center gap-5">
              {visibleNavItems.slice(0, 4).map((item) => (
                <span
                  key={item.id}
                  className={`text-sm tracking-wide font-medium cursor-pointer transition-colors hover:-translate-y-[1px] ${activeTab === item.id ? "text-primary" : "text-foreground/50 hover:text-foreground"}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.label}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="p-6 md:p-8 pb-32"
            >
              <div className="max-w-6xl mx-auto">
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
                { activeTab === "employer"      && <EmployerDashboard /> }
                { activeTab === "analytics"     && <AnalyticsDashboard /> }
                { activeTab === "activity"      && <BlockchainActivity /> }
                { activeTab === "feedback"      && <FeedbackPanel /> }
                { activeTab === "documentation" && <Documentation /> }
                { activeTab === "admin"         && <AdminPanel /> }
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

// ── Root export (providers wrap everything) ───────────────────────────────────
export default function Home() {
  return (
    <StellarProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </StellarProvider>
  );
}
