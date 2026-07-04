import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { billingInvoices } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import {
  toBillingInvoice,
  validateAmountCents,
  validateCurrency,
  validateInvoiceNumber,
  validateInvoiceStatus,
  normalizeInvoiceNumber,
} from "@/lib/billing/invoices";

export async function GET() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await selectAll(
    db
      .select()
      .from(billingInvoices)
      .where(eq(billingInvoices.userId, session.user.id))
      .orderBy(desc(billingInvoices.issuedAt)),
  );

  return NextResponse.json({
    invoices: rows.map(toBillingInvoice),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    invoiceNumber?: string;
    amountCents?: number;
    currency?: string;
    status?: string;
    issuedAt?: string;
    paymentMethodId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.invoiceNumber || body.amountCents === undefined) {
    return NextResponse.json(
      { error: "invoiceNumber and amountCents are required" },
      { status: 400 },
    );
  }

  const invoiceNumber = normalizeInvoiceNumber(body.invoiceNumber);
  const amountCents = body.amountCents;
  const currency = (body.currency ?? "USD").trim().toUpperCase();
  const status = (body.status ?? "paid").trim().toLowerCase();
  const issuedAt = body.issuedAt ? new Date(body.issuedAt) : new Date();

  const invoiceNumberError = validateInvoiceNumber(invoiceNumber);
  if (invoiceNumberError) {
    return NextResponse.json({ error: invoiceNumberError }, { status: 400 });
  }

  const amountError = validateAmountCents(amountCents);
  if (amountError) {
    return NextResponse.json({ error: amountError }, { status: 400 });
  }

  const currencyError = validateCurrency(currency);
  if (currencyError) {
    return NextResponse.json({ error: currencyError }, { status: 400 });
  }

  const statusError = validateInvoiceStatus(status);
  if (statusError) {
    return NextResponse.json({ error: statusError }, { status: 400 });
  }

  if (Number.isNaN(issuedAt.getTime())) {
    return NextResponse.json({ error: "issuedAt is invalid" }, { status: 400 });
  }

  const db = await getDb();
  const id = randomUUID();

  await db.insert(billingInvoices).values({
    id,
    userId: session.user.id,
    invoiceNumber,
    amountCents,
    currency,
    status,
    issuedAt,
    paymentMethodId: body.paymentMethodId ?? null,
  });

  return NextResponse.json(
    {
      invoice: {
        id,
        invoiceNumber,
        amountCents,
        currency,
        status,
        issuedAt: issuedAt.toISOString(),
        paymentMethodId: body.paymentMethodId ?? null,
      },
    },
    { status: 201 },
  );
}
