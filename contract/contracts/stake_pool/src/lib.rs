// Stake Pool Soroban Smart Contract
// Part of Global Decentralized Credential Trust Platform (Level 5)
// Implements XLM bonding, challenge windows, and bond slashing for certificate integrity
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Env, String, Address, Map, token,
};

/// Bond lifecycle state
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum BondStatus {
    Locked,       // XLM locked, challenge window open
    Released,     // Bond returned to institution (no dispute)
    Slashed,      // Bond slashed due to fraud (challenger rewarded)
    Challenged,   // Active dispute in progress
}

/// Per-certificate bond record
#[contracttype]
#[derive(Clone)]
pub struct BondRecord {
    pub cert_hash: String,
    pub institution: Address,
    pub amount: i128,           // in stroops (1 XLM = 10_000_000 stroops)
    pub locked_at: u64,
    pub challenge_window: u64,  // seconds — default 7 days
    pub status: BondStatus,
    pub challenger: Option<Address>,
}

/// Default challenge window: 7 days in seconds
const DEFAULT_CHALLENGE_WINDOW: u64 = 7 * 24 * 60 * 60;
/// Default bond: 1 XLM in stroops
const DEFAULT_BOND_AMOUNT: i128 = 10_000_000;
/// Challenger reward: 50% of slashed bond
const CHALLENGER_REWARD_BPS: i128 = 5000; // basis points

#[contract]
pub struct StakePool;

#[contractimpl]
impl StakePool {

    // ── Initialization ───────────────────────────────────────────────────────

    /// Initialize with XLM token address and admin
    pub fn initialize(env: Env, xlm_token: Address, admin: Address) {
        env.storage().instance().set(&symbol_short!("TOKEN"), &xlm_token);
        env.storage().instance().set(&symbol_short!("ADMIN"), &admin);
        env.storage().instance().set(&symbol_short!("LOCKED"), &0i128);
        env.storage().instance().set(&symbol_short!("SLASHED"), &0i128);
    }

    // ── Bond Management ──────────────────────────────────────────────────────

    /// Lock a bond when issuing a certificate
    /// Institution must have approved the token transfer before calling this
    pub fn lock_bond(env: Env, cert_hash: String, institution: Address) {
        institution.require_auth();

        let xlm_token: Address = env.storage().instance().get(&symbol_short!("TOKEN")).unwrap();
        let token_client = token::Client::new(&env, &xlm_token);

        // Transfer bond from institution to contract
        token_client.transfer(&institution, &env.current_contract_address(), &DEFAULT_BOND_AMOUNT);

        // Record bond
        let bond = BondRecord {
            cert_hash: cert_hash.clone(),
            institution,
            amount: DEFAULT_BOND_AMOUNT,
            locked_at: env.ledger().timestamp(),
            challenge_window: DEFAULT_CHALLENGE_WINDOW,
            status: BondStatus::Locked,
            challenger: None,
        };

        let mut bonds: Map<String, BondRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("BONDS"))
            .unwrap_or(Map::new(&env));
        bonds.set(cert_hash.clone(), bond);
        env.storage().instance().set(&symbol_short!("BONDS"), &bonds);

        // Update total locked
        let locked: i128 = env.storage().instance().get(&symbol_short!("LOCKED")).unwrap_or(0i128);
        env.storage().instance().set(&symbol_short!("LOCKED"), &(locked + DEFAULT_BOND_AMOUNT));

