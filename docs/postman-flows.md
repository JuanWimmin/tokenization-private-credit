# Flujos de Prueba en Postman — Tokenization Platform

## Índice

1. [Configuración del Entorno](#1-configuración-del-entorno)
2. [Flujo Completo del Emisor (Issuer)](#2-flujo-completo-del-emisor-issuer)
3. [Flujo Completo del Inversor (Investor)](#3-flujo-completo-del-inversor-investor)
4. [Deploy: Despliegue Individual de Contratos](#4-deploy-despliegue-individual-de-contratos)
5. [Participation Token: Operaciones](#5-participation-token-operaciones)
6. [Token Sale: Operaciones](#6-token-sale-operaciones)
7. [Vault: Operaciones](#7-vault-operaciones)
8. [Campaigns: CRUD](#8-campaigns-crud)
9. [Investments: CRUD](#9-investments-crud)
10. [Loans: CRUD](#10-loans-crud)
11. [Referencia de Errores Comunes](#11-referencia-de-errores-comunes)

---

## 1. Configuración del Entorno

### Variables de Entorno en Postman

Crear un entorno en Postman con las siguientes variables:

| Variable | Valor inicial | Descripción |
|----------|--------------|-------------|
| `BASE_URL` | `http://localhost:4000` | URL base del backend |
| `API_KEY` | `<tu-api-key>` | Valor del header `x-api-key` |
| `CALLER_PUBLIC_KEY` | `G...` | Clave pública del caller (issuer o admin) |
| `INVESTOR_PUBLIC_KEY` | `G...` | Clave pública del inversor |
| `ESCROW_CONTRACT_ID` | — | ID del contrato escrow (de Trustless Work) |
| `PARTICIPATION_TOKEN_ID` | — | ID del contrato participation token (se llena tras deploy) |
| `TOKEN_SALE_ID` | — | ID del contrato token sale (se llena tras deploy) |
| `VAULT_ID` | — | ID del contrato vault (se llena tras deploy) |
| `CAMPAIGN_ID` | — | UUID de la campaña (se llena tras crear campaign) |
| `USDC_CONTRACT_ID` | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` | Contrato USDC testnet |

### Header Global (aplicar en todas las requests)

```
x-api-key: {{API_KEY}}
Content-Type: application/json
```

### Nota sobre XDR

Todos los endpoints de escritura de contratos devuelven `{ "unsignedXdr": "..." }`.
El XDR debe firmarse con la clave privada del `callerPublicKey` y luego enviarse a la red Stellar.
Para pruebas, puedes usar [Stellar Laboratory](https://laboratory.stellar.org/) para firmar y enviar.

---

## 2. Flujo Completo del Emisor (Issuer)

Este es el flujo principal de punta a punta para crear y gestionar una campaña de tokenización.

```
[1] Crear Campaign (DRAFT/FUNDRAISING)
        ↓
[2] Deploy All (participation token + token sale + vault)
        ↓
[3] Actualizar Campaign con IDs de contratos
        ↓
[4] Cambiar status → ACTIVE (fondos capturados por escrow)
        ↓
[5] Cambiar status → REPAYMENT (loans activos)
        ↓
[6] Habilitar Vault (availability_for_exchange)
        ↓
[7] Cambiar status → CLAIMABLE
        ↓
[8] (Inversores reclaman) → CLOSED
```

---

### Paso 1 — Crear Campaña

**POST** `{{BASE_URL}}/campaigns`

```json
{
  "name": "Private Credit Fund Alpha",
  "description": "Fondo de crédito privado para PYMES",
  "issuerAddress": "{{CALLER_PUBLIC_KEY}}",
  "escrowId": "{{ESCROW_CONTRACT_ID}}",
  "poolSize": 100000,
  "loanDuration": 12,
  "expectedReturn": 15,
  "loanSize": 50000,
  "tokenFactoryId": "placeholder",
  "tokenSaleId": "placeholder"
}
```

**Respuesta esperada:**

```json
{
  "id": "uuid-de-la-campaña",
  "name": "Private Credit Fund Alpha",
  "status": "FUNDRAISING",
  "escrowId": "{{ESCROW_CONTRACT_ID}}",
  ...
}
```

> **Acción:** Guardar `id` en la variable `CAMPAIGN_ID`.

---

### Paso 2 — Deploy All (todos los contratos de una vez)

**POST** `{{BASE_URL}}/deploy/all`

```json
{
  "tokenName": "Alpha Credit Token",
  "tokenSymbol": "ACT",
  "escrowId": "{{ESCROW_CONTRACT_ID}}",
  "escrowContract": "{{ESCROW_CONTRACT_ID}}",
  "roiPercentage": 15,
  "hardCap": 100000,
  "maxPerInvestor": 10000,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta esperada:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> **Acciones:**
> 1. Firmar el XDR con la clave privada del issuer.
> 2. Enviar la transacción a Stellar Testnet.
> 3. En el resultado de la transacción, identificar los IDs de los 3 contratos desplegados.
> 4. Guardar en variables: `PARTICIPATION_TOKEN_ID`, `TOKEN_SALE_ID`, `VAULT_ID`.

---

### Paso 3 — Actualizar Campaign con IDs de contratos

**PATCH** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}`

```json
{
  "tokenFactoryId": "{{PARTICIPATION_TOKEN_ID}}",
  "tokenSaleId": "{{TOKEN_SALE_ID}}",
  "vaultId": "{{VAULT_ID}}"
}
```

**Respuesta esperada:**

```json
{
  "id": "{{CAMPAIGN_ID}}",
  "tokenFactoryId": "{{PARTICIPATION_TOKEN_ID}}",
  "tokenSaleId": "{{TOKEN_SALE_ID}}",
  "vaultId": "{{VAULT_ID}}",
  ...
}
```

---

### Paso 4 — Cambiar estado a ACTIVE

**PATCH** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}/status`

```json
{
  "status": "ACTIVE"
}
```

**Respuesta esperada:**

```json
{
  "id": "{{CAMPAIGN_ID}}",
  "status": "ACTIVE",
  ...
}
```

---

### Paso 5 — Cambiar estado a REPAYMENT

**PATCH** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}/status`

```json
{
  "status": "REPAYMENT"
}
```

---

### Paso 6 — Habilitar Vault para claims

**POST** `{{BASE_URL}}/vault/availability-for-exchange`

```json
{
  "contractId": "{{VAULT_ID}}",
  "enabled": true,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}",
  "campaignId": "{{CAMPAIGN_ID}}"
}
```

**Respuesta esperada:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> **Nota:** Si se provee `campaignId`, el sistema automáticamente actualiza el status de la campaña a `CLAIMABLE` en la base de datos al ejecutar la transacción.

---

### Paso 7 — Cambiar estado a CLAIMABLE

**PATCH** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}/status`

```json
{
  "status": "CLAIMABLE"
}
```

---

### Paso 8 — Cambiar estado a CLOSED (cuando todos reclamaron)

**PATCH** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}/status`

```json
{
  "status": "CLOSED"
}
```

---

## 3. Flujo Completo del Inversor (Investor)

```
[1] Consultar campaña disponible
        ↓
[2] Aprobar USDC al token sale (approve en token USDC)
        ↓
[3] Comprar tokens (buy en token sale)
        ↓
[4] Registrar inversión en DB
        ↓
[5] Ver balance de participation tokens
        ↓
[6] (Cuando vault habilitado) Preview claim
        ↓
[7] Claim tokens + ROI
```

---

### Paso 1 — Consultar campaña

**GET** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}`

**Respuesta esperada:**

```json
{
  "id": "{{CAMPAIGN_ID}}",
  "name": "Private Credit Fund Alpha",
  "status": "FUNDRAISING",
  "tokenSaleId": "{{TOKEN_SALE_ID}}",
  "tokenFactoryId": "{{PARTICIPATION_TOKEN_ID}}",
  "poolSize": "100000",
  "loanSize": "50000",
  "expectedReturn": "15",
  ...
}
```

---

### Paso 2 — Comprar tokens (token sale buy)

> **Nota:** El contrato de token sale maneja la transferencia de USDC internamente.
> El inversor necesita haber aprobado el gasto de USDC al contrato de token sale previamente.

**POST** `{{BASE_URL}}/token-sale/buy`

```json
{
  "contractId": "{{TOKEN_SALE_ID}}",
  "usdcAddress": "{{USDC_CONTRACT_ID}}",
  "payer": "{{INVESTOR_PUBLIC_KEY}}",
  "beneficiary": "{{INVESTOR_PUBLIC_KEY}}",
  "amount": 1000,
  "callerPublicKey": "{{INVESTOR_PUBLIC_KEY}}"
}
```

**Respuesta esperada:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> **Acciones:**
> 1. Firmar y enviar el XDR.
> 2. Guardar el `txHash` resultante.

---

### Paso 3 — Registrar inversión en DB

**POST** `{{BASE_URL}}/investments`

```json
{
  "campaignId": "{{CAMPAIGN_ID}}",
  "investorAddress": "{{INVESTOR_PUBLIC_KEY}}",
  "usdcAmount": 1000,
  "tokenAmount": 1000,
  "txHash": "hash-de-la-transaccion-stellar"
}
```

**Respuesta esperada:**

```json
{
  "id": "uuid-de-la-inversion",
  "campaignId": "{{CAMPAIGN_ID}}",
  "investorAddress": "{{INVESTOR_PUBLIC_KEY}}",
  "usdcAmount": "1000",
  "tokenAmount": "1000",
  "txHash": "hash...",
  ...
}
```

---

### Paso 4 — Ver balance de participation tokens

**GET** `{{BASE_URL}}/participation-token/balance?contractId={{PARTICIPATION_TOKEN_ID}}&address={{INVESTOR_PUBLIC_KEY}}&callerPublicKey={{INVESTOR_PUBLIC_KEY}}`

**Respuesta esperada:**

```json
{
  "balance": "10000000000"
}
```

> **Nota:** El balance se devuelve en unidades base (7 decimales). Para el monto real: `balance / 10^7`.

---

### Paso 5 — Preview claim (cuando vault está habilitado)

**GET** `{{BASE_URL}}/vault/preview-claim?contractId={{VAULT_ID}}&beneficiary={{INVESTOR_PUBLIC_KEY}}&callerPublicKey={{INVESTOR_PUBLIC_KEY}}`

**Respuesta esperada:**

```json
{
  "usdcAmount": "1150000000",
  "tokenAmount": "1000000000"
}
```

---

### Paso 6 — Reclamar tokens + ROI

**POST** `{{BASE_URL}}/vault/claim`

```json
{
  "contractId": "{{VAULT_ID}}",
  "beneficiary": "{{INVESTOR_PUBLIC_KEY}}",
  "callerPublicKey": "{{INVESTOR_PUBLIC_KEY}}"
}
```

**Respuesta esperada:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> **Acción:** Firmar y enviar el XDR. El inversor recibirá USDC (principal + ROI) y sus participation tokens serán quemados.

---

## 4. Deploy: Despliegue Individual de Contratos

### 4.1 Deploy Participation Token

**POST** `{{BASE_URL}}/deploy/participation-token`

```json
{
  "name": "Alpha Credit Token",
  "symbol": "ACT",
  "escrowContractId": "{{ESCROW_CONTRACT_ID}}",
  "mintAuthority": "{{CALLER_PUBLIC_KEY}}",
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Utiliza `PARTICIPATION_TOKEN_WASM_HASH` del entorno del servidor.
> Token decimals = 7 (hardcoded).

---

### 4.2 Deploy Token Sale

**POST** `{{BASE_URL}}/deploy/token-sale`

```json
{
  "escrowContractId": "{{ESCROW_CONTRACT_ID}}",
  "admin": "{{CALLER_PUBLIC_KEY}}",
  "hardCap": 100000,
  "maxPerInvestor": 10000,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Utiliza `TOKEN_SALE_WASM_HASH` del entorno del servidor.

---

### 4.3 Deploy Vault

**POST** `{{BASE_URL}}/deploy/vault`

```json
{
  "admin": "{{CALLER_PUBLIC_KEY}}",
  "enabled": false,
  "roiPercentage": 15,
  "token": "{{PARTICIPATION_TOKEN_ID}}",
  "usdc": "{{USDC_CONTRACT_ID}}",
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Utiliza `VAULT_WASM_HASH` del entorno del servidor.
> Se recomienda iniciar el vault con `enabled: false` hasta que la campaña esté lista para claims.

---

### 4.4 Deploy All (recomendado para flujo completo)

**POST** `{{BASE_URL}}/deploy/all`

```json
{
  "tokenName": "Alpha Credit Token",
  "tokenSymbol": "ACT",
  "escrowId": "{{ESCROW_CONTRACT_ID}}",
  "escrowContract": "{{ESCROW_CONTRACT_ID}}",
  "roiPercentage": 15,
  "hardCap": 100000,
  "maxPerInvestor": 10000,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Llama al método `deploy_all` del contrato `DEPLOYER_CONTRACT_ID`.
> Despliega los 3 contratos en una sola transacción con salts aleatorios.
> El USDC se usa: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`.
> El vault inicia deshabilitado (`vault_enabled: false`).

---

### 4.5 Set Admin (cualquier contrato)

**POST** `{{BASE_URL}}/deploy/set-admin`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "newAdmin": "GNEW_ADMIN_ADDRESS",
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

---

## 5. Participation Token: Operaciones

### 5.1 Mint (emitir tokens)

**POST** `{{BASE_URL}}/participation-token/mint`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "to": "{{INVESTOR_PUBLIC_KEY}}",
  "amount": 1000,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Solo el `mintAuthority` puede mintear tokens.

---

### 5.2 Transfer (transferir tokens)

**POST** `{{BASE_URL}}/participation-token/transfer`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "from": "{{INVESTOR_PUBLIC_KEY}}",
  "to": "GDESTINATION_ADDRESS",
  "amount": 100,
  "callerPublicKey": "{{INVESTOR_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

---

### 5.3 Approve (aprobar allowance)

**POST** `{{BASE_URL}}/participation-token/approve`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "from": "{{INVESTOR_PUBLIC_KEY}}",
  "spender": "{{VAULT_ID}}",
  "amount": 1000,
  "expirationLedger": 999999,
  "callerPublicKey": "{{INVESTOR_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> `expirationLedger`: número de ledger en que expira la aprobación.
> Obtener el ledger actual en [Stellar Expert](https://stellar.expert/explorer/testnet).

---

### 5.4 Transfer From (transferir con allowance)

**POST** `{{BASE_URL}}/participation-token/transfer-from`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "spender": "{{CALLER_PUBLIC_KEY}}",
  "from": "{{INVESTOR_PUBLIC_KEY}}",
  "to": "GDESTINATION_ADDRESS",
  "amount": 100,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

---

### 5.5 Burn (quemar tokens)

**POST** `{{BASE_URL}}/participation-token/burn`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "from": "{{INVESTOR_PUBLIC_KEY}}",
  "amount": 100,
  "callerPublicKey": "{{INVESTOR_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

---

### 5.6 Burn From (quemar con allowance)

**POST** `{{BASE_URL}}/participation-token/burn-from`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "spender": "{{CALLER_PUBLIC_KEY}}",
  "from": "{{INVESTOR_PUBLIC_KEY}}",
  "amount": 100,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

---

### 5.7 Set Admin (participation token)

**POST** `{{BASE_URL}}/participation-token/set-admin`

```json
{
  "contractId": "{{PARTICIPATION_TOKEN_ID}}",
  "newAdmin": "GNEW_ADMIN_ADDRESS",
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

---

### 5.8 Balance (lectura)

**GET** `{{BASE_URL}}/participation-token/balance`

**Query params:**

| Param | Valor |
|-------|-------|
| `contractId` | `{{PARTICIPATION_TOKEN_ID}}` |
| `address` | `{{INVESTOR_PUBLIC_KEY}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "balance": "10000000000"
}
```

---

### 5.9 Allowance (lectura)

**GET** `{{BASE_URL}}/participation-token/allowance`

**Query params:**

| Param | Valor |
|-------|-------|
| `contractId` | `{{PARTICIPATION_TOKEN_ID}}` |
| `from` | `{{INVESTOR_PUBLIC_KEY}}` |
| `spender` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "allowance": "1000000000"
}
```

---

### 5.10 Decimals, Name, Symbol, Escrow ID (lecturas)

**GET** `{{BASE_URL}}/participation-token/decimals`

| Param | Valor |
|-------|-------|
| `contractId` | `{{PARTICIPATION_TOKEN_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "decimals": 7 }
```

**GET** `{{BASE_URL}}/participation-token/name`

| Param | Valor |
|-------|-------|
| `contractId` | `{{PARTICIPATION_TOKEN_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "name": "Alpha Credit Token" }
```

**GET** `{{BASE_URL}}/participation-token/symbol`

| Param | Valor |
|-------|-------|
| `contractId` | `{{PARTICIPATION_TOKEN_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "symbol": "ACT" }
```

**GET** `{{BASE_URL}}/participation-token/escrow-id`

| Param | Valor |
|-------|-------|
| `contractId` | `{{PARTICIPATION_TOKEN_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "escrowId": "{{ESCROW_CONTRACT_ID}}" }
```

---

## 6. Token Sale: Operaciones

### 6.1 Buy (comprar tokens)

**POST** `{{BASE_URL}}/token-sale/buy`

```json
{
  "contractId": "{{TOKEN_SALE_ID}}",
  "usdcAddress": "{{USDC_CONTRACT_ID}}",
  "payer": "{{INVESTOR_PUBLIC_KEY}}",
  "beneficiary": "{{INVESTOR_PUBLIC_KEY}}",
  "amount": 1000,
  "callerPublicKey": "{{INVESTOR_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> `amount`: cantidad de USDC a invertir (en unidades enteras, el contrato maneja la conversión a base units).
> `payer` y `beneficiary` pueden ser distintos (por ejemplo, empresa pagadora y beneficiario final).

---

### 6.2 Update Caps

**POST** `{{BASE_URL}}/token-sale/update-caps`

```json
{
  "contractId": "{{TOKEN_SALE_ID}}",
  "newHardCap": 200000,
  "newMaxPerInvestor": 20000,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Solo el admin del contrato puede ejecutar esta operación.

---

### 6.3 Set Token

**POST** `{{BASE_URL}}/token-sale/set-token`

```json
{
  "contractId": "{{TOKEN_SALE_ID}}",
  "newToken": "{{PARTICIPATION_TOKEN_ID}}",
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Permite cambiar qué participation token entrega el token sale.

---

### 6.4 Set Admin (token sale)

**POST** `{{BASE_URL}}/token-sale/set-admin`

```json
{
  "contractId": "{{TOKEN_SALE_ID}}",
  "newAdmin": "GNEW_ADMIN_ADDRESS",
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

---

### 6.5 Get Admin (lectura)

**GET** `{{BASE_URL}}/token-sale/admin`

| Param | Valor |
|-------|-------|
| `contractId` | `{{TOKEN_SALE_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "admin": "GCALLER_PUBLIC_KEY..."
}
```

---

## 7. Vault: Operaciones

### 7.1 Availability For Exchange (habilitar/deshabilitar vault)

**POST** `{{BASE_URL}}/vault/availability-for-exchange`

**Habilitar (cuando el issuer está listo para que los inversores reclamen):**

```json
{
  "contractId": "{{VAULT_ID}}",
  "enabled": true,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}",
  "campaignId": "{{CAMPAIGN_ID}}"
}
```

**Deshabilitar:**

```json
{
  "contractId": "{{VAULT_ID}}",
  "enabled": false,
  "callerPublicKey": "{{CALLER_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> Si `enabled: true` y se provee `campaignId`, el status de la campaña en DB se actualiza a `CLAIMABLE` automáticamente.
> Solo el admin puede ejecutar esta operación.

---

### 7.2 Claim (reclamar como inversor)

**POST** `{{BASE_URL}}/vault/claim`

```json
{
  "contractId": "{{VAULT_ID}}",
  "beneficiary": "{{INVESTOR_PUBLIC_KEY}}",
  "callerPublicKey": "{{INVESTOR_PUBLIC_KEY}}"
}
```

**Respuesta:**

```json
{
  "unsignedXdr": "AAAAAgAAAAA..."
}
```

> El vault debe estar habilitado para que esto funcione.
> El inversor recibe USDC (principal + ROI) y sus participation tokens son quemados.

---

### 7.3 Overview (lectura del estado del vault)

**GET** `{{BASE_URL}}/vault/overview`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "enabled": false,
  "roiPercentage": "15",
  "totalDeposited": "0",
  "totalRedeemed": "0",
  "admin": "GCALLER...",
  "token": "{{PARTICIPATION_TOKEN_ID}}",
  "usdc": "CBIELTK6..."
}
```

---

### 7.4 Preview Claim

**GET** `{{BASE_URL}}/vault/preview-claim`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `beneficiary` | `{{INVESTOR_PUBLIC_KEY}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "usdcAmount": "1150000000",
  "tokenAmount": "1000000000"
}
```

---

### 7.5 Is Enabled (lectura)

**GET** `{{BASE_URL}}/vault/is-enabled`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "enabled": false
}
```

---

### 7.6 USDC Balance del Vault (lectura)

**GET** `{{BASE_URL}}/vault/usdc-balance`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "balance": "115000000000"
}
```

---

### 7.7 Total Redeemed (lectura)

**GET** `{{BASE_URL}}/vault/total-redeemed`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

**Respuesta:**

```json
{
  "totalTokensRedeemed": "0"
}
```

---

### 7.8 Admin, ROI Percentage, Token Address, USDC Address (lecturas)

**GET** `{{BASE_URL}}/vault/admin`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "admin": "GCALLER..." }
```

**GET** `{{BASE_URL}}/vault/roi-percentage`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "roiPercentage": "15" }
```

**GET** `{{BASE_URL}}/vault/token-address`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "tokenAddress": "{{PARTICIPATION_TOKEN_ID}}" }
```

**GET** `{{BASE_URL}}/vault/usdc-address`

| Param | Valor |
|-------|-------|
| `contractId` | `{{VAULT_ID}}` |
| `callerPublicKey` | `{{CALLER_PUBLIC_KEY}}` |

```json
{ "usdcAddress": "CBIELTK6..." }
```

---

## 8. Campaigns: CRUD

### 8.1 Listar todas las campañas

**GET** `{{BASE_URL}}/campaigns`

**Respuesta:**

```json
[
  {
    "id": "uuid",
    "name": "Private Credit Fund Alpha",
    "status": "FUNDRAISING",
    "issuerAddress": "GCALLER...",
    "escrowId": "{{ESCROW_CONTRACT_ID}}",
    "poolSize": "100000",
    "loanDuration": 12,
    "expectedReturn": "15",
    "loanSize": "50000",
    "tokenFactoryId": "{{PARTICIPATION_TOKEN_ID}}",
    "tokenSaleId": "{{TOKEN_SALE_ID}}",
    "vaultId": "{{VAULT_ID}}",
    "createdAt": "2026-03-13T00:00:00.000Z",
    "updatedAt": "2026-03-13T00:00:00.000Z"
  }
]
```

---

### 8.2 Obtener campaña por ID

**GET** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}`

**Respuesta:**

```json
{
  "id": "{{CAMPAIGN_ID}}",
  "name": "Private Credit Fund Alpha",
  "status": "FUNDRAISING",
  "investments": [
    {
      "id": "uuid",
      "investorAddress": "GINVESTOR...",
      "usdcAmount": "1000",
      "tokenAmount": "1000",
      "txHash": "hash..."
    }
  ],
  ...
}
```

---

### 8.3 Crear campaña

**POST** `{{BASE_URL}}/campaigns`

```json
{
  "name": "Private Credit Fund Beta",
  "description": "Segundo fondo de crédito privado",
  "issuerAddress": "{{CALLER_PUBLIC_KEY}}",
  "escrowId": "{{ESCROW_CONTRACT_ID}}",
  "poolSize": 200000,
  "loanDuration": 24,
  "expectedReturn": 18,
  "loanSize": 80000,
  "tokenFactoryId": "{{PARTICIPATION_TOKEN_ID}}",
  "tokenSaleId": "{{TOKEN_SALE_ID}}",
  "vaultId": "{{VAULT_ID}}"
}
```

---

### 8.4 Actualizar campaña

**PATCH** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}`

```json
{
  "name": "Private Credit Fund Alpha V2",
  "description": "Descripción actualizada",
  "vaultId": "{{VAULT_ID}}"
}
```

---

### 8.5 Cambiar status de campaña

**PATCH** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}/status`

```json
{
  "status": "ACTIVE"
}
```

**Transiciones válidas:**

```
FUNDRAISING  →  ACTIVE | PAUSED
ACTIVE       →  REPAYMENT | PAUSED
REPAYMENT    →  CLAIMABLE | PAUSED
CLAIMABLE    →  CLOSED | PAUSED
PAUSED       →  (solo puede volver al status anterior)
```

---

### 8.6 Eliminar campaña

**DELETE** `{{BASE_URL}}/campaigns/{{CAMPAIGN_ID}}`

**Respuesta:**

```json
{
  "id": "{{CAMPAIGN_ID}}",
  "name": "Private Credit Fund Alpha",
  ...
}
```

---

## 9. Investments: CRUD

### 9.1 Listar todas las inversiones

**GET** `{{BASE_URL}}/investments`

**Respuesta:**

```json
[
  {
    "id": "uuid",
    "campaignId": "{{CAMPAIGN_ID}}",
    "investorAddress": "GINVESTOR...",
    "usdcAmount": "1000",
    "tokenAmount": "1000",
    "txHash": "hash...",
    "createdAt": "2026-03-13T00:00:00.000Z"
  }
]
```

---

### 9.2 Obtener inversión por ID

**GET** `{{BASE_URL}}/investments/{{INVESTMENT_ID}}`

---

### 9.3 Inversiones por campaña

**GET** `{{BASE_URL}}/investments/campaign/{{CAMPAIGN_ID}}`

---

### 9.4 Registrar inversión

**POST** `{{BASE_URL}}/investments`

```json
{
  "campaignId": "{{CAMPAIGN_ID}}",
  "investorAddress": "{{INVESTOR_PUBLIC_KEY}}",
  "usdcAmount": 1000,
  "tokenAmount": 1000,
  "txHash": "hash-de-la-transaccion-stellar"
}
```

**Respuesta:**

```json
{
  "id": "uuid",
  "campaignId": "{{CAMPAIGN_ID}}",
  "investorAddress": "{{INVESTOR_PUBLIC_KEY}}",
  "usdcAmount": "1000",
  "tokenAmount": "1000",
  "txHash": "hash...",
  "campaign": { ... },
  "createdAt": "2026-03-13T00:00:00.000Z"
}
```

---

## 10. Loans: CRUD

### 10.1 Listar todos los loans

**GET** `{{BASE_URL}}/loans`

**Respuesta:**

```json
[
  {
    "id": "uuid",
    "campaignId": "{{CAMPAIGN_ID}}",
    "description": "Préstamo para capital de trabajo",
    "amount": "50000",
    "receiver": "GRECEIVER...",
    "status": "PENDING",
    "milestoneIndex": null,
    "disbursedAt": null,
    "repaidAt": null,
    "createdAt": "2026-03-13T00:00:00.000Z"
  }
]
```

---

### 10.2 Obtener loan por ID

**GET** `{{BASE_URL}}/loans/{{LOAN_ID}}`

---

### 10.3 Loans por campaña

**GET** `{{BASE_URL}}/loans/campaign/{{CAMPAIGN_ID}}`

---

### 10.4 Estadísticas de loans por campaña

**GET** `{{BASE_URL}}/loans/campaign/{{CAMPAIGN_ID}}/stats`

**Respuesta:**

```json
{
  "_sum": {
    "amount": 50000
  },
  "_count": 1
}
```

---

### 10.5 Crear loan

**POST** `{{BASE_URL}}/loans`

```json
{
  "campaignId": "{{CAMPAIGN_ID}}",
  "description": "Préstamo para capital de trabajo - Tramo 1",
  "amount": 50000,
  "receiver": "GRECEIVER_STELLAR_ADDRESS",
  "milestoneIndex": 1
}
```

**Validaciones:**
- `amount` no puede superar el `loanSize` de la campaña.
- La suma total de loans de la campaña no puede superar el `poolSize`.

**Respuesta:**

```json
{
  "id": "uuid",
  "campaignId": "{{CAMPAIGN_ID}}",
  "status": "PENDING",
  "amount": "50000",
  "receiver": "GRECEIVER...",
  ...
}
```

---

### 10.6 Actualizar loan

**PATCH** `{{BASE_URL}}/loans/{{LOAN_ID}}`

**Marcar como DISBURSED:**

```json
{
  "status": "DISBURSED",
  "disbursedAt": "2026-03-13T12:00:00.000Z"
}
```

**Marcar como REPAID:**

```json
{
  "status": "REPAID",
  "repaidAt": "2026-09-13T12:00:00.000Z"
}
```

**Transiciones válidas:**

```
PENDING   →  DISBURSED
DISBURSED →  REPAID | DEFAULTED
```

---

### 10.7 Eliminar loan

**DELETE** `{{BASE_URL}}/loans/{{LOAN_ID}}`

> Solo se puede eliminar loans en estado `PENDING`.

---

## 11. Referencia de Errores Comunes

| Código HTTP | Causa | Solución |
|-------------|-------|---------|
| `401 Unauthorized` | Header `x-api-key` ausente o incorrecto | Verificar la variable `API_KEY` en el entorno |
| `400 Bad Request` | Body inválido / campos faltantes | Revisar que todos los campos requeridos estén presentes y con tipos correctos |
| `404 Not Found` | ID de campaña, inversión o loan no existe | Verificar que el UUID es correcto |
| `400 Bad Request` | Transición de status inválida en campaña | Respetar el flujo de estados documentado |
| `400 Bad Request` | Loan amount supera loanSize o poolSize | Reducir el monto del loan |
| `400 Bad Request` | Transición de status de loan inválida | Respetar: PENDING → DISBURSED → REPAID/DEFAULTED |
| `400 Bad Request` | Intentar eliminar loan no PENDING | Solo se puede eliminar loans PENDING |
| `500 Internal Server Error` | Error en Soroban RPC o contrato | Verificar que el contrato existe y el WASM hash es correcto |

### Notas sobre el XDR Workflow

```
API Response (unsignedXdr)
        ↓
Firmar con clave privada del callerPublicKey
        ↓
Enviar a Stellar Testnet RPC
        ↓
Guardar txHash del resultado
        ↓
(Opcional) Registrar en DB si aplica (e.g., POST /investments)
```

**Herramientas para firmar y enviar XDR:**
- [Stellar Laboratory - Transaction Signer](https://laboratory.stellar.org/#txsigner?network=test)
- SDK de Stellar (JavaScript/Python/Go)
- Freighter Wallet (extensión de browser)

**Constantes del sistema:**
- USDC Testnet: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`
- Token Decimals: `7` (1 token = 10,000,000 unidades base)
- Soroban RPC Testnet: `https://soroban-testnet.stellar.org`