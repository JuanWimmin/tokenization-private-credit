use soroban_sdk::{contract, contractimpl, panic_with_error, token, Address, Env};
use token::Client as TokenClient;

use crate::error::ContractError;
use crate::events::{AvailabilityChangedEvent, ClaimEvent, RoiPercentageChangedEvent};
use crate::storage_types::{DataKey, INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD};
use crate::types::{ClaimPreview, VaultOverview};
use crate::helper::{calculate_usdc_amount, get_required};

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    // ============ Constructor ============
    /// # Arguments
    /// * `admin` - The address that will control vault availability
    /// * `enabled` - Initial state of whether claiming is enabled
    /// * `roi_percentage` - The ROI percentage (e.g., 5 for 5% return). Must be 0..=100.
    /// * `token` - The participation token contract address (must be trusted)
    /// * `usdc` - The USDC stablecoin contract address (must be trusted
    pub fn __constructor(
        env: Env,
        admin: Address,
        enabled: bool,
        roi_percentage: u32,
        token: Address,
        usdc: Address,
    ) {
        const ROI_MAX: u32 = 100;
        let already_initialized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Initialized)
            .unwrap_or(false);
        if already_initialized {
            panic_with_error!(&env, ContractError::AlreadyInitialized);
        }

        if roi_percentage > ROI_MAX {
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

    /// Updates the ROI percentage. Only callable by the admin.
    ///
    /// # Arguments
    /// * `new_roi_percentage` - The new ROI percentage. Must be 0..=100.
    pub fn update_roi_porcentage(
        env: Env,
        new_roi_percentage: u32,
    ) -> Result<(), ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        let stored_admin: Address = get_required(&env, &DataKey::Admin)?;
        stored_admin.require_auth();

        const ROI_MAX: u32 = 100;
        if new_roi_percentage > ROI_MAX {
            panic_with_error!(&env, ContractError::InvalidRoiPercentage);
        }

        let old_roi_percentage: u32 = get_required(&env, &DataKey::RoiPercentage)?;

        env.storage()
            .instance()
            .set(&DataKey::RoiPercentage, &new_roi_percentage);

        RoiPercentageChangedEvent {
            admin: stored_admin,
            old_roi_percentage,
            new_roi_percentage,
        }
        .publish(&env);

        Ok(())
    }

    // ============ Claim Function ============

    /// Claims ROI for the beneficiary by exchanging their participation tokens for USDC.
    /// The beneficiary receives their tokens' value plus the ROI percentage.
    /// # Arguments
    /// * `beneficiary` - The address claiming their ROI (must have tokens)
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

        let roi_percentage: u32 = env
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
    pub fn get_roi_percentage(env: Env) -> Result<u32, ContractError> {
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
    pub fn preview_claim(env: Env, beneficiary: Address) -> Result<ClaimPreview, ContractError> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        let roi_percentage: u32 = env
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

        let roi_percentage: u32 = env
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
