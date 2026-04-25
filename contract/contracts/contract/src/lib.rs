#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, String, Map};

#[contract]
pub struct CertificateValidator;

#[contractimpl]
impl CertificateValidator {

    // Store certificate (hash -> owner name)
    pub fn issue_certificate(env: Env, cert_hash: String, owner: String) {
        let mut certs: Map<String, String> = env
            .storage()
            .instance()
            .get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));

        certs.set(cert_hash.clone(), owner.clone());
        env.storage().instance().set(&symbol_short!("CERTS"), &certs);

        // Emit an event for indexing
        env.events().publish((symbol_short!("ISSUE"), cert_hash), owner);
    }

    // Verify certificate
    pub fn verify_certificate(env: Env, cert_hash: String) -> bool {
        let certs: Map<String, String> = env
            .storage()
            .instance()
            .get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));

        certs.contains_key(cert_hash)
    }

    // Get certificate owner
    pub fn get_owner(env: Env, cert_hash: String) -> String {
        let certs: Map<String, String> = env
            .storage()
            .instance()
            .get(&symbol_short!("CERTS"))
            .unwrap_or(Map::new(&env));

        certs.get(cert_hash).unwrap()
    }
}

#[cfg(test)]
mod test;