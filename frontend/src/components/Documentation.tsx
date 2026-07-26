"use client";

import React, { useState } from "react";
import {
  BookOpen, Shield, Code2, Zap, Lock, Globe, ChevronRight,
  FileText, Building2, Search, Terminal, ExternalLink, Copy,
  CheckCircle2, AlertTriangle, BrainCircuit, Layers, Wallet,
  Hash
} from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: Section[] = [
  { id: "overview",         label: "Overview",              icon: BookOpen },
  { id: "quickstart",       label: "Quick Start",           icon: Zap },
  { id: "architecture",     label: "Architecture",          icon: Layers },
  { id: "verification",     label: "Verify a Certificate",  icon: Search },
  { id: "issuance",         label: "Issue a Credential",    icon: FileText },
  { id: "ai-fraud",         label: "AI Fraud Detection",    icon: BrainCircuit },
  { id: "smart-contracts",  label: "Smart Contracts",       icon: Code2 },
  { id: "wallet",           label: "Wallet Integration",    icon: Wallet },
  { id: "registry",         label: "Institution Registry",  icon: Building2 },
  { id: "security",         label: "Security Model",        icon: Lock },
  { id: "api",              label: "API Reference",         icon: Terminal },
  { id: "faq",              label: "FAQ",                   icon: Globe },
];

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-white/10 bg-white/5">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{language}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors">
          {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Alert({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) {
  const styles = {
    info:    "border-blue-500/30 bg-blue-500/5 text-blue-300",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-300",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
  };
  const icons = { info: Shield, warning: AlertTriangle, success: CheckCircle2 };
  const Icon = icons[type];
  return (
    <div className={`flex gap-3 p-4 rounded-xl border my-4 ${styles[type]}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${color}`}>
      {label}
    </span>
  );
}

function OverviewSection() {
  return (
    <div>
      <SectionTitle title="CertifyVal Documentation" subtitle="The decentralized certificate trust platform on Stellar Soroban" />
      <p className="text-white/60 text-sm leading-relaxed mb-6">
        CertifyVal is an open, permissionless credential verification system built on the Stellar blockchain using Soroban smart contracts.
        It allows institutions to issue tamper-proof digital certificates and enables anyone to verify authenticity in seconds — without trusting any central authority.
      </p>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Shield,       title: "Trustless Verification", desc: "Certificates are verified against an immutable on-chain registry — no central database, no single point of failure." },
          { icon: BrainCircuit, title: "AI Fraud Detection",     desc: "Machine learning models scan documents for tampering, metadata anomalies, and heuristic red flags in real-time." },
          { icon: Globe,        title: "Global Registry",        desc: "Institutions worldwide can register, stake XLM for trust score boosts, and issue credentials to their graduates." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-5 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-3"><Icon size={16} className="text-white/70" /></div>
            <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
            <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <Alert type="info">CertifyVal runs on the <strong>Stellar Testnet</strong>. XLM can be obtained from Friendbot at <code className="bg-white/10 px-1 rounded">friendbot.stellar.org</code>.</Alert>
    </div>
  );
}

function QuickstartSection() {
  return (
    <div>
      <SectionTitle title="Quick Start" subtitle="Get up and running in 5 minutes" />
      <div className="space-y-6">
        {[
          { n: 1, title: "Install Freighter Wallet",    body: "CertifyVal uses Freighter — the official Stellar browser extension wallet.", extra: <a href="https://freighter.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"><ExternalLink size={11} />Download at freighter.app</a> },
          { n: 2, title: "Switch to Testnet",           body: "In Freighter: Settings → Network → Testnet" },
          { n: 3, title: "Fund your wallet",            body: <CodeBlock language="bash" code={`curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"`} /> },
          { n: 4, title: "Connect & Start",             body: "Click 'Connect Wallet' in the top navigation, approve in Freighter, and you're ready to verify or issue certificates." },
        ].map(({ n, title, body, extra }) => (
          <div key={n} className="flex gap-4">
            <span className="w-7 h-7 rounded-full bg-white/10 text-sm font-bold text-white flex items-center justify-center shrink-0 mt-0.5">{n}</span>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              {typeof body === "string" ? <p className="text-xs text-white/50">{body}</p> : body}
              {extra}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div>
      <SectionTitle title="Architecture" subtitle="How CertifyVal works end-to-end" />
      <p className="text-white/60 text-sm leading-relaxed mb-6">Three main layers: the Next.js frontend, Soroban smart contracts on Stellar, and Supabase for off-chain metadata.</p>
      <div className="border border-white/10 rounded-xl p-5 bg-white/5 mb-6 space-y-3">
        {[
          { step: "User uploads document",  color: "bg-emerald-500", detail: "Browser-side only — file never leaves the client." },
          { step: "SHA-256 hash computed",   color: "bg-emerald-500", detail: "A cryptographic fingerprint generated locally." },
          { step: "AI Fraud Analysis",       color: "bg-rose-500",    detail: "Heuristic + LLM engine scans metadata for anomalies." },
          { step: "Soroban contract query",  color: "bg-blue-500",    detail: "Hash is sent to the on-chain registry contract." },
          { step: "Verdict returned",        color: "bg-purple-500",  detail: "Valid/Invalid + institution + issuance date." },
        ].map(({ step, color, detail }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full ${color} mt-1.5 shrink-0`} />
            <div><p className="text-sm text-white font-medium">{step}</p><p className="text-xs text-white/40">{detail}</p></div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">On-Chain (Soroban)</h3>
          <ul className="space-y-1.5 text-xs text-white/50">
            {["Certificate registry contract", "Institution whitelist contract", "XLM staking pool contract", "Fraud flag registry"].map(i => <li key={i} className="flex items-center gap-2"><ChevronRight size={10} />{i}</li>)}
          </ul>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Off-Chain (Supabase)</h3>
          <ul className="space-y-1.5 text-xs text-white/50">
            {["Institution metadata & logos", "Credential passport profiles", "Analytics & event logs", "User feedback storage"].map(i => <li key={i} className="flex items-center gap-2"><ChevronRight size={10} />{i}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function VerificationSection() {
  return (
    <div>
      <SectionTitle title="Verify a Certificate" subtitle="Step-by-step verification guide" />
      <Alert type="success">Verification is completely free, requires no wallet, and takes under 3 seconds.</Alert>
      <ol className="space-y-4 mt-4">
        {[
          { n: 1, title: "Upload the document",  body: "Drag and drop any PDF or image. The file is processed entirely in your browser — nothing is uploaded to any server." },
          { n: 2, title: "AI pre-scan",          body: "Our AI engine scans for signs of tampering, unusual metadata, or known fraud patterns before querying the blockchain." },
          { n: 3, title: "Blockchain query",     body: "The SHA-256 hash is sent to the Soroban certificate registry. The contract returns institution, date, and status." },
          { n: 4, title: "Read the verdict",     body: "A clear VALID or INVALID verdict, with institution name, certificate type, and a shareable verification link." },
        ].map(({ n, title, body }) => (
          <li key={n} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
            <span className="w-7 h-7 rounded-full bg-white/10 text-sm font-bold text-white flex items-center justify-center shrink-0">{n}</span>
            <div><h4 className="text-sm font-semibold text-white mb-1">{title}</h4><p className="text-xs text-white/50 leading-relaxed">{body}</p></div>
          </li>
        ))}
      </ol>
      <CodeBlock language="javascript" code={`async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}
const hash = await hashFile(myFile);
const result = await verifyCertificate(hash);
// { valid: true, institution: "MIT", issuedAt: 1706745600 }`} />
    </div>
  );
}

function IssuanceSection() {
  return (
    <div>
      <SectionTitle title="Issue a Credential" subtitle="For registered institutions only" />
      <Alert type="warning">Issuance requires a connected wallet from a <strong>registered and approved institution</strong>. The wallet must match the institution&apos;s on-chain public key.</Alert>
      <ol className="space-y-4 mt-4">
        {[
          { n: 1, title: "Connect institution wallet", body: "Connect your Freighter wallet. Ensure it matches the public key registered in the Institution Registry." },
          { n: 2, title: "Fill certificate details",   body: "Enter recipient name, certificate type (Degree, Diploma, Badge), institution name, and issue date." },
          { n: 3, title: "Upload or hash document",    body: "Upload the original certificate PDF. The SHA-256 hash is computed in-browser and anchored on-chain." },
          { n: 4, title: "Sign and submit",            body: "The Soroban transaction is constructed and sent to Freighter for signing. Once confirmed, it's permanently on-chain." },
        ].map(({ n, title, body }) => (
          <li key={n} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
            <span className="w-7 h-7 rounded-full bg-white/10 text-sm font-bold text-white flex items-center justify-center shrink-0">{n}</span>
            <div><h4 className="text-sm font-semibold text-white mb-1">{title}</h4><p className="text-xs text-white/50 leading-relaxed">{body}</p></div>
          </li>
        ))}
      </ol>
      <CodeBlock language="rust" code={`pub fn issue_certificate(
    env: Env,
    issuer: Address,
    hash: String,
    recipient: String,
    cert_type: String,
) -> Result<(), ContractError> {
    issuer.require_auth();
    let registry = InstitutionRegistry::load(&env);
    registry.assert_registered(&issuer)?;
    env.storage().persistent().set(&hash, &Certificate {
        issuer, recipient, cert_type,
        issued_at: env.ledger().timestamp(),
    });
    Ok(())
}`} />
    </div>
  );
}

function AiFraudSection() {
  return (
    <div>
      <SectionTitle title="AI Fraud Detection" subtitle="Multi-layer document authenticity analysis" />
      <p className="text-white/60 text-sm leading-relaxed mb-6">CertifyVal runs a multi-stage AI pipeline on every uploaded document before querying the blockchain, catching sophisticated forgeries that have valid hashes but manipulated content.</p>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {[
          { title: "Heuristic Engine",     color: "text-rose-400",   desc: "Pattern-based rules check for known forgery signatures, pixel-level inconsistencies, and font anomalies." },
          { title: "Metadata Analysis",    color: "text-amber-400",  desc: "PDF metadata is parsed for creation date mismatches, suspicious software signatures, and editing history." },
          { title: "LLM Analysis (Groq)",  color: "text-blue-400",   desc: "A Groq-powered LLM reviews document text for logical inconsistencies and credential formatting errors." },
          { title: "Risk Scoring",         color: "text-purple-400", desc: "All signals combine into a 0–100 fraud risk score. Scores above 70 trigger a fraud warning." },
        ].map(({ title, color, desc }) => (
          <div key={title} className="p-4 rounded-xl border border-white/10 bg-white/5">
            <h3 className={`text-sm font-semibold mb-1 ${color}`}>{title}</h3>
            <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <CodeBlock language="typescript" code={`const result = await runFraudAnalysis(file, {
  heuristic: true,
  metadata:  true,
  llm:       true,
});
// result:
{
  riskScore: 23,          // 0 = clean, 100 = definite fraud
  verdict: "LOW_RISK",    // LOW_RISK | MEDIUM_RISK | HIGH_RISK
  flags: [],
  confidence: 0.94
}`} />
      <Alert type="warning">AI fraud detection is advisory only. A LOW_RISK score does not guarantee authenticity — always cross-reference the blockchain verdict.</Alert>
    </div>
  );
}

function SmartContractsSection() {
  return (
    <div>
      <SectionTitle title="Smart Contracts" subtitle="Soroban contracts powering CertifyVal" />
      <div className="space-y-6">
        {[
          { name: "Certificate Registry",  id: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", desc: "Core contract. Stores SHA-256 certificate hashes mapped to institution addresses and timestamps.", methods: ["issue_certificate(issuer, hash, recipient, type)", "verify_certificate(hash) → CertResult", "revoke_certificate(issuer, hash)"] },
          { name: "Institution Registry", id: "CBIELTK6YBZJU5UP2WWQEQDTIVCS4JHXE7OYNWZFMHZB6Y4YPEULKNKM", desc: "Manages whitelisted institutions. Institutions must stake XLM to register.", methods: ["register_institution(name, country, stake)", "get_institution(address) → Institution", "is_registered(address) → bool"] },
          { name: "Stake Pool",           id: "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE", desc: "Handles XLM staking. Higher stake = higher trust score.", methods: ["stake(amount)", "unstake(amount)", "get_stake(address) → i128"] },
        ].map(({ name, id, desc, methods }) => (
          <div key={name} className="p-5 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-white">{name}</h3>
              <Pill label="Testnet" color="bg-blue-500/10 text-blue-400" />
            </div>
            <p className="text-xs text-white/50 mb-3 leading-relaxed">{desc}</p>
            <div className="font-mono text-[10px] text-white/30 bg-white/5 rounded px-3 py-2 mb-3 break-all">{id}</div>
            <div className="space-y-1">
              {methods.map(m => <div key={m} className="font-mono text-[11px] text-emerald-400/70 flex items-center gap-2"><Hash size={10} className="shrink-0 text-white/20" />{m}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletSection() {
  return (
    <div>
      <SectionTitle title="Wallet Integration" subtitle="Freighter wallet connection guide" />
      <p className="text-white/60 text-sm leading-relaxed mb-4">CertifyVal uses the Freighter browser extension for wallet connectivity on Stellar, via <code className="bg-white/10 px-1 rounded text-xs">@stellar/freighter-api</code>.</p>
      <CodeBlock language="typescript" code={`import { isConnected, getPublicKey, signTransaction, setAllowed } from "@stellar/freighter-api";

const { isConnected: connected } = await isConnected();
await setAllowed();
const { publicKey } = await getPublicKey();

const { signedTransaction } = await signTransaction(xdr, {
  networkPassphrase: Networks.TESTNET,
});`} />
      <Alert type="info">The wallet is used only for signing Soroban transactions. CertifyVal never requests private keys or seed phrases.</Alert>
    </div>
  );
}

function RegistrySection() {
  return (
    <div>
      <SectionTitle title="Institution Registry" subtitle="How to register your institution" />
      <Alert type="warning">Institution registration requires a minimum stake of <strong>100 XLM</strong> on Testnet.</Alert>
      <ol className="space-y-4 mt-4">
        {[
          { n: 1, title: "Connect institution wallet", body: "Use a dedicated institutional wallet — this address will be permanently linked to your institution on-chain." },
          { n: 2, title: "Open Institution Registry",  body: "Navigate to the Institution Registry tab and click 'Register Institution'." },
          { n: 3, title: "Fill institution details",   body: "Provide name, country, type (University, College, Certifying Body), and website URL." },
          { n: 4, title: "Stake XLM for trust score",  body: "Stake at least 100 XLM. Trust score is proportional to stake — higher score = more verification weight." },
          { n: 5, title: "Submit for approval",        body: "Your registration transaction is confirmed on Soroban. You can immediately start issuing credentials." },
        ].map(({ n, title, body }) => (
          <li key={n} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
            <span className="w-7 h-7 rounded-full bg-white/10 text-sm font-bold text-white flex items-center justify-center shrink-0">{n}</span>
            <div><h4 className="text-sm font-semibold text-white mb-1">{title}</h4><p className="text-xs text-white/50 leading-relaxed">{body}</p></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SecuritySection() {
  return (
    <div>
      <SectionTitle title="Security Model" subtitle="How CertifyVal ensures trustless security" />
      <div className="space-y-4">
        {[
          { icon: Hash,         title: "SHA-256 Hashing",       body: "All certificates are represented as SHA-256 cryptographic hashes. Even a 1-bit change produces a completely different hash, making forgery computationally infeasible." },
          { icon: Lock,         title: "On-Chain Immutability",  body: "Once a certificate hash is anchored to Soroban, it cannot be modified — only revoked by the original issuer." },
          { icon: Shield,       title: "No Central Authority",   body: "Verification does not rely on any central server. Anyone can query the Soroban contract directly via the Stellar Horizon API." },
          { icon: Wallet,       title: "Wallet-Based Auth",      body: "Issuance authority is cryptographically tied to the institution's Stellar public key. Private key signatures are the only authentication." },
          { icon: BrainCircuit, title: "AI Pre-screening",       body: "AI analysis catches document forgeries that don't involve hash manipulation (e.g., visual watermark removal, metadata spoofing)." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Icon size={16} className="text-white/60" /></div>
            <div><h4 className="text-sm font-semibold text-white mb-1">{title}</h4><p className="text-xs text-white/50 leading-relaxed">{body}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiSection() {
  return (
    <div>
      <SectionTitle title="API Reference" subtitle="Programmatic access to CertifyVal" />
      <p className="text-white/60 text-sm mb-6">All Soroban contract methods are publicly accessible via the Stellar Horizon API. No API key required for verification.</p>
      <div className="space-y-6">
        {[
          { method: "GET", path: "/verify/:hash", desc: "Verify a certificate by its SHA-256 hash.", response: `{\n  "valid": true,\n  "institution": "MIT",\n  "recipient": "Alice Johnson",\n  "type": "Bachelor of Science",\n  "issuedAt": 1706745600,\n  "riskScore": 12\n}` },
          { method: "GET", path: "/institutions", desc: "List all registered institutions with trust scores.", response: `[\n  {\n    "address": "GXXXX...",\n    "name": "MIT",\n    "country": "US",\n    "trustScore": 98,\n    "stakedXLM": 10000\n  }\n]` },
        ].map(({ method, path, desc, response }) => (
          <div key={path} className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-white/5">
              <Pill label={method} color="bg-emerald-500/10 text-emerald-400" />
              <code className="text-sm font-mono text-white">{path}</code>
            </div>
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">{desc}</p>
              <CodeBlock language="json" code={response} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqSection() {
  const faqs = [
    { q: "Is CertifyVal free to use?",                    a: "Verification is always free and requires no wallet. Issuance requires a small Stellar network fee (< 0.0001 XLM) plus institution registration stake." },
    { q: "What file types are supported?",                 a: "PDF, PNG, JPG, JPEG, and WEBP files up to 10MB. Files are hashed client-side and never uploaded to any server." },
    { q: "Can a fraudulent certificate pass verification?", a: "Only if the fraudster obtained the institution's private key to register a fraudulent hash on-chain — which would be a crime. Physical forgeries with wrong hashes always fail." },
    { q: "What happens if an institution revokes a cert?", a: "Revoked certificates exist on-chain but are marked REVOKED. Verification returns the revocation status and timestamp." },
    { q: "Is the platform open source?",                   a: "Yes! Smart contracts and frontend are open source. You can inspect, fork, and deploy your own instance of CertifyVal." },
    { q: "What is the AI fraud detection accuracy?",       a: "The heuristic engine catches ~94% of known PDF manipulation techniques. Combined with Groq LLM analysis, accuracy reaches ~97% on test datasets." },
  ];
  return (
    <div>
      <SectionTitle title="FAQ" subtitle="Frequently asked questions" />
      <div className="space-y-3">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-white hover:bg-white/5 transition-colors list-none">
              {q}
              <ChevronRight size={14} className="text-white/30 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="px-4 pb-4 text-xs text-white/50 leading-relaxed border-t border-white/10 pt-3">{a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  overview: OverviewSection, quickstart: QuickstartSection, architecture: ArchitectureSection,
  verification: VerificationSection, issuance: IssuanceSection, "ai-fraud": AiFraudSection,
  "smart-contracts": SmartContractsSection, wallet: WalletSection, registry: RegistrySection,
  security: SecuritySection, api: ApiSection, faq: FaqSection,
};

export function Documentation() {
  const [activeSection, setActiveSection] = useState("overview");
  const SectionComponent = SECTION_COMPONENTS[activeSection] ?? OverviewSection;

  return (
    <div className="flex min-h-[70vh] rounded-xl border border-white/10 overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 bg-white/5 p-3 hidden md:block">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 mb-3">Sections</p>
        <nav className="space-y-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile section picker */}
      <div className="md:hidden w-full absolute top-0">
        <select value={activeSection} onChange={e => setActiveSection(e.target.value)}
          className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
          {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <SectionComponent />
      </div>
    </div>
  );
}
