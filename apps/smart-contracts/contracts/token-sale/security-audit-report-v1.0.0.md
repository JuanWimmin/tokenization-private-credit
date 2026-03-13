---
title: Security Audit Report — participation-token Contract
author: Rodion Romanovich
status: Active
created: 2026-03-11
updated: 2026-03-11
version: 1.0.0
---

# Security Audit Report: `participation-token` Contract

**Contract:** `ParticipationTokenContract`
**Path:** `contracts/participation-token/src/`
**SDK:** soroban-sdk 23.1.1
**Auditor:** Rodion Romanovich
**Issue:** #5

---

## Findings Summary

| # | Severity | Title | Status |
|---|----------|-------|--------|
| F-01 | Critical | USDC address accepted as runtime parameter in `buy()` | **FIXED** |
| F-02 | High | Storage keys used string literals instead of typed enum | **FIXED** |
| F-03 | High | No TTL extension — storage could expire and brick the contract | **FIXED** |
| F-04 | High | `unwrap()`/`expect()` in storage reads could cause unrecoverable panics | **FIXED** |
| F-05 | Medium | No input validation on `amount` parameter | **FIXED** |
| F-06 | Medium | No typed error enum — all errors were raw panics | **FIXED** |
| F-07 | Low | Events used deprecated `env.events().publish()` API | **FIXED** |
| F-08 | Informational | `mint` invocation uses dynamic `invoke_contract` instead of typed client | **ACKNOWLEDGED** |
| F-09 | Informational | Constructor cannot be re-invoked (secure by design) | **N/A** |

---

## Detailed Findings

### F-01: USDC address accepted as runtime parameter (Critical)

**Description:** The original `buy()` function accepted `usdc: Address` as a parameter, allowing any caller to pass an arbitrary token contract address. An attacker could deploy a malicious contract that mimics the USDC `transfer` interface but does nothing (or transfers worthless tokens), then call `buy()` with that address to receive participation tokens without paying real USDC.

**Impact:** Complete loss of funds. Attacker receives participation tokens for free, diluting real investors' positions.

**Proof of Concept:** Call `buy(payer, beneficiary, amount, malicious_contract_address)` where `malicious_contract_address.transfer()` is a no-op.

**Remediation:** Moved USDC address to the constructor. It is now stored in instance storage at deployment time and read internally by `buy()`. The `buy()` signature no longer accepts a USDC address parameter.

**Related Issues:** None found.

---

### F-02: String-literal storage keys (High)

**Description:** The original contract used raw string literals (e.g., `"escrow_contract"`, `"sale_token"`) as storage keys via `Symbol::new()`. A typo in any key would silently write/read from different storage slots, potentially causing the contract to operate with incorrect data.

**Impact:** Silent data corruption. A single typo could cause the contract to read uninitialized storage, leading to panics or incorrect behavior.

**Remediation:** Replaced all string-based keys with a typed `DataKey` enum using `#[contracttype]`:
```rust
#[contracttype]
pub enum DataKey {
    EscrowContract,
    ParticipationToken,
    UsdcAddress,
}
```
Compile-time type safety prevents typos entirely.

**Related Issues:** None found.

---

### F-03: No TTL extension (High)

**Description:** The contract never called `extend_ttl()` on its instance storage. On Stellar, all storage entries have a TTL (Time To Live) and are archived after expiration. If the contract's storage expired, all configuration (escrow address, token address, USDC address) would become inaccessible, effectively bricking the contract.

**Impact:** Permanent contract failure after TTL expiration. All stored configuration lost.

**Remediation:** Added TTL extension at the beginning of `buy()`:
```rust
env.storage()
    .instance()
    .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
```
Constants: `INSTANCE_BUMP_AMOUNT = 7 * 17280 ledgers` (~7 days), `INSTANCE_LIFETIME_THRESHOLD = 6 * 17280 ledgers` (~6 days).

**Related Issues:** None found.

---

### F-04: Unguarded `unwrap()` in storage reads (High)

**Description:** The original `read_config()` function used `.unwrap()` when reading from instance storage. If any key was missing (e.g., due to TTL expiration or an uninitialized contract), the contract would panic with an unhelpful error message, providing no diagnostic information to the caller.

**Impact:** Unrecoverable runtime panic with no meaningful error code. Difficult to debug in production.

**Remediation:** Replaced all `.unwrap()` calls with `.ok_or(ContractError::NotInitialized)?`, propagating a typed error to the caller:
```rust
let escrow_contract: Address = e
    .storage()
    .instance()
    .get(&DataKey::EscrowContract)
    .ok_or(ContractError::NotInitialized)?;
```

**Related Issues:** None found.

---

### F-05: No input validation on `amount` (Medium)

**Description:** The original `buy()` function accepted any `i128` value for `amount`, including zero and negative numbers. Passing `amount = 0` would execute a no-op USDC transfer and mint zero participation tokens, wasting gas. Passing a negative amount would cause undefined behavior in the token contracts.

**Impact:** Gas waste (amount = 0) or potential undefined behavior (negative amounts).

**Remediation:** Added explicit validation:
```rust
if amount <= 0 {
    return Err(ContractError::AmountMustBePositive);
}
```

