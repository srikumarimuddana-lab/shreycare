import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldMarkPaid,
  shouldMarkExpired,
  shouldMarkFailed,
  refundStatus,
  isFinanciallyLocked,
  lockedFieldsInUpdate,
  MANUAL_PAYMENT_STATUSES,
  isPayLinkExpired,
  payLinkExpiryFromNow,
  isPayableStatus,
  PAY_LINK_TTL_DAYS,
} from "./status.ts";

describe("shouldMarkPaid", () => {
  it("advances from not-yet-paid states", () => {
    assert.equal(shouldMarkPaid("pending"), true);
    assert.equal(shouldMarkPaid("failed"), true);
    assert.equal(shouldMarkPaid("expired"), true);
  });

  it("never clobbers a terminal or already-paid state", () => {
    // Guards against a retried "paid" webhook overwriting a later refund
    // or dispute that raced ahead of it.
    assert.equal(shouldMarkPaid("paid"), false);
    assert.equal(shouldMarkPaid("refunded"), false);
    assert.equal(shouldMarkPaid("partially_refunded"), false);
    assert.equal(shouldMarkPaid("disputed"), false);
  });
});

describe("shouldMarkExpired / shouldMarkFailed", () => {
  it("only transition from pending", () => {
    assert.equal(shouldMarkExpired("pending"), true);
    assert.equal(shouldMarkExpired("paid"), false);
    assert.equal(shouldMarkFailed("pending"), true);
    assert.equal(shouldMarkFailed("paid"), false);
  });
});

describe("refundStatus", () => {
  it("classifies by cumulative refunded amount", () => {
    assert.equal(refundStatus(1000, 0), "paid");
    assert.equal(refundStatus(1000, 400), "partially_refunded");
    assert.equal(refundStatus(1000, 1000), "refunded");
    // Over-refund (shouldn't happen, but must not read as partial)
    assert.equal(refundStatus(1000, 1200), "refunded");
  });
});

describe("isFinanciallyLocked", () => {
  it("locks only Stripe orders with a captured charge", () => {
    assert.equal(
      isFinanciallyLocked({
        payment_method: "stripe",
        payment_status: "paid",
        stripe_payment_intent_id: "pi_1",
      }),
      true,
    );
    assert.equal(
      isFinanciallyLocked({
        payment_method: "stripe",
        payment_status: "refunded",
        stripe_payment_intent_id: "pi_1",
      }),
      true,
    );
    assert.equal(
      isFinanciallyLocked({
        payment_method: "stripe",
        payment_status: "disputed",
        stripe_payment_intent_id: "pi_1",
      }),
      true,
    );
  });

  it("leaves pending / failed / expired Stripe orders editable", () => {
    for (const status of ["pending", "failed", "expired"]) {
      assert.equal(
        isFinanciallyLocked({
          payment_method: "stripe",
          payment_status: status,
          stripe_payment_intent_id: null,
        }),
        false,
        `status ${status} should be editable`,
      );
    }
  });

  it("never locks cash or e-transfer orders", () => {
    assert.equal(
      isFinanciallyLocked({ payment_method: "cash", payment_status: "paid" }),
      false,
    );
    assert.equal(
      isFinanciallyLocked({ payment_method: "interac", payment_status: "paid" }),
      false,
    );
  });
});

describe("lockedFieldsInUpdate", () => {
  it("flags only the financial fields present in a patch body", () => {
    assert.deepEqual(
      lockedFieldsInUpdate({ customerName: "x", notes: "y" }),
      [],
    );
    assert.deepEqual(
      lockedFieldsInUpdate({ items: [], paymentStatus: "paid", notes: "ok" }).sort(),
      ["items", "paymentStatus"].sort(),
    );
  });
});

describe("MANUAL_PAYMENT_STATUSES", () => {
  it("excludes Stripe-only lifecycle states", () => {
    assert.ok(!MANUAL_PAYMENT_STATUSES.includes("failed" as never));
    assert.ok(!MANUAL_PAYMENT_STATUSES.includes("disputed" as never));
    assert.ok(!MANUAL_PAYMENT_STATUSES.includes("partially_refunded" as never));
    assert.deepEqual([...MANUAL_PAYMENT_STATUSES], ["pending", "paid", "refunded"]);
  });
});

describe("pay-link expiry", () => {
  const now = new Date("2026-07-14T00:00:00Z");

  it("defaults to a 7-day window", () => {
    assert.equal(PAY_LINK_TTL_DAYS, 7);
    const expiry = new Date(payLinkExpiryFromNow(now));
    const days = (expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    assert.equal(days, 7);
  });

  it("treats a future expiry as live and a past one as expired", () => {
    assert.equal(isPayLinkExpired("2026-07-20T00:00:00Z", now), false);
    assert.equal(isPayLinkExpired("2026-07-10T00:00:00Z", now), true);
  });

  it("treats the exact expiry instant as expired (<=)", () => {
    assert.equal(isPayLinkExpired("2026-07-14T00:00:00Z", now), true);
  });

  it("treats a missing expiry as non-expiring (legacy rows)", () => {
    assert.equal(isPayLinkExpired(null, now), false);
    assert.equal(isPayLinkExpired(undefined, now), false);
  });
});

describe("isPayableStatus", () => {
  it("is true only for pending / failed / expired", () => {
    for (const s of ["pending", "failed", "expired"]) {
      assert.equal(isPayableStatus(s), true, s);
    }
    for (const s of ["paid", "refunded", "partially_refunded", "disputed"]) {
      assert.equal(isPayableStatus(s), false, s);
    }
  });
});
