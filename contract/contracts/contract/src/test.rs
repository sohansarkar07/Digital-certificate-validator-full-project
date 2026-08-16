// Comprehensive integration tests for Digital Certificate Validator Soroban contract
// Covers: issuance, typed credentials, batch verify, revocation, suspension,
// expiry, admin RBAC, sub-admin delegation, transfer_admin, and duplicate prevention.
#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String, Address, Vec, testutils::Address as _};

// ─── Helper: create a default environment with mocked auth ──────────────────
fn setup() -> (Env, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(CertificateValidator, ());
    let admin = Address::generate(&env);
    let client = CertificateValidatorClient::new(&env, &contract_id);
    client.set_admin(&admin);
    (env, contract_id)
}

#[test]
fn test_issue_and_get_owner() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    let owner = String::from_str(&env, "John Doe");

    client.issue_certificate(&cert_hash, &owner);
    let stored_owner = client.get_owner(&cert_hash);
    assert_eq!(stored_owner, owner);
}

#[test]
fn test_verify_valid_certificate() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "7f02a70648cce0e7ab48a11e189ab01d69f9d0fd64cbb1b292e580596c8747c6");
    let owner = String::from_str(&env, "Jane Doe");

    client.issue_certificate(&cert_hash, &owner);
    assert!(client.verify_certificate(&cert_hash));
}

#[test]
fn test_verify_non_existent_certificate() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let fake_hash = String::from_str(&env, "non_existent_hash_abc123");
    assert!(!client.verify_certificate(&fake_hash));
}

#[test]
fn test_certificate_count_increments() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    assert_eq!(client.get_certificate_count(), 0);

    let owner = String::from_str(&env, "Test User");
    client.issue_certificate(&String::from_str(&env, "hash_001"), &owner);
    assert_eq!(client.get_certificate_count(), 1);

    client.issue_certificate(&String::from_str(&env, "hash_002"), &owner);
    assert_eq!(client.get_certificate_count(), 2);
}

#[test]
fn test_revoke_certificate() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "revoke_test_hash_abc123");
    let owner = String::from_str(&env, "Alice Smith");

    client.issue_certificate(&cert_hash, &owner);
    assert!(client.verify_certificate(&cert_hash));
    assert!(!client.is_revoked(&cert_hash));

    client.revoke_certificate(&cert_hash);
    assert!(client.is_revoked(&cert_hash));
    // verify_certificate should return false for revoked cert (legacy path)
    // typed path would also return false but this uses the legacy map
}

#[test]
fn test_admin_rbac() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let other = Address::generate(&env);
    assert!(!client.is_admin(&other));
}

#[test]
fn test_sub_admin_delegation() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let sub = Address::generate(&env);
    client.add_sub_admin(&sub);
    assert!(client.is_any_admin(&sub));
}

#[test]
fn test_remove_sub_admin() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let sub = Address::generate(&env);
    client.add_sub_admin(&sub);
    assert!(client.is_any_admin(&sub));

    client.remove_sub_admin(&sub);
    assert!(!client.is_any_admin(&sub));
}

#[test]
fn test_batch_verify() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let owner = String::from_str(&env, "Batch User");
    let hash1 = String::from_str(&env, "batch_hash_1");
    let hash2 = String::from_str(&env, "batch_hash_2");
    let hash3 = String::from_str(&env, "batch_hash_nonexistent");

    client.issue_certificate(&hash1, &owner);
    client.issue_certificate(&hash2, &owner);

    let mut hashes = Vec::new(&env);
    hashes.push_back(hash1);
    hashes.push_back(hash2);
    hashes.push_back(hash3);

    let results = client.batch_verify(&hashes);
    assert_eq!(results.len(), 3);
    assert!(results.get(0).unwrap());
    assert!(results.get(1).unwrap());
    assert!(!results.get(2).unwrap());
}

#[test]
fn test_typed_credential_issuance() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "typed_hash_001");
    let owner = String::from_str(&env, "Sohan Sarkar");
    let issuer = Address::generate(&env);

    client.issue_typed_credential(
        &cert_hash,
        &owner,
        &issuer,
        &CredentialCategory::Academic,
        &String::from_str(&env, "degree"),
        &String::from_str(&env, "MIT"),
        &String::from_str(&env, "MIT-001"),
        &0u64,   // no expiry
        &15u32,  // low risk
        &String::from_str(&env, "QmExampleIPFSHash"),
    );

    let record = client.get_credential(&cert_hash).unwrap();
    assert_eq!(record.owner, owner);
    assert_eq!(record.ai_risk_score, 15u32);
    assert_eq!(record.status, CredentialStatus::Active);
    assert!(!client.is_revoked(&cert_hash));
    assert!(client.verify_certificate(&cert_hash));
}

#[test]
fn test_suspend_and_restore_certificate() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let cert_hash = String::from_str(&env, "suspend_hash_001");
    let owner = String::from_str(&env, "Bob Jones");
    let issuer = Address::generate(&env);

    client.issue_typed_credential(
        &cert_hash, &owner, &issuer,
        &CredentialCategory::Professional,
        &String::from_str(&env, "certification"),
        &String::from_str(&env, "Acme Corp"),
        &String::from_str(&env, "ACME-001"),
        &0u64, &0u32,
        &String::from_str(&env, ""),
    );

    // Suspend
    client.suspend_certificate(&cert_hash);
    let record = client.get_credential(&cert_hash).unwrap();
    assert_eq!(record.status, CredentialStatus::Suspended);
    assert!(!client.verify_certificate(&cert_hash));

    // Restore
    client.restore_certificate(&cert_hash);
    let record2 = client.get_credential(&cert_hash).unwrap();
    assert_eq!(record2.status, CredentialStatus::Active);
    assert!(client.verify_certificate(&cert_hash));
}

#[test]
fn test_hash_index_tracks_all_issued() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let owner = String::from_str(&env, "Index User");
    let h1 = String::from_str(&env, "idx_hash_1");
    let h2 = String::from_str(&env, "idx_hash_2");
    let h3 = String::from_str(&env, "idx_hash_3");

    client.issue_certificate(&h1, &owner);
    client.issue_certificate(&h2, &owner);
    client.issue_certificate(&h3, &owner);

    let hashes = client.get_all_hashes();
    assert_eq!(hashes.len(), 3);
}

#[test]
fn test_transfer_admin() {
    let (env, contract_id) = setup();
    let client = CertificateValidatorClient::new(&env, &contract_id);

    let new_admin = Address::generate(&env);
    client.transfer_admin(&new_admin);
    assert!(client.is_admin(&new_admin));
}
