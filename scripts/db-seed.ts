import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { count, eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  campaignTemplates,
  contacts,
  conversations,
  conversationVisitorData,
  conversationSegments,
  messages,
  messageShortcuts,
  subInboxes,
  routingRules,
  triageRules,
  chatboxRestrictions,
  pluginCatalog,
  pluginCategories,
  users,
  userSessions,
  visitors,
  workspaceMembers,
  workspaces,
  workspaceSubscriptions,
  workspaceAuditLogs,
} from "../src/db/schema";
import {
  conversations as mockConversations,
  currentUser,
  detailsFor,
  threadFor,
  workspace as mockWorkspace,
} from "../src/lib/mock-inbox";
import { contacts as mockContacts, contactCount } from "../src/lib/mock-contacts";
import { plugins as mockPlugins } from "../src/lib/mock-plugins";
import { mockCampaignTemplates } from "../src/lib/mock-campaigns";
import { PLUGIN_CATEGORIES } from "../src/lib/plugins-routes";
import { helpdeskEnabled } from "../src/lib/mock-helpdesk";
import {
  analyticsEnabled,
  analyticsTimezone,
} from "../src/lib/mock-analytics";
import { serializeSegments } from "../src/lib/contacts/mappers";
import { splitDisplayName } from "../src/lib/auth/profile";
import { DEFAULT_FREE_PLAN } from "../src/lib/billing/plans";

import { unlinkSync } from "node:fs";

const root = path.resolve(import.meta.dirname, "..");
const dbPath = process.env.DATABASE_PATH ?? path.join(root, "data", "bybelt.db");

if (existsSync(dbPath)) {
  try {
    unlinkSync(dbPath);
    console.log("Deleted existing database to ensure fresh seed.");
  } catch (err) {
    console.warn("Could not delete existing database:", err);
  }
}

mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    avatar_gradient TEXT NOT NULL,
    presence_status TEXT NOT NULL DEFAULT 'online',
    force_offline INTEGER NOT NULL DEFAULT 0,
    auto_available INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    initials TEXT NOT NULL,
    logo_url TEXT
  );
  CREATE TABLE IF NOT EXISTS workspace_members (
    user_id TEXT NOT NULL REFERENCES users(id),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, workspace_id)
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    name TEXT NOT NULL,
    initials TEXT,
    preview TEXT NOT NULL,
    time_label TEXT NOT NULL,
    unread INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    country TEXT NOT NULL,
    avatar_gradient TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    location TEXT,
    local_time TEXT,
    timezone TEXT,
    channel TEXT,
    device TEXT,
    ip TEXT,
    customer_email TEXT,
    assigned_operator_id TEXT REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    "from" TEXT NOT NULL,
    text TEXT NOT NULL,
    time_label TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    author_user_id TEXT REFERENCES users(id),
    delivered_at INTEGER,
    read_at INTEGER,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_mime TEXT,
    attachment_size INTEGER,
    rfc_message_id TEXT,
    email_in_reply_to TEXT
  );
  CREATE TABLE IF NOT EXISTS conversation_visitor_data (
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    data_key TEXT NOT NULL,
    data_value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (conversation_id, data_key)
  );
  CREATE TABLE IF NOT EXISTS conversation_segments (
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    segment TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (conversation_id, segment)
  );
  CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    name TEXT NOT NULL,
    initials TEXT,
    city TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    current_page TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    avatar_gradient TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    name TEXT NOT NULL,
    initials TEXT,
    email TEXT NOT NULL,
    location TEXT NOT NULL,
    company TEXT NOT NULL,
    segments TEXT NOT NULL,
    last_active TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    avatar_gradient TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    contact_count INTEGER NOT NULL DEFAULT 0,
    last_update TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS campaign_templates (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS helpdesk_articles (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    category_id TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    last_update TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS helpdesk_categories (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS plugin_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    category TEXT NOT NULL,
    badge TEXT,
    price TEXT,
    separate_checkout INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS plugin_categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    count INTEGER NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workspace_plugins (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    plugin_id TEXT NOT NULL REFERENCES plugin_catalog(id),
    installed INTEGER NOT NULL DEFAULT 1,
    installed_at INTEGER NOT NULL,
    PRIMARY KEY (workspace_id, plugin_id)
  );
  CREATE TABLE IF NOT EXISTS workspace_settings (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    setting_key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (workspace_id, setting_key)
  );
  CREATE TABLE IF NOT EXISTS oauth_accounts (
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    email TEXT NOT NULL,
    linked_at INTEGER NOT NULL,
    PRIMARY KEY (provider, provider_user_id)
  );
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    used_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS workspace_subscriptions (
    workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
    plan_tag TEXT NOT NULL DEFAULT 'Free',
    plan_amount TEXT NOT NULL DEFAULT 'Free',
    plan_period TEXT NOT NULL DEFAULT 'forever!',
    status TEXT NOT NULL DEFAULT 'Active',
    billing_owner TEXT NOT NULL DEFAULT 'none',
    monthly_cents INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    label TEXT NOT NULL,
    last4 TEXT NOT NULL,
    brand TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS billing_invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    invoice_number TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'paid',
    issued_at INTEGER NOT NULL,
    payment_method_id TEXT REFERENCES payment_methods(id)
  );
  CREATE TABLE IF NOT EXISTS workspace_audit_logs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    badge TEXT NOT NULL DEFAULT 'Write',
    ip_address TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Unknown',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workspace_api_tokens (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    label TEXT NOT NULL,
    token_preview TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workspace_webhooks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    url TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_agent_log (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    conversation_id TEXT REFERENCES conversations(id),
    message_id TEXT,
    category TEXT NOT NULL DEFAULT 'unknown',
    sentiment TEXT NOT NULL DEFAULT 'neutral',
    risk TEXT NOT NULL DEFAULT 'low',
    is_spam INTEGER NOT NULL DEFAULT 0,
    is_vip INTEGER NOT NULL DEFAULT 0,
    confidence INTEGER NOT NULL DEFAULT 0,
    decision TEXT NOT NULL,
    reason TEXT,
    model TEXT NOT NULL DEFAULT 'rules',
    summary TEXT,
    channel TEXT NOT NULL DEFAULT 'unknown',
    latency_ms INTEGER,
    grounding_source TEXT,
    review_status TEXT,
    error TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS conversation_ai (
    conversation_id TEXT PRIMARY KEY REFERENCES conversations(id),
    summary TEXT,
    sentiment TEXT,
    category TEXT,
    confidence INTEGER,
    is_vip INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_review_queue (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    conversation_id TEXT REFERENCES conversations(id),
    message_id TEXT,
    channel TEXT NOT NULL DEFAULT 'chat',
    state TEXT NOT NULL DEFAULT 'pending_review',
    decision TEXT NOT NULL,
    reason TEXT,
    confidence INTEGER NOT NULL DEFAULT 0,
    confidence_level TEXT NOT NULL DEFAULT 'low',
    draft_text TEXT,
    reviewer TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    resolved_at INTEGER
  );
`);

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_total INTEGER NOT NULL DEFAULT 0`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN helpdesk_enabled INTEGER NOT NULL DEFAULT 0`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN analytics_enabled INTEGER NOT NULL DEFAULT 0`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(
    `ALTER TABLE workspaces ADD COLUMN analytics_timezone TEXT NOT NULL DEFAULT 'UTC'`,
  );
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      email TEXT NOT NULL,
      linked_at INTEGER NOT NULL,
      PRIMARY KEY (provider, provider_user_id)
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      used_at INTEGER
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(
    `ALTER TABLE users ADD COLUMN presence_status TEXT NOT NULL DEFAULT 'online'`,
  );
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT ''`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN phone TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN force_offline INTEGER NOT NULL DEFAULT 0`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN auto_available INTEGER NOT NULL DEFAULT 1`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN schedule_enabled INTEGER NOT NULL DEFAULT 0`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(
    `ALTER TABLE users ADD COLUMN schedule_days TEXT NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]'`,
  );
} catch {
  // Column already exists.
}

try {
  sqlite.exec(
    `ALTER TABLE users ADD COLUMN schedule_timezone TEXT NOT NULL DEFAULT 'UTC+05:00'`,
  );
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN schedule_start TEXT NOT NULL DEFAULT '09:00'`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN schedule_end TEXT NOT NULL DEFAULT '17:00'`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      used_at INTEGER
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT NOT NULL REFERENCES users(id),
      setting_key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_id, setting_key)
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS message_shortcuts (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      bang TEXT NOT NULL,
      tag TEXT,
      message TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS message_shortcuts_workspace_bang
      ON message_shortcuts (workspace_id, bang);
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS triage_rules (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      ruleset TEXT NOT NULL,
      name TEXT NOT NULL,
      action TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      match_contains TEXT,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sub_inboxes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      name TEXT NOT NULL,
      segment TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS sub_inboxes_workspace_name
      ON sub_inboxes (workspace_id, name);
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS routing_rules (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      name TEXT NOT NULL,
      action TEXT NOT NULL,
      assign_target TEXT,
      match_contains TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS routing_rules_workspace_name
      ON routing_rules (workspace_id, name);
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS search_ai_frequent_searches (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      query TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chatbox_restrictions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      kind TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS chatbox_restrictions_workspace_kind_value
    ON chatbox_restrictions (workspace_id, kind, value);
  `);
} catch {
  // Index already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      user_agent TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'Unknown',
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      revoked_at INTEGER
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_email TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_phone TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_messenger TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_telegram TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_twitter TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_whatsapp TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN contact_instagram TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE conversations ADD COLUMN customer_email TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE conversations ADD COLUMN assigned_operator_id TEXT REFERENCES users(id)`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN author_user_id TEXT REFERENCES users(id)`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN delivered_at INTEGER`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN read_at INTEGER`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN attachment_url TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN attachment_name TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN attachment_mime TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN attachment_size INTEGER`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN rfc_message_id TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE messages ADD COLUMN email_in_reply_to TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS conversation_reminders (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      message_id TEXT NOT NULL REFERENCES messages(id),
      author_user_id TEXT NOT NULL REFERENCES users(id),
      remind_at INTEGER NOT NULL,
      note TEXT NOT NULL,
      cancelled_at INTEGER,
      fulfilled_at INTEGER,
      created_at INTEGER NOT NULL
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`ALTER TABLE conversation_reminders ADD COLUMN fulfilled_at INTEGER`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS visitor_chat_sessions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      visitor_nickname TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'US',
      locale TEXT,
      page_url TEXT,
      email TEXT,
      ip TEXT,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`ALTER TABLE visitor_chat_sessions ADD COLUMN phone TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`ALTER TABLE helpdesk_articles ADD COLUMN body TEXT NOT NULL DEFAULT ''`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS conversation_ratings (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id),
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      session_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      comment TEXT,
      created_at INTEGER NOT NULL
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`ALTER TABLE conversation_ratings ADD COLUMN comment TEXT`);
} catch {
  // Column already exists.
}

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS campaign_recipients (
      campaign_id TEXT NOT NULL REFERENCES campaigns(id),
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      added_at INTEGER NOT NULL,
      PRIMARY KEY (campaign_id, contact_id)
    );
  `);
} catch {
  // Table already exists.
}

try {
  sqlite.exec(`ALTER TABLE workspace_webhooks ADD COLUMN events TEXT NOT NULL DEFAULT '["message:operator","message:visitor","message:note","conversation:status","conversation:assigned","conversation:created","conversation:deleted"]'`);
} catch {
  // Column already exists.
}

const db = drizzle(sqlite);

function backfillUserProfileNames() {
  const allUsers = db.select().from(users).all();
  for (const user of allUsers) {
    if (!user.firstName) {
      const { firstName, lastName } = splitDisplayName(user.name);
      db.update(users)
        .set({ firstName, lastName })
        .where(eq(users.id, user.id))
        .run();
    }
  }
}

backfillUserProfileNames();

const WORKSPACE_CONTACT_DEFAULTS = {
  contactEmail: "contact@fashionsis.com",
  contactPhone: "3322528575",
};

function backfillWorkspaceContacts() {
  const allWorkspaces = db.select().from(workspaces).all();
  for (const workspace of allWorkspaces) {
    if (workspace.domain !== mockWorkspace.domain) continue;

    db.update(workspaces)
      .set({
        contactEmail: workspace.contactEmail ?? WORKSPACE_CONTACT_DEFAULTS.contactEmail,
        contactPhone: workspace.contactPhone ?? WORKSPACE_CONTACT_DEFAULTS.contactPhone,
        logoUrl: workspace.logoUrl ?? mockWorkspace.logoUrl ?? null,
      })
      .where(eq(workspaces.id, workspace.id))
      .run();
  }
}

backfillWorkspaceContacts();

function backfillConversationCustomerEmails() {
  db.update(conversations)
    .set({ customerEmail: "amanda.altice@example.com" })
    .where(eq(conversations.id, "c7"))
    .run();
}

backfillConversationCustomerEmails();

function backfillConversationAssignments(targetUserId: string) {
  db.update(conversations)
    .set({ assignedOperatorId: targetUserId })
    .where(eq(conversations.id, "c1"))
    .run();
}

function seedConversationVisitorData() {
  const now = new Date();
  const entries = [{ conversationId: "c7", dataKey: "order_id", dataValue: "1413568" }];

  for (const entry of entries) {
    db.insert(conversationVisitorData)
      .values({
        conversationId: entry.conversationId,
        dataKey: entry.dataKey,
        dataValue: entry.dataValue,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [conversationVisitorData.conversationId, conversationVisitorData.dataKey],
        set: {
          dataValue: entry.dataValue,
          updatedAt: now,
        },
      })
      .run();
  }
}

function seedConversationSegments() {
  const now = new Date();
  const entries = [{ conversationId: "c7", segment: "refund" }];

  for (const entry of entries) {
    db.insert(conversationSegments)
      .values({
        conversationId: entry.conversationId,
        segment: entry.segment,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .run();
  }
}

function seedConversations(workspaceId: string) {
  mockConversations.forEach((conversation, index) => {
    const details = detailsFor(conversation);
    const thread = threadFor(conversation);

    db.insert(conversations)
      .values({
        id: conversation.id,
        workspaceId,
        name: conversation.name,
        initials: conversation.initials ?? null,
        preview: conversation.preview,
        timeLabel: conversation.time,
        unread: conversation.unread,
        status: conversation.status,
        country: conversation.country,
        avatarGradient: conversation.avatarGradient,
        sortOrder: index,
        location: details.location,
        localTime: details.localTime,
        timezone: details.timezone,
        channel: details.channel,
        device: details.device,
        ip: details.ip,
        customerEmail: conversation.id === "c7" ? "amanda.altice@example.com" : null,
      })
      .run();

    thread.forEach((message, messageIndex) => {
      db.insert(messages)
        .values({
          id: message.id,
          conversationId: conversation.id,
          from: message.from,
          text: message.text,
          timeLabel: message.time,
          sortOrder: messageIndex,
        })
        .run();
    });
  });
}

function seedContacts(workspaceId: string) {
  mockContacts.forEach((contact, index) => {
    db.insert(contacts)
      .values({
        id: contact.id,
        workspaceId,
        name: contact.name,
        initials: contact.initials ?? null,
        email: contact.email,
        location: contact.location,
        company: contact.company,
        segments: serializeSegments(contact.segments),
        lastActive: contact.lastActive,
        score: contact.score,
        avatarGradient: contact.avatarGradient,
        sortOrder: index,
      })
      .run();
  });

  db.update(workspaces)
    .set({ contactTotal: contactCount })
    .where(eq(workspaces.id, workspaceId))
    .run();
}

function seedCampaignTemplates(workspaceId: string) {
  mockCampaignTemplates.forEach((template, index) => {
    db.insert(campaignTemplates)
      .values({
        id: template.id,
        workspaceId,
        name: template.name,
        category: template.category,
        sortOrder: index,
      })
      .run();
  });
}

function seedPluginCatalog() {
  mockPlugins.forEach((plugin, index) => {
    db.insert(pluginCatalog)
      .values({
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        iconUrl: plugin.iconUrl,
        category: plugin.category,
        badge: plugin.badge ?? null,
        price: plugin.price ?? null,
        separateCheckout: plugin.separateCheckout ? 1 : 0,
        sortOrder: index,
      })
      .run();
  });
}

function ensureCatalogPlugin(
  database: Database.Database,
  plugin: (typeof mockPlugins)[number],
  sortOrder: number,
) {
  const existing = database
    .prepare("SELECT id FROM plugin_catalog WHERE id = ?")
    .get(plugin.id);
  if (existing) return false;

  database
    .prepare(
      `INSERT INTO plugin_catalog (id, name, description, icon_url, category, badge, price, separate_checkout, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      plugin.id,
      plugin.name,
      plugin.description,
      plugin.iconUrl,
      plugin.category,
      plugin.badge ?? null,
      plugin.price ?? null,
      plugin.separateCheckout ? 1 : 0,
      sortOrder,
    );
  return true;
}

function syncPluginCatalogToStandalone() {
  const standalonePath = path.join(root, ".next", "standalone", "data", "bybelt.db");
  if (!existsSync(standalonePath)) return;

  const standaloneDb = new Database(standalonePath);
  for (const pluginId of ["overlay", "dedicated-email-ip"] as const) {
    const plugin = mockPlugins.find((item) => item.id === pluginId);
    if (!plugin) continue;
    if (ensureCatalogPlugin(standaloneDb, plugin, mockPlugins.indexOf(plugin))) {
      console.log(`Synced ${pluginId} plugin to standalone catalog.`);
    }
  }
  standaloneDb.close();
}

function seedPluginCategories() {
  PLUGIN_CATEGORIES.forEach((category, index) => {
    db.insert(pluginCategories)
      .values({
        id: category.id,
        label: category.label,
        count: category.count,
        sortOrder: index,
      })
      .run();
  });
}

const MOCK_MESSAGE_SHORTCUTS = [
  {
    bang: "!pricing",
    tag: "sales",
    message:
      "Our plans start at $25/month per workspace. Visit our pricing page for full details on Mini, Essentials, and Plus tiers.",
  },
  {
    bang: "!refund",
    tag: "support",
    message:
      "We offer refunds within 30 days of purchase if you are not satisfied. Reply with your order email and we will process it.",
  },
] as const;

function seedMessageShortcuts(workspaceId: string, userId: string) {
  const now = new Date();
  MOCK_MESSAGE_SHORTCUTS.forEach((shortcut, index) => {
    db.insert(messageShortcuts)
      .values({
        id: randomUUID(),
        workspaceId,
        bang: shortcut.bang,
        tag: shortcut.tag,
        message: shortcut.message,
        createdBy: userId,
        sortOrder: index,
        createdAt: now,
      })
      .run();
  });
}

const MOCK_TRIAGE_RULES = [
  {
    ruleset: "block",
    name: "Spam sender filter",
    action: "Send to Spam",
    matchContains: "noreply",
    enabled: 1,
  },
  {
    ruleset: "sort",
    name: "VIP segment",
    action: "Assign Segment",
    matchContains: "vip",
    enabled: 1,
  },
] as const;

function seedTriageRules(workspaceId: string) {
  const now = new Date();
  MOCK_TRIAGE_RULES.forEach((rule, index) => {
    db.insert(triageRules)
      .values({
        id: randomUUID(),
        workspaceId,
        ruleset: rule.ruleset,
        name: rule.name,
        action: rule.action,
        matchContains: rule.matchContains,
        enabled: rule.enabled,
        sortOrder: index,
        createdAt: now,
      })
      .run();
  });
}

const MOCK_SUB_INBOXES = [
  {
    name: "Support",
    segment: "support",
    enabled: 1,
  },
  {
    name: "Sales",
    segment: "sales",
    enabled: 1,
  },
] as const;

function seedSubInboxes(workspaceId: string) {
  const now = new Date();
  MOCK_SUB_INBOXES.forEach((subInbox, index) => {
    db.insert(subInboxes)
      .values({
        id: randomUUID(),
        workspaceId,
        name: subInbox.name,
        segment: subInbox.segment,
        enabled: subInbox.enabled,
        sortOrder: index,
        createdAt: now,
      })
      .run();
  });
}

const MOCK_ROUTING_RULES = [
  {
    name: "Sales queue",
    action: "Assign to Team",
    assignTarget: "Sales",
    matchContains: "pricing",
    enabled: 1,
  },
  {
    name: "Support round robin",
    action: "Round Robin",
    assignTarget: null,
    matchContains: null,
    enabled: 1,
  },
] as const;

function seedRoutingRules(workspaceId: string) {
  const now = new Date();
  MOCK_ROUTING_RULES.forEach((rule, index) => {
    db.insert(routingRules)
      .values({
        id: randomUUID(),
        workspaceId,
        name: rule.name,
        action: rule.action,
        assignTarget: rule.assignTarget,
        matchContains: rule.matchContains,
        enabled: rule.enabled,
        sortOrder: index,
        createdAt: now,
      })
      .run();
  });
}

const MOCK_BLOCKED_PAGES = [
  "https://www.fabzop.com/cart",
  "https://www.fabzop.com/checkout",
] as const;

function seedChatboxRestrictions(workspaceId: string) {
  const now = new Date();
  MOCK_BLOCKED_PAGES.forEach((value, index) => {
    db.insert(chatboxRestrictions)
      .values({
        id: randomUUID(),
        workspaceId,
        kind: "blocked_page",
        value,
        sortOrder: index,
        createdAt: now,
      })
      .run();
  });
}

function memberWorkspaceIds(targetUserId: string) {
  return db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, targetUserId))
    .all()
    .map((row) => row.workspaceId);
}

function seedWorkspaceAuditLogs(workspaceId: string, userId: string) {
  const existing = db
    .select({ value: count() })
    .from(workspaceAuditLogs)
    .where(eq(workspaceAuditLogs.workspaceId, workspaceId))
    .get();

  if ((existing?.value ?? 0) > 0) {
    return;
  }

  const now = new Date();
  const mins45 = new Date(now.getTime() - 45 * 60_000);
  const hour1 = new Date(now.getTime() - 60 * 60_000);
  const year =
    now.getMonth() < 4 || (now.getMonth() === 4 && now.getDate() < 5)
      ? now.getFullYear() - 1
      : now.getFullYear();
  const mayFifth = new Date(year, 4, 5, 19, 8);

  const entries = [
    { action: "Operator logged in", ipAddress: "39.48.199.245", createdAt: mins45 },
    { action: "Operator logged in", ipAddress: "39.48.199.245", createdAt: hour1 },
    { action: "Operator logged out", ipAddress: "39.48.199.245", createdAt: hour1 },
    { action: "Workspace settings", ipAddress: "39.48.197.175", createdAt: mayFifth },
  ];

  for (const entry of entries) {
    db.insert(workspaceAuditLogs)
      .values({
        id: randomUUID(),
        workspaceId,
        userId,
        action: entry.action,
        badge: "Write",
        ipAddress: entry.ipAddress,
        country: "Pakistan",
        createdAt: entry.createdAt,
      })
      .run();
  }

  console.log(`Seeded ${entries.length} transparency audit logs for ${workspaceId}.`);
}

function seedWorkspaceSubscriptions(targetUserId: string) {
  for (const memberWorkspaceId of memberWorkspaceIds(targetUserId)) {
    const existing = db
      .select({ value: count() })
      .from(workspaceSubscriptions)
      .where(eq(workspaceSubscriptions.workspaceId, memberWorkspaceId))
      .get();
    if ((existing?.value ?? 0) > 0) {
      continue;
    }

    db.insert(workspaceSubscriptions)
      .values({
        workspaceId: memberWorkspaceId,
        planTag: DEFAULT_FREE_PLAN.planTag,
        planAmount: DEFAULT_FREE_PLAN.planAmount,
        planPeriod: DEFAULT_FREE_PLAN.planPeriod,
        status: DEFAULT_FREE_PLAN.status,
        billingOwner: DEFAULT_FREE_PLAN.billingOwner,
        monthlyCents: DEFAULT_FREE_PLAN.monthlyCents,
      })
      .run();
    console.log(`Seeded free subscription for ${memberWorkspaceId}.`);
  }
}

function seedWorkspaceInboxResources(targetUserId: string) {
  for (const memberWorkspaceId of memberWorkspaceIds(targetUserId)) {
    const shortcutCount = db
      .select({ value: count() })
      .from(messageShortcuts)
      .where(eq(messageShortcuts.workspaceId, memberWorkspaceId))
      .get();
    if ((shortcutCount?.value ?? 0) === 0) {
      seedMessageShortcuts(memberWorkspaceId, targetUserId);
      console.log(`Seeded ${MOCK_MESSAGE_SHORTCUTS.length} message shortcuts for ${memberWorkspaceId}.`);
    }

    const triageCount = db
      .select({ value: count() })
      .from(triageRules)
      .where(eq(triageRules.workspaceId, memberWorkspaceId))
      .get();
    if ((triageCount?.value ?? 0) === 0) {
      seedTriageRules(memberWorkspaceId);
      console.log(`Seeded ${MOCK_TRIAGE_RULES.length} triage rules for ${memberWorkspaceId}.`);
    }

    const subInboxCount = db
      .select({ value: count() })
      .from(subInboxes)
      .where(eq(subInboxes.workspaceId, memberWorkspaceId))
      .get();
    if ((subInboxCount?.value ?? 0) === 0) {
      seedSubInboxes(memberWorkspaceId);
      console.log(`Seeded ${MOCK_SUB_INBOXES.length} sub-inboxes for ${memberWorkspaceId}.`);
    }

    const routingCount = db
      .select({ value: count() })
      .from(routingRules)
      .where(eq(routingRules.workspaceId, memberWorkspaceId))
      .get();
    if ((routingCount?.value ?? 0) === 0) {
      seedRoutingRules(memberWorkspaceId);
      console.log(`Seeded ${MOCK_ROUTING_RULES.length} routing rules for ${memberWorkspaceId}.`);
    }

    const restrictionCount = db
      .select({ value: count() })
      .from(chatboxRestrictions)
      .where(eq(chatboxRestrictions.workspaceId, memberWorkspaceId))
      .get();
    if ((restrictionCount?.value ?? 0) === 0) {
      seedChatboxRestrictions(memberWorkspaceId);
      console.log(`Seeded ${MOCK_BLOCKED_PAGES.length} chatbox restrictions for ${memberWorkspaceId}.`);
    }
  }
}

function attachMockDataToWorkspace(workspaceId: string) {
  const hasMockConversations = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, mockConversations[0]!.id))
    .get();

  if (hasMockConversations) {
    for (const conversation of mockConversations) {
      db.update(conversations)
        .set({ workspaceId })
        .where(eq(conversations.id, conversation.id))
        .run();
    }
    for (const contact of mockContacts) {
      db.update(contacts).set({ workspaceId }).where(eq(contacts.id, contact.id)).run();
    }
    for (const template of mockCampaignTemplates) {
      db.update(campaignTemplates)
        .set({ workspaceId })
        .where(eq(campaignTemplates.id, template.id))
        .run();
    }
    return;
  }

  seedConversations(workspaceId);
  seedContacts(workspaceId);
  seedCampaignTemplates(workspaceId);
}

const password = process.env.SEED_USER_PASSWORD ?? "fashionsis-dev";
const passwordHash = bcrypt.hashSync(password, 12);

let workspaceId: string;
let userId: string;

const existingUser = db.select().from(users).where(eq(users.email, currentUser.email)).get();

if (existingUser) {
  userId = existingUser.id;
  const membership = db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, existingUser.id))
    .get();

  if (!membership) {
    console.error("User exists but has no workspace membership.");
    sqlite.close();
    process.exit(1);
  }

  workspaceId = membership.workspaceId;
  console.log(`User ${currentUser.email} already exists.`);
  db.update(users)
    .set({ presenceStatus: "online", forceOffline: 0 })
    .where(eq(users.id, userId))
    .run();
} else {
  userId = randomUUID();
  workspaceId = randomUUID();
  const { firstName, lastName } = splitDisplayName(currentUser.name);

  db.insert(users)
    .values({
      id: userId,
      email: currentUser.email,
      passwordHash,
      name: currentUser.name,
      firstName,
      lastName,
      phone: null,
      avatarGradient: currentUser.avatarGradient,
      createdAt: new Date(),
    })
    .run();

  db.insert(workspaces)
    .values({
      id: workspaceId,
      name: mockWorkspace.name,
      domain: mockWorkspace.domain,
      initials: mockWorkspace.initials,
      logoUrl: mockWorkspace.logoUrl ?? null,
      contactEmail: WORKSPACE_CONTACT_DEFAULTS.contactEmail,
      contactPhone: WORKSPACE_CONTACT_DEFAULTS.contactPhone,
      contactTotal: contactCount,
      helpdeskEnabled: helpdeskEnabled ? 1 : 0,
      analyticsEnabled: analyticsEnabled ? 1 : 0,
      analyticsTimezone,
    })
    .run();

  db.insert(workspaceMembers)
    .values({
      userId,
      workspaceId,
      role: "owner",
    })
    .run();

  console.log("Database seeded (user + workspace).");
  console.log(`  Email:    ${currentUser.email}`);
  console.log(`  Password: ${password}`);
}

function seedUserSessionHistory(targetUserId: string) {
  const existing = db
    .select({ value: count() })
    .from(userSessions)
    .where(eq(userSessions.userId, targetUserId))
    .get();

  if ((existing?.value ?? 0) > 0) {
    return;
  }

  const now = Date.now();
  const samples = [
    {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ipAddress: "39.48.199.245",
      country: "Pakistan",
      minutesAgo: 17,
      revokedAt: null as Date | null,
    },
    {
      userAgent: "okhttp/4.12.0",
      ipAddress: "39.48.196.15",
      country: "Pakistan",
      minutesAgo: 60 * 24 * 21,
      revokedAt: null,
    },
    {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      ipAddress: "39.57.35.221",
      country: "Pakistan",
      minutesAgo: 60 * 24 * 40,
      revokedAt: new Date(now - 60 * 24 * 35 * 60_000),
    },
  ];

  for (const sample of samples) {
    const createdAt = new Date(now - sample.minutesAgo * 60_000);
    db.insert(userSessions)
      .values({
        id: randomUUID(),
        userId: targetUserId,
        userAgent: sample.userAgent,
        ipAddress: sample.ipAddress,
        country: sample.country,
        createdAt,
        lastSeenAt: createdAt,
        revokedAt: sample.revokedAt,
      })
      .run();
  }

  console.log(`Seeded ${samples.length} login history sessions.`);
}

seedUserSessionHistory(userId);

const hasMockConversations = db
  .select()
  .from(conversations)
  .where(eq(conversations.id, mockConversations[0]!.id))
  .get();

attachMockDataToWorkspace(workspaceId);

if (hasMockConversations) {
  const existingConversations = db
    .select({ value: count() })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId))
    .get();
  console.log(`Conversations already seeded (${existingConversations?.value ?? 0}).`);
} else {
  console.log(`Seeded ${mockConversations.length} conversations with messages.`);
}

const hasMockContacts = db
  .select()
  .from(contacts)
  .where(eq(contacts.id, mockContacts[0]!.id))
  .get();

if (hasMockContacts) {
  const existingContacts = db
    .select({ value: count() })
    .from(contacts)
    .where(eq(contacts.workspaceId, workspaceId))
    .get();
  console.log(`Contacts already seeded (${existingContacts?.value ?? 0}).`);
} else {
  console.log(`Seeded ${mockContacts.length} contacts (total ${contactCount}).`);
}

const hasMockTemplates = db
  .select()
  .from(campaignTemplates)
  .where(eq(campaignTemplates.id, mockCampaignTemplates[0]!.id))
  .get();

if (hasMockTemplates) {
  const existingTemplates = db
    .select({ value: count() })
    .from(campaignTemplates)
    .where(eq(campaignTemplates.workspaceId, workspaceId))
    .get();
  console.log(`Campaign templates already seeded (${existingTemplates?.value ?? 0}).`);
} else {
  console.log(`Seeded ${mockCampaignTemplates.length} campaign templates.`);
}

const existingCatalog = db.select({ value: count() }).from(pluginCatalog).get();
if ((existingCatalog?.value ?? 0) > 0) {
  console.log(`Plugin catalog already seeded (${existingCatalog?.value}).`);
} else {
  seedPluginCatalog();
  console.log(`Seeded ${mockPlugins.length} plugins.`);
}

const overlayPlugin = db
  .select()
  .from(pluginCatalog)
  .where(eq(pluginCatalog.id, "overlay"))
  .get();
if (!overlayPlugin) {
  const overlay = mockPlugins.find((plugin) => plugin.id === "overlay");
  if (overlay) {
    db.insert(pluginCatalog)
      .values({
        id: overlay.id,
        name: overlay.name,
        description: overlay.description,
        iconUrl: overlay.iconUrl,
        category: overlay.category,
        badge: overlay.badge ?? null,
        price: overlay.price ?? null,
        separateCheckout: overlay.separateCheckout ? 1 : 0,
        sortOrder: mockPlugins.length - 1,
      })
      .run();
    console.log("Added Overlay plugin to catalog.");
  }
}

const dedicatedEmailIpPlugin = db
  .select()
  .from(pluginCatalog)
  .where(eq(pluginCatalog.id, "dedicated-email-ip"))
  .get();
if (!dedicatedEmailIpPlugin) {
  const dedicatedEmailIp = mockPlugins.find((plugin) => plugin.id === "dedicated-email-ip");
  if (dedicatedEmailIp) {
    db.insert(pluginCatalog)
      .values({
        id: dedicatedEmailIp.id,
        name: dedicatedEmailIp.name,
        description: dedicatedEmailIp.description,
        iconUrl: dedicatedEmailIp.iconUrl,
        category: dedicatedEmailIp.category,
        badge: dedicatedEmailIp.badge ?? null,
        price: dedicatedEmailIp.price ?? null,
        separateCheckout: dedicatedEmailIp.separateCheckout ? 1 : 0,
        sortOrder: mockPlugins.length,
      })
      .run();
    console.log("Added Dedicated Email IP plugin to catalog.");
  }
}

const existingPluginCategories = db.select({ value: count() }).from(pluginCategories).get();
if ((existingPluginCategories?.value ?? 0) > 0) {
  console.log(`Plugin categories already seeded (${existingPluginCategories?.value}).`);
} else {
  seedPluginCategories();
  console.log(`Seeded ${PLUGIN_CATEGORIES.length} plugin categories.`);
}

seedWorkspaceInboxResources(userId);

function seedSecondaryOperator(primaryWorkspaceId: string) {
  const secondaryEmail = "team@fashionpara.com";
  const existing = db.select().from(users).where(eq(users.email, secondaryEmail)).get();

  let secondaryUserId = existing?.id;
  if (!existing) {
    secondaryUserId = randomUUID();
    db.insert(users)
      .values({
        id: secondaryUserId,
        email: secondaryEmail,
        passwordHash,
        name: "Team Operator",
        firstName: "Team",
        lastName: "Operator",
        phone: null,
        avatarGradient: "from-violet-500 to-purple-600",
        createdAt: new Date(),
      })
      .run();
    console.log(`Seeded secondary operator ${secondaryEmail}.`);
  }

  if (!secondaryUserId) {
    return;
  }

  const membership = db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, secondaryUserId),
        eq(workspaceMembers.workspaceId, primaryWorkspaceId),
      ),
    )
    .get();

  if (!membership) {
    db.insert(workspaceMembers)
      .values({
        userId: secondaryUserId,
        workspaceId: primaryWorkspaceId,
        role: "member",
      })
      .run();
    console.log(`Linked secondary operator to workspace ${primaryWorkspaceId}.`);
  }
}

seedSecondaryOperator(workspaceId);

db.update(workspaces)
  .set({
    contactTotal: contactCount,
    helpdeskEnabled: helpdeskEnabled ? 1 : 0,
    analyticsEnabled: analyticsEnabled ? 1 : 0,
    analyticsTimezone,
  })
  .where(eq(workspaces.id, workspaceId))
  .run();

const DEMO_WORKSPACE_ID = "ws-demo-boutique";
const demoWorkspace = db.select().from(workspaces).where(eq(workspaces.id, DEMO_WORKSPACE_ID)).get();
if (!demoWorkspace) {
  db.insert(workspaces)
    .values({
      id: DEMO_WORKSPACE_ID,
      name: "Demo Boutique",
      domain: "demo-boutique.com",
      initials: "DB",
      logoUrl: null,
      contactTotal: 0,
      helpdeskEnabled: 0,
      analyticsEnabled: 0,
      analyticsTimezone: "UTC",
    })
    .run();
  console.log("Seeded secondary workspace Demo Boutique.");
}

const demoMembership = db
  .select()
  .from(workspaceMembers)
  .where(
    and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, DEMO_WORKSPACE_ID)),
  )
  .get();

if (!demoMembership) {
  db.insert(workspaceMembers)
    .values({
      userId,
      workspaceId: DEMO_WORKSPACE_ID,
      role: "member",
    })
    .run();
  console.log("Linked user to Demo Boutique workspace.");
}

seedWorkspaceSubscriptions(userId);
seedWorkspaceAuditLogs(workspaceId, userId);
backfillConversationAssignments(userId);
seedConversationVisitorData();
seedConversationSegments();
syncPluginCatalogToStandalone();

console.log(`  DB: ${dbPath}`);
sqlite.close();
