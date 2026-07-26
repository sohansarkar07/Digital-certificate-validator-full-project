// Extended integration tests for Digital Certificate Validator Soroban smart contract
// Covers original functions + Level 5 extensions: revoke, count, admin RBAC
#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String, Address, testutils::Address as _};

#[test]
fn test_issue_and_get_owner() {
    let env = Env::default();
    let contract_id = env.register(CertificateValidator, ());
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    let owner = String::from_str(&env, "John Doe");

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
    let is_valid = client.verify_certificate(&fake_hash);
    assert!(!is_valid);
}

#[test]
fn test_certificate_count_increments() {
    let env = Env::default();
    let contract_id = env.register(CertificateValidator, ());
    let client = CertificateValidatorClient::new(&env, &contract_id);

    assert_eq!(client.get_certificate_count(), 0);

    let hash1 = String::from_str(&env, "hash_001");
    let hash2 = String::from_str(&env, "hash_002");
    let owner = String::from_str(&env, "Test User");

    client.issue_certificate(&hash1, &owner);
    assert_eq!(client.get_certificate_count(), 1);

    client.issue_certificate(&hash2, &owner);
    assert_eq!(client.get_certificate_count(), 2);
}

#[test]
fn test_revoke_certificate() {
    let env = Env::default();
    let contract_id = env.register(CertificateValidator, ());
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "revoke_test_hash_abc123");
    let owner = String::from_str(&env, "Alice Smith");

    client.issue_certificate(&cert_hash, &owner);
    assert!(client.verify_certificate(&cert_hash));
    assert!(!client.is_revoked(&cert_hash));

    client.revoke_certificate(&cert_hash);
    assert!(client.is_revoked(&cert_hash));
}

#[test]
fn test_admin_rbac() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(CertificateValidator, ());
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let other = Address::generate(&env);

    client.set_admin(&admin);
    assert!(client.is_admin(&admin));
    assert!(!client.is_admin(&other));
}
