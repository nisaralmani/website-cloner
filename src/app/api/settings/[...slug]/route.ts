import { NextResponse } from "next/server";
import { and, eq, like } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { users, workspaceSettings } from "@/db/schema";
import { fromBooleanFlag, toBooleanFlag } from "@/lib/auth/flags";
import { toOperatorPresence } from "@/lib/auth/presence";
import { requireSession } from "@/lib/auth/request";
import { getPageConfig } from "@/lib/settings-data";
import {
  AVAILABILITY_AUTO_AVAILABLE_KEY,
  AVAILABILITY_FORCE_OFFLINE_KEY,
  AVAILABILITY_SCHEDULE_ENABLED_KEY,
  isAvailabilityPage,
  presenceFromForceOffline,
} from "@/lib/settings/availability";
import { normalizeAvailabilitySchedule } from "@/lib/auth/schedule";
import { isUserFieldSettingsPage, isUserToggleSettingsPage } from "@/lib/settings/user-pages";
import {
  loadUserSettingFields,
  loadUserSettingToggles,
  saveUserSettingField,
  saveUserSettingToggle,
} from "@/lib/settings/user-settings";
import {
  extractDefaultToggles,
  toggleSettingKey,
} from "@/lib/settings/toggles";
import { appendWorkspaceAuditLog } from "@/lib/transparency/append-audit-log";
import {
  DEFAULT_INTERFACE_PREFERENCES,
  type InterfaceFieldKey,
  validateInterfaceField,
} from "@/lib/auth/interface-preferences";
import {
  isSecretFieldKey,
  loadWorkspaceSettingFields,
  saveWorkspaceSettingField,
} from "@/lib/settings/workspace-settings";
import {
  isWorkspaceFieldSettingsPage,
  validateWorkspaceSettingField,
  workspaceFieldDefaults,
} from "@/lib/settings/workspace-pages";
type RouteContext = { params: Promise<{ slug: string[] }> };

