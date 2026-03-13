# Deployer Contract — `deploy_all`

Guía para el equipo backend sobre cómo invocar `deploy_all` desde la API (NestJS + Stellar SDK) para deployar los tres contratos de una campaña en una sola transacción.

---

## ¿Qué hace `deploy_all`?

Despliega los tres contratos de una campaña en el orden correcto y los conecta entre sí:

| Paso | Acción |
|------|--------|
| 1 | Deploya **token-sale** con el deployer como admin temporal |
| 2 | Deploya **participation-token** con el token-sale como `mint_authority` directo |
| 3 | Llama `set_token` en token-sale → le informa la dirección del participation-token |
| 4 | Llama `set_admin` en token-sale → transfiere el admin al `token_sale_admin` real |
| 5 | Deploya **vault-contract** apuntando al participation-token |

Al finalizar, los tres contratos están completamente configurados y listos para operar. No se requiere ninguna llamada adicional post-deploy.

---

## Prerrequisitos

El contrato deployer debe estar ya instanciado con los WASM hashes de los tres contratos. Estos hashes se configuran una sola vez al deployar el deployer:

```
DEPLOYER_CONTRACT_ID=C...          # ID del contrato deployer en la red
DEPLOYER_ADMIN_SECRET=S...         # Clave secreta del admin del deployer
PARTICIPATION_TOKEN_WASM_HASH=...  # hex 64 chars
TOKEN_SALE_WASM_HASH=...           # hex 64 chars
VAULT_CONTRACT_WASM_HASH=...       # hex 64 chars
```

---

## Parámetros de `deploy_all`

La función recibe un único argumento `params` de tipo `DeployAllParams`:

```
DeployAllParams {
  // ── Salts (determinan las direcciones resultantes) ──────────────────────
  token_sale_salt:        BytesN<32>   // Salt único para el token-sale
  participation_salt:     BytesN<32>   // Salt único para el participation-token
  vault_salt:             BytesN<32>   // Salt único para el vault-contract

  // ── Participation Token (token fungible de la campaña) ───────────────────
  token_name:             String       // Nombre del token  (ej. "Real Estate Fund A")
  token_symbol:           String       // Símbolo del token (ej. "REFA")
  escrow_id:              String       // ID del escrow en Trustless Work (ej. "eng_001")
  decimal:                u32          // Decimales del token (estándar: 7, máx: 18)

  // ── Token Sale ───────────────────────────────────────────────────────────
  escrow_contract:        Address      // Dirección del contrato escrow que recibe los USDC
  token_sale_admin:       Address      // Admin del token-sale (puede actualizar caps, set_token)
  hard_cap:               i128         // Máximo total de tokens a vender (0 = sin límite)
  max_per_investor:       i128         // Máximo por inversor             (0 = sin límite)

  // ── Vault Contract ───────────────────────────────────────────────────────
  vault_admin:            Address      // Admin del vault (habilita/deshabilita el claim)
  vault_enabled:          bool         // Estado inicial del vault (true = claim habilitado)
  roi_percentage:         i128         // ROI en porcentaje entero (ej. 5 = 5%)
  usdc:                   Address      // Dirección del contrato USDC en la red
}
```

> **Sobre los salts:** Son valores de 32 bytes que determinan la dirección resultante de cada contrato de forma determinística. Deben ser **únicos por campaña**. Se recomienda derivarlos del ID de campaña para reproducibilidad:
>
> ```ts
> import { createHash } from 'crypto';
>
> function saltFromCampaignId(campaignId: string, suffix: string): Buffer {
>   return createHash('sha256')
>     .update(`${campaignId}:${suffix}`)
>     .digest();
> }
>
> const tokenSaleSalt      = saltFromCampaignId(campaign.id, 'token-sale');
> const participationSalt  = saltFromCampaignId(campaign.id, 'participation-token');
> const vaultSalt          = saltFromCampaignId(campaign.id, 'vault');
> ```

---

## Respuesta

```
DeployedContracts {
  participation_token:  Address   // Dirección del token fungible (ERC-20 equivalente)
  token_sale:           Address   // Dirección del contrato de venta
  vault_contract:       Address   // Dirección del vault para claims de ROI
}
```

Las tres direcciones deben guardarse en la base de datos asociadas a la campaña (columnas `tokenFactoryId`, `tokenSaleId`, `vaultId` del modelo `Campaign`).

---

## Implementación en el backend

### 1. Variables de entorno requeridas

