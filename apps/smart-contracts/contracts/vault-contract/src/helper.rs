use crate::error::ContractError;
use soroban_sdk::{TryFromVal, Env, Val};
use crate::storage_types::DataKey;

pub fn calculate_usdc_amount(
    token_balance: i128,
    roi_percentage: u32,
) -> Result<i128, ContractError> {
    let rate = 100_i128
        .checked_add(roi_percentage as i128)
        .ok_or(ContractError::ArithmeticOverflow)?;
    let numerator = token_balance
        .checked_mul(rate)
        .ok_or(ContractError::ArithmeticOverflow)?;
    numerator
        .checked_div(100)
        .ok_or(ContractError::ArithmeticOverflow)
}

/// Helper to read a required value from instance storage.
pub fn get_required<T: TryFromVal<Env, Val>>(
    env: &Env,
    key: &DataKey,
) -> Result<T, ContractError> {
    env.storage()
        .instance()
        .get(key)
        .ok_or(ContractError::NotInitialized)
}