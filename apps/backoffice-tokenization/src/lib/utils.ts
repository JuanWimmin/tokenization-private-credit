export { cn } from "@tokenization/shared/lib/utils";

const SOROBAN_DECIMAL_SCALE = 1e7;

export function formatCurrency(amount: number, decimals = 0): string {
  return amount.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fromStroops(stroops: number | string): number {
  return Number(stroops) / SOROBAN_DECIMAL_SCALE;
}
