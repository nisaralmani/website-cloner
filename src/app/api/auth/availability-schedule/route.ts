import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import { fromBooleanFlag } from "@/lib/auth/flags";
import { normalizeAvailabilitySchedule } from "@/lib/auth/schedule";
import { requireSession } from "@/lib/auth/request";
import {
  AVAILABILITY_DAYS,
  normalizeScheduleTime,
  serializeScheduleDays,
  validateSchedulePatch,
  type AvailabilityDay,
  type AvailabilitySchedule,
} from "@/lib/settings/schedule";

function scheduleResponse(user: typeof users.$inferSelect) {
  return { schedule: normalizeAvailabilitySchedule(user) };
}

export async function GET() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(scheduleResponse(user));
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<AvailabilitySchedule>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const currentRow = await selectOne(
    db.select().from(users).where(eq(users.id, session.user.id)),
  );
  if (!currentRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const current = normalizeAvailabilitySchedule(currentRow);
  const patch: Partial<AvailabilitySchedule> = {};

  if (body.enabled !== undefined) {
    patch.enabled = Boolean(body.enabled);
  }
  if (body.days !== undefined) {
    patch.days = body.days.filter((day): day is AvailabilityDay =>
      AVAILABILITY_DAYS.includes(day as AvailabilityDay),
    );
  }
  if (body.timezone !== undefined) {
    patch.timezone = body.timezone.trim();
  }
  if (body.start !== undefined) {
    patch.start = normalizeScheduleTime(body.start, current.start);
  }
  if (body.end !== undefined) {
    patch.end = normalizeScheduleTime(body.end, current.end);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No schedule fields provided" }, { status: 400 });
  }

  const nextSchedule: AvailabilitySchedule = {
    ...current,
    ...patch,
  };

  const errors = validateSchedulePatch({
    ...patch,
    start: patch.start ?? current.start,
    end: patch.end ?? current.end,
  });
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      ...(patch.enabled !== undefined
        ? { scheduleEnabled: fromBooleanFlag(patch.enabled) }
        : {}),
      ...(patch.days !== undefined
        ? { scheduleDays: serializeScheduleDays(patch.days) }
        : {}),
      ...(patch.timezone !== undefined ? { scheduleTimezone: patch.timezone } : {}),
      ...(patch.start !== undefined ? { scheduleStart: patch.start } : {}),
      ...(patch.end !== undefined ? { scheduleEnd: patch.end } : {}),
    })
    .where(eq(users.id, session.user.id));

  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    schedule: normalizeAvailabilitySchedule(user),
    validated: nextSchedule,
  });
}
