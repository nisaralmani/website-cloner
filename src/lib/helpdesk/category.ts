import { randomUUID } from "crypto";
import { eq, max, count } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { helpdeskArticles, helpdeskCategories } from "@/db/schema";
import { toHelpdeskCategory } from "@/lib/helpdesk/mappers";

export async function createHelpdeskCategory(
  db: AppDatabase,
  workspaceId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false as const, error: "name is required" };
  }

  const [maxOrderRow] = await db
    .select({ value: max(helpdeskCategories.sortOrder) })
    .from(helpdeskCategories)
    .where(eq(helpdeskCategories.workspaceId, workspaceId));

  const id = randomUUID();
  await db.insert(helpdeskCategories).values({
    id,
    workspaceId,
    name: trimmed,
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
  });

  const row = await selectOne(
    db.select().from(helpdeskCategories).where(eq(helpdeskCategories.id, id)),
  );
  if (!row) {
    return { ok: false as const, error: "Failed to create category" };
  }

  return { ok: true as const, category: toHelpdeskCategory(row, 0) };
}

export async function updateHelpdeskCategory(
  db: AppDatabase,
  workspaceId: string,
  categoryId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false as const, error: "name is required" };
  }

  const existing = await selectOne(
    db.select().from(helpdeskCategories).where(eq(helpdeskCategories.id, categoryId)),
  );
  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db
    .update(helpdeskCategories)
    .set({ name: trimmed })
    .where(eq(helpdeskCategories.id, categoryId));

  const [articlesInCategory] = await db
    .select({ value: count() })
    .from(helpdeskArticles)
    .where(eq(helpdeskArticles.categoryId, categoryId));

  const row = await selectOne(
    db.select().from(helpdeskCategories).where(eq(helpdeskCategories.id, categoryId)),
  );
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return {
    ok: true as const,
    category: toHelpdeskCategory(row, articlesInCategory?.value ?? 0),
  };
}

export async function getHelpdeskCategory(
  db: AppDatabase,
  workspaceId: string,
  categoryId: string,
) {
  const existing = await selectOne(
    db.select().from(helpdeskCategories).where(eq(helpdeskCategories.id, categoryId)),
  );
  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const [articlesInCategory] = await db
    .select({ value: count() })
    .from(helpdeskArticles)
    .where(eq(helpdeskArticles.categoryId, categoryId));

  return {
    ok: true as const,
    category: toHelpdeskCategory(existing, articlesInCategory?.value ?? 0),
  };
}

export async function deleteHelpdeskCategory(
  db: AppDatabase,
  workspaceId: string,
  categoryId: string,
) {
  const existing = await selectOne(
    db.select().from(helpdeskCategories).where(eq(helpdeskCategories.id, categoryId)),
  );
  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db
    .update(helpdeskArticles)
    .set({ categoryId: null })
    .where(eq(helpdeskArticles.categoryId, categoryId));
  await db.delete(helpdeskCategories).where(eq(helpdeskCategories.id, categoryId));

  return { ok: true as const, id: categoryId };
}
