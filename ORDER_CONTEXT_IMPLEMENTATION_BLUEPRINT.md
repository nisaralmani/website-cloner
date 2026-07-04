# Order Context Pipeline — Implementation Blueprint (Milestone M3)

**Role:** Chief Shopify Integration Engineer
**Status:** Understanding phase — NO CODE CHANGED. Read-only analysis and blueprint for M3 implementation.
**Date:** 2026-07-03

> **Central finding:** There are **two independent, unsynchronized order-context paths** that never reconcile with each other:
> 1. **PUSH (webhook → stored):** Shopify webhooks write a denormalized copy of order facts into `conversation_visitor_data` rows + note messages, keyed per conversation by exact-lowercase `customerEmail`.
> 2. **PULL (live GraphQL):** When an operator opens a conversation, the UI and the widget AI fetch a *fresh* customer+orders snapshot straight from Shopify's Admin GraphQL API (`cache: "no-store"`), bypassing the stored copy entirely.
>
> The stored copy (path 1) can be stale/missing; the live copy (path 2) is fresh but uncached and re-fetched on every open. They can disagree, and nothing detects it. This split is the root of most weaknesses below.

---

## 1. End-to-End Lifecycle Trace

```
Shopify Order/Customer event
        │
        ▼
[A] Webhook handler (shopify-app :3005)  ── authenticate.webhook → getShopLink(shop)
        │  applyShopifyOrderToMainApp() / upsertMainAppShopifyContact()  (bridge)
        ▼
[B] Internal bridge (X-Bybelt-Internal-Secret)  →  main app :3004
        │
        ▼
[C] Main-app API route  /api/integrations/shopify/{order,sync,customer}
        │
        ├─ upsertShopifyContact()          → contacts table   (dedupe by workspaceId+email)
        └─ applyShopifyOrderToConversations() / applyShopifyCustomerToConversations()
                 │  findConversationIdsByCustomerEmail(email)   ← LINKAGE KEY
                 ▼
[D] Storage: conversation_visitor_data (shopify_* keys) + messages(from:"note") + conversation_segments("shopify")
        │
        ▼
[E] SSE fan-out: publishInbox(workspaceId, {conversations|messages})
        │
        ▼
[F] Inbox UI: GET /api/conversations/[id] → buildCustomerDetailsForConversation()
        │        → fetchVisitorDataForConversation()   (reads STORED path-1 copy)
        │
        └─ CustomerInfoPanel → useShopifyCustomerContext(email)
                 → GET /api/integrations/shopify/context  (LIVE path-2 pull)
                 → plugin /plugin/shopify/internal/customer → loadShopifyCustomerContext()
                 → Shopify Admin GraphQL (orders first:3)
        │
        ▼
[G] AI context injection: generateChatAiReply({ shopifyCustomer }) → formatShopifyCustomerContext()
        (uses the LIVE summary, NOT the stored visitor data)
```

**Parallel refresh path — Bulk sync (cron + on-link):**
```
runShopifyBulkContactSync() → fetchShopifyCustomersForSync() → plugin /internal/sync
   → listShopifyCustomersForSync()  [PAGE_SIZE 100, MAX_CUSTOMERS 500]
   → syncShopifyContacts() (loop upsert) → tagShopifySegmentForSyncedEmails() (loop)
```

---

## 2. Step-by-Step Layer Analysis

