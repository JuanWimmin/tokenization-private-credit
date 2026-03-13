#![cfg(test)]
extern crate std;

use crate::error::ContractError;
use crate::contract::{VaultContract, VaultContractClient};
use soroban_sdk::{testutils::Address as _, testutils::Events as _, token, Address, Env, String};
use participation_token::{Token as FactoryToken, TokenClient as FactoryTokenClient};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

fn create_usdc_token<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(e, &sac.address()),
        TokenAdminClient::new(e, &sac.address()),
    )
}

fn create_token_factory<'a>(e: &Env, mint_authority: &Address) -> FactoryTokenClient<'a> {
    let escrow_contract = Address::generate(e);
    let token_contract = e.register(
        FactoryToken,
        (
            String::from_str(e, "TestToken"),
            String::from_str(e, "TST"),
            escrow_contract,
            7_u32,
            mint_authority,
        ),
    );
    FactoryTokenClient::new(e, &token_contract)
}

fn create_vault<'a>(
    e: &Env,
    admin: &Address,
    enabled: bool,
    roi_percentage: i128,
    token: &Address,
    usdc: &Address,
) -> VaultContractClient<'a> {
    let contract_id = e.register(
        VaultContract,
        (
            admin.clone(),
            enabled,
            roi_percentage,
            token.clone(),
            usdc.clone(),
        ),
    );
    VaultContractClient::new(e, &contract_id)
}

// ============ Constructor Validation Tests ============

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_constructor_rejects_negative_roi_percentage() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let _ = create_vault(&env, &admin, true, -1, &token.address, &usdc_client.address);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_constructor_rejects_roi_percentage_over_max() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let _ = create_vault(&env, &admin, true, 1001, &token.address, &usdc_client.address);
}

// ============ Original Tests (Updated) ============

#[test]
fn test_vault_deployment_and_availability() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    vault.availability_for_exchange(&true);

    vault.availability_for_exchange(&false);
}

#[test]
fn test_claim_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 2, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    // roi_percentage = 2 means 2% premium -> rate = 1.02
    // 100 tokens * 1.02 = 102 USDC
    usdc_admin.mint(&vault.address, &300);

    assert_eq!(token.balance(&beneficiary), 100);
    assert_eq!(usdc_client.balance(&beneficiary), 0);
    assert_eq!(usdc_client.balance(&vault.address), 300);

    vault.claim(&beneficiary);

    assert_eq!(token.balance(&beneficiary), 0);
    assert_eq!(token.balance(&vault.address), 0); // tokens burned, not transferred
    assert_eq!(usdc_client.balance(&beneficiary), 102);
    assert_eq!(usdc_client.balance(&vault.address), 198);
}

#[test]
fn test_claim_when_disabled() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::ExchangeIsCurrentlyDisabled)));
}

#[test]
fn test_claim_insufficient_vault_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 5, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    // roi_percentage = 5 means 5% premium -> rate = 1.05
    // 100 tokens * 1.05 = 105 USDC, but vault only has 100
    usdc_admin.mint(&vault.address, &100);

    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::VaultDoesNotHaveEnoughUSDC)));
}

#[test]
fn test_claim_no_tokens() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::BeneficiaryHasNoTokensToClaim)));
}

#[test]
fn test_claim_with_6_percent_premium() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    let token = create_token_factory(&env, &token_admin);

    // roi_percentage = 6 means 6% premium -> rate = 1.06
    let vault = create_vault(&env, &admin, true, 6, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);

    // 100 tokens * 1.06 = 106 USDC
    usdc_admin.mint(&vault.address, &200);

    vault.claim(&beneficiary);

    assert_eq!(token.balance(&beneficiary), 0);
    assert_eq!(token.balance(&vault.address), 0); // tokens burned, not transferred
    assert_eq!(usdc_client.balance(&beneficiary), 106);
    assert_eq!(usdc_client.balance(&vault.address), 94);
}

// ============ Getter Function Tests ============

#[test]
fn test_get_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    assert_eq!(vault.get_admin(), admin);
}

#[test]
fn test_is_enabled() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Test with enabled = false
    let vault_disabled = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);
    assert_eq!(vault_disabled.is_enabled(), false);

    // Test with enabled = true
    let vault_enabled = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);
    assert_eq!(vault_enabled.is_enabled(), true);

    // Test toggling
    vault_disabled.availability_for_exchange(&true);
    assert_eq!(vault_disabled.is_enabled(), true);
}

