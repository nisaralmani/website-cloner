import { sqliteTable, text, integer, real, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  avatarGradient: text("avatar_gradient").notNull(),
  emailVerified: integer("email_verified").notNull().default(0),
  presenceStatus: text("presence_status").notNull().default("online"),
  forceOffline: integer("force_offline").notNull().default(0),
  autoAvailable: integer("auto_available").notNull().default(1),
  scheduleEnabled: integer("schedule_enabled").notNull().default(0),
  scheduleDays: text("schedule_days").notNull().default('["Mon","Tue","Wed","Thu","Fri","Sat"]'),
  scheduleTimezone: text("schedule_timezone").notNull().default("UTC+05:00"),
  scheduleStart: text("schedule_start").notNull().default("09:00"),
  scheduleEnd: text("schedule_end").notNull().default("17:00"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  initials: text("initials").notNull(),
  logoUrl: text("logo_url"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactMessenger: text("contact_messenger"),
  contactTelegram: text("contact_telegram"),
  contactTwitter: text("contact_twitter"),
  contactWhatsapp: text("contact_whatsapp"),
  contactInstagram: text("contact_instagram"),
  contactTotal: integer("contact_total").notNull().default(0),
  helpdeskEnabled: integer("helpdesk_enabled").notNull().default(0),
  analyticsEnabled: integer("analytics_enabled").notNull().default(0),
  analyticsTimezone: text("analytics_timezone").notNull().default("UTC"),
});

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    role: text("role").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.workspaceId] })],
);

export const oauthAccounts = sqliteTable(
  "oauth_accounts",
  {
    provider: text("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    email: text("email").notNull(),
    linkedAt: integer("linked_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerUserId] })],
);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
});

export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
});

export const userSessions = sqliteTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  userAgent: text("user_agent").notNull(),
  ipAddress: text("ip_address").notNull(),
  country: text("country").notNull().default("Unknown"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  initials: text("initials"),
  preview: text("preview").notNull(),
  timeLabel: text("time_label").notNull(),
  unread: integer("unread").notNull().default(0),
  status: text("status").notNull(),
  country: text("country").notNull(),
  avatarGradient: text("avatar_gradient").notNull(),
  sortOrder: integer("sort_order").notNull(),
  location: text("location"),
  localTime: text("local_time"),
  timezone: text("timezone"),
  channel: text("channel"),
  device: text("device"),
  ip: text("ip"),
  customerEmail: text("customer_email"),
  assignedOperatorId: text("assigned_operator_id").references(() => users.id),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  from: text("from").notNull(),
  text: text("text").notNull(),
  timeLabel: text("time_label").notNull(),
  sortOrder: integer("sort_order").notNull(),
  authorUserId: text("author_user_id").references(() => users.id),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  readAt: integer("read_at", { mode: "timestamp" }),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentMime: text("attachment_mime"),
  attachmentSize: integer("attachment_size"),
  rfcMessageId: text("rfc_message_id"),
  emailInReplyTo: text("email_in_reply_to"),
});

export const conversationReminders = sqliteTable("conversation_reminders", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => users.id),
  remindAt: integer("remind_at", { mode: "timestamp" }).notNull(),
  note: text("note").notNull(),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  fulfilledAt: integer("fulfilled_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const conversationVisitorData = sqliteTable(
  "conversation_visitor_data",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    dataKey: text("data_key").notNull(),
    dataValue: text("data_value").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.dataKey] })],
);

export const conversationSegments = sqliteTable(
  "conversation_segments",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    segment: text("segment").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.segment] })],
);

export const visitors = sqliteTable("visitors", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  initials: text("initials"),
  city: text("city").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  currentPage: text("current_page").notNull(),
  isActive: integer("is_active").notNull().default(0),
  avatarGradient: text("avatar_gradient").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  initials: text("initials"),
  email: text("email").notNull(),
  location: text("location").notNull(),
  company: text("company").notNull(),
  segments: text("segments").notNull(),
  lastActive: text("last_active").notNull(),
  score: integer("score").notNull().default(0),
  avatarGradient: text("avatar_gradient").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  contactCount: integer("contact_count").notNull().default(0),
  lastUpdate: text("last_update").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const campaignTemplates = sqliteTable("campaign_templates", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const campaignRecipients = sqliteTable(
  "campaign_recipients",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.campaignId, table.contactId] })],
);

export const helpdeskArticles = sqliteTable("helpdesk_articles", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  status: text("status").notNull(),
  categoryId: text("category_id"),
  views: integer("views").notNull().default(0),
  helpfulCount: integer("helpful_count").notNull().default(0),
  lastUpdate: text("last_update").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const helpdeskCategories = sqliteTable("helpdesk_categories", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const pluginCatalog = sqliteTable("plugin_catalog", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url").notNull(),
  category: text("category").notNull(),
  badge: text("badge"),
  price: text("price"),
  separateCheckout: integer("separate_checkout").notNull().default(0),
  sortOrder: integer("sort_order").notNull(),
});

export const pluginCategories = sqliteTable("plugin_categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  count: integer("count").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const workspacePlugins = sqliteTable(
  "workspace_plugins",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    pluginId: text("plugin_id")
      .notNull()
      .references(() => pluginCatalog.id),
    installed: integer("installed").notNull().default(1),
    installedAt: integer("installed_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.pluginId] })],
);

export const workspaceSettings = sqliteTable(
  "workspace_settings",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    settingKey: text("setting_key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.settingKey] })],
);

export const userSettings = sqliteTable(
  "user_settings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    settingKey: text("setting_key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.settingKey] })],
);