### [A] Webhook Handlers
- **Files:** `shopify-app/chat/app/routes/webhooks.orders.{create,updated,cancelled,paid}.tsx`, `webhooks.refunds.create.tsx`, `webhooks.fulfillments.create.tsx`, `webhooks.customers.{create,update,delete,redact,data_request}.tsx`, `webhooks.shop.redact.tsx`. Payload helpers: `shopify-order-webhook.server.ts`, `shopify-order-products.server.ts`.
- **Functions:** `action()` per topic; `orderEmailFromPayload`, `orderDetailFromPayload`, `formatShopifyOrderStatus`, `formatShopifyOrderProducts`.
- **Dependencies:** `authenticate.webhook` (HMAC), `getShopLink`, the bridge helpers.
- **Failure scenarios:** No `ShopLink` for shop → silently returns 200 (order dropped). Missing email or `order.name` → silently returns 200 (order dropped, F below). Bridge throws → webhook returns non-2xx → Shopify retries (good) but each retry re-runs the whole handler.
- **Recovery:** Relies on Shopify's own webhook retry for transient bridge failures. No local queue/dead-letter (deferred to M2-T3).
- **Consistency:** Order→conversation is decided by `orderEmailFromPayload` which `.trim()`s but does **not** lowercase, while the DB match lowercases — casing mismatch risk (see W-Broken-Linkage).
- **Freshness:** Event-driven; only as fresh as delivered webhooks. A missed `fulfillments/create` leaves `shopify_order_status` permanently stale.

### [B] Internal Bridge
- **Files:** `bybelt-main.server.ts` (now via `bridge-client.server.ts`, M2-T2), `internal-auth.server.ts`, main-app `internal-request.ts`.
- **Guarantees:** Retries + typed errors + structured logs now exist (M2-T2). Auth is a single static shared secret.
- **Failure:** If secret misconfigured, every enrichment silently 401s; the main-app `sync PUT`/`order PUT` return 401 → webhook non-2xx → Shopify retries indefinitely with no progress.

### [C] Main-App API Routes
- **Files:** `src/app/api/integrations/shopify/{order,sync,customer,context,status}/route.ts`.
- **`order` PUT:** validates `workspaceId,email,orderName`; calls `applyShopifyOrderToConversations`; then loads note messages, fans out SSE, and fires workspace webhooks (`void`, fire-and-forget).
- **`sync` POST/PUT/PATCH:** POST = bulk sync; PUT = single contact upsert + `applyShopifyCustomerToConversations`; PATCH = live enrich by email.
- **Failure:** `order` PUT returns 200 with `conversationsUpdated:0` when no conversation matches — a *successful* response that silently did nothing.

### [D] Storage
- **Files:** `src/lib/inbox/shopify-conversation.ts`, `visitor-data.ts`, `conversation-segments.ts`.
- **Model:** Order facts are **denormalized per conversation** into `conversation_visitor_data (conversationId, dataKey, dataValue)` with 11 `shopify_*` keys (`SHOPIFY_VISITOR_DATA_KEYS`). There is **no `orders` table and no `shopify_customer` table** — orders exist only as (a) a single `shopify_last_order` string per conversation, (b) note messages, and (c) transiently via live pull. Values are truncated to 500 chars.
- **Consistency:** Upserts are per-key, sequential, `onConflictDoUpdate` — no transaction wrapping the whole enrichment. A crash mid-loop leaves a conversation partially enriched.
- **Freshness:** Only the *latest* order is retained (`shopify_last_order`); order history is not stored (only live pull shows the last 3).

### [E] SSE Fan-out
- **Files:** `event-bus.ts`, `snapshot.ts`; `publishInbox` in `order/route.ts` and `shopify-bulk-sync.ts`.
- **Behavior:** After enrichment, re-fetches the entire workspace conversation list (`fetchWorkspaceConversations`) and pushes it. Note messages pushed per conversation.
- **Cost:** Every enriched order triggers a full workspace conversation-list re-query + broadcast (see W-N+1 / scale).

### [F] Inbox Rendering
- **Files:** `src/app/api/conversations/[id]/route.ts`, `conversation-details.ts`, `visitor-data.ts`, `components/inbox/CustomerInfoPanel.tsx`, `hooks/useShopifyCustomerContext.ts`.
- **Two sources rendered side by side:** `buildCustomerDetailsForConversation` returns the **stored** visitor data (path 1); `CustomerInfoPanel` *also* calls `useShopifyCustomerContext(email)` → **live** context (path 2) on every mount.
- **Failure:** Live pull failing → panel sets `error`, shows nothing live, but stored visitor data still renders (graceful-ish, but the two can disagree with no indication which is authoritative).
- **Freshness:** Live path fresh-per-open; stored path as-of-last-webhook.

