// Digital Certificate Validator — Soroban Smart Contract on Stellar
// Level 5 Blue Belt — Enhanced contract logic with full credential lifecycle,
// multi-admin RBAC, typed credentials, batch verification, expiry, and event emission.
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Env, String, Map, Address, Vec,
};

// ── Credential Category ────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum CredentialCategory {
    Academic,
    Employment,
    Professional,
    Personal,
    Government,
    Training,
}

// ── Credential Status ─────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum CredentialStatus {
    Active,
    Revoked,
    Expired,
    Suspended,
}

// ── Credential Record (stored on-chain) ───────────────────────────────────────
#[contracttype]
#[derive(Clone)]
pub struct CredentialRecord {
    pub owner: String,
    pub issuer_wallet: Address,
    pub category: CredentialCategory,
    pub credential_type: String,
    pub institution: String,
    pub institution_id: String,
    pub issued_at: u64,
    pub expires_at: u64,
    pub ai_risk_score: u32,
    pub status: CredentialStatus,
    pub ipfs_doc_hash: String,
}

#[contract]
pub struct CertificateValidator;

#[contractimpl]
impl CertificateValidator {

    // Initialize the contract with a platform admin address (callable once).
    pub fn initialize(env: Env, admin: Address) {
        let existing: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if existing.is_none() {
            env.storage().instance().set(&symbol_short!("ADMIN"), &admin);
            env.events().publish((symbol_short!("INIT"),), admin);
        }
    }

