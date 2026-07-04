# Shopify Integration (Phases 1–125)

Bybelt Chat connects to Shopify via a companion React Router app on `chat.bybelt.com` (port 3005 behind nginx).

## Architecture

| Path | App | Purpose |
|------|-----|---------|
| `/` | Next.js (3004) | Inbox, contacts, settings |
| `/auth/`, `/plugin/`, `/webhooks/*` | Shopify app (3005) | OAuth, plugin UI, webhooks |

Cross-app calls use `BYBELT_INTERNAL_SECRET` and Docker `host.docker.internal` URLs in production.

## Webhooks

| Topic | Effect |
|-------|--------|
| `customers/create` | Upsert contact + enrich inbox conversations |
| `customers/update` | Same as create |
| `customers/delete` | Redact contact + `integration:shopify_delete` |
| `customers/redact` | GDPR redact + `integration:shopify_redact` |
| `customers/data_request` | Notify workspace webhooks (`integration:shopify_data_request`) |
| `orders/create` | Upsert contact, order note, products visitor data |
| `orders/updated` | Refresh order + fulfillment update note |
| `orders/cancelled` | Cancellation note + visitor data refresh |
| `orders/paid` | Payment confirmation inbox note |
| `refunds/create` | Refund inbox note on matched order |
| `fulfillments/create` | Shipped inbox note with tracking context |
| `shop/redact` | Bulk workspace Shopify data redaction on uninstall compliance |
| `app/uninstalled` | Remove shop link + notify main app webhooks |
| `app/scopes_update` | Refresh OAuth session scopes |

## Internal APIs (main app)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/integrations/shopify/sync` | POST | Bulk customer sync + inbox segment tagging |
| `/api/integrations/shopify/sync` | PATCH | Enrich single contact by email (all matching inbox convos) |
| `/api/integrations/shopify/sync/cron` | POST | Cron sync all linked workspaces |
| `/api/integrations/shopify/customer` | PUT | Enrich conversations by email |
| `/api/integrations/shopify/order` | PUT | Order visitor data + optional inbox note |
| `/api/integrations/shopify/status` | GET | Link + last sync stats |
| `/api/integrations/shopify/health` | GET | Session-authenticated bridge health check |
| `/api/integrations/shopify/uninstalled` | POST | Notify workspace webhooks on app uninstall |
| `/api/integrations/shopify/linked` | POST | Notify workspace webhooks on new shop link |
| `/api/integrations/shopify/redact` | POST | GDPR customer data redaction |
| `/api/integrations/shopify/redact-shop` | POST | Bulk Shopify workspace data redaction |
| `/api/integrations/shopify/data-request` | POST | GDPR data-request workspace webhook |

## Workspace webhooks

| Event | When |
|-------|------|
| `integration:shopify_linked` | First shop ↔ workspace link |
| `integration:shopify_uninstalled` | App uninstalled |
| `integration:shopify_order` | Order applied to inbox conversations |
| `integration:shopify_customer` | Customer data applied to inbox conversations |
| `integration:shopify_data_request` | Shopify GDPR customer data request |
| `integration:shopify_refund` | Refund note applied to inbox conversations |
| `integration:shopify_fulfilled` | Fulfillment/shipped note applied to inbox |
| `integration:shopify_cancelled` | Order cancellation note applied to inbox |
| `integration:shopify_paid` | Order paid note applied to inbox |
| `integration:shopify_sync` | Bulk Shopify contact sync completed |
| `integration:shopify_redact` | Shopify customer or workspace data redacted |
| `integration:shopify_delete` | Shopify customer deleted |

## Visitor data keys

`shopify_last_order`, `shopify_location`, `shopify_phone`, `shopify_customer_id`, `shopify_products`, `shopify_total_spent`, `shopify_order_count`, `shopify_tags`, `shopify_shop`, `shopify_order_status`, `shopify_store_name`

## Phases 116–125

| Phase | Deliverable |
|-------|-------------|
| 116 | `integration:shopify_redact` on shop-wide redact (`scope: workspace`) |
| 117 | Internal customer PUT passes `shop` for segment + visitor data |
| 118 | `shopify_store_name` visitor data from Shopify shop name |
| 119 | GET `/api/integrations/shopify/health` session health endpoint |
| 120 | Settings Shopify panel “Open Shopify inbox” link (`/?inbox=shopify`) |
| 121 | `integration:shopify_delete` on `customers/delete` redact |
| 122 | Stack smoke HEAD for `app/scopes_update` |
| 123 | Webhook test payload lists sample Shopify integration events |
| 124 | API smoke validates `shop` when workspace is linked |
| 125 | Docs through phase 125 |

## Ops

```bash
npm run deploy:vps
npm run deploy:shopify:vps
cd shopify-app/chat && shopify app deploy --allow-updates
npm run smoke:shopify-all
npm run cron:shopify-sync
npm run cron:shopify-install
```

Optional authenticated smoke with workspace + customer email:

```bash
BYBELT_INTERNAL_SECRET=... \
SHOPIFY_SMOKE_WORKSPACE_ID=... \
SHOPIFY_SMOKE_EMAIL=contact@example.com \
npm run smoke:shopify-api
```

After container restarts, merchants must **Open app** from Shopify Admin once to refresh OAuth session.
