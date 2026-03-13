export { cn } from "@tokenization/shared/lib/utils";

export function formatCurrency(amount: number, decimals = 0): string {
  return amount.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
