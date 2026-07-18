import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";
import { generateInvoicePdf } from "@/lib/payments/invoice";
import {
  buildInvoiceData,
  INVOICE_SALE_COLUMNS,
  type InvoiceSaleRow,
} from "@/lib/payments/invoice-data";

// Download a printable invoice PDF for an order.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const { data: sale, error } = await supabaseAdmin
    .from("sales")
    .select(INVOICE_SALE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !sale) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const invoice = buildInvoiceData(sale as unknown as InvoiceSaleRow, req.nextUrl.origin);
  const pdf = await generateInvoicePdf(invoice);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${sale.order_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
