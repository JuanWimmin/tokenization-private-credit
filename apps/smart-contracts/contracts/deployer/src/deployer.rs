use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, IntoVal, String, Symbol, Val, Vec,
    vec,
};

use crate::storage_types::DataKey;

/// Result of deploying the full contract suite.
#[derive(Clone, Debug)]
#[contracttype]
pub struct DeployedContracts {
    pub participation_token: Address,
    pub token_sale: Address,
    pub vault_contract: Address,
}

/// Parameters for deploying the full contract suite.
#[derive(Clone, Debug)]
#[contracttype]
pub struct DeployAllParams {
    pub participation_salt: BytesN<32>,
    pub token_sale_salt: BytesN<32>,
    pub vault_salt: BytesN<32>,
    pub token_name: String,
    pub token_symbol: String,
    pub decimal: u32,
    pub escrow_contract: Address,
    pub vault_admin: Address,
    pub vault_enabled: bool,
    pub roi_percentage: u32,
    pub usdc: Address,
    pub token_sale_admin: Address,
    pub hard_cap: i128,
    pub max_per_investor: i128,
}

#[contract]
pub struct DeployerContract;

#[contractimpl]
impl DeployerContract {
    /// Initializes the deployer factory with the admin and WASM hashes
    /// of the contracts it will deploy.
    ///
    /// # Arguments
    /// * `admin` - The deployer admin address
    /// * `participation_token_wasm` - WASM hash for the participation-token contract
    /// * `token_sale_wasm` - WASM hash for the token-sale contract
    /// * `vault_contract_wasm` - WASM hash for the vault-contract contract
    pub fn __constructor(
        env: Env,
        admin: Address,
        participation_token_wasm: BytesN<32>,
        token_sale_wasm: BytesN<32>,
        vault_contract_wasm: BytesN<32>,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ParticipationTokenWasm, &participation_token_wasm);
        env.storage()
            .instance()
            .set(&DataKey::TokenSaleWasm, &token_sale_wasm);
        env.storage()
            .instance()
            .set(&DataKey::VaultContractWasm, &vault_contract_wasm);
    }

    // ============ Individual Deploy Functions ============

    /// Deploys a new participation-token (fungible token) instance.
    ///
    /// # Arguments
    /// * `salt` - Unique salt for deterministic address derivation
    /// * `name` - Token name
    /// * `symbol` - Token symbol
    /// * `escrow_contract` - Escrow contract address (immutable after init)
    /// * `decimal` - Token decimals (max 18)
    /// * `mint_authority` - Address authorized to mint tokens
    pub fn deploy_participation_token(
        env: Env,
        salt: BytesN<32>,
        name: String,
        symbol: String,
        escrow_contract: Address,
        decimal: u32,
        mint_authority: Address,
    ) -> Address {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::ParticipationTokenWasm)
            .unwrap();

        let constructor_args: Vec<Val> = (
            name,
            symbol,
            escrow_contract,
            decimal,
            mint_authority,
        )
            .into_val(&env);

        env.deployer()
            .with_current_contract(salt)
            .deploy_v2(wasm_hash, constructor_args)
    }

    /// Deploys a new token-sale contract instance.
    ///
    /// # Arguments
    /// * `salt` - Unique salt for deterministic address derivation
    /// * `escrow_contract` - The escrow contract address to receive USDC
    /// * `token_sale_admin` - The admin address for the token-sale contract
    /// * `hard_cap` - Maximum total tokens that can be sold (0 = no limit)
    /// * `max_per_investor` - Maximum tokens per investor (0 = no limit)
    ///
    /// Note: the participation-token address must be set after deployment
    /// by calling `set_token` from the token-sale admin.
    pub fn deploy_token_sale(
        env: Env,
        salt: BytesN<32>,
        escrow_contract: Address,
        token_sale_admin: Address,
        hard_cap: i128,
        max_per_investor: i128,
    ) -> Address {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::TokenSaleWasm)
            .unwrap();

        let constructor_args: Vec<Val> = (
            escrow_contract,
            token_sale_admin,
            hard_cap,
            max_per_investor,
        ).into_val(&env);

        env.deployer()
            .with_current_contract(salt)
            .deploy_v2(wasm_hash, constructor_args)
    }

    /// Deploys a new vault-contract instance.
    ///
    /// # Arguments
    /// * `salt` - Unique salt for deterministic address derivation
    /// * `vault_admin` - The admin address for the vault
    /// * `enabled` - Initial enabled state for claiming
    /// * `roi_percentage` - ROI percentage (e.g., 5 for 5%)
    /// * `token` - The participation token address
    /// * `usdc` - The USDC stablecoin contract address
    pub fn deploy_vault_contract(
        env: Env,
        salt: BytesN<32>,
        vault_admin: Address,
        enabled: bool,
        roi_percentage: u32,
        token: Address,
        usdc: Address,
    ) -> Address {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::VaultContractWasm)
            .unwrap();

        let constructor_args: Vec<Val> = (
            vault_admin,
            enabled,
            roi_percentage,
            token,
            usdc,
        )
            .into_val(&env);

        env.deployer()
            .with_current_contract(salt)
            .deploy_v2(wasm_hash, constructor_args)
    }

    // ============ Full Suite Deploy ============

    /// Deploys all three contracts in the correct order.
    ///
    /// Strategy:
    /// 1. Deploy token-sale (no participation-token needed in constructor)
    /// 2. Deploy participation-token with token-sale as direct mint_authority
    /// 3. Wire token-sale → participation-token via `set_token` (deployer is temp admin)
    /// 4. Transfer token-sale admin to params.token_sale_admin via `set_admin`
    /// 5. Deploy vault-contract pointing to the participation-token
    pub fn deploy_all(env: Env, signer: Address, params: DeployAllParams) -> DeployedContracts {
        signer.require_auth();

        let participation_token_wasm: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::ParticipationTokenWasm)
            .unwrap();
        let token_sale_wasm: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::TokenSaleWasm)
            .unwrap();
        let vault_contract_wasm: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::VaultContractWasm)
            .unwrap();

        let deployer_addr = env.current_contract_address();

        // Step 1: Deploy token-sale with deployer as temporary admin
        // (allows deployer to call set_token and set_admin in steps 3-4)
        let token_sale_args: Vec<Val> = (
            params.escrow_contract.clone(),
            deployer_addr.clone(),
            params.hard_cap,
            params.max_per_investor,
        ).into_val(&env);

        let token_sale_addr = env
            .deployer()
            .with_current_contract(params.token_sale_salt)
            .deploy_v2(token_sale_wasm, token_sale_args);

        // Step 2: Deploy participation-token with token-sale as direct mint_authority
        let participation_token_args: Vec<Val> = (
            params.token_name,
            params.token_symbol,
            params.escrow_contract,
            params.decimal,
            token_sale_addr.clone(),
        )
            .into_val(&env);

        let participation_token_addr = env
            .deployer()
            .with_current_contract(params.participation_salt)
            .deploy_v2(participation_token_wasm, participation_token_args);

        // Step 3: Wire token-sale to its participation-token
        let set_token_args = vec![&env, participation_token_addr.clone().into_val(&env)];
        env.invoke_contract::<()>(
            &token_sale_addr,
            &Symbol::new(&env, "set_token"),
            set_token_args,
        );

        // Step 4: Transfer token-sale admin to the intended admin
        let set_admin_args = vec![&env, params.token_sale_admin.into_val(&env)];
        env.invoke_contract::<()>(
            &token_sale_addr,
            &Symbol::new(&env, "set_admin"),
            set_admin_args,
        );

        // Step 5: Deploy vault-contract pointing to the participation-token
        let vault_args: Vec<Val> = (
            params.vault_admin,
            params.vault_enabled,
            params.roi_percentage,
            participation_token_addr.clone(),
            params.usdc,
        )
            .into_val(&env);

        let vault_addr = env
            .deployer()
            .with_current_contract(params.vault_salt)
            .deploy_v2(vault_contract_wasm, vault_args);

        DeployedContracts {
            participation_token: participation_token_addr,
            token_sale: token_sale_addr,
            vault_contract: vault_addr,
        }
    }

    // ============ Admin Functions ============

    /// Updates a WASM hash for a contract type.
    pub fn update_wasm(env: Env, key: DataKey, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&key, &new_wasm_hash);
    }

    /// Returns the stored admin address.
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}