#[test]
fn test_get_roi_percentage() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 15, &token.address, &usdc_client.address);

    assert_eq!(vault.get_roi_percentage(), 15);
}

#[test]
fn test_get_token_address() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    assert_eq!(vault.get_token_address(), token.address);
}

#[test]
fn test_get_usdc_address() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    assert_eq!(vault.get_usdc_address(), usdc_client.address);
}

#[test]
fn test_get_vault_usdc_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    // Initially zero
    assert_eq!(vault.get_vault_usdc_balance(), 0);

    // After minting
    usdc_admin.mint(&vault.address, &500);
    assert_eq!(vault.get_vault_usdc_balance(), 500);
}

#[test]
fn test_get_total_tokens_redeemed() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary1 = Address::generate(&env);
    let beneficiary2 = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 5, &token.address, &usdc_client.address);

    // Initially zero
    assert_eq!(vault.get_total_tokens_redeemed(), 0);

    // Mint tokens and USDC
    token.mint(&beneficiary1, &100);
    token.mint(&beneficiary2, &200);
    usdc_admin.mint(&vault.address, &1000);

    // First claim
    vault.claim(&beneficiary1);
    assert_eq!(vault.get_total_tokens_redeemed(), 100);

    // Second claim
    vault.claim(&beneficiary2);
    assert_eq!(vault.get_total_tokens_redeemed(), 300);
}

// ============ Preview Function Tests ============

#[test]
fn test_preview_claim_basic() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 10% ROI
    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 100);
    assert_eq!(preview.usdc_amount, 110); // 100 * 1.10 = 110
    assert_eq!(preview.roi_amount, 10); // 110 - 100 = 10
    assert_eq!(preview.vault_has_sufficient_balance, true);
    assert_eq!(preview.claim_enabled, true);
}

#[test]
fn test_preview_claim_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 50% ROI
    let vault = create_vault(&env, &admin, true, 50, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &100); // Only 100 USDC, but needs 150

    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 100);
    assert_eq!(preview.usdc_amount, 150); // 100 * 1.50 = 150
    assert_eq!(preview.roi_amount, 50);
    assert_eq!(preview.vault_has_sufficient_balance, false); // Not enough!
    assert_eq!(preview.claim_enabled, true);
}

#[test]
fn test_preview_claim_disabled_vault() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Vault is disabled
    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 100);
    assert_eq!(preview.usdc_amount, 110);
    assert_eq!(preview.claim_enabled, false); // Disabled!
}

#[test]
fn test_preview_claim_zero_tokens() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    // Beneficiary has no tokens
    let preview = vault.preview_claim(&beneficiary);

    assert_eq!(preview.token_balance, 0);
    assert_eq!(preview.usdc_amount, 0);
    assert_eq!(preview.roi_amount, 0);
}

// ============ Vault Overview Tests ============

#[test]
fn test_get_vault_overview() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 25, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &1000);

    let overview = vault.get_vault_overview();

    assert_eq!(overview.admin, admin);
    assert_eq!(overview.enabled, true);
    assert_eq!(overview.roi_percentage, 25);
    assert_eq!(overview.token_address, token.address);
    assert_eq!(overview.usdc_address, usdc_client.address);
    assert_eq!(overview.vault_usdc_balance, 1000);
    assert_eq!(overview.total_tokens_redeemed, 0);
}

#[test]
fn test_vault_overview_after_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    // Claim: 100 tokens -> 110 USDC
    vault.claim(&beneficiary);

    let overview = vault.get_vault_overview();

    assert_eq!(overview.vault_usdc_balance, 390); // 500 - 110 = 390
    assert_eq!(overview.total_tokens_redeemed, 100);
}

// ============ Event Emission Tests ============

#[test]
fn test_claim_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 5, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &200);

    vault.claim(&beneficiary);

    // Verify event was emitted
    let events = env.events().all();
    assert!(!events.events().is_empty(), "Expected claim event to be emitted");
}

#[test]
fn test_availability_change_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    vault.availability_for_exchange(&true);

    // Verify event was emitted
    let events = env.events().all();
    assert!(
        !events.events().is_empty(),
        "Expected availability changed event to be emitted"
    );
}

