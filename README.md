<div align="center">

# ðŸ›¡ï¸ CertifyVal
### **Global Decentralized Credential Trust Platform**

> *Eliminating certificate fraud through blockchain immutability, AI fraud detection, and cryptographic verification â€” powered by Stellar Soroban*

<p>ðŸŒ <strong>Live Application: <a href="https://certifyval.vercel.app/">https://certifyval.vercel.app/</a></strong></p>

<p>
  <a href="https://youtu.be/pkX4ZjrTgLw">
    <img src="https://img.shields.io/badge/Demo_Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white" />
  </a>
  <a href="https://drive.google.com/file/d/13R5k0awT4VD1-IW8M5MIOfXvL9BKrIWX/view?usp=drivesdk">
    <img src="https://img.shields.io/badge/PPT_Presentation-FFD700?style=for-the-badge&logo=google-drive&logoColor=black" />
  </a>
  <br/>
  <a href="https://docs.google.com/forms/d/e/1FAIpQLSeTacaTE5WdiziG8oA6qHFntoSKmnlPN_es5Chn5q7jiOEwbQ/viewform?usp=publish-editor">
    <img src="https://img.shields.io/badge/User_Feedback_Form-4285F4?style=for-the-badge&logo=google-forms&logoColor=white" />
  </a>
  <a href="https://docs.google.com/spreadsheets/d/1KkirRluFDUFCoo5sLA4LoxLYy0ZxEHPbe_fjbee3U7w/edit?usp=sharing">
    <img src="https://img.shields.io/badge/User_Responses_Sheet-34A853?style=for-the-badge&logo=google-sheets&logoColor=white" />
  </a>
</p>

<img src="https://img.shields.io/badge/Rust-black?style=for-the-badge&logo=rust&logoColor=white" />
<img src="https://img.shields.io/badge/Stellar-E84142?style=for-the-badge&logo=stellar&logoColor=white" />
<img src="https://img.shields.io/badge/Soroban-3178C6?style=for-the-badge&logo=web3.js&logoColor=white" />
<img src="https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Groq_AI-FF6B35?style=for-the-badge&logo=openai&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/github/actions/workflow/status/sohansarkar07/Digital-certificate-validator-full-project/rust-test.yml?branch=main&label=CI%2FCD&style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-339933?style=for-the-badge" />
<img src="https://img.shields.io/badge/Level-Blue_Belt_â­-0077FF?style=for-the-badge" />

<br><br>

