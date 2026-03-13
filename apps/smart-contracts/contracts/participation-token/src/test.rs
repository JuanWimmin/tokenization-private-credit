#![cfg(test)]
extern crate std;

use crate::{contract::Token, TokenClient};
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    Address, Env, FromVal, IntoVal, String, Symbol, Vec,
};

fn create_token<'a>(e: &Env, mint_authority: &Address, escrow_contract: &Address) -> TokenClient<'a> {
    let token_contract = e.register(
        Token,
        (
            String::from_val(e, &"TestToken"),
            String::from_val(e, &"TST"),
            escrow_contract,
            7_u32,
            mint_authority,
        ),
    );
    TokenClient::new(e, &token_contract)
}

#[test]
fn test() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);
    let user3 = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user1, &1000);
    assert_eq!(
        e.auths(),
        std::vec![(
            mint_authority.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    token.address.clone(),
                    symbol_short!("mint"),
                    (&user1, 1000_i128).into_val(&e),
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user1), 1000);

    token.approve(&user2, &user3, &500, &200);
    assert_eq!(
        e.auths(),
        std::vec![(
            user2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    token.address.clone(),
                    symbol_short!("approve"),
                    (&user2, &user3, 500_i128, 200_u32).into_val(&e),
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.allowance(&user2, &user3), 500);

    token.transfer(&user1, &user2, &600);
    assert_eq!(
        e.auths(),
        std::vec![(
            user1.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    token.address.clone(),
                    symbol_short!("transfer"),
                    (&user1, &user2, 600_i128).into_val(&e),
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user1), 400);
    assert_eq!(token.balance(&user2), 600);

    token.transfer_from(&user3, &user2, &user1, &400);
    assert_eq!(
        e.auths(),
        std::vec![(
            user3.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    token.address.clone(),
                    Symbol::new(&e, "transfer_from"),
                    (&user3, &user2, &user1, 400_i128).into_val(&e),
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user1), 800);
    assert_eq!(token.balance(&user2), 200);

    token.transfer(&user1, &user3, &300);
    assert_eq!(token.balance(&user1), 500);
    assert_eq!(token.balance(&user3), 300);

    // Increase to 500
    token.approve(&user2, &user3, &500, &200);
    assert_eq!(token.allowance(&user2, &user3), 500);
    token.approve(&user2, &user3, &0, &200);
    assert_eq!(
        e.auths(),
        std::vec![(
            user2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    token.address.clone(),
                    symbol_short!("approve"),
                    (&user2, &user3, 0_i128, 200_u32).into_val(&e),
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.allowance(&user2, &user3), 0);
}

#[test]
fn test_burn() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.approve(&user1, &user2, &500, &200);
    assert_eq!(token.allowance(&user1, &user2), 500);

    token.burn_from(&user2, &user1, &500);
    assert_eq!(
        e.auths(),
        std::vec![(
            user2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    token.address.clone(),
                    symbol_short!("burn_from"),
                    (&user2, &user1, 500_i128).into_val(&e),
                )),
                sub_invocations: std::vec![]
            }
        )]
    );

    assert_eq!(token.allowance(&user1, &user2), 0);
    assert_eq!(token.balance(&user1), 500);
    assert_eq!(token.balance(&user2), 0);

    token.burn(&user1, &500);
    assert_eq!(
        e.auths(),
        std::vec![(
            user1.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    token.address.clone(),
                    symbol_short!("burn"),
                    (&user1, 500_i128).into_val(&e),
                )),
                sub_invocations: std::vec![]
            }
        )]
    );

    assert_eq!(token.balance(&user1), 0);
    assert_eq!(token.balance(&user2), 0);
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn transfer_insufficient_balance() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.transfer(&user1, &user2, &1001);
}

#[test]
#[should_panic(expected = "insufficient allowance")]
fn transfer_from_insufficient_allowance() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);
    let user3 = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.approve(&user1, &user3, &100, &200);
    assert_eq!(token.allowance(&user1, &user3), 100);

    token.transfer_from(&user3, &user1, &user2, &101);
}

#[test]
#[should_panic(expected = "Decimal must not be greater than 18")]
fn decimal_is_over_eighteen() {
    let e = Env::default();
    let mint_authority = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let _ = TokenClient::new(
        &e,
        &e.register(
            Token,
            (
                String::from_val(&e, &"name"),
                String::from_val(&e, &"symbol"),
                escrow_contract,
                19_u32,
                mint_authority,
            ),
        ),
    );
}

// New tests for T-REX alignment

