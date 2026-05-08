export const SK_PST_RATE = 0.06;

const SK_VALUES = new Set(["SK", "SASKATCHEWAN"]);

export function calculateTax(
  amount: number,
  province: string
): { rate: number; amount: number } {
  if (SK_VALUES.has(province.trim().toUpperCase())) {
    return { rate: SK_PST_RATE, amount: +(amount * SK_PST_RATE).toFixed(2) };
  }
  return { rate: 0, amount: 0 };
}
