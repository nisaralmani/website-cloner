import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  deleteHelpdeskCategory,
  getHelpdeskCategory,
  updateHelpdeskCategory,
} from "@/lib/helpdesk/category";
import { assertHelpdeskWritesAllowed } from "@/lib/helpdesk/plan-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const result = await getHelpdeskCategory(db, session.workspace.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ category: result.category });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const db = await getDb();
  const planError = await assertHelpdeskWritesAllowed(db, session.workspace.id);
  if (planError) {
    return NextResponse.json({ error: planError }, { status: 403 });
  }

  const result = await updateHelpdeskCategory(db, session.workspace.id, id, body.name);
  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ category: result.category });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const planError = await assertHelpdeskWritesAllowed(db, session.workspace.id);
  if (planError) {
    return NextResponse.json({ error: planError }, { status: 403 });
  }

  const result = await deleteHelpdeskCategory(db, session.workspace.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ id: result.id });
}
