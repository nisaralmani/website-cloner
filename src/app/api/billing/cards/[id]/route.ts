import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { paymentMethods } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();

  const existing = await selectOne(
    db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, session.user.id))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
  }

  await db
    .delete(paymentMethods)
    .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, session.user.id)));

  return NextResponse.json({ ok: true, id });
}
