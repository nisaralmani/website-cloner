import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { contacts } from "@/db/schema";
import { createContact, updateContact } from "@/lib/contacts/create";
import { toContact } from "@/lib/contacts/mappers";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";
import type { ContactSegment } from "@/types/contacts";

export type ShopifyContactInput = {
  name: string;
  email: string;
  location?: string;
  company?: string;
};

function mergeSegments(existing: ContactSegment[]): ContactSegment[] {
  if (existing.includes("shopify")) return existing;
  return [...existing, "shopify"];
}

export async function upsertShopifyContact(
  db: AppDatabase,
  workspaceId: string,
  input: ShopifyContactInput,
) {
  const email = normalizeCustomerEmail(input.email);
  const name = input.name.trim();
  if (!email || !name) {
    return { ok: false as const, error: "name and email are required" };
  }

  const existing = await selectOne(
    db
      .select()
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), eq(contacts.email, email))),
  );

  if (!existing) {
    const created = await createContact(db, workspaceId, {
      name,
      email,
      location: input.location,
      company: input.company ?? "Shopify",
      segments: ["shopify"],
    });
    if (!created.ok) return created;
    return { ok: true as const, created: true, updated: false, contact: created.contact };
  }

  const current = toContact(existing);
  const segments = mergeSegments(current.segments);
  const updated = await updateContact(db, workspaceId, existing.id, {
    name: name !== existing.name ? name : undefined,
    location: input.location?.trim() || undefined,
    company: input.company?.trim() || undefined,
    segments: segments.length !== current.segments.length ? segments : undefined,
  });

  if (!updated.ok) return updated;
  return {
    ok: true as const,
    created: false,
    updated: true,
    contact: updated.contact,
  };
}

export async function syncShopifyContacts(
  db: AppDatabase,
  workspaceId: string,
  rows: ShopifyContactInput[],
) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const result = await upsertShopifyContact(db, workspaceId, row);
    if (!result.ok) {
      skipped += 1;
      continue;
    }
    if (result.created) created += 1;
    else if (result.updated) updated += 1;
    else skipped += 1;
  }

  return { created, updated, skipped, total: rows.length };
}
