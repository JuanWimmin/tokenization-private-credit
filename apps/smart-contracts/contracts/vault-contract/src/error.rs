use core::fmt;
use soroban_sdk::contracterror;

#[derive(Debug, Copy, Clone, PartialEq)]
#[contracterror]
pub enum ContractError {
    AdminNotFound = 1,
    OnlyAdminCanChangeAvailability = 2,
    ExchangeIsCurrentlyDisabled = 3,
    BeneficiaryHasNoTokensToClaim = 4,
    VaultDoesNotHaveEnoughUSDC = 5,
    TokenAndUsdcCannotBeSame = 6,
    InvalidAddressConfiguration = 7,
    AlreadyInitialized = 8,
    InvalidRoiPercentage = 9,
    EnabledFlagNotFound = 10,
    RoiPercentageNotFound = 11,
    TokenAddressNotFound = 12,
    UsdcAddressNotFound = 13,
    ArithmeticOverflow = 14,
    NotInitialized = 15,
}

impl fmt::Display for ContractError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ContractError::AdminNotFound => write!(f, "Admin not found"),
            ContractError::OnlyAdminCanChangeAvailability => {
                write!(f, "Only admin can change availability")
            }
            ContractError::ExchangeIsCurrentlyDisabled => {
                write!(f, "Exchange is currently disabled")
            }
            ContractError::BeneficiaryHasNoTokensToClaim => {
                write!(f, "Beneficiary has no tokens to claim")
            }
            ContractError::VaultDoesNotHaveEnoughUSDC => {
                write!(f, "Vault does not have enough USDC")
            }
            ContractError::TokenAndUsdcCannotBeSame => {
                write!(f, "Token and USDC addresses cannot be the same")
            }
            ContractError::InvalidAddressConfiguration => {
                write!(f, "Invalid address configuration: admin cannot be token or USDC address")
            }
            ContractError::AlreadyInitialized => {
                write!(f, "Contract has already been initialized")
            }
            ContractError::InvalidRoiPercentage => {
                write!(f, "ROI percentage must be between 0 and 100")
            }
            ContractError::EnabledFlagNotFound => {
                write!(f, "Enabled flag not found in storage")
            }
            ContractError::RoiPercentageNotFound => {
                write!(f, "ROI percentage not found in storage")
            }
            ContractError::TokenAddressNotFound => {
                write!(f, "Token address not found in storage")
            }
            ContractError::UsdcAddressNotFound => {
                write!(f, "USDC address not found in storage")
            }
            ContractError::ArithmeticOverflow => write!(f, "Arithmetic overflow"),
            ContractError::NotInitialized => write!(f, "Contract not initialized"),
        }
    }
}