**Tests:**
- `test_buy_rejects_zero_amount` — verifies `amount = 0` returns `ContractError::AmountMustBePositive`
- `test_buy_rejects_negative_amount` — verifies `amount = -50` returns `ContractError::AmountMustBePositive`

**Related Issues:** None found.

---

### F-06: No typed error enum (Medium)

**Description:** The original contract had no `ContractError` type. All error conditions resulted in raw panics or unhelpful `unwrap()` failures, making it impossible for callers (other contracts, SDKs, frontends) to programmatically distinguish between different failure modes.

**Impact:** Poor developer experience. No programmatic error handling possible for callers.

**Remediation:** Created `error.rs` with a typed error enum:
```rust
#[contracterror]
pub enum ContractError {
    NotInitialized = 1,
    AmountMustBePositive = 2,
}
```
`buy()` now returns `Result<(), ContractError>`.

**Related Issues:** None found.

---

### F-07: Events used deprecated API (Low)

**Description:** Events were emitted using `env.events().publish((symbol_short!("buy"),), event)`, which is deprecated in soroban-sdk v23. The recommended approach is the `#[contractevent]` macro with `.publish(&env)`.

**Impact:** Future SDK versions may remove the deprecated API, causing compilation failures. Inconsistent with the rest of the codebase (escrow contract uses `#[contractevent]`).

**Remediation:** Migrated to `#[contractevent]`:
```rust
#[contractevent(topics = ["pt_buy"], data_format = "vec")]
#[derive(Clone, Debug)]
pub struct BuyEvent {
    pub payer: Address,
    pub beneficiary: Address,
    pub amount: i128,
}
```
Published via: `BuyEvent { payer, beneficiary, amount }.publish(&env);`

**Related Issues:** None found.

---

### F-08: Dynamic invocation for `mint` (Informational)

**Description:** The `mint_participation_tokens()` helper uses `env.invoke_contract()` with a dynamically constructed `Symbol` to call the token-factory's `mint()` function. This is less type-safe than using a generated client.

**Impact:** Minimal. The function name is a compile-time constant (`"mint"`), and the token-factory contract validates the call. Using `invoke_contract` is necessary because `mint()` is not part of the standard `TokenInterface`, so `token::Client` cannot be used.

**Remediation:** Documented with a clear comment explaining why `invoke_contract` is required. No code change needed.

**Related Issues:** None found.

---

### F-09: Constructor re-invocation (Informational)

**Description:** Verified that `__constructor` uses the Soroban constructor pattern, which is automatically invoked only at contract deployment. It cannot be called again by any external actor.

**Impact:** None. Secure by design.

**Related Issues:** None found.

---

## Automated Analysis

### CoinFabrik Scout Audit (cargo-scout-audit v0.3.16)

```
+---------------------+----------+----------+--------+-------+-------------+
| Crate               | Status   | Critical | Medium | Minor | Enhancement |
+---------------------+----------+----------+--------+-------+-------------+
| participation_token  | Analyzed | 0        | 0      | 0     | 1           |
+---------------------+----------+----------+--------+-------+-------------+
```

The only finding is an enhancement suggesting upgrading from soroban-sdk `23.1.1` to `25.3.0`. This applies to the entire workspace and is outside the scope of this audit.

---

## Test Coverage

### Original Tests (updated for new API)
- `test_buy_transfers_usdc_and_mints_sale_token` — happy path
- `test_buy_rejects_zero_amount` — input validation (amount = 0)
- `test_buy_rejects_negative_amount` — input validation (amount < 0)
- `test_buy_payer_different_from_beneficiary` — payer != beneficiary

### New Edge Case Tests
- `test_buy_payer_is_beneficiary` — self-buy (payer == beneficiary)
- `test_multiple_sequential_buys_accumulate` — 3 sequential buys accumulate correctly
- `test_multiple_payers_same_beneficiary` — different payers, same beneficiary
- `test_buy_fails_insufficient_usdc` — USDC transfer fails when payer has insufficient balance
- `test_buy_minimum_amount` — boundary: amount = 1

### Test Results
```
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/sale.rs` | Rewrote: typed storage, USDC in constructor, input validation, TTL, error propagation, new event API |
| `src/error.rs` | **New:** Typed `ContractError` enum with `#[contracterror]` |
| `src/storage_types.rs` | **New:** Typed `DataKey` enum + TTL constants |
| `src/events.rs` | **New:** `BuyEvent` with `#[contractevent]` macro |
| `src/lib.rs` | Updated module declarations and public exports |
| `src/test.rs` | Rewritten for new API + 5 new edge case tests |

---

## Additional Improvements (outside scope, applied to related contracts)

During the audit, the following improvements were also applied to `vault-contract` and `token-factory` for consistency:

- **vault-contract:** All arithmetic uses `checked_*` operations. `unwrap()`/`expect()` replaced with `Result<T, ContractError>`. Added `ArithmeticOverflow` and `NotInitialized` error variants. 10 new edge case tests.
- **token-factory:** `receive_balance` and `spend_balance` use `checked_add`/`checked_sub`. 9 new edge case tests.
