# 🌟 Digital Certificate Validator (Soroban Smart Contract)

## 📌 Project Description
Digital Certificate Validator is a blockchain-based system built on Stellar Soroban that enables secure issuance and verification of digital certificates using cryptographic hashes.

---


## 🚀 What it does
- Issues certificates by storing their hash on-chain
- Verifies authenticity of certificates
- Retrieves certificate owner details

---

## 🏗️ System Architecture

### 🔹 High-Level Architecture

User / Institution
        │
        ▼
Frontend (React / Web App)
        │
        ▼
Backend (Optional API Layer)
        │
        ▼
Soroban Smart Contract (Stellar Blockchain)
        │
        ▼
On-chain Storage (Hash → Owner Mapping)

---

### 🔹 Architecture Flow (Step-by-Step)

1. Certificate Creation
   - Institution generates a certificate (PDF/image)

2. Hash Generation
   - Certificate → SHA256 Hash

3. Issue Certificate
   - Frontend calls smart contract:
     issue_certificate(cert_hash, owner)

4. Blockchain Storage
   - Smart contract stores:
     cert_hash → owner

5. Verification
   - User enters certificate hash

6. Smart Contract Call
   - verify_certificate(cert_hash)

7. Result
   - TRUE → Valid certificate
   - FALSE → Invalid certificate

8. Owner Retrieval
   - get_owner(cert_hash)

---

### 🔹 Data Flow Diagram

[ Institution ]
      │
      ▼
[ Generate Certificate ]
      │
      ▼
[ Hash (SHA256) ]
      │
      ▼
[ Soroban Contract ]
      │
      ▼
[ Blockchain Storage ]

Verification Flow:

[ User ]
   │
   ▼
[ Enter Hash ]
   │
   ▼
[ Smart Contract ]
   │
   ▼
[ Valid / Invalid ]

---

## 📦 Smart Contract Functions

### issue_certificate(cert_hash, owner)
Stores certificate hash with owner name.

### verify_certificate(cert_hash)
Returns true if certificate exists.

### get_owner(cert_hash)
Returns owner of certificate.

---

## 🛠️ Tech Stack
- Stellar Soroban
- Rust
- Stellar CLI
- (Optional) React + Wallet Integration

---

## 🔗 Deployed Contract[
https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID
](https://stellar.expert/explorer/testnet/contract/CC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4)
---

## 🧪 Usage

1. Generate SHA256 hash of certificate
2. Call issue_certificate
3. Share hash
4. Verify using verify_certificate
5. Fetch owner using get_owner

---

## 🎯 Use Cases
- University certificates
- Online courses
- Government documents
- Employee verification

---

## ⚠️ Limitations
- No access control
- No certificate revocation
- Only hash stored

---

## 🚧 Future Improvements
- Role-based access
- Expiry system
- IPFS integration
- QR verification

---

## 👨‍💻 Author
Sohan Sarkar