[Demo Video](https://youtu.be/pkX4ZjrTgLw) â€¢
[Problem](#problem-statement) â€¢
[Solution](#solution) â€¢
[Architecture](#architecture) â€¢
[AI Fraud Engine](#ai-fraud-detection) â€¢
[Blockchain](#blockchain-architecture) â€¢
[Database Schema](#database-schema) â€¢
[User Flow](#user-flow) â€¢
[Product Iteration](#product-iteration) â€¢
[Roadmap](#roadmap) â€¢
[Setup](#setup)
---

## ðŸŽ¥ YouTube Overview

[![YouTube Overview](https://img.youtube.com/vi/pkX4ZjrTgLw/0.jpg)](https://www.youtube.com/watch?v=pkX4ZjrTgLw)

</div>

---

<a name="what-is-this"></a>
## ðŸ“– What Is CertifyVal?

**CertifyVal** is a next-generation, institutional-grade **decentralized credential trust platform** built on the Stellar blockchain. It bridges the gap between the $25B+ credential fraud industry and modern cryptographic verification technology.

Unlike simple hash-on-chain tools, CertifyVal is a **complete verification ecosystem**:

| Capability | Description |
|:---|:---|
| ðŸ›ï¸ **Institution Portal** | Register, get approved, and issue tamper-proof credentials on-chain |
| ðŸ”¬ **AI Fraud Engine** | Dual-layer Groq LLM + Heuristic fraud pipeline scores every certificate |
| ðŸ”— **Blockchain Ledger** | Soroban smart contracts store SHA256 hashes immutably on Stellar |
| ðŸŽ’ **Credential Passport** | Students own a portable, shareable digital credential wallet |
| ðŸ‘” **Employer Dashboard** | Employers bulk-verify candidates in seconds, not days |
| ðŸ“Š **Analytics & Audit** | Real-time on-chain activity logs and exportable audit trails |
| ðŸ“§ **Email Delivery** | OTP + credential delivery via Resend email API |

> Give it a certificate â€” and within **2 seconds** it tells you: *Real or Fake, and who issued it, and when, and whether the issuing institution is trusted.*

---

## ðŸ“¸ Platform UI Tour

| Landing Page | Issuance Portal |
|:---:|:---:|
| <img src="assets/screenshots/landing_page.png" alt="Landing Page" width="100%"/> | <img src="assets/screenshots/issuance_page.png" alt="Issuance Portal" width="100%"/> |

| Verification Portal | Credential Passport |
|:---:|:---:|
| <img src="assets/screenshots/verify_page.png" alt="Verify Portal" width="100%"/> | <img src="assets/screenshots/credential_passport.png" alt="Credential Passport" width="100%"/> |

| Institution Registry | Platform Analytics |
|:---:|:---:|
| <img src="assets/screenshots/institution_registry.png" alt="Institution Registry" width="100%"/> | <img src="assets/screenshots/analytics.png" alt="Analytics" width="100%"/> |

| Blockchain Activity | Developer Documentation |
|:---:|:---:|
| <img src="assets/screenshots/blockchain_activity.png" alt="Blockchain Activity" width="100%"/> | <img src="assets/screenshots/documentation.png" alt="Documentation" width="100%"/> |

---

<a name="problem-statement"></a>
## ðŸ”´ Problem Statement

The global credentialing system is fundamentally broken. Here is the scale of the crisis:

```
  â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
  â•‘  ðŸ“Š THE CREDENTIAL FRAUD CRISIS â€” BY THE NUMBERS           â•‘
  â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£
  â•‘  â€¢ 40% of CVs contain at least one significant fabrication  â•‘
  â•‘  â€¢ $25B+ lost annually to credential fraud worldwide        â•‘
  â•‘  â€¢ Average manual verification time: 3â€“10 business days     â•‘
  â•‘  â€¢ 17% of licensed professionals have fraudulent degrees    â•‘
  â•‘  â€¢ Zero cryptographic verification in 95% of institutions   â•‘
  â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### Core Pain Points

**1. ðŸ–¨ï¸ Forgery is Trivially Easy**
Standard certificates (PDF/PNG/paper) can be edited in minutes using free software. There is no cryptographic signature, no tamper detection, no way for an employer to distinguish real from fake.

**2. ðŸŒ Verification is Painfully Slow**
Current process: send email â†’ wait for response â†’ manually compare data â†’ no guarantee of response. This takes 3â€“10 days per candidate.

**3. ðŸšï¸ Centralized Fragility**
Institution servers go down. Universities close. HR records get deleted. When the central authority disappears, so does your credential's verifiability.

**4. ðŸ’¸ Blockchain Economics Have Been a Barrier**
Ethereum gas fees (up to $50/tx) made blockchain-based credentialing commercially unviable for mass adoption.

**5. ðŸ”’ Data Privacy Conflicts**
GDPR compliance and student data privacy make it difficult to publish credential data openly, creating a tension between transparency and privacy.

---

<a name="solution"></a>
## ðŸŸ¢ The Solution â€” CertifyVal

CertifyVal solves each problem with a targeted, elegantly designed solution:

| Problem | CertifyVal's Solution |
|:---|:---|
| PDF Forgery | SHA256 hash stored immutably on Stellar â€” hash mismatch = detected fraud |
| Slow verification | Sub-second smart contract lookups â€” instant cryptographic proof |
| Centralized fragility | Decentralized Stellar ledger â€” no single point of failure |
| High gas fees | Soroban: ~$0.000001/tx â€” mass issuance becomes economically viable |
| Data privacy | Only the hash fingerprint is stored on-chain â€” zero PII on blockchain |
| Fraudulent institutions | On-chain Institution Registry with admin approval + stake-based accountability |

### The CertifyVal Difference

```
  Traditional System:         CertifyVal System:
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ PDF File     â”‚            â”‚ SHA256(certificate_data)     â”‚
  â”‚ Easy to edit â”‚     â†’      â”‚ + Soroban On-chain Proof     â”‚
  â”‚ No proof     â”‚            â”‚ + AI Fraud Score             â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜            â”‚ + Institution Trust Score    â”‚
                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       FORGEABLE                    CRYPTOGRAPHICALLY SEALED
```

---

<a name="why-soroban"></a>
## ðŸ”‘ Why Soroban? â€” The Technical Case

> **Soroban is not just a blockchain â€” it's the perfect host for a trust protocol.**

### Competitive Analysis

| Feature | Ethereum | Solana | Cardano | **Stellar Soroban** |
|:---|:---:|:---:|:---:|:---:|
| **Tx Fee (avg)** | $5â€“50 | $0.001 | $0.15 | âœ… **$0.000001** |
| **Confirmation** | 12â€“60s | 400ms | 20s | âœ… **<5s** |
| **Language** | Solidity | Rust | Haskell | âœ… **Rust** |
| **Type Safety** | Medium | High | High | âœ… **Highest** |
| **WASM Runtime** | âŒ | âŒ | âœ… | âœ… |
| **Built-in Auth** | âŒ | âŒ | âŒ | âœ… **`require_auth`** |
| **Storage Model** | Expensive | Rent-based | UTXO | âœ… **Optimized Instance** |
| **Formal Verification** | Limited | Limited | âœ… | âœ… |

### Soroban-Specific Features We Leverage

```rust
// 1. INSTANCE STORAGE â€” Persistent, efficient certificate mapping
env.storage().instance().set(&cert_hash, &owner);

// 2. NATIVE AUTHENTICATION â€” Cryptographic wallet authorization
institution_wallet.require_auth();

// 3. SYMBOL MACROS â€” Compact on-chain key storage
symbol_short!("ISSUE")   // 8-byte max compressed key

// 4. EVENTS â€” Real-time notification system for indexers
env.events().publish((symbol_short!("ISSUE"), cert_hash), owner);

// 5. BYTES TYPE â€” Native SHA256 hash storage (no string padding)
cert_hash: Bytes  // Exact 32-byte match, no encoding overhead
```

---

<a name="architecture"></a>
## ðŸ—ï¸ System Architecture

### High-Level Platform Overview

```mermaid
graph TB
    subgraph CLIENT["ðŸ–¥ï¸ Client Layer â€” Next.js 15"]
        UI["React Components"]
        WALLET["Freighter Wallet\nWalletConnect"]
        SDK["Stellar SDK"]
    end

    subgraph AI["ðŸ¤– AI Layer â€” Fraud Detection"]
        HEURISTIC["Layer 1: Heuristic\nEngine (local)"]
        GROQ["Layer 2: Groq AI\nLlama-3 70B"]
        RISK["Risk Score\nAggregator"]
    end

    subgraph BACKEND["âš™ï¸ Backend Layer â€” Next.js API Routes"]
        OTP_API["POST /api/email/otp"]
        CRED_API["POST /api/email/credential"]
        RESEND["Resend Email API"]
    end

    subgraph DB["ðŸ—„ï¸ Database Layer â€” Supabase PostgreSQL"]
        CREDS_TABLE["credentials table"]
        INSTS_TABLE["institutions table"]
        AUDIT_TABLE["audit_logs table"]
        PERMS_TABLE["permissions table"]
    end

    subgraph BLOCKCHAIN["â›“ï¸ Blockchain Layer â€” Stellar Soroban"]
        CERT_CONTRACT["ðŸ“œ Certificate Contract\nCC36B2WF..."]
        INST_CONTRACT["ðŸ›ï¸ Institution Registry\nContract"]
        STAKE_CONTRACT["ðŸ’° Stake Pool Contract"]
    end

    subgraph STELLAR["ðŸŒ Stellar Network"]
        TESTNET["Stellar Testnet\nHorizon RPC"]
        LEDGER["Immutable Ledger\nGlobal State"]
    end

    CLIENT --> AI
    CLIENT --> BACKEND
    CLIENT --> BLOCKCHAIN
    AI --> RISK
    BACKEND --> RESEND
    BACKEND --> DB
    BLOCKCHAIN --> STELLAR
    STELLAR --> LEDGER

    classDef clientStyle fill:#1e3a5f,stroke:#4a9eff,color:#fff
    classDef aiStyle fill:#2d1b69,stroke:#9b59b6,color:#fff
    classDef backendStyle fill:#1a3a2a,stroke:#2ecc71,color:#fff
    classDef dbStyle fill:#3a1a0a,stroke:#e67e22,color:#fff
    classDef blockchainStyle fill:#2a1a3a,stroke:#e84142,color:#fff
    classDef stellarStyle fill:#1a2a3a,stroke:#3498db,color:#fff
```

---

<a name="user-flow"></a>
## ðŸ‘¤ User Flow Architecture

### Complete End-to-End User Journey

```mermaid
flowchart TD
    START(["ðŸš€ User Visits CertifyVal"])
    CONNECT["Connect Freighter Wallet"]
    ROLE{Select Role}

    subgraph INSTITUTION_FLOW["ðŸ›ï¸ Institution Path"]
        I1["Register Institution\n(Name, Country, Type)"]
        I2["Admin Approves\n(On-chain)"]
        I3["Lock Stake Bond\n(XLM via Stake Pool)"]
        I4["Upload Certificate\nDocument/URL"]
        I5["AI Fraud Analysis\n(Layer 1 + 2)"]
        I6{AI Recommendation}
        I7["Issue Certificate\nSoroban TX"]
        I8["Email Sent to\nRecipient via Resend"]
    end

    subgraph STUDENT_FLOW["ðŸŽ“ Student / Holder Path"]
        S1["Connect Wallet"]
        S2["View Credential\nPassport"]
        S3["Add Credential\n(Upload Wizard)"]
        S4["AI Validates\nDocument"]
        S5["Share Credential\nPublic Link / QR"]
    end

    subgraph EMPLOYER_FLOW["ðŸ‘” Employer Path"]
        E1["Enter Certificate\nHash or Scan QR"]
        E2["Blockchain Lookup\n<2 seconds"]
        E3["Retrieve: Owner,\nIssuer, Date, Hash"]
        E4["AI Trust Score\nDisplayed"]
        E5["Export Audit\nLog PDF/TXT"]
    end

    START --> CONNECT
    CONNECT --> ROLE
    ROLE -->|Institution| I1
    ROLE -->|Student| S1
    ROLE -->|Employer| E1

    I1 --> I2 --> I3 --> I4 --> I5 --> I6
    I6 -->|"âœ… Proceed"| I7 --> I8
    I6 -->|"âš ï¸ Risk Flagged"| I4

    S1 --> S2 --> S3 --> S4 --> S5

    E1 --> E2 --> E3 --> E4 --> E5

    classDef startStyle fill:#0f4c75,stroke:#1b6ca8,color:#fff,rx:20px
    classDef institutionStyle fill:#1a3a2a,stroke:#2ecc71,color:#fff
    classDef studentStyle fill:#2d1b69,stroke:#9b59b6,color:#fff
    classDef employerStyle fill:#3a1a0a,stroke:#e67e22,color:#fff
```

---

<a name="ai-fraud-detection"></a>
## ðŸ¤– AI Fraud Detection Pipeline

CertifyVal uses a **dual-layer hybrid AI system** to detect fraudulent credentials before they are issued on-chain.

### Architecture Overview

```mermaid
flowchart TD
    INPUT(["ðŸ“„ Incoming Certificate\nDocument / URL / Text"])

    subgraph LAYER1["âš¡ Layer 1 â€” Heuristic Engine (Local, <10ms)"]
        H1["ðŸ“Š Pattern Analysis\nTitle/Institution keyword match"]
        H2["ðŸ”¢ Numeric Validation\nDate ranges, score ranges"]
        H3["ðŸ“‹ Template Detection\nKnown fake template fingerprints"]
        H4["ðŸ”— URL Verification\nInstitution domain validation"]
        H5["ðŸ“ Format Scoring\nSuspicious length/structure checks"]
        HSCORE["Heuristic Risk Score\n(0-100)"]
    end

    subgraph LAYER2["ðŸ§  Layer 2 â€” Groq AI Engine (LLM, ~200ms)"]
        G1["ðŸ” Context Analysis\nGroq Llama-3 70B inference"]
        G2["ðŸ« Institution Verification\nCross-reference known institutions"]
        G3["ðŸ“ Language Analysis\nAI detects machine-generated text"]
        G4["ðŸŽ¯ Anomaly Detection\nOutlier score vs credential type"]
        GSCORE["AI Confidence Score\n(0-100)"]
    end

    subgraph AGGREGATOR["ðŸ“Š Risk Score Aggregator"]
        WEIGHT["Weighted Combination\n40% Heuristic + 60% AI"]
        FINAL["Final Risk Score\n(0-100)"]
        DECISION{"Risk\nThreshold"}
    end

    subgraph OUTPUT["ðŸš¦ Decision Output"]
        PROCEED["âœ… PROCEED\nScore < 30\nLow Risk"]
        REVIEW["âš ï¸ MANUAL REVIEW\nScore 30-70\nMedium Risk"]
        BLOCK["ðŸš« BLOCK\nScore > 70\nHigh Risk â€” Likely Fraud"]
    end

    INPUT --> H1
    INPUT --> H2
    INPUT --> H3
    INPUT --> H4
    INPUT --> H5
    H1 & H2 & H3 & H4 & H5 --> HSCORE

    INPUT --> G1
    G1 --> G2 --> G3 --> G4 --> GSCORE

    HSCORE --> WEIGHT
    GSCORE --> WEIGHT
    WEIGHT --> FINAL --> DECISION

    DECISION -->|"Risk < 30"| PROCEED
    DECISION -->|"30 â‰¤ Risk â‰¤ 70"| REVIEW
    DECISION -->|"Risk > 70"| BLOCK

    classDef layer1Style fill:#1a3a2a,stroke:#2ecc71,color:#fff
    classDef layer2Style fill:#2d1b69,stroke:#9b59b6,color:#fff
    classDef aggStyle fill:#3a1a0a,stroke:#e67e22,color:#fff
    classDef outputStyle fill:#1e3a5f,stroke:#4a9eff,color:#fff
```

### Heuristic Engine â€” Detection Rules

```mermaid
graph LR
    subgraph RULES["Heuristic Rules (classificationEngine.ts)"]
        R1["ðŸ”´ Unrealistic Dates\ne.g. graduation in future"]
        R2["ðŸ”´ Impossible Scores\ne.g. GPA > 4.0, %age > 100"]
        R3["ðŸ”´ Fake Institution Names\nKeyword blocklist match"]
        R4["ðŸŸ¡ Generic Template Text\n'This certifies that...'"]
        R5["ðŸŸ¡ Suspicious URL Patterns\nIP-based or free domain hosts"]
        R6["ðŸŸ¢ Known Good Patterns\nUniversity domain whitelist"]
    end

    CERT["Certificate\nInput"] --> R1 & R2 & R3 & R4 & R5 & R6
    R1 --> SCORE["Risk Score\nÎ£ weighted flags"]
    R2 --> SCORE
    R3 --> SCORE
    R4 --> SCORE
    R5 --> SCORE
    R6 --> SCORE
```

### Groq AI Integration

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GROQ as Groq API<br/>(Llama-3 70B)
    participant AGG as Risk Aggregator

    FE->>GROQ: POST /v1/chat/completions
    Note over FE,GROQ: Prompt: "Analyze this credential for authenticity.<br/>Certificate text: {certificateData}<br/>Return JSON: {riskScore, confidence, flags[]}"
    GROQ-->>FE: {riskScore: 23, confidence: 0.94, flags: []}
    FE->>AGG: Combine with Heuristic score
    AGG-->>FE: Final recommendation: PROCEED
```

---

<a name="blockchain-architecture"></a>
## â›“ï¸ Blockchain Architecture

### Smart Contract Ecosystem

```mermaid
graph TB
    subgraph CONTRACTS["Soroban Smart Contracts"]
        direction TB
        CERT["ðŸ“œ Certificate Contract\nCC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4"]
        INST["ðŸ›ï¸ Institution Registry Contract"]
        STAKE["ðŸ’° Stake Pool Contract"]
    end

    subgraph CERT_FUNCS["Certificate Contract Functions"]
        CF1["issue_certificate(env, hash, owner, type)"]
        CF2["verify_certificate(env, hash) â†’ bool"]
        CF3["get_owner(env, hash) â†’ String"]
        CF4["revoke_certificate(env, hash)"]
        CF5["issue_typed(env, hash, owner, type)"]
    end

    subgraph INST_FUNCS["Institution Registry Functions"]
        IF1["register_institution(id, name, country, wallet, website, type)"]
        IF2["approve_institution(id)"]
        IF3["reject_institution(id)"]
        IF4["suspend_institution(id)"]
        IF5["record_verification(id)"]
        IF6["get_trust_score(id) â†’ u32"]
    end

    subgraph STAKE_FUNCS["Stake Pool Functions"]
        SF1["lock_bond(cert_hash, staker, token)"]
        SF2["release_bond(cert_hash)"]
        SF3["challenge_bond(cert_hash, challenger)"]
        SF4["slash_bond(cert_hash)"]
        SF5["get_bond_status(cert_hash)"]
    end

    CERT --> CERT_FUNCS
    INST --> INST_FUNCS
    STAKE --> STAKE_FUNCS

    classDef contractStyle fill:#2a1a3a,stroke:#e84142,color:#fff,rx:8px
    classDef funcStyle fill:#1e1e2e,stroke:#555,color:#ccc,rx:4px
```

### Certificate Issuance Flow (On-Chain)

```mermaid
sequenceDiagram
    participant INST as ðŸ›ï¸ Institution
    participant FE as ðŸ–¥ï¸ Frontend
    participant WALLET as ðŸ’³ Freighter Wallet
    participant SOROBAN as â›“ï¸ Soroban Contract
    participant LEDGER as ðŸ“– Stellar Ledger

    INST->>FE: Upload certificate document
    FE->>FE: Compute SHA256 hash locally
    FE->>FE: Run AI fraud analysis
    FE->>WALLET: Request transaction signing
    WALLET->>INST: Prompt: "Sign issue_certificate tx?"
    INST->>WALLET: âœ… Approve
    WALLET->>SOROBAN: invoke issue_certificate(hash, owner, type)
    SOROBAN->>SOROBAN: institution.require_auth()
    SOROBAN->>SOROBAN: storage().instance().set(hash, owner)
    SOROBAN->>LEDGER: Persist state change
    SOROBAN->>SOROBAN: events().publish(("ISSUE", hash), owner)
    SOROBAN-->>FE: TransactionResult { success, txHash }
    FE-->>INST: âœ… Certificate issued â€” txHash: abc123...
```

### Verification Flow (On-Chain)

```mermaid
sequenceDiagram
    participant EMP as ðŸ‘” Employer / Verifier
    participant FE as ðŸ–¥ï¸ Frontend
    participant SOROBAN as â›“ï¸ Soroban Contract
    participant AI as ðŸ¤– AI Engine
    participant LEDGER as ðŸ“– Stellar Ledger

    EMP->>FE: Enter certificate hash
    FE->>SOROBAN: invoke verify_certificate(hash)
    SOROBAN->>LEDGER: storage().instance().get(hash)
    LEDGER-->>SOROBAN: owner: "Jane Doe"
    SOROBAN-->>FE: { verified: true, owner: "Jane Doe" }
    FE->>SOROBAN: invoke get_institution_trust_score(issuer)
    SOROBAN-->>FE: { trust_score: 87, status: Approved }
    FE->>AI: Compute display risk indicators
    AI-->>FE: { riskScore: 12, recommendation: "Genuine" }
    FE-->>EMP: âœ… VERIFIED â€” Jane Doe â€” MIT â€” Trust: 87/100
```

### Trust Score Calculation

```mermaid
graph LR
    subgraph INPUTS["Trust Score Inputs"]
        V["âœ… Verifications\nrecorded on-chain"]
        D["âŒ Disputes\nraised vs institution"]
        I["ðŸ“œ Certificates Issued\ntotal volume"]
        A["â±ï¸ Account Age\ndays since approval"]
    end

    subgraph FORMULA["Trust Formula"]
        F["trust_score = base(70)\n+ verify_bonus(verifications)\n- dispute_penalty(disputes * 15)\n+ longevity_bonus(age_days / 30)"]
    end

    subgraph OUTPUT["Output"]
        T["Trust Score: 0â€“100\nâ‰¥ 80: âœ… Highly Trusted\n50â€“79: ðŸŸ¡ Trusted\n< 50: ðŸ”´ Low Trust"]
    end

    INPUTS --> FORMULA --> OUTPUT
```

---

<a name="database-schema"></a>
## ðŸ—„ï¸ Database Schema

### Supabase PostgreSQL Schema â€” Entity Relationship

```mermaid
erDiagram
    credentials {
        TEXT id PK
        TEXT wallet_address FK
        TEXT title
        TEXT institution
        TEXT type
        DATE date
        TEXT cert_hash
        TEXT description
        TEXT[] skills
        TEXT category
        TEXT credential_type
        TEXT evidence_type
        TEXT upload_type
        TEXT source_platform
        BOOL is_public
        TEXT share_token
        FLOAT ai_risk_score
        TEXT ai_classification
        TEXT file_url
        TEXT tx_hash
        TIMESTAMP created_at
    }

    institutions {
        TEXT id PK
        TEXT wallet_address
        TEXT name
        TEXT country
        TEXT website
        TEXT type
        TEXT status
        INT trust_score
        BIGINT verifications
        BIGINT disputes
        TIMESTAMP created_at
    }

    credential_permissions {
        UUID id PK
        TEXT credential_id FK
        TEXT granted_to
        TEXT granted_by
        TEXT permission_type
        TIMESTAMP expires_at
        TIMESTAMP created_at
    }

    audit_logs {
        UUID id PK
        TEXT action
        TEXT wallet_address
        TEXT credential_id FK
        TEXT institution_id
        JSONB metadata
        TIMESTAMP created_at
    }

    email_deliveries {
        UUID id PK
        TEXT recipient
        TEXT type
        TEXT credential_id FK
        TEXT status
        TIMESTAMP sent_at
    }

    credentials ||--o{ credential_permissions : "has"
    credentials ||--o{ audit_logs : "tracked in"
    credentials ||--o{ email_deliveries : "delivered via"
    institutions ||--o{ audit_logs : "tracked in"
    credentials }o--|| institutions : "issued by"
```

### Data Flow â€” Supabase RLS Policies

```mermaid
graph TD
    subgraph RLS["Row Level Security Policies"]
        P1["ðŸ“– SELECT credentials\nWHERE wallet_address = auth.uid()\nOR is_public = true"]
        P2["âœï¸ INSERT credentials\nWHERE wallet_address = auth.uid()"]
        P3["ðŸ—‘ï¸ DELETE credentials\nWHERE wallet_address = auth.uid()"]
        P4["ðŸ“– SELECT institutions\nAll users can view approved institutions"]
        P5["âœï¸ INSERT institutions\nRequires wallet_address match"]
    end

    USER["ðŸ‘¤ Authenticated\nWallet User"] --> P1
    USER --> P2
    USER --> P3
    PUBLIC["ðŸŒ Public"] --> P4
    USER --> P5
```

---

## ðŸ› ï¸ Tech Stack

### Frontend
| Technology | Version | Purpose |
|:---|:---|:---|
| **Next.js** | 15.x | React Framework with App Router, API Routes |
| **TypeScript** | 5.x | Type-safe frontend development |
| **Tailwind CSS** | 3.x | Utility-first styling system |
| **Framer Motion** | 11.x | Fluid animations and micro-interactions |
| **Spline 3D** | Latest | Interactive 3D hero elements |

### Blockchain
| Technology | Version | Purpose |
|:---|:---|:---|
| **Rust** | 1.75+ | Soroban smart contract language |
| **Soroban SDK** | 25.x | Stellar smart contract framework |
| **Stellar SDK (JS)** | Latest | Frontend blockchain interactions |
| **Freighter API** | Latest | Browser wallet integration |

### Backend & Database
| Technology | Version | Purpose |
|:---|:---|:---|
| **Supabase** | Latest | PostgreSQL + Auth + Storage + RLS |
| **Resend** | Latest | Transactional email delivery |
| **Groq API** | Latest | LLM inference (Llama-3 70B) |

### DevOps
| Technology | Purpose |
|:---|:---|
| **GitHub Actions** | CI/CD â€” auto `cargo test` on every push |
| **Vercel** | Frontend deployment with preview URLs |
| **Stellar CLI** | Contract build, deploy, invoke |

### ðŸ’³ Supported Wallets
- **Freighter Wallet** â­ (Recommended â€” full feature support)
- **Albedo** (Web-based signing)
- **xBull Wallet**
- **LOBSTR** (Manual signature flow)

---

<a name="vision"></a>
## ðŸŽ¯ Vision & Use Cases

### Vision

> *"A world where every credential â€” from a school certificate to a medical license â€” can be verified in under 2 seconds, by anyone, anywhere, for free."*

CertifyVal's mission is to become the **global trust layer for human credentials** â€” the way SSL/TLS became the trust layer for internet data. We aim to make credential fraud as technically impossible as forging a cryptographic signature.

### Use Cases by Sector

```mermaid
mindmap
  root(("ðŸ›¡ï¸ CertifyVal\nUse Cases"))
    Education
      University Degrees
      Online Course Certificates
      Professional Certifications
      Language Proficiency Tests
    Healthcare
      Medical Licenses
      Nursing Credentials
      Specialist Certifications
      Drug Trial Participation
    Finance
      CPA / CFA Certifications
      AML Compliance Training
      Trading Licenses
      Advisor Credentials
    Government
      Professional Licenses
      Immigration Documents
      Security Clearances
      Municipal Permits
    Corporate
      Employee Background Checks
      Vendor Compliance Verification
      Training Completion Records
      ISO Certifications
    Web3
      DAO Governance Credentials
      Hackathon Winner Proofs
      Developer Skill NFTs
      On-chain CVs
```

### Market Opportunity

| Market Segment | TAM | CertifyVal's Entry Point |
|:---|:---|:---|
| Credential Verification Software | $1.8B | B2B Institution subscriptions |
| Background Screening | $4.2B | Employer API access |
| EdTech Platform Integrations | $12B | University partnerships |
| Blockchain Identity | $3.7B | Web3 DID standard |
| **Total Addressable Market** | **$21.7B** | **Unified trust protocol** |

---

<a name="architecture-pipeline"></a>
## ðŸ”„ Complete Platform Pipeline

```mermaid
graph TB
    subgraph INGESTION["ðŸ“¥ Data Ingestion"]
        DOC["Certificate Document\n(PDF / Image / URL)"]
        TEXT["Extracted Text\n(OCR / manual entry)"]
        META["Metadata\n(Issuer, date, type)"]
    end

    subgraph HEURISTIC["âš¡ Layer 1 Heuristic Processing"]
        PAT["Pattern Matcher\n(classificationEngine.ts)"]
        FRAUD["Fraud Rule Engine\n(fraudEngine.ts)"]
        HEUR_OUT["Heuristic Score\n+ Flag List"]
    end

    subgraph LLM["ðŸ§  Layer 2 LLM Processing"]
        GROQ_REQ["Groq API Request\n(groqService.ts)"]
        LLM_PARSE["LLM Response Parser\n(heuristicEngine.ts)"]
        LLM_OUT["AI Score\n+ Reasoning"]
    end

    subgraph AGGREGATION["ðŸ“Š Score Aggregation"]
        COMBINE["Weighted Combination\n(40% + 60%)"]
        THRESHOLD["Threshold Classifier"]
        DECISION["PROCEED / REVIEW / BLOCK"]
    end

    subgraph BLOCKCHAIN_PIPE["â›“ï¸ Blockchain Pipeline"]
        HASH["SHA256(document)\nLocal computation"]
        SIGN["Wallet Signature\nFreighter SDK"]
        TX["Soroban TX Construction\nStellar SDK"]
        SUBMIT["Submit to Horizon RPC"]
        CONFIRM["Transaction Confirmed\n+ Event emitted"]
    end

    subgraph NOTIFICATION["ðŸ“§ Notification Pipeline"]
        OTP["OTP Generation\n/api/email/otp"]
        CRED_EMAIL["Credential Email\n/api/email/credential"]
        RESEND_OUT["Resend API\nEmail Delivery"]
    end

    subgraph STORAGE["ðŸ’¾ Storage Pipeline"]
        SUPABASE_DB["Supabase PostgreSQL\nCredential records"]
        SUPABASE_STORAGE["Supabase Storage\nDocument files"]
        LOCAL_CACHE["React State\nClient-side cache"]
    end

    DOC --> TEXT --> PAT & GROQ_REQ
    META --> PAT
    PAT --> FRAUD --> HEUR_OUT
    GROQ_REQ --> LLM_PARSE --> LLM_OUT
    HEUR_OUT & LLM_OUT --> COMBINE --> THRESHOLD --> DECISION
    DECISION -->|"âœ… PROCEED"| HASH
    HASH --> SIGN --> TX --> SUBMIT --> CONFIRM
    CONFIRM --> OTP --> CRED_EMAIL --> RESEND_OUT
    CONFIRM --> SUPABASE_DB
    DOC --> SUPABASE_STORAGE
    CONFIRM --> LOCAL_CACHE
```

---

<a name="contract"></a>
## ðŸ”— Mission Credentials

| Category | Identifier / Link |
|:---|:---|
| **Issuer Account ID** | `GA5B7EJJ3SRB2VKWTCKTVWUV6R2UTLUJGRUXWSAAXI3BE4B5PUZZ4YCF` |
| **Transaction Method** | `manageData` (Data Anchoring) |
| **Stellar Explorer** | [View On-Chain Activity](https://stellar.expert/explorer/testnet/account/GA5B7EJJ3SRB2VKWTCKTVWUV6R2UTLUJGRUXWSAAXI3BE4B5PUZZ4YCF) |
| **CI/CD Pipeline** | ![CI/CD Status](https://img.shields.io/github/actions/workflow/status/sohansarkar07/Digital-certificate-validator-full-project/rust-test.yml?branch=main&label=Build%20Status&style=flat-square) |

> [!NOTE]
> This project focuses on **Decentralized Identity and Credentialing**. It anchors data directly to the Stellar ledger using Soroban's native storage â€” no custom token or liquidity pool required.

### ðŸ“¸ Smart Contract Dashboard

<img width="100%" alt="Smart Contract Dashboard screenshot" src="https://github.com/user-attachments/assets/369d60dd-2250-49b9-8a8c-7b2361dc8e9c" />

### Proof of Live Transaction

| Field | Value |
|:---|:---|
| **Issuer Account** | `GA5B7EJJ3SRB2VKWTCKTVWUV6R2UTLUJGRUXWSAAXI3BE4B5PUZZ4YCF` |
| **Operation Type** | `manageData` |
| **Data Key (Cert Hash)** | `CERT_a7ac025645017ad40977d16f63f092ecb0a203a879fdac091a8c175c968` |
| **Data Value** | `Sohan Sarkar Certified Arbitrum Builder` |
| **Status** | âœ… Success |
| **Network** | Stellar Testnet |
| **Fee Charged** | `0.00001 XLM` |
| **Date** | `2026-07-23` |

ðŸ”— [View on Stellar Expert](https://stellar.expert/explorer/testnet/account/GA5B7EJJ3SRB2VKWTCKTVWUV6R2UTLUJGRUXWSAAXI3BE4B5PUZZ4YCF)

### ðŸ“¸ Transaction Proof Screenshot

<img width="100%" alt="Stellar Expert Transaction Proof" src="assets/tx-proof.png" />

---

## ðŸ§ª CI/CD Pipeline

```mermaid
graph TD
    PUSH["git push origin main"]

    subgraph GITHUB_ACTIONS["GitHub Actions: rust-test.yml"]
        TRIGGER["Workflow Triggered"]
        RUST_SETUP["Setup Rust Stable Toolchain"]
        WASM["rustup target add wasm32-unknown-unknown"]
        CACHE["Cache ~/.cargo/registry\n(dependency caching)"]
        WORKSPACE["cd contract/"]
        TEST["cargo test --workspace"]
        RESULT{All Tests Pass?}
        SUCCESS["âœ… Build Green\nDeploy to Vercel"]
        FAIL["âŒ Build Red\nNotify Developer"]
    end

    subgraph TEST_SUITES["Test Suites (9 total)"]
        T1["contract: 6 tests\nâœ… verify_valid_certificate\nâœ… verify_non_existent\nâœ… issue_and_get_owner\nâœ… admin_rbac\nâœ… certificate_count_increments\nâœ… revoke_certificate"]
        T2["institution_registry: 2 tests\nâœ… register_and_approve\nâœ… trust_score_calculation"]
        T3["stake_pool: 1 test\nâœ… bond_amount_is_one_xlm"]
    end

    PUSH --> TRIGGER
    TRIGGER --> RUST_SETUP --> WASM --> CACHE --> WORKSPACE --> TEST
    TEST --> T1 & T2 & T3
    T1 & T2 & T3 --> RESULT
    RESULT -->|Yes| SUCCESS
    RESULT -->|No| FAIL
```

---

<a name="product-iteration"></a>
## ðŸ”„ Product Iteration (Based on Real User Feedback)

We actively listen to our users and rapidly iterate to improve the platform. Here are some of the recent enhancements directly resulting from real user feedback sessions:

| Component | Status | Improvement | Commit |
|:---|:---:|:---|:---:|
| ðŸ“Š **Analytics Dashboard** | âœ… Done | Fixed a visual bug in the **graph bar analytics** where missing tracking events and division by zero prevented total verifications from counting. | [72986a1](https://github.com/sohansarkar07/Digital-certificate-validator-full-project/commit/72986a1) |
| ðŸ—£ï¸ **Feedback Section** | âœ… Done | Upgraded the feedback form to **automatically fetch and pre-fill** the user's name and role from their decentralized profile, eliminating manual typing. | [4042513](https://github.com/sohansarkar07/Digital-certificate-validator-full-project/commit/4042513) |
| ðŸ‘¤ **Profile Section** | âœ… Done | Enhanced the Wallet Profile slide-out to now fetch and prominently display the user's **custom display name and email address**, instead of just their wallet type. | [750f075](https://github.com/sohansarkar07/Digital-certificate-validator-full-project/commit/750f075) |
| ðŸŽ¨ **UI Overlap Bug** | âœ… Done | Corrected an **overlapping text layout issue** in the Live Blockchain Activity feed where excessively long event types (like `CREDENTIALVERIFICATIONFAILED`) would spill over into transaction hashes. | [e313712](https://github.com/sohansarkar07/Digital-certificate-validator-full-project/commit/e313712) |
| ðŸ“œ **Public Verify Page â€” Scroll** | âœ… Done | Fixed the entire public verification page being **frozen and unscrollable** by mouse wheel. Root cause: global `overflow-hidden` on the body blocked scroll. The verify page now has its own dedicated scroll container. | [7846b8d](https://github.com/sohansarkar07/Digital-certificate-validator-full-project/commit/7846b8d) |
| ðŸ” **Certificate Zoom & Scroll** | âœ… Done | Added a **"Scroll & Zoom"** toggle button on the public certificate viewer, allowing users to expand the certificate document to full resolution and scroll through it, then snap back to "Fit to Screen". | [c95d445](https://github.com/sohansarkar07/Digital-certificate-validator-full-project/commit/c95d445) |
| ðŸ—ºï¸ **Routing & Navigation** | âœ… Done | Improved the entire routing structure: tabs now **sync with the URL** (`?tab=verify`), enabling browser back/forward navigation, bookmarkable deep links, and page-refresh state restoration. Added **breadcrumbs**, grouped sidebar sections (**Main / Platform / Administration**), full top nav, functional Settings â†’ Docs and Support â†’ Feedback buttons, and dynamic browser tab titles. | [fc94507](https://github.com/sohansarkar07/Digital-certificate-validator-full-project/commit/fc94507) |

---

<a name="roadmap"></a>
## ðŸš§ Roadmap & Future Plans

### Development Timeline

```mermaid
gantt
    title CertifyVal Development Roadmap
    dateFormat  YYYY-MM
    section Phase 1 â€” Foundation
    Smart Contracts (Soroban)       :done,   p1a, 2026-01, 2026-03
    Frontend (Next.js 15)           :done,   p1b, 2026-02, 2026-04
    AI Fraud Engine (Groq)          :done,   p1c, 2026-04, 2026-06
    Supabase Integration            :done,   p1d, 2026-05, 2026-06

    section Phase 2 â€” Level 5 Blue Belt
    Credential Passport             :done,   p2a, 2026-06, 2026-07
    Email Notifications (Resend)    :done,   p2b, 2026-06, 2026-07
    Employer Dashboard              :done,   p2c, 2026-07, 2026-07
    User Onboarding Flow            :done,   p2d, 2026-07, 2026-07

    section Phase 3 â€” Q3 2026
    IPFS Document Storage           :active, p3a, 2026-08, 2026-09
    QR Code Verification            :done,   p3b, 2026-08, 2026-09
    Mobile PWA                      :        p3c, 2026-09, 2026-10
    Batch Issuance (100+ certs)     :        p3d, 2026-09, 2026-10

    section Phase 4 â€” Q4 2026+
    Multi-chain (Ethereum EIP-712)  :        p4a, 2026-11, 2027-01
    DID W3C Standard Compliance     :        p4b, 2026-11, 2027-02
    Institutional DAO Governance    :        p4c, 2027-01, 2027-03
    React Native Mobile App         :        p4d, 2027-02, 2027-06
```

### Phase 3 â€” Immediate Next Features

| Priority | Feature | ETA |
|:---:|:---|:---|
| ðŸ”´ | IPFS integration for document storage (Pinata/web3.storage) | Q3 2026 |
| âœ… | QR Code generation for every certificate with scan-to-verify | Q3 2026 |
| ðŸŸ¡ | Certificate expiry dates on-chain | Q3 2026 |
| ðŸŸ¡ | Mobile PWA (installable, offline-capable) | Q3 2026 |
| ðŸŸ¢ | Batch issuance â€” 100+ certificates in one transaction | Q4 2026 |
| ðŸŸ¢ | REST API for institutions to integrate programmatically | Q4 2026 |

### Phase 4 â€” Platform Maturity

- **Multi-chain**: Extend to Ethereum (EIP-712 signed credentials) alongside Stellar
- **W3C DID Standard**: Align with global Decentralized Identity specification
- **Decentralized Dispute Resolution**: On-chain voting for fraudulent credential disputes
- **Institutional DAO**: Governance token for registered institutions to vote on upgrades
- **ISO 21001 Compliance**: International education management standards alignment
- **React Native App**: Native iOS & Android apps

---

## ðŸ“ Project Structure

```text
Digital-certificate-validator-full-project/
â”‚
â”œâ”€â”€ ðŸ“„ README.md                          # This document
â”œâ”€â”€ ðŸ“„ README_v2_updated.md               # Legacy README reference
â”‚
â”œâ”€â”€ ðŸ¦€ contract/                          # Soroban Smart Contracts (Rust)
â”‚   â”œâ”€â”€ Cargo.toml                        # Workspace config (soroban-sdk = "25")
â”‚   â””â”€â”€ contracts/
â”‚       â”œâ”€â”€ contract/                     # Core Certificate Contract
â”‚       â”‚   â”œâ”€â”€ Cargo.toml
â”‚       â”‚   â””â”€â”€ src/
â”‚       â”‚       â””â”€â”€ lib.rs               # issue, verify, get_owner, revoke
â”‚       â”œâ”€â”€ institution_registry/         # Institution Registry Contract
â”‚       â”‚   â”œâ”€â”€ Cargo.toml
â”‚       â”‚   â””â”€â”€ src/
â”‚       â”‚       â””â”€â”€ lib.rs               # register, approve, suspend, trust_score
â”‚       â””â”€â”€ stake_pool/                   # Bond & Stake Contract
â”‚           â”œâ”€â”€ Cargo.toml
â”‚           â””â”€â”€ src/
â”‚               â””â”€â”€ lib.rs               # lock_bond, release, challenge, slash
â”‚
â”œâ”€â”€ ðŸŒ frontend/                          # Next.js 15 Frontend
â”‚   â”œâ”€â”€ next.config.ts                    # Next.js configuration
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ tailwind.config.ts
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx                 # Main landing + app shell
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx               # Root layout with metadata
â”‚   â”‚   â”‚   â”œâ”€â”€ globals.css              # Global styles + CSS vars
â”‚   â”‚   â”‚   â”œâ”€â”€ error.tsx                # Error boundary
â”‚   â”‚   â”‚   â”œâ”€â”€ not-found.tsx            # 404 page
â”‚   â”‚   â”‚   â”œâ”€â”€ icon.jpg                 # App favicon
â”‚   â”‚   â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ email/
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ otp/route.ts     # OTP email endpoint
â”‚   â”‚   â”‚   â”‚       â””â”€â”€ credential/route.ts # Credential delivery endpoint
â”‚   â”‚   â”‚   â””â”€â”€ verify/[id]/             # Public credential verification
â”‚   â”‚   â”‚       â”œâ”€â”€ page.tsx
â”‚   â”‚   â”‚       â””â”€â”€ PublicVerifyClient.tsx
â”‚   â”‚   â”œâ”€â”€ components/                  # React Components
â”‚   â”‚   â”‚   â”œâ”€â”€ LandingPage.tsx          # Hero + features landing
â”‚   â”‚   â”‚   â”œâ”€â”€ BlockchainVerifier.tsx   # Core verification UI
â”‚   â”‚   â”‚   â”œâ”€â”€ InstitutionDashboard.tsx # Institution issuance portal
â”‚   â”‚   â”‚   â”œâ”€â”€ CredentialPassport.tsx   # Student credential wallet
â”‚   â”‚   â”‚   â”œâ”€â”€ CredentialUploadWizard.tsx # Multi-step upload flow
â”‚   â”‚   â”‚   â”œâ”€â”€ EmployerDashboard.tsx    # Employer bulk verification
â”‚   â”‚   â”‚   â”œâ”€â”€ AdminPanel.tsx           # Platform admin controls
â”‚   â”‚   â”‚   â”œâ”€â”€ AIInsightsPanel.tsx      # AI fraud results display
â”‚   â”‚   â”‚   â”œâ”€â”€ BlockchainActivity.tsx   # Live on-chain activity feed
â”‚   â”‚   â”‚   â”œâ”€â”€ WalletProfile.tsx        # Wallet info + stats
â”‚   â”‚   â”‚   â”œâ”€â”€ Documentation.tsx        # In-app docs
â”‚   â”‚   â”‚   â”œâ”€â”€ NotificationCenter.tsx   # Real-time alerts
â”‚   â”‚   â”‚   â”œâ”€â”€ ThemeToggle.tsx          # Dark/Light mode switch
â”‚   â”‚   â”‚   â”œâ”€â”€ Onboarding.tsx           # Role selection wizard
â”‚   â”‚   â”‚   â”œâ”€â”€ FeedbackPanel.tsx        # User feedback collection
â”‚   â”‚   â”‚   â”œâ”€â”€ InstitutionRegistry.tsx  # Browse institutions
â”‚   â”‚   â”‚   â”œâ”€â”€ PendingClaims.tsx        # Pending verification queue
â”‚   â”‚   â”‚   â”œâ”€â”€ Analytics.tsx            # Dashboard analytics
â”‚   â”‚   â”‚   â””â”€â”€ QRCodeDisplay.tsx        # QR code generator
â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”‚   â”œâ”€â”€ useAuth.tsx              # Wallet auth + session
â”‚   â”‚   â”‚   â””â”€â”€ useStellar.tsx           # Stellar blockchain hook
â”‚   â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”‚   â”œâ”€â”€ supabase.ts              # Supabase client
â”‚   â”‚   â”‚   â”œâ”€â”€ db.ts                    # Database helpers
â”‚   â”‚   â”‚   â”œâ”€â”€ types.ts                 # Shared TypeScript types
â”‚   â”‚   â”‚   â””â”€â”€ credentialPermissions.ts # Permission system
â”‚   â”‚   â””â”€â”€ services/
â”‚   â”‚       â”œâ”€â”€ blockchain.ts            # Stellar transaction service
â”‚   â”‚       â”œâ”€â”€ contract.ts              # Certificate contract client
â”‚   â”‚       â”œâ”€â”€ institutionContract.ts   # Institution contract client
â”‚   â”‚       â”œâ”€â”€ stakeContract.ts         # Stake pool client
â”‚   â”‚       â”œâ”€â”€ notificationService.ts   # Push notification service
â”‚   â”‚       â”œâ”€â”€ emailService.ts          # Email service wrapper
â”‚   â”‚       â””â”€â”€ ai/
â”‚   â”‚           â”œâ”€â”€ groqService.ts       # Groq LLM API integration
â”‚   â”‚           â”œâ”€â”€ heuristicEngine.ts   # Rule-based fraud detection
â”‚   â”‚           â”œâ”€â”€ fraudEngine.ts       # Combined fraud orchestrator
â”‚   â”‚           â””â”€â”€ classificationEngine.ts # Document classifier
â”‚   â””â”€â”€ supabase/
â”‚       â”œâ”€â”€ schema.sql                   # Full database schema
â”‚       â””â”€â”€ migration_v3_credential_delivery.sql
â”‚
â”œâ”€â”€ ðŸ¤– .github/
â”‚   â””â”€â”€ workflows/
â”‚       â””â”€â”€ rust-test.yml               # CI/CD pipeline
â”‚
â”œâ”€â”€ ðŸ–¼ï¸ assets/                           # Documentation screenshots
â”‚   â”œâ”€â”€ issuance-portal.png
â”‚   â”œâ”€â”€ verify-portal.png
â”‚   â”œâ”€â”€ mobile-view.png
â”‚   â””â”€â”€ tx-proof.png
â”‚
â””â”€â”€ ðŸ“‹ demo_credential_01.txt            # Sample credential for testing
```

---

<a name="setup"></a>
## âš™ï¸ Quick Start

### Prerequisites

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Add WASM target
rustup target add wasm32-unknown-unknown

# 3. Install Stellar CLI
cargo install --locked stellar-cli --features opt
```

### Smart Contract Setup

```bash
# Clone the repository
git clone https://github.com/sohansarkar07/Digital-certificate-validator-full-project.git
cd Digital-certificate-validator-full-project/contract

# Run all tests (9 tests across 3 contracts)
cargo test

# Build contracts
stellar contract build

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contract.wasm \
  --source <YOUR_ACCOUNT> \
  --network testnet
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GROQ_API_KEY, RESEND_API_KEY

# Run development server
npm run dev
# â†’ Open http://localhost:3000
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI
GROQ_API_KEY=gsk_your_groq_api_key

# Email
RESEND_API_KEY=re_your_resend_key

# Blockchain (optional â€” defaults to testnet)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=CC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4
```

---

## ðŸ“‹ Level 5 Blue Belt â€” User Onboarding & Feedback

### Google Form â€” User Feedback Collection

We collect user details including **wallet address, email, name, and product feedback (rating)** via Google Form:

ðŸ”— **[CertifyVal User Feedback Form](https://docs.google.com/forms/d/e/1FAIpQLSeTacaTE5WdiziG8oA6qHFntoSKmnlPN_es5Chn5q7jiOEwbQ/viewform?usp=publish-editor)**

Fields collected:
- Full Name
- Email Address
- Stellar Wallet Address
- Product Rating (1â€“5 stars)
- Feedback / Feature Requests

### ðŸ“Š Exported User Responses

ðŸ“Ž **[Download User Responses (Excel)](https://docs.google.com/spreadsheets/d/1KkirRluFDUFCoo5sLA4LoxLYy0ZxEHPbe_fjbee3U7w/edit?usp=sharing)**

### ðŸ“½ï¸ PPT Presentation

ðŸ“Ž **[View Project Presentation (Google Drive)](https://drive.google.com/file/d/13R5k0awT4VD1-IW8M5MIOfXvL9BKrIWX/view?usp=drivesdk)**

---

## ðŸ‘¨â€ðŸ’» Author

**Sohan Sarkar**
- Blockchain Developer | Soroban Specialist | Full-Stack Engineer
- [GitHub Profile](https://github.com/sohansarkar07)
- [Repository](https://github.com/sohansarkar07/Digital-certificate-validator-full-project)

---

## ðŸ“œ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

> **Last Updated:** July 2026 â€” Level 5 Blue Belt Submission for RiseIn.
>
> Built with â¤ï¸ on Stellar Soroban â€” *The blockchain built for the real world.*

</div>