// ============ Constructor Validation Tests ============

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_constructor_rejects_same_token_and_usdc() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token = create_token_factory(&env, &token_admin);

    // Pass the same address for both token and usdc — should panic
    create_vault(&env, &admin, true, 10, &token.address, &token.address);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_constructor_rejects_admin_equals_token() {
    let env = Env::default();
    env.mock_all_auths();

    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &token_admin);
    let token = create_token_factory(&env, &token_admin);

    // Pass token address as admin — should panic
    create_vault(&env, &token.address, true, 10, &token.address, &usdc_client.address);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_constructor_rejects_admin_equals_usdc() {
    let env = Env::default();
    env.mock_all_auths();

    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &token_admin);
    let token = create_token_factory(&env, &token_admin);

    // Pass usdc address as admin — should panic
    create_vault(&env, &usdc_client.address, true, 10, &token.address, &usdc_client.address);
}

#[test]
fn test_constructor_accepts_valid_distinct_addresses() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // All distinct addresses — should succeed
    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    assert_eq!(vault.get_admin(), admin);
    assert_eq!(vault.get_token_address(), token.address);
    assert_eq!(vault.get_usdc_address(), usdc_client.address);
}

// ============ Input Validation Tests ============

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_constructor_rejects_negative_roi() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Negative ROI should panic
    create_vault(&env, &admin, true, -5, &token.address, &usdc_client.address);
}

#[test]
fn test_constructor_accepts_zero_roi() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Zero ROI is valid (no profit, just principal return)
    let vault = create_vault(&env, &admin, true, 0, &token.address, &usdc_client.address);
    assert_eq!(vault.get_roi_percentage(), 0);
}

// ============ Re-initialization Protection Tests ============

#[test]
fn test_constructor_sets_initialized_flag() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // First deploy works fine
    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    // Vault is functional after initialization
    assert_eq!(vault.get_admin(), admin);
    assert_eq!(vault.is_enabled(), true);
    assert_eq!(vault.get_roi_percentage(), 10);
}

// ============ Edge Case Tests ============

#[test]
fn test_multiple_claims_different_beneficiaries() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary1 = Address::generate(&env);
    let beneficiary2 = Address::generate(&env);
    let beneficiary3 = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    // Mint different amounts
    token.mint(&beneficiary1, &100);
    token.mint(&beneficiary2, &200);
    token.mint(&beneficiary3, &50);
    usdc_admin.mint(&vault.address, &1000);

    // Claims
    vault.claim(&beneficiary1); // 110 USDC
    vault.claim(&beneficiary2); // 220 USDC
    vault.claim(&beneficiary3); // 55 USDC

    assert_eq!(usdc_client.balance(&beneficiary1), 110);
    assert_eq!(usdc_client.balance(&beneficiary2), 220);
    assert_eq!(usdc_client.balance(&beneficiary3), 55);
    assert_eq!(vault.get_total_tokens_redeemed(), 350);
    assert_eq!(vault.get_vault_usdc_balance(), 615); // 1000 - 385 = 615
}

#[test]
fn test_high_roi_percentage() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 100% ROI (doubling)
    let vault = create_vault(&env, &admin, true, 100, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    let preview = vault.preview_claim(&beneficiary);
    assert_eq!(preview.usdc_amount, 200); // 100 * 2.0 = 200
    assert_eq!(preview.roi_amount, 100);

    vault.claim(&beneficiary);
    assert_eq!(usdc_client.balance(&beneficiary), 200);
}

// ============ Constructor Validation Tests (CoKeFish #24) ============

#[test]
fn test_constructor_accepts_max_roi() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 1000, &token.address, &usdc_client.address);
    assert_eq!(vault.get_roi_percentage(), 1000);
}

// ============ Security Tests (#33) ============

#[test]
fn test_claim_overflow_in_formula() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, _) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Use max ROI (1000) and a token balance that causes overflow: token_balance * (100 + roi) overflows i128
    // token_balance * 1100 > i128::MAX when token_balance > i128::MAX / 1100
    let overflow_balance: i128 = i128::MAX / 1100 + 1;
    let vault = create_vault(&env, &admin, true, 1000, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &overflow_balance);

    // claim() will compute: overflow_balance * (100 + 1000) / 100 which overflows i128 -> returns ArithmeticOverflow
    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::ArithmeticOverflow)));
}

#[test]
fn test_claim_zero_roi() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 0% ROI — principal only, no profit
    let vault = create_vault(&env, &admin, true, 0, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &200);

    vault.claim(&beneficiary);

    assert_eq!(token.balance(&beneficiary), 0);
    assert_eq!(usdc_client.balance(&beneficiary), 100); // exactly principal
    assert_eq!(usdc_client.balance(&vault.address), 100);
}

