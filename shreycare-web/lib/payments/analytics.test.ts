import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregatePayments, type SaleForPayments } from "./analytics.ts";

function sale(partial: Partial<SaleForPayments>): SaleForPayments {
  return {
    type: "online",
    sale_date: "2026-07-10T12:00:00Z",
    payment_method: "stripe",
    payment_status: "paid",
    subtotal: 100,
    tax_amount: 6,
    total: 106,
    amount_refunded: 0,
    ...partial,
  };
}

describe("aggregatePayments", () => {
  const now = new Date("2026-07-14T00:00:00Z");

  it("splits collected revenue by payment method", () => {
    const result = aggregatePayments(
      [
        sale({ payment_method: "stripe", total: 100 }),
        sale({ payment_method: "interac", total: 50 }),
        sale({ payment_method: "cash", total: 25 }),
        sale({ payment_method: "weird", total: 10 }), // unknown → other
      ],
      now,
    );

    const byMethod = Object.fromEntries(
      result.byMethod.map((b) => [b.method, b.collected]),
    );
    assert.equal(byMethod.stripe, 100);
    assert.equal(byMethod.interac, 50);
    assert.equal(byMethod.cash, 25);
    assert.equal(byMethod.other, 10);
    assert.equal(result.collected, 185);
  });

  it("nets refunds out of collected but tracks them separately", () => {
    const result = aggregatePayments(
      [
        sale({ total: 100, payment_status: "partially_refunded", amount_refunded: 30 }),
        sale({ total: 50, payment_status: "refunded", amount_refunded: 50 }),
      ],
      now,
    );
    // collected = (100-30) + (50-50) = 70
    assert.equal(result.collected, 70);
    assert.equal(result.refunded, 80);
  });

  it("treats a fully-refunded legacy row with no amount_refunded as fully returned", () => {
    const result = aggregatePayments(
      [sale({ total: 40, payment_status: "refunded", amount_refunded: 0 })],
      now,
    );
    assert.equal(result.collected, 0);
    assert.equal(result.refunded, 40);
  });

  it("keeps pending and failed money out of collected", () => {
    const result = aggregatePayments(
      [
        sale({ total: 100, payment_status: "pending" }),
        sale({ total: 80, payment_status: "failed" }),
        sale({ total: 60, payment_status: "expired" }),
      ],
      now,
    );
    assert.equal(result.collected, 0);
    assert.equal(result.pending, 100);
    const stripe = result.byMethod.find((b) => b.method === "stripe")!;
    assert.equal(stripe.pending, 100);
    assert.equal(stripe.failedOrExpired, 140);
  });

  it("counts disputed money as collected-at-risk and in the disputed tile", () => {
    const result = aggregatePayments(
      [sale({ total: 100, payment_status: "disputed" })],
      now,
    );
    assert.equal(result.disputed, 100);
    assert.equal(result.collected, 100);
  });

  it("builds a dense monthly axis and buckets captured sales into their month", () => {
    const result = aggregatePayments(
      [
        sale({ sale_date: "2026-07-05T00:00:00Z", total: 100, payment_method: "stripe" }),
        sale({ sale_date: "2026-06-20T00:00:00Z", total: 40, payment_method: "cash" }),
      ],
      now,
      12,
    );
    assert.equal(result.monthly.length, 12);
    const july = result.monthly.find((m) => m.month === "2026-07")!;
    const june = result.monthly.find((m) => m.month === "2026-06")!;
    assert.equal(july.stripe, 100);
    assert.equal(july.total, 100);
    assert.equal(june.cash, 40);
  });

  it("computes AOV over paid orders only", () => {
    const result = aggregatePayments(
      [
        sale({ total: 100, payment_status: "paid" }),
        sale({ total: 200, payment_status: "paid" }),
        sale({ total: 999, payment_status: "pending" }), // excluded
      ],
      now,
    );
    assert.equal(result.averageOrderValue, 150);
  });

  it("falls back to subtotal+tax when total is missing", () => {
    const result = aggregatePayments(
      [sale({ total: 0, subtotal: 100, tax_amount: 6 })],
      now,
    );
    assert.equal(result.collected, 106);
  });
});
