export const FREE_SHIPPING_THRESHOLD = 4;

const TIERS: { max: number; cost: number }[] = [
  { max: 1, cost: 11.99 },
  { max: 2, cost: 7.99 },
  { max: 3, cost: 3.99 },
];

export function calculateShipping(bottleCount: number): number {
  if (bottleCount <= 0) return 0;
  for (const tier of TIERS) {
    if (bottleCount <= tier.max) return tier.cost;
  }
  return 0;
}

export function bottlesUntilFreeShipping(bottleCount: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - bottleCount);
}