#[test]
fn test_double_claim_same_beneficiary() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &500);

    // First claim succeeds
    vault.claim(&beneficiary);
    assert_eq!(usdc_client.balance(&beneficiary), 110);
    assert_eq!(token.balance(&beneficiary), 0);

    // Second claim fails — tokens already burned
    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::BeneficiaryHasNoTokensToClaim)));
}

#[test]
#[should_panic]
fn test_non_admin_cannot_change_availability() {
    let env = Env::default();
    // Do NOT mock_all_auths — we want auth to fail for non-admin

    let admin = Address::generate(&env);
    let _non_admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (usdc_client, _) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, false, 10, &token.address, &usdc_client.address);

    // Non-admin tries to enable — should fail auth
    vault.availability_for_exchange(&true);
}

#[test]
fn test_claim_exact_vault_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 10% ROI: 100 tokens → 110 USDC
    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &110); // exactly enough

    vault.claim(&beneficiary);

    assert_eq!(usdc_client.balance(&beneficiary), 110);
    assert_eq!(usdc_client.balance(&vault.address), 0); // vault fully drained
}

#[test]
fn test_preview_matches_actual_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    let vault = create_vault(&env, &admin, true, 15, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &200);
    usdc_admin.mint(&vault.address, &1000);

    // Preview before claim
    let preview = vault.preview_claim(&beneficiary);
    assert_eq!(preview.token_balance, 200);
    assert_eq!(preview.usdc_amount, 230); // 200 * 1.15 = 230
    assert_eq!(preview.vault_has_sufficient_balance, true);
    assert_eq!(preview.claim_enabled, true);

    // Actual claim
    vault.claim(&beneficiary);

    // Verify preview amounts match actual
    assert_eq!(usdc_client.balance(&beneficiary), preview.usdc_amount);
    assert_eq!(token.balance(&beneficiary), 0);
}

#[test]
fn test_small_amount_truncation() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 1% ROI: 3 tokens → 3 * 101 / 100 = 303 / 100 = 3 (integer division truncates)
    let vault = create_vault(&env, &admin, true, 1, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &3);
    usdc_admin.mint(&vault.address, &100);

    let preview = vault.preview_claim(&beneficiary);
    assert_eq!(preview.usdc_amount, 3); // 303 / 100 = 3 (truncated)
    assert_eq!(preview.roi_amount, 0); // 3 - 3 = 0 (lost to truncation)

    vault.claim(&beneficiary);
    assert_eq!(usdc_client.balance(&beneficiary), 3);
}

#[test]
fn test_claim_single_token_high_roi() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 50% ROI: 1 token → 1 * 150 / 100 = 1 (truncated)
    let vault = create_vault(&env, &admin, true, 50, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &1);
    usdc_admin.mint(&vault.address, &100);

    vault.claim(&beneficiary);
    assert_eq!(usdc_client.balance(&beneficiary), 1); // 150/100 = 1
}

#[test]
fn test_claim_large_token_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // 10% ROI with large amounts
    let vault = create_vault(&env, &admin, true, 10, &token.address, &usdc_client.address);

    let large_amount: i128 = 1_000_000_000_000; // 1 trillion
    token.mint(&beneficiary, &large_amount);
    let vault_funds: i128 = 2_000_000_000_000;
    usdc_admin.mint(&vault.address, &vault_funds);

    vault.claim(&beneficiary);

    // 1_000_000_000_000 * 110 / 100 = 1_100_000_000_000
    assert_eq!(usdc_client.balance(&beneficiary), 1_100_000_000_000);
}

#[test]
fn test_enable_disable_enable_then_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);
    let token = create_token_factory(&env, &token_admin);

    // Start disabled
    let vault = create_vault(&env, &admin, false, 5, &token.address, &usdc_client.address);

    token.mint(&beneficiary, &100);
    usdc_admin.mint(&vault.address, &200);

    // Claim should fail when disabled
    let result = vault.try_claim(&beneficiary);
    assert_eq!(result, Err(Ok(ContractError::ExchangeIsCurrentlyDisabled)));

    // Enable → claim should work
    vault.availability_for_exchange(&true);
    vault.claim(&beneficiary);
    assert_eq!(usdc_client.balance(&beneficiary), 105);
}
