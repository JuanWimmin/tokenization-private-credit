# Plan: Integrar el block Wallet Kit de Trustless Work

Referencia: [Wallet Kit | Trustless Work Blocks](https://blocks.trustlesswork.com/blocks/wallet-kit)

---

## 1. Objetivo

Sustituir la implementación actual del wallet (custom en `packages/tw-blocks-shared/src/wallet-kit/`) por el **block oficial Wallet Kit** de Trustless Work, que ofrece:

- **Wallet** (estado/contexto)
- **StellarProvider** (Stellar Wallets Kit)
- **Connect Button** (botón de conectar wallet)

Requisitos del block (según la documentación):

- Necesario para todos los blocks de escrow.
- Provee wallet provider, validadores y botón de conexión con Stellar Wallets Kit.
- Si no se usa el contexto de escrow, el payload debe proporcionarse por otro medio.
- Debe añadirse la trustline USDC en la wallet para que las interacciones con escrow funcionen.

---

## 2. Estado actual en el monorepo

### 2.1 Implementación actual (custom)

| Ubicación | Contenido |
|-----------|-----------|
| `packages/tw-blocks-shared/src/wallet-kit/WalletProvider.tsx` | Contexto (walletAddress, walletName, setWalletInfo, clearWalletInfo). |
| `packages/tw-blocks-shared/src/wallet-kit/WalletButtons.tsx` | Botón connect/disconnect + popover (usa `useWalletContext`, `useWallet`). |
| `packages/tw-blocks-shared/src/wallet-kit/useWallet.ts` | handleConnect / handleDisconnect usando `getKit()` (Stellar Wallets Kit). |
| `packages/tw-blocks-shared/src/wallet-kit/wallet-kit.ts` | `getKit()` (lazy init de StellarWalletsKit) y `signTransaction()`. |
| `packages/tw-blocks-shared/src/wallet-kit/validators.ts` | Validadores (p. ej. `isValidWallet`) usados en escrows. |
| `packages/tw-blocks-shared/src/wallet-kit/trustlines.ts` | Opciones de trustline para formularios de escrow. |

Dependencia directa: `@creit.tech/stellar-wallets-kit` (en root `package.json`).

### 2.2 Uso actual del wallet

- **Apps**
  - **investor-tokenization**: `app/layout.tsx` → `WalletProvider`; `Header.tsx` y `roi-dashboard-shell.tsx` → `WalletButton` / `SidebarWalletButton`.
  - **backoffice-tokenization**: `app/layout.tsx` → `WalletProvider`; `Header.tsx` → `WalletButton`.
- **Packages**
  - **packages/ui**: `sidebar-wallet-button.tsx` → `WalletButton` de tw-blocks-shared.
  - **packages/tw-blocks-shared**: Todos los bloques de escrow (fund, approve, release, dispute, initialize, update, withdraw, resolve, etc.) usan `useWalletContext()` y muchos usan `signTransaction`, `validators`, `trustlines`.

---

## 3. Pasos del plan (no ejecutar hasta aprobar)

### Fase 1: Instalación y revisión del block

0. **Inicialización obligatoria (requerido por la CLI)**
   - Antes de añadir cualquier block, hay que ejecutar **una vez**:
     ```bash
     npx trustless-work init
     ```
   - **Importante:** Usar `npx trustless-work init` (no `trustless-work init`); sin `npx` el comando no se encuentra.
   - Este paso instala dependencias y crea `.twblocks.json` (configuración uiBase). Si no se hace, al ejecutar `npx trustless-work add wallet-kit` aparece:
     ```
     ❌ Missing initial setup. Run 'trustless-work init' first to install dependencies and create .twblocks.json (uiBase).
     ```

1. **Instalar el block**
   - En la raíz del monorepo (o en la app que vaya a consumir el block primero):  
     `npx trustless-work add wallet-kit`
   - Revisar qué archivos/paquetes añade (p. ej. en `packages/` o en una app) y cómo exporta:
     - Provider del wallet (equivalente a `WalletProvider`)
     - StellarProvider (equivalente a la configuración actual de Stellar Wallets Kit)
     - Connect Button (equivalente a `WalletButton`)

2. **Revisar dependencias del block**
   - Consultar la [sección de dependencias](https://blocks.trustlesswork.com/get-started/dependencies) para wallet-kit.
   - Comprobar compatibilidad con React 19, Next.js 16 y con `@trustless-work/escrow` ya usado en el repo.

3. **Documentar la API del block**
   - Nombres de componentes (provider, botón).
   - Si el context se accede por un hook (p. ej. `useWalletContext` o similar).
   - Si el block expone algo equivalente a `signTransaction` o si las apps/blocks deben seguir usando la implementación actual para firmar.

### Fase 2: Estrategia de migración

4. **Decidir enfoque**
   - **Opción A – Sustitución directa**: Reemplazar en `tw-blocks-shared` el uso de `WalletProvider`/`WalletButton`/`useWallet` por los del block; mantener en tw-blocks-shared solo lo que el block no cubra (p. ej. `signTransaction`, validators, trustlines) y re-exportar lo que venga del block.
   - **Opción B – Capa de adaptación**: Introducir en `tw-blocks-shared` una capa que use el block por debajo y exponga la misma API actual (`WalletProvider`, `WalletButton`, `useWalletContext`), para que las apps y `packages/ui` no cambien imports. Útil si la API del block difiere de la actual.

5. **Compatibilidad con escrow**
   - Los bloques de escrow en tw-blocks-shared necesitan:
     - Contexto de wallet (dirección/nombre) → debe venir del block o del adaptador.
     - Firma de transacciones → si el block no expone `signTransaction`, mantener `wallet-kit.ts` (o equivalente) y que use el kit que provea el StellarProvider del block.
   - Validadores y trustlines pueden seguir viviendo en tw-blocks-shared salvo que el block traiga los suyos.

### Fase 3: Cambios por capa

6. **Layouts de las apps**
   - Sustituir en `investor-tokenization` y `backoffice-tokenization`:
     - Import de `WalletProvider` (y si aplica StellarProvider) por el provider del block (o por el re-export desde tw-blocks-shared).
   - Mantener el orden de providers según indique la doc del block (p. ej. StellarProvider > WalletProvider u otro).

7. **Header y sidebar**
   - **Header** (investor y backoffice): Sustituir `WalletButton` por el Connect Button del block (o por el re-export desde tw-blocks-shared).
   - **packages/ui**: En `sidebar-wallet-button.tsx`, usar el Connect Button del block en lugar de `WalletButton` de tw-blocks-shared (o seguir usando tw-blocks-shared si ahí se re-exporta el del block).

8. **packages/tw-blocks-shared**
   - Si se elige **Opción A**: Eliminar o deprecar `WalletProvider.tsx`, `WalletButtons.tsx`, `useWallet.ts` y la parte de `wallet-kit.ts` que solo inicialice el kit; re-exportar provider y botón del block; mantener `signTransaction`, `validators`, `trustlines` y cualquier hook que los use.
   - Si se elige **Opción B**: Crear módulos que importen el block y expongan `WalletProvider`, `WalletButton`, `useWalletContext` con la misma firma que hoy; el resto de tw-blocks-shared sigue igual.
   - Actualizar todos los archivos que importan de `wallet-kit/WalletProvider` o `wallet-kit/WalletButtons` para que apunten al nuevo origen (block o capa de adaptación).

9. **Dependencias**
   - Si el block incluye o exige `@creit.tech/stellar-wallets-kit`, dejar que el block lo gestione; si no, mantener la dependencia solo donde se siga usando (p. ej. `signTransaction`).
   - Comprobar que `@trustless-work/blocks` (ya en el repo) sea la versión esperada por el wallet-kit block.

### Fase 4: Pruebas y rollback

10. **Pruebas**
    - Ambas apps arrancan sin error (investor-tokenization, backoffice-tokenization).
    - Conectar/desconectar wallet en Header y en sidebar (página ROI).
    - Flujos de escrow que usen wallet (inicializar, fund, approve, release, etc.) siguen funcionando.
    - Si aplica, comprobar que la trustline USDC esté presente o que se guíe al usuario a añadirla.

11. **Rollback**
    - Dejar la implementación actual (carpeta `wallet-kit/` y sus imports) intacta hasta confirmar que el block funciona en dev; usar feature flag o rama para cambiar entre “wallet custom” y “wallet block” si se desea.

---

## 4. Resumen de archivos a tocar (estimado)

| Área | Archivos |
|------|----------|
| Instalación | Salida de `npx trustless-work add wallet-kit` (por definir). |
| Apps | `investor-tokenization/src/app/layout.tsx`, `Header.tsx`; `backoffice-tokenization/src/app/layout.tsx`, `Header.tsx`. |
| ROI | `investor-tokenization/src/features/roi/roi-dashboard-shell.tsx` (ya usa SidebarWalletButton). |
| UI shared | `packages/ui/src/sidebar-wallet-button.tsx`. |
| tw-blocks-shared | `packages/tw-blocks-shared/src/wallet-kit/*` (refactor o re-export); todos los escrows y tanstack que importen wallet (lista en sección 2.2). |
| Root | `package.json` (dependencias si el block las añade o modifica). |

---

## 5. Orden recomendado de ejecución

1. Ejecutar `npx trustless-work add wallet-kit` y documentar cambios.
2. Revisar dependencias y documentación del block.
3. Elegir Opción A o B y aplicar cambios en tw-blocks-shared.
4. Actualizar layouts y Headers de ambas apps.
5. Actualizar `sidebar-wallet-button.tsx`.
6. Ejecutar pruebas manuales y de integración.
7. Eliminar o deprecar código custom del wallet solo después de validar.

---

*Documento solo de planificación. No ejecutar pasos hasta aprobación.*
