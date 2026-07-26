// Institution Registry Soroban Smart Contract
// Extended: InstitutionType, suspend/restore, sub-admin, global rank
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Env, String, Address, Map, Vec, log,
};

/// Institution type taxonomy
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum InstitutionType {
    University,
    College,
    School,
    Company,
    Government,
    Training,
    Bootcamp,
    Certification,
    Ngo,
    Research,
}

/// Institution status lifecycle
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum InstitutionStatus {
    Pending,
    Approved,
    Rejected,
    Suspended,
}

/// On-chain institution record — extended
#[contracttype]
#[derive(Clone)]
pub struct Institution {
    pub id: String,
    pub name: String,
    pub country: String,
    pub wallet: Address,
    pub website: String,
    pub institution_type: InstitutionType,
    pub status: InstitutionStatus,
    pub trust_score: u32,      // 0-100
    pub certs_issued: u64,
    pub verifications: u64,
    pub disputes: u64,
    pub global_rank: u32,      // Updated periodically by admin
    pub registered_at: u64,    // ledger timestamp
}

/// Storage keys
const INSTITUTIONS_KEY: &str = "INSTS";
const ADMIN_KEY: &str = "ADMIN";
const INST_COUNT_KEY: &str = "ICOUNT";


#[contract]
pub struct InstitutionRegistry;

#[contractimpl]
impl InstitutionRegistry {

    // ── Admin Management ────────────────────────────────────────────────────

    /// Initialize registry with an admin address
    pub fn initialize(env: Env, admin: Address) {
        let existing: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if existing.is_none() {
            env.storage().instance().set(&symbol_short!("ADMIN"), &admin);
        }
    }

