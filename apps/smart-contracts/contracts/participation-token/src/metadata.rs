use soroban_sdk::{Address, Env, String};
use soroban_token_sdk::{metadata::TokenMetadata, TokenUtils};

use crate::storage_types::DataKey;

// Standard metadata (name, symbol, decimals) via TokenUtils
pub fn read_decimal(e: &Env) -> u32 {
    let util = TokenUtils::new(e);
    util.metadata().get_metadata().decimal
}

pub fn read_name(e: &Env) -> String {
    let util = TokenUtils::new(e);
    util.metadata().get_metadata().name
}

pub fn read_symbol(e: &Env) -> String {
    let util = TokenUtils::new(e);
    util.metadata().get_metadata().symbol
}

pub fn write_metadata(e: &Env, metadata: TokenMetadata) {
    let util = TokenUtils::new(e);
    util.metadata().set_metadata(&metadata);
}

// Immutable metadata (escrow_contract, mint_authority) - set only once at initialization
pub fn read_escrow_contract(e: &Env) -> Address {
    let key = DataKey::EscrowContract;
    e.storage()
        .instance()
        .get(&key)
        .expect("Escrow contract not initialized")
}

pub fn write_escrow_contract(e: &Env, escrow_contract: &Address) {
    let key = DataKey::EscrowContract;
    // Check if already set (immutable - can only be set once)
    if e.storage().instance().has(&key) {
        panic!("Escrow contract already set - cannot modify");
    }
    e.storage().instance().set(&key, escrow_contract);
}

pub fn read_mint_authority(e: &Env) -> Address {
    let key = DataKey::MintAuthority;
    e.storage()
        .instance()
        .get(&key)
        .expect("Mint authority not initialized")
}

pub fn write_mint_authority(e: &Env, mint_authority: &Address) {
    let key = DataKey::MintAuthority;
    e.storage().instance().set(&key, mint_authority);
}