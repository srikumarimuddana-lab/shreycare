import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { buildInvoiceData, payUrlForToken, type InvoiceSaleRow } from "./invoice-data.ts";

function row(partial: Partial<InvoiceSaleRow>): InvoiceSaleRow {
  return {
    order_number: "SC-ABC123",
    sale_date: "2026-07-10T12:00:00Z",
    customer_name: "Jane Smith",
    customer_email: "jane@example.com",
    customer_phone: null,
    shipping_address: null,
    items: [{ productName: "Hair Oil", quantity: 2, unitPrice: 20 }],
    subtotal: 40,
    shipping_amount: 5,
    tax_rate: 0.06,
    tax_amount: 2.7,
    total: 47.7,
    amount_refunded: 0,
    payment_method: "stripe",
    payment_status: "pending",
    pay_token: "11111111-1111-1111-1111-111111111111",
    pay_link_expires_at: "2026-07-20T00:00:00Z",
    ...partial,
  };
}

describe("payUrlForToken", () => {
  const saved = process.env.NEXT_PUBLIC_SITE_URL;
  before(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });
  after(() => {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = saved;
  });

  it("prefers the configured site URL, else the request origin", () => {
    assert.equal(
      payUrlForToken("tok", "https://req.example"),
      "https://req.example/pay/tok",
    );
    process.env.NEXT_PUBLIC_SITE_URL = "https://shreycare.com";
    assert.equal(
      payUrlForToken("tok", "https://req.example"),
      "https://shreycare.com/pay/tok",
    );
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });
});

describe("buildInvoiceData", () => {
  const now = new Date("2026-07-14T00:00:00Z");
  const origin = "https://shop.example";

  it("includes a pay URL for an unpaid order with a live link", () => {
    const data = buildInvoiceData(row({}), origin, now);
    assert.equal(data.payUrl, `${origin}/pay/11111111-1111-1111-1111-111111111111`);
    assert.equal(data.payLinkExpiresAt, "2026-07-20T00:00:00Z");
  });

  it("omits the pay URL once paid", () => {
    const data = buildInvoiceData(row({ payment_status: "paid" }), origin, now);
    assert.equal(data.payUrl, null);
    assert.equal(data.payLinkExpiresAt, null);
  });

  it("omits the pay URL when the link has expired", () => {
    const data = buildInvoiceData(
      row({ pay_link_expires_at: "2026-07-01T00:00:00Z" }),
      origin,
      now,
    );
    assert.equal(data.payUrl, null);
  });

  it("carries the money fields through as numbers", () => {
    const data = buildInvoiceData(row({ total: "47.70", subtotal: "40" }), origin, now);
    assert.equal(data.total, 47.7);
    assert.equal(data.subtotal, 40);
    assert.equal(data.taxAmount, 2.7);
  });
});
