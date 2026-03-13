#![cfg(test)]
extern crate std;

use crate::contract::{TokenSaleContract, TokenSaleContractClient};
use crate::error::ContractError;
use escrow::{Escrow, EscrowContract, EscrowContractClient, Flags, Milestone, Roles, Trustline};
use soroban_sdk::{testutils::Address as _, token, vec, Address, Env, String};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;
use participation_token::{Token as FactoryToken, TokenClient as FactoryTokenClient};

fn create_usdc_token<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(e, &sac.address()),
        TokenAdminClient::new(e, &sac.address()),
    )
}

fn create_escrow_contract<'a>(env: &Env) -> EscrowContractClient<'a> {
    EscrowContractClient::new(env, &env.register(EscrowContract {}, ()))
}

fn create_token_factory<'a>(e: &Env, mint_authority: &Address, escrow_contract: &Address) -> FactoryTokenClient<'a> {
    let token_contract = e.register(
        FactoryToken,
        (
            String::from_str(e, "SaleToken"),
            String::from_str(e, "SALE"),
            escrow_contract,
            7_u32,
            mint_authority,
        ),
    );
    FactoryTokenClient::new(e, &token_contract)
}

fn create_token_sale<'a>(
    e: &Env,
    escrow_addr: &Address,
    admin: &Address,
    hard_cap: i128,
    max_per_investor: i128,
) -> TokenSaleContractClient<'a> {
    let contract_id = e.register(
        TokenSaleContract,
        (
            escrow_addr.clone(),
            admin.clone(),
            hard_cap,
            max_per_investor,
        ),
    );
    TokenSaleContractClient::new(e, &contract_id)
}

struct TestSetup<'a> {
    env: Env,
    #[allow(dead_code)]
    admin: Address,
    payer: Address,
    beneficiary: Address,
    usdc_client: TokenClient<'a>,
    usdc_admin: TokenAdminClient<'a>,
    sale_token: FactoryTokenClient<'a>,
    token_sale_client: TokenSaleContractClient<'a>,
}

fn setup_test(hard_cap: i128, max_per_investor: i128) -> TestSetup<'static> {
    let env = Env::default();
    env.mock_all_auths_allowing_non_root_auth();

    let admin = Address::generate(&env);
    let payer = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    let escrow_client = create_escrow_contract(&env);
    let engagement_id = String::from_str(&env, "eng_1");

    let roles = Roles {
        approver: payer.clone(),
        service_provider: beneficiary.clone(),
        platform_address: admin.clone(),
        release_signer: payer.clone(),
        dispute_resolver: admin.clone(),
    };

    let flags = Flags {
        disputed: false,
        released: false,
        resolved: false,
        approved: false,
    };

    let trustline = Trustline {
        address: usdc_client.address.clone(),
    };

    let milestones = vec![
        &env,
        Milestone {
            description: String::from_str(&env, "m1"),
            status: String::from_str(&env, "Pending"),
            evidence: String::from_str(&env, ""),
            amount: hard_cap,
            flags: flags.clone(),
            receiver: beneficiary.clone(),
        },
    ];

    let escrow_properties = Escrow {
        engagement_id,
        title: String::from_str(&env, "Test Escrow"),
        description: String::from_str(&env, "Test Escrow Description"),
        roles,
        platform_fee: 0,
        milestones,
        trustline,
        receiver_memo: 0,
    };

    escrow_client.initialize_escrow(&escrow_properties);

    let temp_admin = Address::generate(&env);
    let sale_token = create_token_factory(&env, &temp_admin, &escrow_client.address);

    let token_sale_client = create_token_sale(
        &env,
        &escrow_client.address,
        &admin,
        hard_cap,
        max_per_investor,
    );

    // Wire up: set participation token via set_token, then transfer mint authority
    token_sale_client.set_token(&sale_token.address);
    sale_token.set_admin(&token_sale_client.address);

    TestSetup {
        env,
        admin,
        payer,
        beneficiary,
        usdc_client,
        usdc_admin,
        sale_token,
        token_sale_client,
    }
}

#[test]
fn test_buy_transfers_usdc_and_mints_sale_token() {
    let amount: i128 = 100;
    let t = setup_test(1_000, 0); // hard_cap=1000, no per-investor limit

    t.usdc_admin.mint(&t.payer, &amount);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &amount);

    // Verify beneficiary got sale tokens
    let sale_token_balance = t.sale_token.balance(&t.beneficiary);
    assert_eq!(sale_token_balance, amount);
}

// ─── Security audit: AmountMustBePositive ────────────────────────────────────

#[test]
fn test_buy_rejects_zero_amount() {
    let t = setup_test(1_000, 0);
    t.usdc_admin.mint(&t.payer, &100);

    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &t.payer,
        &t.beneficiary,
        &0,
    );
    assert_eq!(result, Err(Ok(ContractError::AmountMustBePositive)));
}

#[test]
fn test_buy_rejects_negative_amount() {
    let t = setup_test(1_000, 0);
    t.usdc_admin.mint(&t.payer, &100);

    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &t.payer,
        &t.beneficiary,
        &(-50),
    );
    assert_eq!(result, Err(Ok(ContractError::AmountMustBePositive)));
}

// ─── Hard cap tests ─────────────────────────────────────────────────────────