        env.events().publish(symbol_short!("LOCK"), cert_hash);
    }

    /// Release bond after challenge window expires with no dispute
    pub fn release_bond(env: Env, cert_hash: String) {
        let mut bonds: Map<String, BondRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("BONDS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut bond) = bonds.get(cert_hash.clone()) {
            // Verify challenge window has passed
            let now = env.ledger().timestamp();
            let window_end = bond.locked_at + bond.challenge_window;
            if now < window_end {
                panic!("Challenge window still open");
            }
            if bond.status != BondStatus::Locked {
                panic!("Bond not in locked state");
            }

            let xlm_token: Address = env.storage().instance().get(&symbol_short!("TOKEN")).unwrap();
            let token_client = token::Client::new(&env, &xlm_token);

            // Return bond to institution
            token_client.transfer(&env.current_contract_address(), &bond.institution, &bond.amount);

            bond.status = BondStatus::Released;
            bonds.set(cert_hash.clone(), bond.clone());
            env.storage().instance().set(&symbol_short!("BONDS"), &bonds);

            // Update total locked
            let locked: i128 = env.storage().instance().get(&symbol_short!("LOCKED")).unwrap_or(0i128);
            env.storage().instance().set(&symbol_short!("LOCKED"), &(locked - DEFAULT_BOND_AMOUNT));

            env.events().publish(symbol_short!("RELEASE"), cert_hash);
        }
    }

    /// Open a challenge on a certificate (anyone can challenge)
    pub fn challenge_certificate(env: Env, cert_hash: String, challenger: Address) {
        challenger.require_auth();

        let mut bonds: Map<String, BondRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("BONDS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut bond) = bonds.get(cert_hash.clone()) {
            let now = env.ledger().timestamp();
            let window_end = bond.locked_at + bond.challenge_window;
            if now > window_end {
                panic!("Challenge window closed");
            }
            if bond.status != BondStatus::Locked {
                panic!("Bond not challengeable");
            }

            bond.status = BondStatus::Challenged;
            bond.challenger = Some(challenger);
            bonds.set(cert_hash.clone(), bond);
            env.storage().instance().set(&symbol_short!("BONDS"), &bonds);

            env.events().publish(symbol_short!("CHAL"), cert_hash);
        }
    }

    /// Slash bond on confirmed fraud (admin only)
    /// 50% to challenger, 50% burned (sent to admin/treasury)
    pub fn slash_bond(env: Env, cert_hash: String) {
        Self::require_admin(&env);

        let mut bonds: Map<String, BondRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("BONDS"))
            .unwrap_or(Map::new(&env));

        if let Some(mut bond) = bonds.get(cert_hash.clone()) {
            if bond.status != BondStatus::Challenged {
                panic!("Bond not in challenged state");
            }

            let xlm_token: Address = env.storage().instance().get(&symbol_short!("TOKEN")).unwrap();
            let admin: Address = env.storage().instance().get(&symbol_short!("ADMIN")).unwrap();
            let token_client = token::Client::new(&env, &xlm_token);

            let challenger_reward = bond.amount * CHALLENGER_REWARD_BPS / 10000;
            let treasury = bond.amount - challenger_reward;

            // Pay challenger
            if let Some(ref ch) = bond.challenger {
                token_client.transfer(&env.current_contract_address(), ch, &challenger_reward);
            }
            // Send remainder to admin/treasury
            token_client.transfer(&env.current_contract_address(), &admin, &treasury);

            bond.status = BondStatus::Slashed;
            bonds.set(cert_hash.clone(), bond.clone());
            env.storage().instance().set(&symbol_short!("BONDS"), &bonds);

            // Update total locked and slashed
            let locked: i128 = env.storage().instance().get(&symbol_short!("LOCKED")).unwrap_or(0i128);
            env.storage().instance().set(&symbol_short!("LOCKED"), &(locked - DEFAULT_BOND_AMOUNT));

            let slashed: i128 = env.storage().instance().get(&symbol_short!("SLASHED")).unwrap_or(0i128);
            env.storage().instance().set(&symbol_short!("SLASHED"), &(slashed + DEFAULT_BOND_AMOUNT));

            env.events().publish(symbol_short!("SLASH"), cert_hash);
        }
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    /// Get bond status for a certificate
    pub fn get_bond(env: Env, cert_hash: String) -> Option<BondRecord> {
        let bonds: Map<String, BondRecord> = env
            .storage()
            .instance()
            .get(&symbol_short!("BONDS"))
            .unwrap_or(Map::new(&env));
        bonds.get(cert_hash)
    }

    /// Get total XLM currently locked in the pool (in stroops)
    pub fn get_total_locked(env: Env) -> i128 {
        env.storage().instance().get(&symbol_short!("LOCKED")).unwrap_or(0i128)
    }

    /// Get total XLM slashed (in stroops)
    pub fn get_total_slashed(env: Env) -> i128 {
        env.storage().instance().get(&symbol_short!("SLASHED")).unwrap_or(0i128)
    }

    /// Get default bond amount in stroops
    pub fn get_bond_amount(_env: Env) -> i128 {
        DEFAULT_BOND_AMOUNT
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&symbol_short!("ADMIN")).unwrap();
        admin.require_auth();
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, String, testutils::Address as _};

    #[test]
    fn test_bond_amount_is_one_xlm() {
        let env = Env::default();
        let contract_id = env.register(StakePool, ());
        let client = StakePoolClient::new(&env, &contract_id);
        assert_eq!(client.get_bond_amount(), 10_000_000i128);
    }
}
