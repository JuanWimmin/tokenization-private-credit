import Decimal from "decimal.js";

const USDC_DECIMAL_SCALE = 1e7;

export function adjustPricesToMicroUSDC(price: number): string {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a finite, non-negative number");
  }

  const priceDecimal = new Decimal(price.toString());
  const microUSDCDecimal = priceDecimal.times(USDC_DECIMAL_SCALE);

  const rounded = microUSDCDecimal.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN);

  return rounded.toFixed(0);
}

export function fromStroops(stroops: number | string): number {
  const val = new Decimal(String(stroops));
  return val.div(USDC_DECIMAL_SCALE).toNumber();
}
