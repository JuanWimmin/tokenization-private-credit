use soroban_sdk::{contractevent, Address};

/// Event emitted when a beneficiary successfully claims their ROI.
/// This enables indexers and explorers to track claim activity.
#[contractevent(topics = ["vault_claim"], data_format = "vec")]
#[derive(Clone, Debug)]
pub struct ClaimEvent {
    pub beneficiary: Address,
    pub tokens_redeemed: i128,
    pub usdc_received: i128,
    pub roi_percentage: u32,
}

/// Event emitted when the vault availability is changed by admin.
#[contractevent(topics = ["vault_avail"], data_format = "vec")]
#[derive(Clone, Debug)]
pub struct AvailabilityChangedEvent {
    pub admin: Address,
    pub enabled: bool,
}

/// Event emitted when the ROI percentage is changed by admin.
#[contractevent(topics = ["vault_roi_changed"], data_format = "vec")]
#[derive(Clone, Debug)]
pub struct RoiPercentageChangedEvent {
    pub admin: Address,
    pub old_roi_percentage: u32,
    pub new_roi_percentage: u32,
}