#[test]
fn test_metadata_getters() {
    let e = Env::default();
    let mint_authority = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    // Test standard metadata getters
    assert_eq!(token.name(), String::from_val(&e, &"TestToken"));
    assert_eq!(token.symbol(), String::from_val(&e, &"TST"));
    assert_eq!(token.decimals(), 7);

    // Test escrow_contract getter
    let token_contract = token.address.clone();
    let escrow_result: Address = e
        .invoke_contract(&token_contract, &Symbol::new(&e, "escrow_contract"), Vec::new(&e));
    assert_eq!(escrow_result, escrow_contract);
}

#[test]
fn test_mint_authority_can_mint() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    // Mint authority should be able to mint
    // With mock_all_auths(), the mint_authority's auth is automatically provided
    token.mint(&user, &1000);
    assert_eq!(token.balance(&user), 1000);
    
    // Verify balance increased correctly
    token.mint(&user, &500);
    assert_eq!(token.balance(&user), 1500);
}

#[test]
#[should_panic]
fn test_deployer_cannot_mint() {
    let e = Env::default();
    // Don't mock all auths - we want to test that only mint_authority can mint
    let token_contract = e.register(
        Token,
        (
            String::from_val(&e, &"TestToken"),
            String::from_val(&e, &"TST"),
            Address::generate(&e), // escrow_contract
            7_u32,
            Address::generate(&e), // mint_authority
        ),
    );
    
    e.as_contract(&token_contract, || {
        let user = Address::generate(&e);
        
        // Try to mint as deployer (should fail because deployer != mint_authority)
        // Without mint_authority's auth, this should panic
        // This will fail because we're not providing mint_authority's auth
        let mut args = Vec::new(&e);
        args.push_back(user.to_val());
        args.push_back(1000_i128.into_val(&e));
        let _: () = e
            .invoke_contract(
                &token_contract,
                &symbol_short!("mint"),
                args,
            );
    });
}

#[test]
#[should_panic(expected = "Escrow contract already set")]
fn test_metadata_immutability() {
    let e = Env::default();
    let mint_authority = Address::generate(&e);
    let escrow_contract = Address::generate(&e);

    // Create token (initializes metadata via __constructor)
    let token_contract = e.register(
        Token,
        (
            String::from_val(&e, &"TestToken"),
            String::from_val(&e, &"TST"),
            escrow_contract.clone(),
            7_u32,
            mint_authority.clone(),
        ),
    );

    // Try to write escrow_contract again (should panic - immutability enforced)
    // We need to wrap in as_contract to access storage
    e.as_contract(&token_contract, || {
        use crate::metadata::write_escrow_contract;
        let new_escrow = Address::generate(&e);
        write_escrow_contract(&e, &new_escrow); // This should panic
    });
}

// ============ Edge Case Tests ============

#[test]
fn test_mint_zero_tokens() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    // Minting zero should succeed (no-op)
    token.mint(&user, &0);
    assert_eq!(token.balance(&user), 0);
}

#[test]
fn test_transfer_zero_amount() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user1, &100);

    // Transfer zero should succeed
    token.transfer(&user1, &user2, &0);
    assert_eq!(token.balance(&user1), 100);
    assert_eq!(token.balance(&user2), 0);
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn test_burn_more_than_balance() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user, &100);
    token.burn(&user, &101); // should panic
}

#[test]
fn test_burn_entire_balance() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user, &500);
    token.burn(&user, &500);
    assert_eq!(token.balance(&user), 0);
}

#[test]
fn test_transfer_to_self() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user, &100);

    // Self-transfer should work and balance remains the same
    token.transfer(&user, &user, &50);
    assert_eq!(token.balance(&user), 100);
}

#[test]
fn test_multiple_mints_accumulate() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user, &100);
    token.mint(&user, &200);
    token.mint(&user, &300);

    assert_eq!(token.balance(&user), 600);
}

#[test]
#[should_panic(expected = "negative amount is not allowed")]
fn test_mint_negative_amount() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user, &(-100));
}

#[test]
#[should_panic(expected = "negative amount is not allowed")]
fn test_transfer_negative_amount() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let user1 = Address::generate(&e);
    let user2 = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    token.mint(&user1, &100);
    token.transfer(&user1, &user2, &(-50));
}

#[test]
fn test_set_admin_transfers_authority() {
    let e = Env::default();
    e.mock_all_auths();

    let mint_authority = Address::generate(&e);
    let new_authority = Address::generate(&e);
    let user = Address::generate(&e);
    let escrow_contract = Address::generate(&e);
    let token = create_token(&e, &mint_authority, &escrow_contract);

    // Original authority mints
    token.mint(&user, &100);
    assert_eq!(token.balance(&user), 100);

    // Transfer authority
    token.set_admin(&new_authority);

    // New authority should be able to mint
    token.mint(&user, &200);
    assert_eq!(token.balance(&user), 300);
}