# Vault Contract — Security & Trust Assumptions

## Overview

The vault contract (`contracts/vault-contract`) holds USDC and distributes it to investors who redeem their participation tokens plus ROI. It relies on three external addresses provided at deployment time: `token`, `usdc`, and `admin`.

**These addresses are immutable.** Once the contract is deployed, they cannot be changed. A misconfigured vault is permanently non-functional.

## Trust Assumptions

### 1. Token Address (`token`)

The `token` parameter must be the **participation token contract** deployed via the token factory during the tokenize escrow flow.

- The vault calls `balance()` and `burn()` on this address.
- If the address is not a valid Soroban token contract, all `claim()` calls will fail.
- If the address points to a malicious contract, it could report fake balances or fail to burn tokens.

**Verification:** After deploying the token factory, confirm that its contract address matches what you pass to the vault constructor. Cross-reference with the `set_token()` call on the participation token contract.

### 2. USDC Address (`usdc`)

The `usdc` parameter must be the **canonical USDC Stellar Asset Contract (SAC)** on the target network.

| Network | USDC Issuer |
|---------|-------------|
| Testnet | Use `register_stellar_asset_contract_v2` in tests |
| Mainnet | Verify the issuer against Circle's official documentation |

- The vault calls `balance()` and `transfer()` on this address.
- If the address is not the real USDC SAC, investors will receive worthless tokens or the transfer will fail.

**Verification:** Use Stellar Expert or the Horizon API to confirm the USDC contract address before deployment.

### 3. Admin Address (`admin`)

The `admin` controls whether the vault is open for claims via `availability_for_exchange()`.

- A compromised admin can disable claims permanently, locking investor funds.
- An admin set to a contract address may not be able to sign transactions.

**Recommendation:** Use a multisig or a well-secured operational wallet. Never use a personal development key for mainnet deployments.

## On-Chain Validations

The constructor enforces the following checks:

| Check | Error Code | Description |
|-------|-----------|-------------|
| Not already initialized | `AlreadyInitialized (8)` | Prevents constructor re-invocation on upgrade/redeploy |
| `token != usdc` | `TokenAndUsdcCannotBeSame (6)` | Prevents deploying with the same address for both token and USDC |
| `admin != token` | `InvalidAddressConfiguration (7)` | Prevents admin from being a token contract |
| `admin != usdc` | `InvalidAddressConfiguration (7)` | Prevents admin from being the USDC contract |

These are **basic sanity checks**, not a substitute for deployer diligence. They catch obvious misconfigurations but cannot verify that an address implements the correct interface or is the "right" contract.

## Initialization & Upgrade Behavior

The vault contract uses an `Initialized` storage flag as defense-in-depth against constructor re-invocation.

**How it works:**
1. On first deployment, `Initialized` is `false` (default). The constructor runs normally and sets it to `true`.
2. Any subsequent attempt to call the constructor will find `Initialized = true` and panic with `AlreadyInitialized (8)`.

**On WASM upgrades (`update_current_contract_wasm`):**
- Soroban does NOT re-call `__constructor` during WASM upgrades — storage is preserved.
- The `Initialized` flag remains `true`, so even if a future SDK version changes this behavior, the contract is protected.
- All existing storage (admin, token, usdc, etc.) persists through the upgrade.

**When re-deployment is needed:**
- If you need to change immutable parameters (token, usdc, admin), you must deploy a **new contract instance**. There is no migration path for these values.
- The old vault should be drained of USDC and disabled before deploying a replacement.

## Deployment Checklist

Before deploying a vault contract to any network:

- [ ] **Token address** — Confirm it matches the token factory contract deployed in the tokenize escrow flow
- [ ] **USDC address** — Verify it is the canonical USDC SAC for the target network
- [ ] **Admin address** — Ensure it is a secure, operational wallet (multisig preferred)
- [ ] **ROI percentage** — Double-check the value (e.g., 5 = 5%, not 0.05)
- [ ] **Enabled flag** — Set to `false` initially; enable only after funding the vault with USDC
- [ ] **Fund the vault** — Transfer sufficient USDC to cover all expected claims (principal + ROI)
- [ ] **Test a preview** — Call `preview_claim()` with a known beneficiary to verify the math

## Token Registry (Future)

Soroban does not currently provide a native on-chain token registry. When the Stellar ecosystem introduces one, the constructor should be updated to validate `token` and `usdc` against it. This would provide a stronger guarantee that the addresses are legitimate token contracts.

For now, off-chain verification (deployment scripts, CI checks, manual review) is the recommended approach.

## Related Files

- **Contract**: `apps/smart-contracts/contracts/vault-contract/src/contract.rs`
- **Error codes**: `apps/smart-contracts/contracts/vault-contract/src/error.rs`
- **Deployment flow**: `docs/TOKENIZE-ESCROW.md`
- **Product context**: `docs/PRODUCT.md`