export const messageShortcuts = sqliteTable(
  "message_shortcuts",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    bang: text("bang").notNull(),
    tag: text("tag"),
    message: text("message").notNull(),
    createdBy: text("created_by").references(() => users.id),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("message_shortcuts_workspace_bang").on(table.workspaceId, table.bang)],
);

export const triageRules = sqliteTable("triage_rules", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  ruleset: text("ruleset").notNull(),
  name: text("name").notNull(),
  action: text("action").notNull(),
  enabled: integer("enabled").notNull().default(1),
  matchContains: text("match_contains"),
  sortOrder: integer("sort_order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const subInboxes = sqliteTable(
  "sub_inboxes",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: text("name").notNull(),
    segment: text("segment"),
    enabled: integer("enabled").notNull().default(1),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("sub_inboxes_workspace_name").on(table.workspaceId, table.name)],
);

export const routingRules = sqliteTable(
  "routing_rules",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: text("name").notNull(),
    action: text("action").notNull(),
    assignTarget: text("assign_target"),
    matchContains: text("match_contains"),
    enabled: integer("enabled").notNull().default(1),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("routing_rules_workspace_name").on(table.workspaceId, table.name)],
);

export const searchAiFrequentSearches = sqliteTable("search_ai_frequent_searches", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  query: text("query").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const chatboxRestrictions = sqliteTable(
  "chatbox_restrictions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    kind: text("kind").notNull(),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("chatbox_restrictions_workspace_kind_value").on(
      table.workspaceId,
      table.kind,
      table.value,
    ),
  ],
);

export const visitorChatSessions = sqliteTable("visitor_chat_sessions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  visitorNickname: text("visitor_nickname").notNull(),
  country: text("country").notNull().default("US"),
  locale: text("locale"),
  pageUrl: text("page_url"),
  email: text("email"),
  phone: text("phone"),
  ip: text("ip"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull(),
});

export const conversationRatings = sqliteTable("conversation_ratings", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  sessionId: text("session_id").notNull(),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const aiAgentLog = sqliteTable("ai_agent_log", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  conversationId: text("conversation_id").references(() => conversations.id),
  messageId: text("message_id"),
  category: text("category").notNull().default("unknown"),
  sentiment: text("sentiment").notNull().default("neutral"),
  risk: text("risk").notNull().default("low"),
  isSpam: integer("is_spam").notNull().default(0),
  isVip: integer("is_vip").notNull().default(0),
  confidence: integer("confidence").notNull().default(0),
  decision: text("decision").notNull(),
  reason: text("reason"),
  model: text("model").notNull().default("rules"),
  summary: text("summary"),
  channel: text("channel").notNull().default("unknown"),
  latencyMs: integer("latency_ms"),
  groundingSource: text("grounding_source"),
  reviewStatus: text("review_status"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const conversationAi = sqliteTable("conversation_ai", {
  conversationId: text("conversation_id")
    .primaryKey()
    .references(() => conversations.id),
  summary: text("summary"),
  sentiment: text("sentiment"),
  category: text("category"),
  confidence: integer("confidence"),
  isVip: integer("is_vip").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * AI human-review queue (Phase 21, Task 4). Backend-only reusable review
 * state; no UI yet. One row per gated AI reply that needs review or that was
 * auto-sent, capturing the safety decision, confidence, reviewer and lifecycle
 * timestamps.
 */
export const aiReviewQueue = sqliteTable("ai_review_queue", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  conversationId: text("conversation_id").references(() => conversations.id),
  messageId: text("message_id"),
  channel: text("channel").notNull().default("chat"),
  /** pending_review | approved | rejected | edited | auto_sent | draft_created */
  state: text("state").notNull().default("pending_review"),
  /** Safety decision that produced this row: AUTO_SEND | CREATE_DRAFT | HUMAN_REVIEW | BLOCK_REPLY */
  decision: text("decision").notNull(),
  reason: text("reason"),
  confidence: integer("confidence").notNull().default(0),
  confidenceLevel: text("confidence_level").notNull().default("low"),
  draftText: text("draft_text"),
  reviewer: text("reviewer"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
});

export const workspaceSubscriptions = sqliteTable("workspace_subscriptions", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id),
  planTag: text("plan_tag").notNull().default("Free"),
  planAmount: text("plan_amount").notNull().default("Free"),
  planPeriod: text("plan_period").notNull().default("forever!"),
  status: text("status").notNull().default("Active"),
  billingOwner: text("billing_owner").notNull().default("none"),
  monthlyCents: integer("monthly_cents").notNull().default(0),
  shopifySubscriptionId: text("shopify_subscription_id"),
});

export const paymentMethods = sqliteTable("payment_methods", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  label: text("label").notNull(),
  last4: text("last4").notNull(),
  brand: text("brand").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const billingInvoices = sqliteTable("billing_invoices", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  invoiceNumber: text("invoice_number").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("paid"),
  issuedAt: integer("issued_at", { mode: "timestamp" }).notNull(),
  paymentMethodId: text("payment_method_id").references(() => paymentMethods.id),
});

export const workspaceAuditLogs = sqliteTable("workspace_audit_logs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  badge: text("badge").notNull().default("Write"),
  ipAddress: text("ip_address").notNull(),
  country: text("country").notNull().default("Unknown"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const workspaceApiTokens = sqliteTable("workspace_api_tokens", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  label: text("label").notNull(),
  tokenPreview: text("token_preview").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const workspaceWebhooks = sqliteTable("workspace_webhooks", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  url: text("url").notNull(),
  enabled: integer("enabled").notNull().default(1),
  events: text("events")
    .notNull()
    .default(
      '["message:operator","message:visitor","message:note","conversation:status","conversation:assigned","conversation:created","conversation:deleted"]',
    ),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
