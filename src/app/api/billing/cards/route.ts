import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { paymentMethods } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import {
  defaultMockPaymentMethod,
  formatPaymentMethodLabel,
  normalizeBrand,
  normalizeLast4,
  toPaymentMethod,
  validateBrand,
  validateLabel,
  validateLast4,
} from "@/lib/billing/payment-methods";

export async function GET() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await selectAll(
    db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, session.user.id))
      .orderBy(asc(paymentMethods.createdAt)),
  );

  return NextResponse.json({
    cards: rows.map(toPaymentMethod),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { label?: string; brand?: string; last4?: string } = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as { label?: string; brand?: string; last4?: string };
    }
  } catch {
    // Empty body is allowed — use mock defaults for the add-card action.
  }

  const defaults = defaultMockPaymentMethod();
  const brand = normalizeBrand(body.brand ?? defaults.brand);
  const last4 = normalizeLast4(body.last4 ?? defaults.last4);
  const label = (body.label ?? formatPaymentMethodLabel(brand, last4)).trim();

  const brandError = validateBrand(brand);
  if (brandError) {
    return NextResponse.json({ error: brandError }, { status: 400 });
  }

  const last4Error = validateLast4(last4);
  if (last4Error) {
    return NextResponse.json({ error: last4Error }, { status: 400 });
  }

  const labelError = validateLabel(label);
  if (labelError) {
    return NextResponse.json({ error: labelError }, { status: 400 });
  }

  const db = await getDb();
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(paymentMethods).values({
    id,
    userId: session.user.id,
    label,
    last4,
    brand,
    createdAt,
  });

  return NextResponse.json(
    {
      card: {
        id,
        label,
        last4,
        brand,
        createdAt: createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
