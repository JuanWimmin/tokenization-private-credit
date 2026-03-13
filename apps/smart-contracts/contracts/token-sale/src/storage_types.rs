use soroban_sdk::{contracttype, Address};

#[contracttype]
pub enum DataKey {
    EscrowContract,
    ParticipationToken,
    Admin,
    HardCap,
    MaxPerInvestor,
    TotalMinted,
    InvestorBalance(Address),
}
