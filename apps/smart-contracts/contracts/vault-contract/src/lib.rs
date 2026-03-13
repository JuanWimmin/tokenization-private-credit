#![no_std]

mod contract;
mod error;
mod events;
mod storage_types;
mod types;
mod helper;

pub use crate::contract::VaultContract;
pub use crate::error::ContractError;
pub use crate::events::{AvailabilityChangedEvent, ClaimEvent};
pub use crate::storage_types::DataKey;
pub use crate::helper::{calculate_usdc_amount, get_required};

#[cfg(test)]
mod test;
