/**
 * Tests for the amount parsing logic used across the platform.
 * The actual fromStroops/adjustPricesToMicroUSDC functions live in
 * the frontend apps, but since they are pure math we test the logic here.
 */

const SOROBAN_DECIMAL_SCALE = 1e7;

function fromStroops(stroops: number | string): number {
  return Number(stroops) / SOROBAN_DECIMAL_SCALE;
}

function toStroops(amount: number): string {
  const scaled = Math.round(amount * SOROBAN_DECIMAL_SCALE);
  return scaled.toFixed(0);
}

describe('Amount parsing (Soroban 7 decimals)', () => {
  describe('fromStroops', () => {
    it('should convert 10000000 stroops to 1.0', () => {
      expect(fromStroops(10_000_000)).toBe(1);
    });

    it('should convert 0 stroops to 0', () => {
      expect(fromStroops(0)).toBe(0);
    });

    it('should convert 1 stroop to 0.0000001', () => {
      expect(fromStroops(1)).toBeCloseTo(0.0000001, 7);
    });

    it('should convert 100500000 stroops to 10.05', () => {
      expect(fromStroops(100_500_000)).toBeCloseTo(10.05, 2);
    });

    it('should handle string input', () => {
      expect(fromStroops('50000000')).toBe(5);
    });

    it('should handle large amounts (1 million USDC)', () => {
      expect(fromStroops(10_000_000_000_000)).toBe(1_000_000);
    });

    it('should handle fractional stroops amounts', () => {
      expect(fromStroops(12_345_678)).toBeCloseTo(1.2345678, 7);
    });
  });

  describe('toStroops (adjustPricesToMicroUSDC logic)', () => {
    it('should convert 1.0 to 10000000', () => {
      expect(toStroops(1)).toBe('10000000');
    });

    it('should convert 0 to 0', () => {
      expect(toStroops(0)).toBe('0');
    });

    it('should convert 100.50 to 1005000000', () => {
      expect(toStroops(100.5)).toBe('1005000000');
    });

    it('should convert 0.01 to 100000', () => {
      expect(toStroops(0.01)).toBe('100000');
    });

    it('should handle large amounts', () => {
      expect(toStroops(1_000_000)).toBe('10000000000000');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve value through toStroops -> fromStroops', () => {
      const original = 42.5;
      const stroops = toStroops(original);
      const result = fromStroops(Number(stroops));
      expect(result).toBeCloseTo(original, 7);
    });

    it('should preserve integer values', () => {
      const original = 100;
      const stroops = toStroops(original);
      const result = fromStroops(Number(stroops));
      expect(result).toBe(original);
    });

    it('should preserve small fractional values', () => {
      const original = 0.0000001;
      const stroops = toStroops(original);
      const result = fromStroops(Number(stroops));
      expect(result).toBeCloseTo(original, 7);
    });
  });
});
