# 📜 Soroban Smart Contract (CertifyVal)

This directory contains the core smart contract for the **Digital Certificate Validator** dapp. It is built using the Soroban SDK for high-security and low-cost execution on the Stellar network.

## 🏗️ Contract Structure

```text
.
├── contracts
│   └── contract
│       ├── src
│       │   ├── lib.rs (Main logic)
│       │   └── test.rs (Unit tests)
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

## 🛡️ Key Features

- **Hash-based Verification**: Only the SHA256 cryptographic hash of the certificate is stored on-chain, ensuring data privacy.
- **Efficient Map Storage**: Uses Soroban's `instance()` storage to maintain a mapping of hashes to owner names.
- **Gas Optimized**: Minimal compute and storage footprint for low-cost transactions.

## 📦 Smart Contract Functions (`lib.rs`)

- **`issue_certificate(cert_hash, owner)`**: 
  - Submits a certificate hash to the blockchain.
  - Linked to the owner's identity.
- **`verify_certificate(cert_hash)`**: 
  - Publicly accessible function to check validity.
- **`get_owner(cert_hash)`**: 
  - Retrieves certificate holder name from storage.

## 🧪 Testing

To run tests on the local machine:
```bash
cargo test
```

## 🛠️ Build & Optimization流程

1. **Build the WASM binary**:
   ```bash
   soroban contract build
   ```
2. **Optimize the contract**:
   ```bash
   soroban contract optimize --wasm target/wasm32-unknown-unknown/release/contract.wasm
   ```
