#![no_std]

mod contract;
mod error;
mod events;
mod storage_types;
mod types;

pub use crate::contract::VaultContract;
pub use crate::error::ContractError;
pub use crate::events::{AvailabilityChangedEvent, ClaimEvent};
pub use crate::storage_types::DataKey;
pub use crate::types::{ClaimPreview, VaultOverview};

#[cfg(test)]
mod test;
