# 🛡️ Digital Certificate Validator (Blockchain Based Certificate Dapp)

The **Digital Certificate Validator** is a high-performance, blockchain-based application deployed on the **Stellar Blockchain**, leveraging the security and transparency of decentralized technology. This application facilitates the efficient issuance and verification of digital certificates through a robust and tamper-proof system. The smart contract is written in **Rust**, utilizing **Soroban-SDK** for seamless integration with the Stellar network.

Institutions can securely issue certificates by storing their cryptographic hashes on-chain, while users/verifiers can check the authenticity of a certificate in real-time, ensuring a controlled and trustworthy verification solution.

---

## 🧐 How this dApp got its name?
#### Certificate + Validator => CertifyVal

---

## 🚀 System Architecture

![System Architecture](architecture.png)

The architecture follows a clean decentralized flow:
1. **Institution**: Generates the certificate (PDF/Image) and computes its **SHA256 hash**.
2. **Smart Contract**: The institution calls `issue_certificate` to store the hash and owner's name on the Stellar ledger.
3. **Stellar Blockchain**: Acts as the immutable source of truth for all certificate hashes.
4. **Verifier**: A user or third-party enters the certificate hash; the contract verifies its existence and returns the owner details.

---

## 🛠️ Tech Stack & Tools

- **[Rust](https://doc.rust-lang.org/book/)**: Core programming language for the smart contract.
- **[Soroban-SDK](https://developers.stellar.org/docs/tools/sdks/library)**: Framework for Stellar smart contracts.
- **[Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/stellar-cli)**: For building, deploying, and invoking contracts.
- **[Stellar Explorer](https://stellar.expert/explorer/testnet/contract/CC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4)**: To track transactions and contract state.
- **SHA256 Hashing**: For secure, one-way certificate fingerprinting.

---

## 🔗 Deployed Contract
**Address**: `CC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4`
- [View on Stellar.Expert Explorer](https://stellar.expert/explorer/testnet/contract/CC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4)

---

## 🎯 Vision & Use Cases

### Vision
Our vision is to eliminate certificate fraud and streamline the verification process across industries. By leveraging Stellar's low-cost and high-speed network, we aim to provide a globally accessible standard for digital credentials.

### Key Use Cases
- **University Certificates**: Ensuring academic credentials cannot be forged.
- **Online Courses**: Providing verifiable proof of completion for digital learning platforms.
- **Government Documents**: Secure verification for high-stake IDs and permits.
- **Employee Verification**: Streamlining the background check process for employers.

---

## 🏗️ Software Development Plan

### 1. Smart Contract Functions
The contract includes key functions to manage the lifecycle of a certificate:

- **`issue_certificate(env: Env, cert_hash: String, owner: String)`**: 
  - Allows an institution to register a certificate hash.
  - Links the hash to the owner's name.
  - Persistence: Stores data in the contract's instance storage.

- **`verify_certificate(env: Env, cert_hash: String) -> bool`**: 
  - Checks if a certificate hash exists on the blockchain.
  - Returns `true` if valid, `false` otherwise.

- **`get_owner(env: Env, cert_hash: String) -> String`**: 
  - Retrieves the name of the owner for a given certificate hash.

### 2. Data Structure
- **`Map<String, String>`**: Used to map `cert_hash` to `owner_name`. This ensures efficient lookup and storage management within the Soroban environment.

---

## 🔐 Access Control & Security

- **Hashing**: Certificates themselves are never stored on-chain, preserving privacy. Only the SHA256 hash (fingerprint) is stored.
- **Immutable Ledger**: Once a certificate hash is issued, it cannot be tampered with or retroactively changed.
- **Current Limitation**: Open access for demonstration.
- **Future Roadmap**: Implementation of **Role-Based Access Control (RBAC)** to ensure only authorized institution addresses can call the `issue_certificate` function.

---

## 🚧 Road Map & Future Plans

- [ ] **IPFS Integration**: Store the actual certificate files on IPFS and save the CID on-chain.
- [ ] **QR Code Verification**: Generate QR codes for certificates that link directly to the verification page.
- [ ] **Expiry System**: Allow certificates to have a "valid until" date.
- [ ] **Revocation Mechanism**: Enable institutions to revoke certificates if necessary.

---

## ⚙️ Environment Setup & Installation

### A) Prerequisites
1. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Install Soroban CLI**:
   ```bash
   cargo install --locked soroban-cli
   ```
3. **Add WASM Target**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### B) Backend (Smart Contract) Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/sohansarkar07/Digital-Certificate-Validator.git
   cd Digital-Certificate-Validator
   ```
2. **Build the contract**:
   ```bash
   soroban contract build
   ```
3. **Optimize (Optional but Recommended)**:
   ```bash
   soroban contract optimize --wasm target/wasm32-unknown-unknown/release/contract.wasm
   ```

### C) Deployment & Invocation
1. **Deploy to Testnet**:
   ```bash
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/contract.wasm \
     --source <YOUR_ACCOUNT_NAME> \
     --network testnet
   ```
2. **Invoke Issue Function**:
   ```bash
   soroban contract invoke \
     --id <CONTRACT_ID> \
     --source <SOURCE_ACCOUNT> \
     --network testnet \
     -- issue_certificate --cert_hash "sha256_hash_here" --owner "John Doe"
   ```

---

## 👨‍💻 Author
**Sohan Sarkar**
- Blockchain Enthusiast | Soroban Developer
- [GitHub Profile](https://github.com/sohansarkar07)