### [G] AI Context Injection
- **Files:** `src/lib/chatbox/ai-reply.ts` (`generateChatAiReply`, `formatShopifyCustomerContext`), `types/shopify.ts`.
- **Behavior:** AI is fed the **live** `shopifyCustomer` summary (orders + statuses), NOT the stored visitor data. System prompt instructs "orders are already synced… do NOT ask for order number again."
- **Risk:** If the live pull returns null/stale (rate-limited, wrong shop, protected-data error), the AI silently falls back to "not identified" and may ask for an order number the operator can plainly see in the stored panel — an inconsistency the customer experiences directly. No confidence gate here yet (that's M4).

### Bulk Sync / Refresh
- **Files:** `shopify-bulk-sync.ts`, `contacts/shopify-sync.ts`, `integrations/shopify-customers.ts`, plugin `shopify-customers-sync.server.ts`, cron `sync/cron/route.ts`.
- **Behavior:** Hard cap **`MAX_CUSTOMERS = 500`**, `PAGE_SIZE = 100`. Loops customers doing `select` + `insert/update` each; then loops emails again to tag segments. Cron iterates all linked workspaces sequentially.
- **Failure:** Stores with >500 customers are **silently truncated** — no signal that the sync was partial. Protected-customer-data errors fall back to an email-only query (degraded enrichment).

---

## 3. Architectural Weakness Register (ranked)

Legend — **C**ritical / **H**igh / **M**edium / **L**ow.

| ID | Severity | Weakness | Evidence | Impact |
|----|----------|----------|----------|--------|
| W1 | **C** | **Dual source of truth, never reconciled.** Stored visitor data (path 1) vs. live GraphQL (path 2) can disagree; UI shows both, AI trusts only the live one. | `conversation-details.ts` (stored) vs `useShopifyCustomerContext`/`ai-reply.ts` (live) | Operator and AI can present contradictory order facts to the customer. Undermines the core M3 wedge ("accurate order context"). |
| W2 | **C** | **No cache on the live path — Shopify GraphQL call on every conversation open.** `cache:"no-store"` at every hop; AI reply also pulls live. | `shopify-context.ts`, `shopify-customer.server.ts`, `context/route.ts` | At scale (many operators × many opens) this hammers Shopify's rate limits and adds main→plugin→Shopify latency to every inbox open. Directly the M8/M6 cache gap, felt in M3. |
| W3 | **H** | **Stale stored order data, no TTL/refresh.** `shopify_order_status`, `shopify_last_order` only change on webhook or bulk sync; a missed fulfillment/refund webhook is stale forever. | `shopify-conversation.ts` writes; no freshness column | Operator sees "unfulfilled" after it shipped. No `updatedAt`-based staleness surfaced to UI. |
| W4 | **H** | **Orders arriving before a conversation exists are dropped.** `findConversationIdsByCustomerEmail` returns `[]` → order webhook stored nowhere; never backfilled when the customer later starts a chat. | `applyShopifyOrderToConversations:262` early-return | Order notes/visitor data missing for the most common flow (buy first, ask later). Only partially recoverable via live pull if email is known. |
| W5 | **H** | **Broken linkage on email casing/whitespace.** Match is `eq(conversations.customerEmail, lowercased)`; conversation.customerEmail is not guaranteed lowercased, and order email is only `.trim()`ed. | `findConversationIdsByCustomerEmail:56` vs `orderEmailFromPayload:28` | Silent linkage miss → order context never attaches. No error, `conversationsUpdated:0`. |
| W6 | **H** | **Silent partial sync at 500-customer cap.** `MAX_CUSTOMERS=500`; excess customers never synced, no warning. | `shopify-customers-sync.server.ts:64,125` | Larger merchants (the valuable ones) get incomplete contact/segment coverage with no signal. |
| W7 | **M** | **N+1 / sequential query storms in enrichment and sync.** Per-conversation loop does ~5 sequential awaits; bulk sync does 2 queries/customer + a second full email loop; SSE re-queries the whole workspace list per order. | `applyShopifyOrderToConversations`, `syncShopifyContacts`, `tagShopifySegmentForSyncedEmails`, `order/route.ts:81` | Slow inbox enrichment and slow sync; compounds W2 at scale. No batching. |
| W8 | **M** | **Fragile note idempotency (last-8 exact-text match).** Duplicate webhook delivery > 8 notes apart re-inserts a duplicate note; also breaks if text formatting changes. | `recentShopifyOrderNoteExists:185` | Duplicate "🛒 New Shopify order" notes in the thread; noisy, erodes trust. |
| W9 | **M** | **Enrichment is not atomic / not transactional.** Multi-key upserts + note insert run as independent statements; a mid-loop failure leaves partial state and the bridge/webhook retry re-runs from scratch (some keys already set, note dedupe may misfire). | `shopify-conversation.ts` (no `db.transaction`) | Partial order context; retries can duplicate or half-apply. |
| W10 | **M** | **Wrong-shop ambiguity for multi-store workspaces.** `db.shopLink.findFirst({where:{workspaceId}})` picks an arbitrary link when a workspace has >1 shop. | `shopify-customer.server.ts:99,249` | Live context can resolve against the wrong store → wrong/empty orders. |
| W11 | **M** | **Duplicate customers across emails / no Shopify-customer-id dedup.** Contacts dedupe only by `(workspaceId, email)`; `shopify_customer_id` is stored as loose visitor data, never used to merge. | `contacts/shopify-sync.ts:32` | Same shopper with two emails = two contacts, split order history. |
| W12 | **M** | **All live-pull failures are swallowed to `null`.** `fetchShopifyCustomerContext`/`loadShopifyCustomerContext` catch-and-return-null; caller can't distinguish "no customer" from "rate-limited/error". | `shopify-context.ts:43,64`; `shopify-customer.server.ts:203,232` | AI silently degrades to "not identified"; no observability into why context is missing (contradicts M2-T2 "no silent failures" spirit). |
| W13 | **L** | **Order history capped at 3 (live) / 1 (stored).** `orders(first:3)`, only `shopify_last_order` stored. | `shopify-customer.server.ts:28`; `shopify-conversation.ts:23` | Repeat buyers' earlier orders invisible in-thread. |
| W14 | **L** | **500-char truncation on all order/product fields.** | `setShopifyVisitorDataKey:102`, note `label.slice(0,400)` | Long multi-item orders truncated silently. |
| W15 | **L** | **Cron sync is fully sequential across workspaces, no concurrency/pagination guard.** | `sync/cron/route.ts` loop | Slow global sync as tenant count grows; one slow store blocks the rest. |

---

## 4. Consistency & Freshness Summary

| Data | Source of truth | Consistency guarantee | Freshness guarantee |
|------|-----------------|-----------------------|---------------------|
| Contact record | `contacts` table | Deduped by `(workspaceId, lowercased email)` only | Webhook + bulk sync (≤500) |
| Stored order/visitor data | `conversation_visitor_data` | Per-key upsert, **no transaction**, per-conversation | Last webhook / last bulk sync; **no TTL, no staleness flag** |
| Order notes | `messages(from:"note")` | Best-effort dedupe (last-8 exact text) | Event-driven |
| Live customer+orders | Shopify Admin GraphQL | Authoritative but **uncached**, arbitrary-shop for multi-store | Fresh per open; fails closed to `null` |
| AI context | Live summary only | Ignores stored copy | As fresh/failed as the live pull |

**No layer guarantees that path-1 (stored) and path-2 (live) agree.** That reconciliation is the central architectural gap M3 must close.

---

## 5. Blueprint Direction for the M3 Coding Phase (no implementation here)

Mapped to M3 tasks in the master plan:

1. **Single canonical order-context resolver (W1, W12) → M3-T2/T4.** One function that returns the customer+orders context with an explicit `{source: "live"|"stored"|"none", freshAsOf, error?}` envelope, so UI and AI read the *same* resolved value and can show provenance instead of two silently-divergent panels.
2. **Cache the live pull (W2) → M3-T2 (feeds M8-T3).** Short-TTL read-cache keyed by `(workspaceId, email)` in front of `loadShopifyCustomerContext`; refresh-on-webhook invalidation. Removes the per-open Shopify round-trip.
3. **Freshness policy + staleness surfacing (W3) → M3-T3.** Add an `updatedAt`-based staleness signal to stored `shopify_*` data; UI flags "as of X" and triggers a live refresh when stale rather than showing silently-old status.
4. **Backfill order context on conversation creation (W4) → M3-T2.** When a conversation is created/identified by email, pull/attach any existing order context instead of only reacting to future webhooks.
5. **Normalize the linkage key (W5) → M3-T1.** Guarantee `conversation.customerEmail` and all inbound emails are normalized identically (lowercased, trimmed) at the boundary; add a test that a mixed-case order email still links.
6. **Signal partial sync (W6) → M3-T3 (feeds M6-T5).** Surface when the 500 cap truncated a sync; page beyond 500 or explicitly report the shortfall.
7. **Batch the enrichment/sync writes (W7, W9) → M3-T2.** Wrap per-conversation enrichment in a transaction; batch visitor-data upserts; avoid the full-workspace re-query per single order.
8. **Robust note idempotency (W8) → M3-T2.** Key notes on a stable Shopify order id + event kind rather than last-8 exact text.
9. **Multi-store correctness (W10) & customer-id dedup (W11) → M3-T1.** Resolve the correct `ShopLink` for the order/customer's actual shop; consider `shopify_customer_id` as a dedup/merge key.

**Explicitly out of scope for M3 (postpone):** durable webhook dead-letter/retry (M2-T3), full reconciliation sweeps (M2-T5), AI confidence gating (M4), and the broader cache/pooling scale work (M8).

---

## 6. Evidence Index (files inspected)

- **Webhooks (plugin):** `webhooks.orders.create.tsx`, `shopify-order-webhook.server.ts`, `shopify-order-products.server.ts`, `webhooks.customers.create.tsx`, `webhooks.shop.redact.tsx`
- **Bridge:** `bybelt-main.server.ts`, `bridge-client.server.ts`, `internal-auth.server.ts`, `internal-request.ts`
- **Main-app routes:** `api/integrations/shopify/{order,sync,customer,context,status,sync/cron}/route.ts`, `api/conversations/[id]/route.ts`
- **Storage/enrichment:** `lib/inbox/shopify-conversation.ts`, `lib/inbox/visitor-data.ts`, `lib/inbox/conversation-details.ts`, `lib/contacts/shopify-sync.ts`, `lib/integrations/shopify-inbox-enrich.ts`, `lib/integrations/shopify-bulk-sync.ts`, `lib/integrations/shopify-customers.ts`, `lib/integrations/shopify-context.ts`
- **Live/GraphQL (plugin):** `shopify-customer.server.ts`, `shopify-customers-sync.server.ts`, `plugin.shopify.internal.customer.tsx`
- **UI/AI:** `components/inbox/CustomerInfoPanel.tsx`, `hooks/useShopifyCustomerContext.ts`, `lib/chatbox/ai-reply.ts`

PHASE 9 COMPLETE
