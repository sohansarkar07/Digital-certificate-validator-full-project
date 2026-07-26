// Digital Certificate Validator — Soroban smart contract on Stellar
// Extended: Typed credential issuance, metadata storage, multi-admin support
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Env, String, Map, Address, Vec
};

// ── Credential Category ────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum CredentialCategory {
    Academic,
    Employment,
    Professional,
    Personal,
}

// ── Credential Record (stored on-chain) ───────────────────────────────────────
#[contracttype]
#[derive(Clone)]
pub struct CredentialRecord {
    pub owner: String,
    pub category: CredentialCategory,
    pub credential_type: String,   // e.g. "degree", "internship_certificate"
    pub institution: String,
    pub issued_at: u64,            // Unix timestamp
    pub ai_risk_score: u32,        // 0-100 from off-chain AI, stored for audit
    pub revoked: bool,
}

#[contract]
pub struct CertificateValidator;

#[contractimpl]
impl CertificateValidator {

    // ── Core Certificate Functions ─────────────────────────────────────────────

    /// Issue a simple certificate (hash → owner name) — legacy compatibility
    pub fn issue_certificate(env: Env, cert_hash: String, owner: String) {
        let mut certs: Map<String, String> = env
            .storage()
            .instance()
            .get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));

        certs.set(cert_hash.clone(), owner.clone());
        env.storage().instance().set(&symbol_short!("CERTS"), &certs);

        let count: u64 = env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0u64);
        env.storage().instance().set(&symbol_short!("COUNT"), &(count + 1));

        env.events().publish((symbol_short!("ISSUE"), cert_hash), owner);
    }

    /// Issue a typed credential with full metadata (new — preferred)
    pub fn issue_typed_credential(
        env: Env,
        cert_hash: String,
        owner: String,
        category: CredentialCategory,
        credential_type: String,
        institution: String,
        ai_risk_score: u32,
    ) {
        // Require auth from the issuer
        let issuer_admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(admin) = issuer_admin {
            admin.require_auth();
        }

        // Build record
        let record = CredentialRecord {
            owner: owner.clone(),
            category: category.clone(),
            credential_type: credential_type.clone(),
            institution: institution.clone(),
            issued_at: env.ledger().timestamp(),
            ai_risk_score,
            revoked: false,
        };

        // Store typed record
        let mut typed_certs: Map<String, CredentialRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));
        typed_certs.set(cert_hash.clone(), record);
        env.storage().instance().set(&symbol_short!("TYPED"), &typed_certs);

        // Also store in legacy map for backwards compatibility
        let mut certs: Map<String, String> = env
            .storage()
            .instance()
            .get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));
        certs.set(cert_hash.clone(), owner.clone());
        env.storage().instance().set(&symbol_short!("CERTS"), &certs);

        // Increment counter
        let count: u64 = env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0u64);
        env.storage().instance().set(&symbol_short!("COUNT"), &(count + 1));

        // Emit rich event for indexing
        env.events().publish((symbol_short!("TYPED"), cert_hash.clone()), (owner, credential_type));
    }

    /// Get full typed credential record
    pub fn get_typed_credential(env: Env, cert_hash: String) -> Option<CredentialRecord> {
        let typed_certs: Map<String, CredentialRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));
        typed_certs.get(cert_hash)
    }

    /// Verify certificate exists on-chain
    pub fn verify_certificate(env: Env, cert_hash: String) -> bool {
        let certs: Map<String, String> = env
            .storage()
            .instance()
            .get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));
        certs.contains_key(cert_hash)
    }

    /// Get certificate owner
    pub fn get_owner(env: Env, cert_hash: String) -> String {
        let certs: Map<String, String> = env
            .storage()
            .instance()
            .get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));
        certs.get(cert_hash).unwrap()
    }

    // ── Revocation ─────────────────────────────────────────────────────────────

    /// Revoke a certificate — requires admin auth
    pub fn revoke_certificate(env: Env, cert_hash: String) {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(a) = admin { a.require_auth(); }

        // Mark in typed store if exists
        let mut typed_certs: Map<String, CredentialRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));
        if let Some(mut record) = typed_certs.get(cert_hash.clone()) {
            record.revoked = true;
            typed_certs.set(cert_hash.clone(), record.clone());
            env.storage().instance().set(&symbol_short!("TYPED"), &typed_certs);
            env.events().publish((symbol_short!("REVOKE"), cert_hash), record.owner);
            return;
        }

        // Legacy revocation
        let mut revoked_set: Map<String, bool> = env
            .storage()
            .instance()
            .get(&symbol_short!("REVOKED"))
            .unwrap_or(Map::new(&env));
        revoked_set.set(cert_hash.clone(), true);
        env.storage().instance().set(&symbol_short!("REVOKED"), &revoked_set);
        env.events().publish((symbol_short!("REVOKE"), cert_hash), String::from_str(&env, "legacy"));
    }

    /// Check if a certificate has been revoked
    pub fn is_revoked(env: Env, cert_hash: String) -> bool {
        // Check typed store first
        let typed_certs: Map<String, CredentialRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));
        if let Some(record) = typed_certs.get(cert_hash.clone()) {
            return record.revoked;
        }
        // Check legacy revoked set
        let revoked_set: Map<String, bool> = env
            .storage()
            .instance()
            .get(&symbol_short!("REVOKED"))
            .unwrap_or(Map::new(&env));
        revoked_set.get(cert_hash).unwrap_or(false)
    }

    // ── Admin Management ───────────────────────────────────────────────────────

    /// Get total certificate count
    pub fn get_certificate_count(env: Env) -> u64 {
        env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0u64)
    }

    /// Set primary platform admin — only callable once or by existing admin
    pub fn set_admin(env: Env, admin: Address) {
        let existing: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(current_admin) = existing {
            current_admin.require_auth();
        }
        env.storage().instance().set(&symbol_short!("ADMIN"), &admin);
    }

    /// Check if an address is the platform admin
    pub fn is_admin(env: Env, addr: Address) -> bool {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        admin.map(|a| a == addr).unwrap_or(false)
    }

    /// Add a secondary admin (sub-admin) — only primary admin can call
    pub fn add_sub_admin(env: Env, sub_admin: Address) {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(a) = admin { a.require_auth(); }

        let mut sub_admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&symbol_short!("SADMIN"))
            .unwrap_or(Vec::new(&env));
        sub_admins.push_back(sub_admin);
        env.storage().instance().set(&symbol_short!("SADMIN"), &sub_admins);
    }

    /// Check if an address is any admin (primary or sub)
    pub fn is_any_admin(env: Env, addr: Address) -> bool {
        // Check primary
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if admin.map(|a| a == addr).unwrap_or(false) { return true; }
        // Check sub-admins
        let sub_admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&symbol_short!("SADMIN"))
            .unwrap_or(Vec::new(&env));
        for sub in sub_admins.iter() {
            if sub == addr { return true; }
        }
        false
    }
}

#[cfg(test)]
mod test;