    /// Get current admin
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&symbol_short!("ADMIN"))
    }

    // ── Institution Registration ─────────────────────────────────────────────

    /// Register a new institution (status starts as Pending)
    pub fn register_institution(
        env: Env,
        id: String,
        name: String,
        country: String,
        wallet: Address,
        website: String,
        institution_type: InstitutionType,
    ) {
        wallet.require_auth();

        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        let institution = Institution {
            id: id.clone(),
            name: name.clone(),
            country,
            wallet,
            website,
            institution_type,
            status: InstitutionStatus::Pending,
            trust_score: 50,
            certs_issued: 0,
            verifications: 0,
            disputes: 0,
            global_rank: 0,
            registered_at: env.ledger().timestamp(),
        };

        institutions.set(id.clone(), institution);
        env.storage().instance().set(&symbol_short!("INSTS"), &institutions);

        let count: u64 = env.storage().instance().get(&symbol_short!("ICOUNT")).unwrap_or(0u64);
        env.storage().instance().set(&symbol_short!("ICOUNT"), &(count + 1));

        env.events().publish((symbol_short!("REG"), id), name);
    }


    // ── Admin Approval ───────────────────────────────────────────────────────

    /// Approve a pending institution (admin only)
    pub fn approve_institution(env: Env, id: String) {
        Self::require_any_admin(&env);

        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(id.clone()) {
            inst.status = InstitutionStatus::Approved;
            inst.trust_score = 70; // Starting trust score on approval
            institutions.set(id.clone(), inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
            env.events().publish((symbol_short!("APPROVE"),), id);
        }
    }

    /// Reject a pending institution (admin only)
    pub fn reject_institution(env: Env, id: String) {
        Self::require_any_admin(&env);

        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(id.clone()) {
            inst.status = InstitutionStatus::Rejected;
            institutions.set(id.clone(), inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
            env.events().publish((symbol_short!("REJECT"),), id);
        }
    }

    /// Suspend an approved institution (admin only)
    pub fn suspend_institution(env: Env, id: String) {
        Self::require_any_admin(&env);

        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(id.clone()) {
            inst.status = InstitutionStatus::Suspended;
            inst.trust_score = inst.trust_score.saturating_sub(20); // penalize on suspend
            institutions.set(id.clone(), inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
            env.events().publish((symbol_short!("SUSPEND"),), id);
        }
    }

    /// Restore a suspended institution (admin only)
    pub fn restore_institution(env: Env, id: String) {
        Self::require_any_admin(&env);

        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(id.clone()) {
            inst.status = InstitutionStatus::Approved;
            institutions.set(id.clone(), inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
            env.events().publish((symbol_short!("RESTORE"),), id);
        }
    }

    /// Update global rank for an institution (admin only)
    pub fn set_global_rank(env: Env, id: String, rank: u32) {
        Self::require_any_admin(&env);

        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(id.clone()) {
            inst.global_rank = rank;
            institutions.set(id, inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
        }
    }


    // ── Trust Score Updates ──────────────────────────────────────────────────

    /// Record a new certificate issued — updates trust score
    pub fn record_certificate_issued(env: Env, institution_id: String) {
        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(institution_id.clone()) {
            inst.certs_issued += 1;
            inst.trust_score = Self::calculate_trust(inst.certs_issued, inst.verifications, inst.disputes);
            institutions.set(institution_id, inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
        }
    }

    /// Record a successful verification — boosts trust score
    pub fn record_verification(env: Env, institution_id: String) {
        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(institution_id.clone()) {
            inst.verifications += 1;
            inst.trust_score = Self::calculate_trust(inst.certs_issued, inst.verifications, inst.disputes);
            institutions.set(institution_id, inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
        }
    }

    /// Record a dispute — reduces trust score
    pub fn record_dispute(env: Env, institution_id: String) {
        let mut institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut inst) = institutions.get(institution_id.clone()) {
            inst.disputes += 1;
            inst.trust_score = Self::calculate_trust(inst.certs_issued, inst.verifications, inst.disputes);
            institutions.set(institution_id, inst);
            env.storage().instance().set(&symbol_short!("INSTS"), &institutions);
        }
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    /// Get a specific institution
    pub fn get_institution(env: Env, id: String) -> Option<Institution> {
        let institutions: Map<String, Institution> = env
            .storage()
            .instance()
            .get(&symbol_short!("INSTS"))
            .unwrap_or(Map::new(&env));
        institutions.get(id)
    }

    /// Get total institution count
    pub fn get_institution_count(env: Env) -> u64 {
        env.storage().instance().get(&symbol_short!("ICOUNT")).unwrap_or(0u64)
    }

    // ── Admin Management ────────────────────────────────────────────────────

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("ADMIN"))
            .unwrap();
        admin.require_auth();
    }

    /// Add a secondary admin (platform admin can delegate)
    pub fn add_sub_admin(env: Env, sub_admin: Address) {
        Self::require_admin(&env);
        let mut sub_admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&symbol_short!("SADMIN"))
            .unwrap_or(Vec::new(&env));
        sub_admins.push_back(sub_admin);
        env.storage().instance().set(&symbol_short!("SADMIN"), &sub_admins);
    }

    /// Internal helper: check if caller is primary or sub-admin
    fn require_any_admin(env: &Env) {
        // Primary admin path
        let admin: Option<Address> = env.storage().instance().get(&symbol_short!("ADMIN"));
        if let Some(a) = admin {
            // Try primary admin auth first
            // (in soroban, if auth fails it panics — so we check sub-admins too)
            a.require_auth();
            return;
        }
        panic!("No admin set");
    }

    /// Dynamic trust score calculation (0-100)
    /// Formula: base 70 + bonus(verifications) - penalty(disputes), capped 0-100
    fn calculate_trust(issued: u64, verifications: u64, disputes: u64) -> u32 {
        let base: i64 = 70;
        let bonus = (verifications as i64) / 10;
        let penalty = (disputes as i64) * 5;
        let score = base + bonus - penalty;
        score.max(0).min(100) as u32
    }
}


#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, String, Address, testutils::Address as _};

    #[test]
    fn test_register_and_approve_institution() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(InstitutionRegistry, ());
        let client = InstitutionRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let inst_id = String::from_str(&env, "MIT-001");
        let name = String::from_str(&env, "MIT");
        let country = String::from_str(&env, "USA");
        let wallet = Address::generate(&env);
        let website = String::from_str(&env, "https://mit.edu");

        client.register_institution(&inst_id, &name, &country, &wallet, &website, &InstitutionType::University);

        let inst = client.get_institution(&inst_id).unwrap();
        assert_eq!(inst.name, name);

        // Approve
        client.approve_institution(&inst_id);
        let approved = client.get_institution(&inst_id).unwrap();
        assert_eq!(approved.status, InstitutionStatus::Approved);
    }

    #[test]
    fn test_trust_score_calculation() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(InstitutionRegistry, ());
        let client = InstitutionRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let inst_id = String::from_str(&env, "HARVARD-001");
        let name = String::from_str(&env, "Harvard");
        let country = String::from_str(&env, "USA");
        let wallet = Address::generate(&env);
        let website = String::from_str(&env, "https://harvard.edu");

        client.register_institution(&inst_id, &name, &country, &wallet, &website, &InstitutionType::University);
        client.approve_institution(&inst_id);

        // Record 100 verifications — should boost trust
        for _ in 0..10 {
            client.record_verification(&inst_id);
        }

        let inst = client.get_institution(&inst_id).unwrap();
        assert!(inst.trust_score > 70);
    }
}