    // Issue a simple certificate (hash -> owner). Prevents duplicate hashes.
    pub fn issue_certificate(env: Env, cert_hash: String, owner: String) {
        let mut certs: Map<String, String> = env
            .storage().instance().get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));

        if certs.contains_key(cert_hash.clone()) {
            panic!("Certificate already issued with this hash");
        }

        certs.set(cert_hash.clone(), owner.clone());
        env.storage().instance().set(&symbol_short!("CERTS"), &certs);

        Self::append_hash_index(&env, cert_hash.clone());

        let count: u64 = env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0u64);
        env.storage().instance().set(&symbol_short!("COUNT"), &(count + 1));

        env.events().publish((symbol_short!("ISSUE"), cert_hash), owner);
    }

    // Issue a full typed credential with complete metadata. Requires issuer wallet auth.
    pub fn issue_typed_credential(
        env: Env,
        cert_hash: String,
        owner: String,
        issuer_wallet: Address,
        category: CredentialCategory,
        credential_type: String,
        institution: String,
        institution_id: String,
        expires_at: u64,
        ai_risk_score: u32,
        ipfs_doc_hash: String,
    ) {
        issuer_wallet.require_auth();

        if ai_risk_score > 100 {
            panic!("ai_risk_score must be between 0 and 100");
        }

        let mut typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if typed_certs.contains_key(cert_hash.clone()) {
            panic!("Certificate already issued with this hash");
        }

        let record = CredentialRecord {
            owner: owner.clone(),
            issuer_wallet: issuer_wallet.clone(),
            category,
            credential_type: credential_type.clone(),
            institution: institution.clone(),
            institution_id: institution_id.clone(),
            issued_at: env.ledger().timestamp(),
            expires_at,
            ai_risk_score,
            status: CredentialStatus::Active,
            ipfs_doc_hash,
        };

        typed_certs.set(cert_hash.clone(), record);
        env.storage().instance().set(&symbol_short!("TYPED"), &typed_certs);

        let mut certs: Map<String, String> = env
            .storage().instance().get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));
        certs.set(cert_hash.clone(), owner.clone());
        env.storage().instance().set(&symbol_short!("CERTS"), &certs);

        Self::append_hash_index(&env, cert_hash.clone());

        let count: u64 = env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0u64);
        env.storage().instance().set(&symbol_short!("COUNT"), &(count + 1));

        env.events().publish(
            (symbol_short!("TYPED"), cert_hash),
            (owner, credential_type, institution_id),
        );
    }

    // Verify a certificate: must exist, be Active, and not expired.
    pub fn verify_certificate(env: Env, cert_hash: String) -> bool {
        let typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if let Some(record) = typed_certs.get(cert_hash.clone()) {
            if record.status != CredentialStatus::Active {
                return false;
            }
            if record.expires_at > 0 && env.ledger().timestamp() > record.expires_at {
                return false;
            }
            return true;
        }

        let certs: Map<String, String> = env
            .storage().instance().get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));
        certs.contains_key(cert_hash)
    }

    // Batch verify multiple hashes in a single contract call.
    pub fn batch_verify(env: Env, cert_hashes: Vec<String>) -> Vec<bool> {
        let mut results = Vec::new(&env);
        for hash in cert_hashes.iter() {
            results.push_back(Self::verify_certificate(env.clone(), hash));
        }
        results
    }

    // Get certificate owner. Panics if not found.
    pub fn get_owner(env: Env, cert_hash: String) -> String {
        let typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if let Some(record) = typed_certs.get(cert_hash.clone()) {
            return record.owner;
        }

        let certs: Map<String, String> = env
            .storage().instance().get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));

        certs.get(cert_hash).unwrap_or_else(|| panic!("Certificate not found"))
    }

    // Get full typed credential record.
    pub fn get_credential(env: Env, cert_hash: String) -> Option<CredentialRecord> {
        let typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));
        typed_certs.get(cert_hash)
    }

    // Get all issued certificate hashes.
    pub fn get_all_hashes(env: Env) -> Vec<String> {
        env.storage().instance().get(&symbol_short!("HSHLS")).unwrap_or(Vec::new(&env))
    }

    // Revoke a certificate — admin only. Emits REVOKE event.
    pub fn revoke_certificate(env: Env, cert_hash: String) {
        Self::require_any_admin(&env);

        let mut typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if let Some(mut record) = typed_certs.get(cert_hash.clone()) {
            if record.status == CredentialStatus::Revoked {
                panic!("Certificate is already revoked");
            }
            record.status = CredentialStatus::Revoked;
            typed_certs.set(cert_hash.clone(), record.clone());
            env.storage().instance().set(&symbol_short!("TYPED"), &typed_certs);
            env.events().publish((symbol_short!("REVOKE"), cert_hash), record.owner);
            return;
        }

        let mut revoked_set: Map<String, bool> = env
            .storage().instance().get(&symbol_short!("REVKD"))
            .unwrap_or(Map::new(&env));

        if revoked_set.get(cert_hash.clone()).unwrap_or(false) {
            panic!("Certificate is already revoked");
        }

        revoked_set.set(cert_hash.clone(), true);
        env.storage().instance().set(&symbol_short!("REVKD"), &revoked_set);
        env.events().publish((symbol_short!("REVOKE"), cert_hash), String::from_str(&env, "legacy"));
    }

    // Suspend a certificate temporarily — admin only.
    pub fn suspend_certificate(env: Env, cert_hash: String) {
        Self::require_any_admin(&env);
        let mut typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if let Some(mut record) = typed_certs.get(cert_hash.clone()) {
            if record.status != CredentialStatus::Active {
                panic!("Certificate must be Active to suspend");
            }
            record.status = CredentialStatus::Suspended;
            typed_certs.set(cert_hash.clone(), record.clone());
            env.storage().instance().set(&symbol_short!("TYPED"), &typed_certs);
            env.events().publish((symbol_short!("SUSP"), cert_hash), record.owner);
        } else {
            panic!("Certificate not found");
        }
    }

    // Restore a suspended certificate to Active — admin only.
    pub fn restore_certificate(env: Env, cert_hash: String) {
        Self::require_any_admin(&env);
        let mut typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if let Some(mut record) = typed_certs.get(cert_hash.clone()) {
            if record.status != CredentialStatus::Suspended {
                panic!("Certificate is not suspended");
            }
            record.status = CredentialStatus::Active;
            typed_certs.set(cert_hash.clone(), record.clone());
            env.storage().instance().set(&symbol_short!("TYPED"), &typed_certs);
            env.events().publish((symbol_short!("RESTOR"), cert_hash), record.owner);
        } else {
            panic!("Certificate not found");
        }
    }

    // Check if a certificate has been revoked.
    pub fn is_revoked(env: Env, cert_hash: String) -> bool {
        let typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if let Some(record) = typed_certs.get(cert_hash.clone()) {
            return record.status == CredentialStatus::Revoked;
        }

        let revoked_set: Map<String, bool> = env
            .storage().instance().get(&symbol_short!("REVKD"))
            .unwrap_or(Map::new(&env));
        revoked_set.get(cert_hash).unwrap_or(false)
    }

    // Check if a certificate has expired.
    pub fn is_expired(env: Env, cert_hash: String) -> bool {
        let typed_certs: Map<String, CredentialRecord> = env
            .storage().instance().get(&symbol_short!("TYPED"))
            .unwrap_or(Map::new(&env));

        if let Some(record) = typed_certs.get(cert_hash) {
            if record.expires_at == 0 { return false; }
            return env.ledger().timestamp() > record.expires_at;
        }
        false
    }

    // Get total number of certificates issued.
    pub fn get_certificate_count(env: Env) -> u64 {
        env.storage().instance().get(&symbol_short!("COUNT")).unwrap_or(0u64)
    }

    // Get the current ledger timestamp.
    pub fn get_ledger_timestamp(env: Env) -> u64 {
        env.ledger().timestamp()
    }

    // Set primary platform admin. Only existing admin or initial bootstrap.
    pub fn set_admin(env: Env, admin: Address) {
        let existing: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(current_admin) = existing {
            current_admin.require_auth();
        }
        env.storage().instance().set(&symbol_short!("ADMIN"), &admin);
        env.events().publish((symbol_short!("SETADM"),), admin);
    }

    // Transfer admin rights to a new address. Old admin loses all rights.
    pub fn transfer_admin(env: Env, new_admin: Address) {
        let current_admin: Address = env
            .storage().instance().get(&symbol_short!("ADMIN"))
            .unwrap_or_else(|| panic!("No admin set"));
        current_admin.require_auth();
        env.storage().instance().set(&symbol_short!("ADMIN"), &new_admin);
        env.events().publish((symbol_short!("XFERADM"),), new_admin);
    }

    // Add a sub-admin — primary admin only.
    pub fn add_sub_admin(env: Env, sub_admin: Address) {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(a) = admin { a.require_auth(); } else { panic!("No admin set"); }

        let mut sub_admins: Vec<Address> = env
            .storage().instance().get(&symbol_short!("SADMN"))
            .unwrap_or(Vec::new(&env));
        sub_admins.push_back(sub_admin.clone());
        env.storage().instance().set(&symbol_short!("SADMN"), &sub_admins);
        env.events().publish((symbol_short!("ADDSA"),), sub_admin);
    }

    // Remove a sub-admin — primary admin only.
    pub fn remove_sub_admin(env: Env, sub_admin: Address) {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(a) = admin { a.require_auth(); } else { panic!("No admin set"); }

        let sub_admins: Vec<Address> = env
            .storage().instance().get(&symbol_short!("SADMN"))
            .unwrap_or(Vec::new(&env));

        let mut new_admins = Vec::new(&env);
        for a in sub_admins.iter() {
            if a != sub_admin {
                new_admins.push_back(a);
            }
        }
        env.storage().instance().set(&symbol_short!("SADMN"), &new_admins);
        env.events().publish((symbol_short!("REMSA"),), sub_admin);
    }

    // Check if an address is the primary admin.
    pub fn is_admin(env: Env, addr: Address) -> bool {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        admin.map(|a| a == addr).unwrap_or(false)
    }

    // Check if an address is any admin (primary or sub-admin).
    pub fn is_any_admin(env: Env, addr: Address) -> bool {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if admin.map(|a| a == addr).unwrap_or(false) { return true; }
        let sub_admins: Vec<Address> = env
            .storage().instance().get(&symbol_short!("SADMN"))
            .unwrap_or(Vec::new(&env));
        for sub in sub_admins.iter() {
            if sub == addr { return true; }
        }
        false
    }

    // Internal: require caller to be any admin.
    fn require_any_admin(env: &Env) {
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(a) = admin {
            a.require_auth();
            return;
        }
        panic!("No admin set — unauthorized");
    }

    // Internal: append a hash to the global index.
    fn append_hash_index(env: &Env, hash: String) {
        let mut hashes: Vec<String> = env
            .storage().instance().get(&symbol_short!("HSHLS"))
            .unwrap_or(Vec::new(env));
        hashes.push_back(hash);
        env.storage().instance().set(&symbol_short!("HSHLS"), &hashes);
    }
}

#[cfg(test)]
mod test;
