use soroban_sdk::{Address, Env, IntoVal, Symbol, contract, contractimpl, token, vec};
use token::Client as TokenClient;

use crate::error::ContractError;
use crate::events::{emit_buy, emit_caps_updated, BuyEvent, CapsUpdatedEvent};
use crate::storage_types::DataKey;

#[contract]
pub struct TokenSaleContract;

fn read_escrow(e: &Env) -> Result<Address, ContractError> {
    e.storage()
        .instance()
        .get(&DataKey::EscrowContract)
        .ok_or(ContractError::EscrowContractNotFound)
}

fn read_participation_token(e: &Env) -> Result<Address, ContractError> {
    e.storage()
        .instance()
        .get(&DataKey::ParticipationToken)
        .ok_or(ContractError::ParticipationTokenNotFound)
}

fn read_admin(e: &Env) -> Result<Address, ContractError> {
    e.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(ContractError::AdminNotFound)
}

fn write_admin(e: &Env, admin: &Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
}

#[contractimpl]
impl TokenSaleContract {
    pub fn __constructor(
        env: Env,
        escrow_contract: Address,
        admin: Address,
        hard_cap: i128,
        max_per_investor: i128,
    ) {
        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow_contract);
        write_admin(&env, &admin);
        env.storage().instance().set(&DataKey::HardCap, &hard_cap);
        env.storage()
            .instance()
            .set(&DataKey::MaxPerInvestor, &max_per_investor);
        env.storage()
            .instance()
            .set(&DataKey::TotalMinted, &0_i128);
    }

    pub fn buy(
        env: Env,
        usdc: Address,
        payer: Address,
        beneficiary: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        if amount <= 0 {
            return Err(ContractError::AmountMustBePositive);
        }
        payer.require_auth();

        let escrow_contract = read_escrow(&env)?;
        let participation_token = read_participation_token(&env)?;

        // Read caps and current state
        let hard_cap: i128 = env
            .storage()
            .instance()
            .get(&DataKey::HardCap)
            .unwrap_or(0);
        let max_per_investor: i128 = env
            .storage()
            .instance()
            .get(&DataKey::MaxPerInvestor)
            .unwrap_or(0);
        let total_minted: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalMinted)
            .unwrap_or(0);
        let investor_balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::InvestorBalance(beneficiary.clone()))
            .unwrap_or(0);

        // Validate hard cap
        if hard_cap > 0 && total_minted + amount > hard_cap {
            return Err(ContractError::HardCapExceeded);
        }

        // Validate per-investor cap (0 means no limit)
        if max_per_investor > 0 && investor_balance + amount > max_per_investor {
            return Err(ContractError::InvestorCapExceeded);
        }

        // Transfer USDC to escrow
        let usdc_client = TokenClient::new(&env, &usdc);
        usdc_client.transfer(&payer, &escrow_contract, &amount);

        // Mint participation tokens
        let mint_sym = Symbol::new(&env, "mint");
        let args_vec = vec![&env, beneficiary.into_val(&env), amount.into_val(&env)];
        let _: () = env.invoke_contract(&participation_token, &mint_sym, args_vec);

        // Update counters after successful mint
        env.storage()
            .instance()
            .set(&DataKey::TotalMinted, &(total_minted + amount));
        env.storage()
            .persistent()
            .set(&DataKey::InvestorBalance(beneficiary.clone()), &(investor_balance + amount));

        emit_buy(
            &env,
            BuyEvent {
                payer,
                beneficiary,
                amount,
                usdc,
            },
        );

        Ok(())
    }

    pub fn get_admin(env: Env) -> Result<Address, ContractError> {
        read_admin(&env)
    }

    pub fn update_caps(
        env: Env,
        new_hard_cap: i128,
        new_max_per_investor: i128,
    ) -> Result<(), ContractError> {
        let admin = read_admin(&env)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::HardCap, &new_hard_cap);
        env.storage()
            .instance()
            .set(&DataKey::MaxPerInvestor, &new_max_per_investor);

        emit_caps_updated(
            &env,
            CapsUpdatedEvent {
                admin,
                new_hard_cap,
                new_max_per_investor,
            },
        );

        Ok(())
    }

    pub fn set_token(env: Env, new_token: Address) -> Result<(), ContractError> {
        let admin = read_admin(&env)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::ParticipationToken, &new_token);

        Ok(())
    }

    pub fn set_admin(env: Env, new_admin: Address) -> Result<(), ContractError> {
        let admin = read_admin(&env)?;
        admin.require_auth();

        write_admin(&env, &new_admin);

        Ok(())
    }
}
