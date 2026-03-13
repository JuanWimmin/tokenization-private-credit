use soroban_sdk::{contracttype, Address};

/// A complete snapshot of the vault's current state.
/// Useful for dashboards, analytics, and indexer integrations.
#[derive(Clone, Debug)]
#[contracttype]
pub struct VaultOverview {
    /// The admin address that controls the vault
    pub admin: Address,
    /// Whether claiming is currently enabled
    pub enabled: bool,
    /// The ROI percentage (e.g., 5 = 5% return on investment)
    pub roi_percentage: i128,
    /// The participation token contract address
    pub token_address: Address,
    /// The USDC stablecoin contract address
    pub usdc_address: Address,
    /// Current USDC balance available in the vault
    pub vault_usdc_balance: i128,
    /// Total participation tokens that have been redeemed
    pub total_tokens_redeemed: i128,
}

/// Information about a beneficiary's claimable ROI.
#[derive(Clone, Debug)]
#[contracttype]
pub struct ClaimPreview {
    /// The beneficiary's current token balance
    pub token_balance: i128,
    /// The amount of USDC the beneficiary would receive
    pub usdc_amount: i128,
    /// The ROI portion of the USDC amount (profit)
    pub roi_amount: i128,
    /// Whether the vault has enough USDC to fulfill this claim
    pub vault_has_sufficient_balance: bool,
    /// Whether claiming is currently enabled
    pub claim_enabled: bool,
}

