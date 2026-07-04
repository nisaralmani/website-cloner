import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { paymentMethods, workspaceSettings } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toPaymentMethod } from "@/lib/billing/payment-methods";
import {
  WORKSPACE_BILLING_PAYMENT_METHOD_FIELD,
  WORKSPACE_BILLING_PAGE_SLUG,
  workspaceBillingPaymentMethodKey,
} from "@/lib/billing/workspace-billing";
import { saveWorkspaceSettingField } from "@/lib/settings/workspace-settings";

async function loadSelectedPaymentMethodId(db: Awaited<ReturnType<typeof getDb>>, workspaceId: string) {
  const settingKey = workspaceBillingPaymentMethodKey();
  const row = await selectOne(
    db
      .select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      ),
  );

  if (!row) {
    return null;
  }

  const value = row.value.trim();
  return value || null;
}

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const userId = session.user.id;

  const cardRows = await selectAll(
    db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(asc(paymentMethods.createdAt)),
  );

  const cards = cardRows.map(toPaymentMethod);
  const paymentMethodId = await loadSelectedPaymentMethodId(db, workspaceId);
  const selectedCard = paymentMethodId
    ? cards.find((card) => card.id === paymentMethodId) ?? null
    : null;

  return NextResponse.json({
    paymentMethodId: selectedCard?.id ?? null,
    cards,
    selectedCard,
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { paymentMethodId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!("paymentMethodId" in body)) {
    return NextResponse.json({ error: "paymentMethodId is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const userId = session.user.id;
  const nextPaymentMethodId = body.paymentMethodId;

  if (nextPaymentMethodId) {
    const ownedCard = await selectOne(
      db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, nextPaymentMethodId)),
    );

    if (!ownedCard || ownedCard.userId !== userId) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }
  }

  await saveWorkspaceSettingField(
    db,
    workspaceId,
    WORKSPACE_BILLING_PAGE_SLUG,
    WORKSPACE_BILLING_PAYMENT_METHOD_FIELD,
    nextPaymentMethodId ?? "",
  );

  const cardRows = await selectAll(
    db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(asc(paymentMethods.createdAt)),
  );
  const cards = cardRows.map(toPaymentMethod);
  const selectedCard = nextPaymentMethodId
    ? cards.find((card) => card.id === nextPaymentMethodId) ?? null
    : null;

  return NextResponse.json({
    paymentMethodId: selectedCard?.id ?? null,
    cards,
    selectedCard,
  });
}