Agregar a `apps/core/.env`:

```env
DEPLOYER_CONTRACT_ID=C...
DEPLOYER_ADMIN_SECRET=S...
USDC_CONTRACT_ID=C...
```

### 2. Servicio de deploy (NestJS)

```typescript
// apps/core/src/deploy/deploy.service.ts
import {
  Address,
  Contract,
  Keypair,
  Networks,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { SorobanRpc } from '@stellar/stellar-sdk';

@Injectable()
export class DeployService {
  private readonly rpc: SorobanRpc.Server;
  private readonly adminKeypair: Keypair;
  private readonly deployerContractId: string;

  constructor() {
    this.rpc = new SorobanRpc.Server(process.env.SOROBAN_RPC_URL);
    this.adminKeypair = Keypair.fromSecret(process.env.DEPLOYER_ADMIN_SECRET);
    this.deployerContractId = process.env.DEPLOYER_CONTRACT_ID;
  }

  async deployAll(dto: DeployAllDto): Promise<DeployedContracts> {
    const { campaignId, tokenName, tokenSymbol, escrowId, escrowContractId,
            tokenSaleAdmin, hardCap, maxPerInvestor,
            vaultAdmin, vaultEnabled, roiPercentage } = dto;

    // 1. Derivar salts únicos a partir del campaignId
    const tokenSaleSalt     = this.saltFromId(campaignId, 'token-sale');
    const participationSalt = this.saltFromId(campaignId, 'participation-token');
    const vaultSalt         = this.saltFromId(campaignId, 'vault');

    // 2. Construir el argumento params como ScVal (struct XDR)
    const params = xdr.ScVal.scvMap([
      this.entry('token_sale_salt',    nativeToScVal(tokenSaleSalt,    { type: 'bytes' })),
      this.entry('participation_salt', nativeToScVal(participationSalt, { type: 'bytes' })),
      this.entry('vault_salt',         nativeToScVal(vaultSalt,        { type: 'bytes' })),
      this.entry('token_name',         nativeToScVal(tokenName,        { type: 'string' })),
      this.entry('token_symbol',       nativeToScVal(tokenSymbol,      { type: 'string' })),
      this.entry('escrow_id',          nativeToScVal(escrowId,         { type: 'string' })),
      this.entry('decimal',            nativeToScVal(7,                { type: 'u32' })),
      this.entry('escrow_contract',    new Address(escrowContractId).toScVal()),
      this.entry('token_sale_admin',   new Address(tokenSaleAdmin).toScVal()),
      this.entry('hard_cap',           nativeToScVal(BigInt(hardCap),  { type: 'i128' })),
      this.entry('max_per_investor',   nativeToScVal(BigInt(maxPerInvestor), { type: 'i128' })),
      this.entry('vault_admin',        new Address(vaultAdmin).toScVal()),
      this.entry('vault_enabled',      nativeToScVal(vaultEnabled,     { type: 'bool' })),
      this.entry('roi_percentage',     nativeToScVal(BigInt(roiPercentage), { type: 'i128' })),
      this.entry('usdc',               new Address(process.env.USDC_CONTRACT_ID).toScVal()),
    ]);

    // 3. Construir la transacción
    const account  = await this.rpc.getAccount(this.adminKeypair.publicKey());
    const contract = new Contract(this.deployerContractId);

    let tx = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call('deploy_all', params))
      .setTimeout(300)
      .build();

    // 4. Simular para obtener el footprint de auth y recursos
    const simResult = await this.rpc.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    tx = SorobanRpc.assembleTransaction(tx, simResult).build();

    // 5. Firmar y enviar
    tx.sign(this.adminKeypair);
    const sendResult = await this.rpc.sendTransaction(tx);

    if (sendResult.status === 'ERROR') {
      throw new Error(`Send failed: ${sendResult.errorResult}`);
    }

    // 6. Esperar confirmación
    const confirmed = await this.pollTransaction(sendResult.hash);

    // 7. Parsear el resultado
    const returnVal  = confirmed.returnValue;
    const resultMap  = scValToNative(returnVal) as Record<string, string>;

    return {
      participationToken: resultMap['participation_token'],
      tokenSale:          resultMap['token_sale'],
      vaultContract:      resultMap['vault_contract'],
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private saltFromId(id: string, suffix: string): Buffer {
    return createHash('sha256').update(`${id}:${suffix}`).digest();
  }

  private entry(key: string, val: xdr.ScVal): xdr.ScMapEntry {
    return new xdr.ScMapEntry({
      key:  xdr.ScVal.scvSymbol(key),
      val,
    });
  }

  private async pollTransaction(hash: string): Promise<SorobanRpc.Api.GetSuccessfulTransactionResponse> {
    const MAX_ATTEMPTS = 40;
    const DELAY_MS     = 3000;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, DELAY_MS));
      const result = await this.rpc.getTransaction(hash);

      if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return result as SorobanRpc.Api.GetSuccessfulTransactionResponse;
      }
      if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed: ${JSON.stringify(result)}`);
      }
    }
    throw new Error(`Transaction ${hash} timed out after ${MAX_ATTEMPTS} attempts`);
  }
}
```

### 3. DTO

```typescript
// apps/core/src/deploy/dto/deploy-all.dto.ts
import { IsString, IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class DeployAllDto {
  @IsString()
  campaignId: string;             // UUID de la campaña en la DB

  @IsString()
  tokenName: string;              // Nombre del token

  @IsString()
  tokenSymbol: string;            // Símbolo del token

  @IsString()
  escrowId: string;               // engagement_id del escrow en Trustless Work

  @IsString()
  escrowContractId: string;       // Dirección C... del contrato escrow

  @IsString()
  tokenSaleAdmin: string;         // Dirección G/C del admin del token-sale

  @IsNumber()
  @Min(0)
  hardCap: number;                // 0 = sin límite

  @IsNumber()
  @Min(0)
  maxPerInvestor: number;         // 0 = sin límite

  @IsString()
  vaultAdmin: string;             // Dirección G/C del admin del vault

  @IsBoolean()
  vaultEnabled: boolean;          // Estado inicial del vault

  @IsNumber()
  @Min(0)
  roiPercentage: number;          // Entero: 5 = 5%, 10 = 10%
}
```

### 4. Guardar resultados en la base de datos

```typescript
// Dentro del CampaignsService, tras llamar deployAll:
const deployed = await this.deployService.deployAll(dto);

await this.prisma.campaign.update({
  where: { id: dto.campaignId },
  data: {
    tokenFactoryId: deployed.participationToken,
    tokenSaleId:    deployed.tokenSale,
    vaultId:        deployed.vaultContract,
    status:         CampaignStatus.ACTIVE,
  },
});
```

---

## Autorización

`deploy_all` llama internamente a `admin.require_auth()`. Esto significa que:

- La cuenta que firma la transacción **debe ser el admin del deployer** (el `DEPLOYER_ADMIN_SECRET`).
- El backend firma la transacción directamente en el servidor (no se devuelve XDR sin firmar al frontend).
- El `token_sale_admin` y el `vault_admin` son direcciones de control operacional post-deploy, **no** necesitan firmar esta transacción.

---

## Flujo completo desde el frontend

```
Frontend (backoffice)          Backend (core)              Stellar / Soroban
─────────────────────          ──────────────              ─────────────────
POST /campaigns/deploy  ──────► deployAll(dto)
                                  │
                                  ├─ buildTx(deploy_all, params)
                                  ├─ simulate(tx)
                                  ├─ assemble(tx)
                                  ├─ sign(tx, DEPLOYER_ADMIN_SECRET)
                                  ├─ sendTransaction(tx)  ────────────────────►
                                  │                                            │
                                  │                        [5 pasos internos en 1 tx]
                                  │                                            │
                                  ◄─ pollTransaction(hash) ◄──────────────────
                                  │
                                  ├─ parse(returnValue)
                                  ├─ campaign.update({ tokenFactoryId, tokenSaleId, vaultId })
                                  │
◄─────────────────────────────── { participationToken, tokenSale, vaultContract }
```

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Auth error` | La cuenta firmante no es el admin del deployer | Verificar `DEPLOYER_ADMIN_SECRET` |
| `MismatchingParameterLen` | El WASM almacenado en el deployer es de una versión antigua | Re-deployar el deployer con los nuevos WASMs o llamar `update_wasm` |
| `CONTRACT_ALREADY_EXISTS` | Se están reutilizando salts de una campaña ya deployada | Usar un `campaignId` distinto o sufijo diferente en la función de salt |
| `InvalidRoiPercentage` | `roiPercentage > 1000` | El ROI máximo permitido es 1000% |
| `Simulation failed` | Fondos insuficientes en la cuenta admin para fees | Cargar XLM en la cuenta `DEPLOYER_ADMIN_SECRET` |
