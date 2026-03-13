use soroban_sdk::contracttype;

pub(crate) const DAY_IN_LEDGERS: u32 = 17280;
pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

/// Typed storage keys for the vault contract.
/// Using an enum instead of raw strings improves type safety and readability.
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// The admin address that can enable/disable the vault
    Admin,
    /// Whether claiming is currently enabled
    Enabled,
    /// The ROI percentage (e.g., 5 means 5% return)
    RoiPercentage,
    /// The participation token contract address
    TokenAddress,
    /// The USDC stablecoin contract address
    UsdcAddress,
    /// Total tokens that have been redeemed through the vault
    TotalTokensRedeemed,
    /// Flag to prevent constructor re-invocation
    Initialized,
}
