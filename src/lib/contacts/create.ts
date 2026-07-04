import { randomUUID } from "crypto";
import { eq, max, count } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { contacts, workspaces } from "@/db/schema";
import { serializeSegments, toContact } from "@/lib/contacts/mappers";
import type { ContactSegment } from "@/types/contacts";

const GRADIENTS = [
  "from-violet-400 to-blue-500",
  "from-sky-400 to-indigo-500",
  "from-fuchsia-400 to-purple-500",
] as const;

export async function createContact(
  db: AppDatabase,
  workspaceId: string,
  input: {
    name: string;
    email: string;
    location?: string;
    company?: string;
    segments?: ContactSegment[];
  },
) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email) {
    return { ok: false as const, error: "name and email are required" };
  }

  const [maxOrderRow] = await db
    .select({ value: max(contacts.sortOrder) })
    .from(contacts)
    .where(eq(contacts.workspaceId, workspaceId));

  const id = randomUUID();
  const nowLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  await db.insert(contacts).values({
    id,
    workspaceId,
    name,
    initials: name.slice(0, 2).toUpperCase(),
    email,
    location: input.location?.trim() || "Unknown",
    company: input.company?.trim() || "—",
    segments: serializeSegments(input.segments ?? ["chat"]),
    lastActive: nowLabel,
    score: 0,
    avatarGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]!,
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
  });

  const row = await selectOne(db.select().from(contacts).where(eq(contacts.id, id)));
  if (!row) {
    return { ok: false as const, error: "Failed to create contact" };
  }

  const [totalRow] = await db
    .select({ value: count() })
    .from(contacts)
    .where(eq(contacts.workspaceId, workspaceId));
  await db
    .update(workspaces)
    .set({ contactTotal: totalRow?.value ?? 0 })
    .where(eq(workspaces.id, workspaceId));

  return { ok: true as const, contact: toContact(row) };
}

export async function updateContact(
  db: AppDatabase,
  workspaceId: string,
  contactId: string,
  input: {
    name?: string;
    email?: string;
    location?: string;
    company?: string;
    segments?: ContactSegment[];
  },
) {
  const existing = await selectOne(
    db.select().from(contacts).where(eq(contacts.id, contactId)),
  );
  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const updates: Partial<typeof contacts.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false as const, error: "name is required" };
    updates.name = name;
    updates.initials = name.slice(0, 2).toUpperCase();
  }
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!email) return { ok: false as const, error: "email is required" };
    updates.email = email;
  }
  if (input.location !== undefined) updates.location = input.location.trim() || "Unknown";
  if (input.company !== undefined) updates.company = input.company.trim() || "—";
  if (input.segments !== undefined) updates.segments = serializeSegments(input.segments);

  await db.update(contacts).set(updates).where(eq(contacts.id, contactId));

  const row = await selectOne(db.select().from(contacts).where(eq(contacts.id, contactId)));
  if (!row) return { ok: false as const, reason: "not_found" as const };

  return { ok: true as const, contact: toContact(row) };
}

export async function deleteContact(db: AppDatabase, workspaceId: string, contactId: string) {
  const existing = await selectOne(
    db.select().from(contacts).where(eq(contacts.id, contactId)),
  );
  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db.delete(contacts).where(eq(contacts.id, contactId));

  const [totalRow] = await db
    .select({ value: count() })
    .from(contacts)
    .where(eq(contacts.workspaceId, workspaceId));
  await db
    .update(workspaces)
    .set({ contactTotal: totalRow?.value ?? 0 })
    .where(eq(workspaces.id, workspaceId));

  return { ok: true as const, id: contactId };
}
