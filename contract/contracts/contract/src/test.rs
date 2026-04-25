#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String};

#[test]
fn test_issue_and_get_owner() {
    let env = Env::default();
    let contract_id = env.register(CertificateValidator, ());
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    let owner = String::from_str(&env, "John Doe");

    // Test 1: Issue certificate and verify owner
    client.issue_certificate(&cert_hash, &owner);
    let stored_owner = client.get_owner(&cert_hash);
    
    assert_eq!(stored_owner, owner);
}

#[test]
fn test_verify_valid_certificate() {
    let env = Env::default();
    let contract_id = env.register(CertificateValidator, ());
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "7f02a70648cce0e7ab48a11e189ab01d69f9d0fd64cbb1b292e580596c8747c6");
    let owner = String::from_str(&env, "Jane Doe");

    // Test 2: Issue and verify it returns true
    client.issue_certificate(&cert_hash, &owner);
    let is_valid = client.verify_certificate(&cert_hash);
    
    assert!(is_valid);
}

#[test]
fn test_verify_non_existent_certificate() {
    let env = Env::default();
    let contract_id = env.register(CertificateValidator, ());
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let fake_hash = String::from_str(&env, "non_existent_hash");

    // Test 3: Verify non-existent certificate returns false
    let is_valid = client.verify_certificate(&fake_hash);
    
    assert!(!is_valid);
}
