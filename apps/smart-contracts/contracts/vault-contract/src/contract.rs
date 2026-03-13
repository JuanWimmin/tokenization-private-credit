use soroban_sdk::{contract, contractimpl, panic_with_error, token, Address, Env};
use token::Client as TokenClient;

use crate::error::ContractError;
use crate::events::{AvailabilityChangedEvent, ClaimEvent};
use crate::storage_types::{DataKey, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD};
use crate::types::{ClaimPreview, VaultOverview};

#[contract]
pub struct VaultContract;

/// Calculates USDC payout: token_balance * (100 + roi_percentage) / 100
/// Returns Err on overflow.
fn calculate_usdc_amount(
    token_balance: i128,
    roi_percentage: i128,
) -> Result<i128, ContractError> {
    let rate = 100_i128
        .checked_add(roi_percentage)
        .ok_or(ContractError::ArithmeticOverflow)?;
    let numerator = token_balance
        .checked_mul(rate)
        .ok_or(ContractError::ArithmeticOverflow)?;
    numerator
        .checked_div(100)
        .ok_or(ContractError::ArithmeticOverflow)
}

/// Helper to read a required value from instance storage.
fn get_required<T: soroban_sdk::TryFromVal<Env, soroban_sdk::Val>>(
    env: &Env,
    key: &DataKey,
) -> Result<T, ContractError> {
    env.storage()
        .instance()
        .get(key)
        .ok_or(ContractError::NotInitialized)
}

#[contractimpl]
impl VaultContract {
    // ============ Constructor ============

    /// Initializes the vault contract with the given parameters.
    ///
    /// # Trust Assumptions
    /// The deployer is responsible for providing correct and trusted addresses.
    /// These addresses are **immutable** after deployment — there are no setters.
    ///
    /// * `token` must be the participation token contract deployed by the token factory.
    /// * `usdc` must be the canonical USDC Stellar Asset Contract on the target network.
    /// * `admin` must be a secure, controlled address (ideally a multisig).
    ///
    /// Providing incorrect addresses will render the vault permanently non-functional.
    /// See `docs/VAULT_SECURITY.md` for the full deployment checklist.
    ///
    /// # Arguments
    /// * `admin` - The address that will control vault availability
    /// * `enabled` - Initial state of whether claiming is enabled
    /// * `roi_percentage` - The ROI percentage (e.g., 5 for 5% return). Must be 0..=1000.
    /// * `token` - The participation token contract address (must be trusted)
    /// * `usdc` - The USDC stablecoin contract address (must be trusted)
    ///
    /// # Panics
    /// * `AlreadyInitialized` - If the contract has already been initialized
    /// * `InvalidRoiPercentage` - If roi_percentage is negative or > 1000
    /// * `TokenAndUsdcCannotBeSame` - If token and USDC addresses are identical
    /// * `InvalidAddressConfiguration` - If admin equals token or USDC address
    pub fn __constructor(
        env: Env,
        admin: Address,
        enabled: bool,
        roi_percentage: i128,
        token: Address,
        usdc: Address,
    ) {
        const ROI_MAX: i128 = 1000;
        let already_initialized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Initialized)
            .unwrap_or(false);
        if already_initialized {
            panic_with_error!(&env, ContractError::AlreadyInitialized);
        }

        if roi_percentage < 0 || roi_percentage > ROI_MAX {
            panic_with_error!(&env, ContractError::InvalidRoiPercentage);
        }
        if token == usdc {
            panic_with_error!(&env, ContractError::TokenAndUsdcCannotBeSame);
        }
        if admin == token || admin == usdc {
            panic_with_error!(&env, ContractError::InvalidAddressConfiguration);
        }

