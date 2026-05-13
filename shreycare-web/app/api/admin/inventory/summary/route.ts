import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

interface InventoryProduct {
  id: string;
  name: string;
  cost_price: number | string | null;
  current_stock: number;
  reorder_point: number;
  unit_label: string;
  is_active: boolean;
}

interface SaleRow {
  items: SaleItem[] | null;
  payment_status: string;
  sale_date: string;
  total: number | string | null;
  subtotal: number | string | null;
  tax_amount: number | string | null;
}

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

function effectiveSaleTotal(s: SaleRow): number {
  const t = Number(s.total ?? 0);
  if (t > 0) return t;
  return Number(s.subtotal ?? 0) + Number(s.tax_amount ?? 0);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  // Fetch all inventory products + all sales (filtered by date if provided).
  let salesQuery = supabaseAdmin
    .from("sales")
    .select("items, payment_status, sale_date, total, subtotal, tax_amount");

  if (from) salesQuery = salesQuery.gte("sale_date", from);
  if (to) salesQuery = salesQuery.lte("sale_date", `${to}T23:59:59Z`);

  const [productsRes, salesRes] = await Promise.all([
    supabaseAdmin
      .from("inventory_products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    salesQuery,
  ]);

  if (productsRes.error) {
    console.error("[inventory/summary] products query:", productsRes.error);
    return NextResponse.json({ error: productsRes.error.message }, { status: 500 });
  }
  if (salesRes.error) {
    console.error("[inventory/summary] sales query:", salesRes.error);
    return NextResponse.json({ error: salesRes.error.message }, { status: 500 });
  }

  const products = (productsRes.data ?? []) as InventoryProduct[];
  const sales = (salesRes.data ?? []) as SaleRow[];

  // Build a map: lowercased product name -> { unitsSold, revenue (paid only) }
  // The revenue per item is computed proportionally to its share of the sale's
  // subtotal — so taxes/shipping are split fairly across line items.
  const perProductFromSales = new Map<string, { unitsSold: number; revenue: number }>();

  for (const sale of sales) {
    if (sale.payment_status === "refunded") continue;
    const items = Array.isArray(sale.items) ? sale.items : [];
    if (items.length === 0) continue;

    const itemSubtotal = items.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
      0,
    );
    const saleTotal = effectiveSaleTotal(sale);
    // Allocate the sale's effective total across line items proportionally to
    // the line subtotal. Falls back to line subtotal if itemSubtotal is 0.
    const ratio = itemSubtotal > 0 ? saleTotal / itemSubtotal : 1;
    const isPaid = sale.payment_status === "paid";

    for (const item of items) {
      if (!item?.productName) continue;
      const key = item.productName.trim().toLowerCase();
      if (!key) continue;
      const qty = Number(item.quantity) || 0;
      const lineSubtotal = qty * (Number(item.unitPrice) || 0);
      const lineRevenue = lineSubtotal * ratio;

      const cur = perProductFromSales.get(key) ?? { unitsSold: 0, revenue: 0 };
      cur.unitsSold += qty;
      // Only count revenue from paid sales toward ROI.
      if (isPaid) cur.revenue += lineRevenue;
      perProductFromSales.set(key, cur);
    }
  }

  // Build per-product rows and accumulate totals.
  const perProduct = products.map((p) => {
    const key = p.name.trim().toLowerCase();
    const sales = perProductFromSales.get(key) ?? { unitsSold: 0, revenue: 0 };
    const cost = Number(p.cost_price ?? 0);
    const cogs = +(cost * sales.unitsSold).toFixed(2);
    const revenue = +sales.revenue.toFixed(2);
    const grossProfit = +(revenue - cogs).toFixed(2);
    const margin = revenue > 0 ? +((grossProfit / revenue) * 100).toFixed(2) : 0;
    const isLowStock = p.current_stock <= p.reorder_point;

    return {
      productId: p.id,
      name: p.name,
      currentStock: p.current_stock,
      reorderPoint: p.reorder_point,
      costPrice: cost,
      unitLabel: p.unit_label,
      totalUnitsSold: sales.unitsSold,
      totalRevenue: revenue,
      totalCOGS: cogs,
      grossProfit,
      margin,
      isLowStock,
    };
  });

  const totalRevenue = +perProduct.reduce((s, r) => s + r.totalRevenue, 0).toFixed(2);
  const totalCOGS = +perProduct.reduce((s, r) => s + r.totalCOGS, 0).toFixed(2);
  const grossProfit = +(totalRevenue - totalCOGS).toFixed(2);
  const profitMargin = totalRevenue > 0 ? +((grossProfit / totalRevenue) * 100).toFixed(2) : 0;
  const roi = totalCOGS > 0 ? +((grossProfit / totalCOGS) * 100).toFixed(2) : 0;
  const totalInventoryValue = +products
    .reduce((s, p) => s + Number(p.current_stock) * Number(p.cost_price ?? 0), 0)
    .toFixed(2);
  const lowStockCount = perProduct.filter((p) => p.isLowStock).length;

  // Identify product names from sales that have NO inventory record — these
  // distort margin (revenue with no COGS allocated). Surface to the admin.
  const knownNames = new Set(products.map((p) => p.name.trim().toLowerCase()));
  const unmatchedProducts = Array.from(perProductFromSales.entries())
    .filter(([key, val]) => !knownNames.has(key) && (val.unitsSold > 0 || val.revenue > 0))
    .map(([name, val]) => ({
      name,
      unitsSold: val.unitsSold,
      revenue: +val.revenue.toFixed(2),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    totalRevenue,
    totalCOGS,
    grossProfit,
    profitMargin,
    roi,
    totalInventoryValue,
    lowStockCount,
    perProduct,
    unmatchedProducts,
    dateRange: from || to ? { from, to } : null,
  });
}
