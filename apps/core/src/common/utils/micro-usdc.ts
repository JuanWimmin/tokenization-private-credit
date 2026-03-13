import Decimal from 'decimal.js';

const USDC_DECIMAL_SCALE = 1e7;

export function toMicroUSDC(amount: number): number {
  const amountDecimal = new Decimal(amount.toString());
  const microUSDC = amountDecimal.times(USDC_DECIMAL_SCALE);
  return microUSDC.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN).toNumber();
}