#[test]
fn test_buy_exact_hard_cap() {
    let hard_cap: i128 = 500;
    let t = setup_test(hard_cap, 0);

    t.usdc_admin.mint(&t.payer, &hard_cap);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &hard_cap);

    let sale_token_balance = t.sale_token.balance(&t.beneficiary);
    assert_eq!(sale_token_balance, hard_cap);
}

#[test]
fn test_buy_exceeds_hard_cap() {
    let hard_cap: i128 = 500;
    let t = setup_test(hard_cap, 0);

    let over_amount = hard_cap + 1;
    t.usdc_admin.mint(&t.payer, &over_amount);

    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &t.payer,
        &t.beneficiary,
        &over_amount,
    );

    assert_eq!(result, Err(Ok(ContractError::HardCapExceeded)));
}

#[test]
fn test_buy_exceeds_hard_cap_across_buyers() {
    let hard_cap: i128 = 500;
    let t = setup_test(hard_cap, 0);

    let buyer2 = Address::generate(&t.env);

    // First buyer takes 400
    t.usdc_admin.mint(&t.payer, &400);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &400);

    // Second buyer tries to take 200 (total would be 600 > 500)
    t.usdc_admin.mint(&buyer2, &200);
    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &buyer2,
        &buyer2,
        &200,
    );

    assert_eq!(result, Err(Ok(ContractError::HardCapExceeded)));

    // But 100 should still work (total = 500 = hard_cap)
    t.usdc_admin.mint(&buyer2, &100);
    t.token_sale_client.buy(&t.usdc_client.address, &buyer2, &buyer2, &100);

    assert_eq!(t.sale_token.balance(&t.beneficiary), 400);
    assert_eq!(t.sale_token.balance(&buyer2), 100);
}

// ─── Per-investor cap tests ─────────────────────────────────────────────────

#[test]
fn test_buy_exceeds_per_investor_cap() {
    let hard_cap: i128 = 1_000;
    let max_per_investor: i128 = 200;
    let t = setup_test(hard_cap, max_per_investor);

    let over_amount = max_per_investor + 1;
    t.usdc_admin.mint(&t.payer, &over_amount);

    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &t.payer,
        &t.beneficiary,
        &over_amount,
    );

    assert_eq!(result, Err(Ok(ContractError::InvestorCapExceeded)));
}

#[test]
fn test_buy_exact_per_investor_cap() {
    let hard_cap: i128 = 1_000;
    let max_per_investor: i128 = 200;
    let t = setup_test(hard_cap, max_per_investor);

    // First buy: 150
    t.usdc_admin.mint(&t.payer, &150);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &150);

    // Second buy: 50 (total = 200 = max_per_investor) — should work
    t.usdc_admin.mint(&t.payer, &50);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &50);

    assert_eq!(t.sale_token.balance(&t.beneficiary), 200);

    // Third buy: 1 more — should fail
    t.usdc_admin.mint(&t.payer, &1);
    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &t.payer,
        &t.beneficiary,
        &1,
    );

    assert_eq!(result, Err(Ok(ContractError::InvestorCapExceeded)));
}

#[test]
fn test_buy_no_per_investor_cap() {
    let hard_cap: i128 = 1_000;
    let t = setup_test(hard_cap, 0); // max_per_investor = 0 means no limit

    // One investor can buy the entire hard_cap
    t.usdc_admin.mint(&t.payer, &hard_cap);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &hard_cap);

    assert_eq!(t.sale_token.balance(&t.beneficiary), hard_cap);
}

// ─── get_admin tests ─────────────────────────────────────────────────────────

#[test]
fn test_get_admin_returns_stored_admin() {
    let t = setup_test(1_000, 0);
    let admin = t.token_sale_client.get_admin();
    assert_eq!(admin, t.admin);
}

// ─── update_caps tests ───────────────────────────────────────────────────────

#[test]
fn test_update_caps_by_admin_changes_hard_cap() {
    let t = setup_test(1_000, 0);

    // Reduce hard cap to 200
    t.token_sale_client.update_caps(&200_i128, &0_i128);

    // Buying 201 should now fail
    t.usdc_admin.mint(&t.payer, &201);
    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &t.payer,
        &t.beneficiary,
        &201,
    );
    assert_eq!(result, Err(Ok(ContractError::HardCapExceeded)));

    // Buying exactly 200 should succeed
    t.usdc_admin.mint(&t.payer, &200);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &200);
    assert_eq!(t.sale_token.balance(&t.beneficiary), 200);
}

#[test]
fn test_update_caps_by_admin_changes_max_per_investor() {
    let t = setup_test(1_000, 0); // initially no per-investor limit

    // Set per-investor cap to 100
    t.token_sale_client.update_caps(&1_000_i128, &100_i128);

    // Buying 101 should now fail
    t.usdc_admin.mint(&t.payer, &101);
    let result = t.token_sale_client.try_buy(
        &t.usdc_client.address,
        &t.payer,
        &t.beneficiary,
        &101,
    );
    assert_eq!(result, Err(Ok(ContractError::InvestorCapExceeded)));

    // Buying exactly 100 should succeed
    t.usdc_admin.mint(&t.payer, &100);
    t.token_sale_client.buy(&t.usdc_client.address, &t.payer, &t.beneficiary, &100);
    assert_eq!(t.sale_token.balance(&t.beneficiary), 100);
}