function pageSlugFromParams(slug: string[]): string | null {
  if (slug.length === 0) return null;
  return slug.join("/");
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageSlug = pageSlugFromParams((await context.params).slug);
  if (!pageSlug) {
    return NextResponse.json({ error: "Page slug is required" }, { status: 400 });
  }

  const config = getPageConfig(pageSlug);
  if (!config) {
    return NextResponse.json({ error: "Settings page not found" }, { status: 404 });
  }

  const defaults = extractDefaultToggles(config);
  const db = await getDb();

  if (isUserFieldSettingsPage(pageSlug)) {
    const fields = await loadUserSettingFields(
      db,
      session.user.id,
      pageSlug,
      { ...DEFAULT_INTERFACE_PREFERENCES },
    );

    return NextResponse.json({ pageSlug, fields });
  }

  let toggles: Record<string, boolean>;

  if (isUserToggleSettingsPage(pageSlug)) {
    toggles = await loadUserSettingToggles(db, session.user.id, pageSlug, defaults);
  } else {
    const workspaceId = session.workspace.id;
    const prefix = `${pageSlug}::`;

    const rows = await selectAll(
      db
        .select()
        .from(workspaceSettings)
        .where(
          and(
            eq(workspaceSettings.workspaceId, workspaceId),
            like(workspaceSettings.settingKey, `${prefix}%`),
          ),
        ),
    );

    toggles = { ...defaults };
    const fieldKeys = isWorkspaceFieldSettingsPage(pageSlug)
      ? new Set(Object.keys(workspaceFieldDefaults(pageSlug)))
      : null;

    for (const row of rows) {
      const localKey = row.settingKey.slice(prefix.length);
      if (fieldKeys?.has(localKey)) {
        continue;
      }
      toggles[localKey] = row.value === "true";
    }
  }

  if (isAvailabilityPage(pageSlug)) {
    const user = await selectOne(
      db.select().from(users).where(eq(users.id, session.user.id)),
    );
    if (user) {
      toggles[AVAILABILITY_FORCE_OFFLINE_KEY] = toBooleanFlag(user.forceOffline);
      toggles[AVAILABILITY_AUTO_AVAILABLE_KEY] = toBooleanFlag(user.autoAvailable);
      toggles[AVAILABILITY_SCHEDULE_ENABLED_KEY] = toBooleanFlag(user.scheduleEnabled);
    }
  }

  const payload: {
    pageSlug: string;
    toggles: Record<string, boolean>;
    fields?: Record<string, string>;
    presence?: "online" | "offline";
    schedule?: ReturnType<typeof normalizeAvailabilitySchedule>;
  } = { pageSlug, toggles };

  if (isWorkspaceFieldSettingsPage(pageSlug)) {
    const fields: Record<string, string> = await loadWorkspaceSettingFields(
      db,
      session.workspace.id,
      pageSlug,
      workspaceFieldDefaults(pageSlug),
    );
    // Never send decrypted secrets (e.g. SMTP/IMAP passwords) to the browser.
    for (const key of Object.keys(fields)) {
      if (isSecretFieldKey(key)) fields[key] = "";
    }
    payload.fields = fields;
  }

  if (isAvailabilityPage(pageSlug)) {
    const user = await selectOne(
      db.select().from(users).where(eq(users.id, session.user.id)),
    );
    payload.presence = toOperatorPresence(user?.presenceStatus);
    if (user) {
      payload.schedule = normalizeAvailabilitySchedule(user);
    }
  }

  return NextResponse.json(payload);
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageSlug = pageSlugFromParams((await context.params).slug);
  if (!pageSlug) {
    return NextResponse.json({ error: "Page slug is required" }, { status: 400 });
  }

  const config = getPageConfig(pageSlug);
  if (!config) {
    return NextResponse.json({ error: "Settings page not found" }, { status: 404 });
  }

  const db = await getDb();

  if (isUserFieldSettingsPage(pageSlug)) {
    let body: { key?: string; value?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const localKey = body.key;
    const value = body.value;
    if (!localKey || typeof value !== "string") {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    if (!(localKey in DEFAULT_INTERFACE_PREFERENCES)) {
      return NextResponse.json({ error: "Unknown field key" }, { status: 400 });
    }

    const validationError = validateInterfaceField(localKey as InterfaceFieldKey, value);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const trimmed = value.trim();
    await saveUserSettingField(db, session.user.id, pageSlug, localKey, trimmed);

    return NextResponse.json({
      key: localKey,
      value: trimmed,
    });
  }

  let body: { key?: string; on?: boolean; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (isWorkspaceFieldSettingsPage(pageSlug) && typeof body.value === "string") {
    const localKey = body.key;
    const value = body.value;
    if (!localKey) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    const defaults = workspaceFieldDefaults(pageSlug);
    if (!(localKey in defaults)) {
      return NextResponse.json({ error: "Unknown field key" }, { status: 400 });
    }

    const validationError = validateWorkspaceSettingField(pageSlug, localKey, value);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const trimmed = value.trim();
    await saveWorkspaceSettingField(
      db,
      session.workspace.id,
      pageSlug,
      localKey,
      trimmed,
    );

    return NextResponse.json({
      key: localKey,
      value: trimmed,
    });
  }

  const localKey = body.key;
  if (!localKey || typeof body.on !== "boolean") {
    return NextResponse.json({ error: "key and on are required" }, { status: 400 });
  }

  const defaults = extractDefaultToggles(config);
  if (!(localKey in defaults)) {
    return NextResponse.json({ error: "Unknown toggle key" }, { status: 400 });
  }

  if (isAvailabilityPage(pageSlug) && localKey === AVAILABILITY_FORCE_OFFLINE_KEY) {
    const presence = presenceFromForceOffline(body.on);
    await db
      .update(users)
      .set({
        forceOffline: fromBooleanFlag(body.on),
        presenceStatus: presence,
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      key: localKey,
      on: body.on,
      presence,
    });
  }

  if (isAvailabilityPage(pageSlug) && localKey === AVAILABILITY_AUTO_AVAILABLE_KEY) {
    await db
      .update(users)
      .set({ autoAvailable: fromBooleanFlag(body.on) })
      .where(eq(users.id, session.user.id));

    const user = await selectOne(
      db.select().from(users).where(eq(users.id, session.user.id)),
    );

    return NextResponse.json({
      key: localKey,
      on: body.on,
      presence: toOperatorPresence(user?.presenceStatus),
    });
  }

  if (isAvailabilityPage(pageSlug) && localKey === AVAILABILITY_SCHEDULE_ENABLED_KEY) {
    await db
      .update(users)
      .set({ scheduleEnabled: fromBooleanFlag(body.on) })
      .where(eq(users.id, session.user.id));

    const user = await selectOne(
      db.select().from(users).where(eq(users.id, session.user.id)),
    );

    return NextResponse.json({
      key: localKey,
      on: body.on,
      schedule: user ? normalizeAvailabilitySchedule(user) : undefined,
    });
  }

  if (isUserToggleSettingsPage(pageSlug)) {
    const settingKey = toggleSettingKey(pageSlug, localKey);
    await saveUserSettingToggle(db, session.user.id, settingKey, body.on);

    return NextResponse.json({
      key: localKey,
      on: body.on,
    });
  }

  const workspaceId = session.workspace.id;
  const settingKey = toggleSettingKey(pageSlug, localKey);
  const value = body.on ? "true" : "false";

  const existing = await selectOne(
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

  if (existing) {
    await db
      .update(workspaceSettings)
      .set({ value })
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      );
  } else {
    await db.insert(workspaceSettings).values({
      workspaceId,
      settingKey,
      value,
    });
  }

  await appendWorkspaceAuditLog(db, {
    workspaceId,
    userId: session.user.id,
    action: `Updated ${pageSlug} setting ${localKey}`,
  });

  return NextResponse.json({
    key: localKey,
    on: body.on,
  });
}
