# Bybelt Chat — Shopify App



Crisp-style Shopify integration for [Bybelt](https://chat.bybelt.com): non-embedded admin app, theme app embed for the storefront chat widget, and read scopes for customer/order context in the inbox.



## Architecture



| Host | Role |

|------|------|

| `chat.bybelt.com` | Main Bybelt webapp (port **3004**) |

| `chat.bybelt.com/auth`, `/plugin/*`, `/webhooks/*` | Shopify React Router backend (port **3005**, nginx-proxied) |



## Prerequisites



- Node.js ≥ 20.19

- Shopify CLI (`shopify version`)

- Partner app credentials in `.env` (see `.env.example`)



## Setup



```bash

cd shopify-app/chat

cp .env.example .env

npm install

npx prisma generate

npx prisma migrate deploy

```



Set `BYBELT_INTERNAL_SECRET` to the same value as the main webapp (see root `.env.example`).



## Development



```bash

npm run dev

```



Press `p` in the CLI to open the app on your dev store.



## App Store (public distribution)

Production uses the **Bybelt Live Chat** public app (`bybelt-live-chat`) in Fashionaxe LLC Partners — not the legacy custom **Bybelt Chat** app.

- Partner Dashboard → Distribution → **Public distribution** (App Store listing)
- Protected customer data: Partners → API access → [customer data form](https://partners.shopify.com/4878268/apps/390559203329/customer_data)
- Deploy config: `cd shopify-app/chat && shopify app deploy --allow-updates`
- Merchants must **install the new public app** (custom installs do not carry over)

## Deploy



From repo root:



```bash

npm run deploy:shopify:vps   # Docker :3005 + nginx routes

npm run deploy:vps           # Main Next.js app :3004

npm run smoke:shopify        # Production smoke checks

```



Then push Partners config if needed:



```bash

cd shopify-app/chat && shopify app deploy --allow-updates

```



## Merchant flow



1. Install **Bybelt Chat** from Shopify Admin (opens `https://chat.bybelt.com/initiate/plugin/shopify`).

2. Complete Shopify OAuth → sign in to Bybelt → link workspace.

3. Enable the chat widget and **Enable Bybelt on my theme** (app embed).

4. Storefront loads `https://chat.bybelt.com/embed.js`; live visitors appear in Bybelt.



## Internal APIs (main app ↔ Shopify backend)



| Route | Purpose |

|-------|---------|

| `GET /plugin/shopify/internal/customer?workspaceId=` | Workspace link status |

| `POST /plugin/shopify/internal/customer` | Customer + orders by email |



Authenticated with `X-Bybelt-Internal-Secret`.



## Scopes



`read_customers`, `read_orders`, `read_products`, `read_content`, `read_themes`



## Structure



| Path | Purpose |

|------|---------|

| `shopify.app.toml` | App URL, scopes, webhooks, shop metafields |

| `extensions/bybelt-chat-widget/` | Theme app embed (`chat-embed.liquid`) |

| `app/routes/initiate.plugin.shopify.tsx` | OAuth handoff + workspace linking |

| `app/routes/plugin.shopify.settings.tsx` | Widget + theme embed settings |

| `app/lib/shopify-customer.server.ts` | Customer/order GraphQL for inbox |