        env.storage()
            .instance()
            .set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Enabled, &enabled);
        env.storage()
            .instance()
            .set(&DataKey::RoiPercentage, &roi_percentage);
        env.storage()
            .instance()
            .set(&DataKey::TokenAddress, &token);
        env.storage().instance().set(&DataKey::UsdcAddress, &usdc);
        env.storage()
            .instance()
            .set(&DataKey::TotalTokensRedeemed, &0_i128);

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
    }

    // ============ Admin Functions ============

    pub fn availability_for_exchange(
        env: Env,
        enabled: bool,
    ) -> Result<(), ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let stored_admin: Address = get_required(&env, &DataKey::Admin)?;

        stored_admin.require_auth();

        env.storage().instance().set(&DataKey::Enabled, &enabled);

        // Emit availability changed event
        AvailabilityChangedEvent {
            admin: stored_admin.clone(),
            enabled,
        }
        .publish(&env);

        Ok(())
    }

    // ============ Claim Function ============

    /// Claims ROI for the beneficiary by exchanging their participation tokens for USDC.
    /// The beneficiary receives their tokens' value plus the ROI percentage.
    ///
    /// Formula: usdc_amount = token_balance * (100 + roi_percentage) / 100
    ///
    /// # Arguments
    /// * `beneficiary` - The address claiming their ROI (must have tokens)
    ///
    /// # Errors
    /// * `EnabledNotFound` - If enabled flag is not set in storage
    /// * `ExchangeIsCurrentlyDisabled` - If vault is disabled
    /// * `RoiPercentageNotFound` - If ROI percentage is not set in storage
    /// * `TokenAddressNotFound` - If token address is not set in storage
    /// * `BeneficiaryHasNoTokensToClaim` - If beneficiary has zero tokens
    /// * `UsdcAddressNotFound` - If USDC address is not set in storage
    /// * `VaultDoesNotHaveEnoughUSDC` - If vault cannot cover the claim
    /// * `ArithmeticOverflow` - If total tokens redeemed overflows
    pub fn claim(env: Env, beneficiary: Address) -> Result<(), ContractError> {
        beneficiary.require_auth();

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let enabled: bool = env
            .storage()
            .instance()
            .get(&DataKey::Enabled)
            .ok_or(ContractError::EnabledFlagNotFound)?;

        if !enabled {
            return Err(ContractError::ExchangeIsCurrentlyDisabled);
        }

        let roi_percentage: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RoiPercentage)
            .ok_or(ContractError::RoiPercentageNotFound)?;

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(ContractError::TokenAddressNotFound)?;

        let token_client = TokenClient::new(&env, &token_address);
        let token_balance = token_client.balance(&beneficiary);

        if token_balance == 0 {
            return Err(ContractError::BeneficiaryHasNoTokensToClaim);
        }

        let usdc_amount = calculate_usdc_amount(token_balance, roi_percentage)?;

        let usdc_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::UsdcAddress)
            .ok_or(ContractError::UsdcAddressNotFound)?;

        let usdc_client = TokenClient::new(&env, &usdc_address);
        let vault_usdc_balance = usdc_client.balance(&env.current_contract_address());

        if vault_usdc_balance < usdc_amount {
            return Err(ContractError::VaultDoesNotHaveEnoughUSDC);
        }

        // Execute the token exchange
        token_client.burn(&beneficiary, &token_balance);
        usdc_client.transfer(&env.current_contract_address(), &beneficiary, &usdc_amount);

        // Update total tokens redeemed (checked arithmetic — #26)
        let total_redeemed: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalTokensRedeemed)
            .unwrap_or(0);
        let new_total = total_redeemed
            .checked_add(token_balance)
            .ok_or(ContractError::ArithmeticOverflow)?;
        env.storage()
            .instance()
            .set(&DataKey::TotalTokensRedeemed, &new_total);

        // Emit claim event for indexers and explorers
        ClaimEvent {
            beneficiary: beneficiary.clone(),
            tokens_redeemed: token_balance,
            usdc_received: usdc_amount,
            roi_percentage,
        }
        .publish(&env);

        Ok(())
    }

    // ============ View/Getter Functions ============

    /// Returns the admin address.
    pub fn get_admin(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::AdminNotFound)
    }

    /// Returns whether claiming is currently enabled.
    pub fn is_enabled(env: Env) -> Result<bool, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage()
            .instance()
            .get(&DataKey::Enabled)
            .ok_or(ContractError::EnabledFlagNotFound)
    }

    /// Returns the ROI percentage (e.g., 5 means 5% return).
    pub fn get_roi_percentage(env: Env) -> Result<i128, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage()
            .instance()
            .get(&DataKey::RoiPercentage)
            .ok_or(ContractError::RoiPercentageNotFound)
    }

    /// Returns the participation token contract address.
    pub fn get_token_address(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(ContractError::TokenAddressNotFound)
    }

    /// Returns the USDC stablecoin contract address.
    pub fn get_usdc_address(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage()
            .instance()
            .get(&DataKey::UsdcAddress)
            .ok_or(ContractError::UsdcAddressNotFound)
    }

    /// Returns the current USDC balance held by the vault.
    pub fn get_vault_usdc_balance(env: Env) -> Result<i128, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        let usdc_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::UsdcAddress)
            .ok_or(ContractError::UsdcAddressNotFound)?;

        let usdc_client = TokenClient::new(&env, &usdc_address);
        Ok(usdc_client.balance(&env.current_contract_address()))
    }

    pub fn get_total_tokens_redeemed(env: Env) -> i128 {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        env.storage()
            .instance()
            .get(&DataKey::TotalTokensRedeemed)
            .unwrap_or(0)
    }

    // ============ Preview Functions ============

    /// Previews the claim for a beneficiary without executing it.
    /// Returns detailed information about what the beneficiary would receive.
    ///
    /// # Arguments
    /// * `beneficiary` - The address to preview the claim for
    ///
    /// # Returns
    /// A `Result<ClaimPreview, ContractError>` with all relevant claim information
    pub fn preview_claim(env: Env, beneficiary: Address) -> Result<ClaimPreview, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        let roi_percentage: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RoiPercentage)
            .ok_or(ContractError::RoiPercentageNotFound)?;

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(ContractError::TokenAddressNotFound)?;

        let token_client = TokenClient::new(&env, &token_address);
        let token_balance = token_client.balance(&beneficiary);

        let (usdc_amount, roi_amount) = if token_balance > 0 {
            let usdc = calculate_usdc_amount(token_balance, roi_percentage)?;
            let roi = usdc
                .checked_sub(token_balance)
                .ok_or(ContractError::ArithmeticOverflow)?;
            (usdc, roi)
        } else {
            (0, 0)
        };

        let usdc_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::UsdcAddress)
            .ok_or(ContractError::UsdcAddressNotFound)?;

        let usdc_client = TokenClient::new(&env, &usdc_address);
        let vault_usdc_balance = usdc_client.balance(&env.current_contract_address());

        let enabled: bool = env
            .storage()
            .instance()
            .get(&DataKey::Enabled)
            .ok_or(ContractError::EnabledFlagNotFound)?;

        Ok(ClaimPreview {
            token_balance,
            usdc_amount,
            roi_amount,
            vault_has_sufficient_balance: vault_usdc_balance >= usdc_amount,
            claim_enabled: enabled,
        })
    }

    // ============ Overview Functions ============

    /// Returns a complete snapshot of the vault's current state.
    /// Useful for dashboards and analytics integrations.
    pub fn get_vault_overview(env: Env) -> Result<VaultOverview, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::AdminNotFound)?;

        let enabled: bool = env
            .storage()
            .instance()
            .get(&DataKey::Enabled)
            .ok_or(ContractError::EnabledFlagNotFound)?;

        let roi_percentage: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RoiPercentage)
            .ok_or(ContractError::RoiPercentageNotFound)?;

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(ContractError::TokenAddressNotFound)?;

        let usdc_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::UsdcAddress)
            .ok_or(ContractError::UsdcAddressNotFound)?;

        let usdc_client = TokenClient::new(&env, &usdc_address);
        let vault_usdc_balance = usdc_client.balance(&env.current_contract_address());

        let total_tokens_redeemed: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalTokensRedeemed)
            .unwrap_or(0);

        Ok(VaultOverview {
            admin,
            enabled,
            roi_percentage,
            token_address,
            usdc_address,
            vault_usdc_balance,
            total_tokens_redeemed,
        })
    }
}
