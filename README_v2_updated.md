# CertifyVal — Global Decentralized Credential Trust Platform

> **Level 5 Stellar Journey to Mastery Submission**
> Built on Rust · Soroban Smart Contracts · Stellar Testnet · Next.js 15 · TypeScript · Tailwind CSS · Freighter Wallet

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple)](https://soroban.stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🌐 What is CertifyVal?

CertifyVal is a **production-ready Global Decentralized Credential Trust Platform** built on the Stellar blockchain. It enables universities, employers, governments, certification providers, and learners worldwide to issue, verify, and manage digital credentials with cryptographic certainty — no central authority required.

**Core Promise:** Every credential is immutable, every institution is accountable, every verification is instant.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CERTIFYVAL PLATFORM                         │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│   FRONTEND   │   SERVICES   │  BLOCKCHAIN  │    OFF-CHAIN AI       │
│  Next.js 15  │              │              │                       │
│  TypeScript  │  contract.ts │ Soroban:     │  Fraud Detection      │
│  Tailwind 4  │  institution │  cert_valid  │  Rule Engine          │
│  Framer Mot. │  Contract.ts │  institution │  (client-side)        │
│              │  stake       │  _registry   │                       │
│  7 Tab UI:   │  Contract.ts │  stake_pool  │  Risk Levels:         │
│  • Verify    │  fraud       │              │  Safe / Low /         │
│  • Issue     │  Detection   │ Stellar SDK  │  Medium / High        │
│  • Registry  │  .ts         │  (CDN)       │                       │
│  • Passport  │              │              │                       │
│  • Employer  │  localStorage│ Freighter    │                       │
│  • Analytics │  fallback    │  Wallet      │                       │
│  • Feedback  │              │  Integration │                       │
└──────────────┴──────────────┴──────────────┴───────────────────────┘
         │                           │
         ▼                           ▼
  Public /verify/[id]        Horizon Testnet API
  (no wallet required)       (balance, account)
```

---

## ✨ Feature Overview

### Feature 1 — Global Institution Registry
- Institution registration with full profile (name, country, wallet, website)
- Admin approval workflow
- Real-time trust score calculation
- Global and country rankings
- Search and filter by country, status, trust score
- Verification badge system
- ⭐⭐⭐⭐⭐ Star rating display

### Feature 2 — Universal Credential Passport
- Every wallet automatically owns a Credential Passport
- Supports: Degrees, Certificates, Hackathons, Research, Bootcamps, Internships, Badges, Licenses
- Timeline view with expandable credential cards
- QR code generation for passport sharing
- Skills overview and blockchain proof links
- All credentials owned by the wallet forever

### Feature 3 — Stake to Issue Mechanism
- **1 XLM bond** locked when issuing a certificate
- 7-day challenge window after issuance
- Bond released automatically if no dispute raised
- Bond slashed if certificate proven fraudulent (50% to challenger, 50% to treasury)
- Visual bond status in UI (locked → released / slashed)

### Feature 4 — Public Verification Page
- Every certificate gets a unique URL: `/verify/{certHash}`
- **No wallet required** — works for anyone
- QR code for the verification URL
- Full certificate status, owner, institution, timestamps
- Stellar Expert Explorer link
- Live blockchain verification on page load

### Feature 5 — AI Fraud Detection
- Client-side rule engine runs before every certificate issuance
- Detects: duplicate hashes, repeated owners, mass issuance, suspicious name patterns, low entropy hashes
- Risk levels: **Safe → Low → Medium → High**
- Safe & Low proceed automatically; Medium & High shown with manual review warning
- Animated risk meter, flag breakdown, analysis ID

### Feature 6 — Institution Trust Engine
- Dynamic trust score (0–100) calculated from: verifications, certs issued, disputes
- ⭐⭐⭐⭐⭐ star display in all institution views
- Global rank and country rank
- Live recalculation on each event

### Feature 7 — Employer Dashboard
- Certificate hash verification search
- Verification history with full audit trail
- Bookmark/unbookmark candidates
- Download verification report (text file)
- Fraud reporting button
- Institution trust score sidebar

### Feature 8 — Analytics Dashboard
- Live stat cards with animated counters
- SVG bar charts (no external chart libraries)
- Weekly certificate issuance trends
- Daily verification activity
- Country geographic distribution
- Live blockchain activity feed
- Auto-refreshes every 30 seconds

### Feature 9 — User Feedback
- Role-based feedback (Student / Employer / Institution / Other)
- Interactive star rating selector
- Feature-specific feedback categories
- Analytics: average rating, rating breakdown, role distribution
- Community feedback feed

### Feature 10 — Smart Contract Improvements
Extended existing `CertificateValidator` contract:
- `revoke_certificate(hash)` — mark certificate as revoked
- `is_revoked(hash)` — check revocation status
- `get_certificate_count()` — total certs issued
- `set_admin(address)` / `is_admin(address)` — RBAC

New `InstitutionRegistry` contract:
- `register_institution(id, name, country, wallet, website)`
- `approve_institution(id)` — admin gated
- `reject_institution(id)` — admin gated
- `record_certificate_issued(id)` — trust score trigger
- `record_verification(id)` — trust score trigger
- `record_dispute(id)` — trust score penalty
- `get_institution(id)` / `get_institution_count()`
- Dynamic trust score: `70 + (verifications/10) - (disputes*5)`

New `StakePool` contract:
- `lock_bond(cert_hash, institution)` — locks 1 XLM
- `release_bond(cert_hash)` — returns after 7-day window
- `challenge_certificate(cert_hash, challenger)` — opens dispute
- `slash_bond(cert_hash)` — 50/50 split to challenger + treasury
- `get_bond(cert_hash)` — query bond status
- `get_total_locked()` / `get_total_slashed()` — platform stats

### Feature 11 — Wallet Profile & Dashboard
- Dedicated slide-out panel tied to the connected wallet
- Live on-chain summary: XLM Balance, Certs Issued, Verifications, Active Bonds, Locked XLM
- Personal Platform Stats: Credential count, Institution registration status, Feedback given
- Quick Actions: Copy address, display QR code, open in Stellar Explorer
- Compact quick-view button pinned to the sidebar

---

## 📁 Project Structure

```
Digital-certificate-validator/
├── contract/
│   ├── Cargo.toml                          # Workspace manifest
│   └── contracts/
│       ├── contract/                       # Core CertificateValidator
│       │   └── src/
│       │       ├── lib.rs                  # Extended with Level 5 fns
│       │       └── test.rs                 # Full test suite
│       ├── institution_registry/           # NEW: Institution Registry
│       │   └── src/lib.rs
│       └── stake_pool/                     # NEW: Stake Pool
│           └── src/lib.rs
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                    # 7-tab navigation
│       │   ├── globals.css                 # Extended design tokens
│       │   └── verify/[id]/               # NEW: Public verify page
│       │       ├── page.tsx
│       │       └── PublicVerifyClient.tsx
│       ├── components/
│       │   ├── BlockchainVerifier.tsx      # Existing (unchanged)
│       │   ├── ConnectWallet.tsx           # Existing (unchanged)
│       │   ├── InstitutionDashboard.tsx    # Extended with fraud + stake
│       │   ├── ThemeToggle.tsx             # Existing (unchanged)
│       │   ├── Tooltip.tsx                 # Existing (unchanged)
│       │   ├── InstitutionRegistry.tsx     # NEW: Feature 1
│       │   ├── CredentialPassport.tsx      # NEW: Feature 2
│       │   ├── FraudDetectionPanel.tsx     # NEW: Feature 5
│       │   ├── EmployerDashboard.tsx       # NEW: Feature 7
│       │   ├── AnalyticsDashboard.tsx      # NEW: Feature 8
│       │   ├── FeedbackPanel.tsx           # NEW: Feature 9
│       │   └── QRCodeDisplay.tsx           # NEW: QR utility
│       ├── hooks/
│       │   └── useStellar.tsx              # Existing (unchanged)
│       └── services/
│           ├── contract.ts                 # Existing (unchanged)
│           ├── institutionContract.ts      # NEW: Institution service
│           ├── stakeContract.ts            # NEW: Stake service
│           └── fraudDetection.ts           # NEW: AI fraud engine
└── README.md
```

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+
- Rust + `cargo`
- Stellar CLI (`cargo install --locked stellar-cli`)
- Freighter wallet browser extension

### Frontend

```bash
cd frontend
npm install
npm run dev          # Development server at http://localhost:3000
npm run build        # Production build
npm run start        # Production server
```

### Smart Contracts

```bash
cd contract

# Run all tests
cargo test

# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Deploy institution_registry (example)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/institution_registry.wasm \
  --source <your-keypair> \
  --network testnet

# Deploy stake_pool
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stake_pool.wasm \
  --source <your-keypair> \
  --network testnet
```

### Environment Variables

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ID=CC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4
NEXT_PUBLIC_INSTITUTION_CONTRACT_ID=<your-institution-registry-contract-id>
NEXT_PUBLIC_STAKE_CONTRACT_ID=<your-stake-pool-contract-id>
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org:443
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

---

## 🧪 Testing Guide

### Smart Contract Tests

```bash
cd contract

# All tests
cargo test

# Specific contract
cargo test -p contract
cargo test -p institution_registry
cargo test -p stake_pool

# Verbose output
cargo test -- --nocapture
```

**Test Coverage:**
- `test_issue_and_get_owner` — Basic issuance + retrieval
- `test_verify_valid_certificate` — On-chain verification
- `test_verify_non_existent_certificate` — Missing cert returns false
- `test_certificate_count_increments` — Count tracking
- `test_revoke_certificate` — Revocation workflow
- `test_admin_rbac` — Role-based access control
- `test_register_and_approve_institution` — Registry workflow
- `test_trust_score_calculation` — Dynamic trust scoring
- `test_bond_amount_is_one_xlm` — Stake pool configuration

### Frontend Tests (manual)

| Test | Steps |
|------|-------|
| Verify Portal | Upload any file → check status in UI |
| Issue Portal | Connect wallet → upload file → run fraud check → issue |
| Fraud Detection | Issue same hash twice → see HIGH RISK alert |
| Institution Registry | Register new institution → see pending status → approve |
| Credential Passport | Connect wallet → view/add/remove credentials → share QR |
| Employer Dashboard | Paste a cert hash → verify → bookmark → download report |
| Analytics | Open dashboard → counters animate → wait 30s for refresh |
| Public Verify | Navigate to `/verify/{certHash}` without wallet |
| Stake Mechanism | Issue cert → see bond locked notice → bond record shown |

---

## 📡 API Documentation

### Soroban Contract: CertificateValidator
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `issue_certificate` | `cert_hash: String, owner: String` | `void` | Anchors cert hash on-chain |
| `verify_certificate` | `cert_hash: String` | `bool` | Returns true if cert exists |
| `get_owner` | `cert_hash: String` | `String` | Returns registered owner |
| `revoke_certificate` | `cert_hash: String` | `void` | Marks cert as revoked |
| `is_revoked` | `cert_hash: String` | `bool` | Returns revocation status |
| `get_certificate_count` | — | `u64` | Total certs issued |
| `set_admin` | `admin: Address` | `void` | Sets platform admin |
| `is_admin` | `addr: Address` | `bool` | Checks admin status |

### Soroban Contract: InstitutionRegistry
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `register_institution` | `id, name, country, wallet, website` | `void` | Registers institution (Pending) |
| `approve_institution` | `id: String` | `void` | Admin: approves institution |
| `reject_institution` | `id: String` | `void` | Admin: rejects institution |
| `record_certificate_issued` | `institution_id: String` | `void` | Triggers trust recalculation |
| `record_verification` | `institution_id: String` | `void` | Boosts trust score |
| `record_dispute` | `institution_id: String` | `void` | Reduces trust score |
| `get_institution` | `id: String` | `Option<Institution>` | Full institution data |
| `get_institution_count` | — | `u64` | Total institutions registered |

### Soroban Contract: StakePool
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `lock_bond` | `cert_hash, institution` | `void` | Locks 1 XLM bond |
| `release_bond` | `cert_hash: String` | `void` | Returns bond after window |
| `challenge_certificate` | `cert_hash, challenger` | `void` | Opens dispute |
| `slash_bond` | `cert_hash: String` | `void` | Admin: slashes fraudulent bond |
| `get_bond` | `cert_hash: String` | `Option<BondRecord>` | Bond status query |
| `get_total_locked` | — | `i128` | Total XLM locked (stroops) |
| `get_total_slashed` | — | `i128` | Total XLM slashed (stroops) |

---

## 📸 Screenshots

_(Screenshots captured from live testnet deployment)_

| Feature | View |
|---------|------|
| Verify Portal | File upload → SHA-256 → Soroban lookup |
| Issuance Portal | Wallet connection → fraud check → issue |
| Institution Registry | Card grid with trust scores and ranking |
| Credential Passport | Timeline view with QR code sharing |
| Employer Dashboard | Verification history + bookmarks |
| Analytics | Live charts + animated counters |
| Public Verify | No-wallet certificate verification page |

---

## 🗺️ Roadmap

### Phase 1 — ✅ Complete (Level 5)
- [x] Core certificate issuance & verification
- [x] Institution Registry with trust scores
- [x] Credential Passport
- [x] Stake-to-Issue mechanism
- [x] AI Fraud Detection engine
- [x] Public verification URLs
- [x] Employer Dashboard
- [x] Analytics Dashboard
- [x] User Feedback system

### Phase 2 — Planned
- [ ] PostgreSQL + Redis backend API
- [ ] Institution logo upload (IPFS)
- [ ] Batch certificate issuance
- [ ] Email notifications for verifications
- [ ] Mobile app (React Native)
- [ ] LOBSTR wallet deep link integration
- [ ] PDF certificate generation

### Phase 3 — Future
- [ ] Cross-chain credential bridging
- [ ] Zero-Knowledge Proof privacy layer
- [ ] Government API integrations
- [ ] Enterprise white-label deployment
- [ ] AI-powered credential matching for employers
- [ ] Decentralized dispute resolution DAO

---

## 👥 User Feedback & Iteration

We collect feedback through the in-app Feedback Panel and external channels.

**User Feedback Form:** [Google Form Link — add your form here]

**Key feedback received (Level 5 iteration):**
- ✅ Employers wanted bookmarking → Implemented bookmark + download report
- ✅ Students wanted QR code sharing → Implemented passport QR + public verify URL
- ✅ Institutions wanted transparency → Implemented trust score engine + dispute tracking
- ✅ Users wanted fraud prevention → Implemented AI fraud detection before issuance

---

## 🔐 Security Considerations

- All certificate hashes are SHA-256 — computationally infeasible to reverse
- Bond slashing creates economic disincentive for fraudulent issuance
- AI fraud detection catches suspicious patterns before they reach the chain
- Admin RBAC prevents unauthorized institution approval
- Local registry fallback ensures no single point of failure

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Rust + Soroban SDK 25 |
| Blockchain | Stellar Testnet |
| Frontend Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| PDF Generation | pdf-lib |
| Wallet | Freighter API + Albedo + xBull + MetaMask Snap |
| QR Codes | QR Server API (free, no auth) |

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgements

Built with ❤️ for the **Stellar Journey to Mastery** program.

Special thanks to the Stellar Development Foundation for Soroban, and to the global community of blockchain developers making decentralized credentials a reality.

---

*CertifyVal — Own your credentials. Trust the chain.*
