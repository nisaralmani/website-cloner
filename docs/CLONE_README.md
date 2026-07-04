# Bybelt — Project Guide (Phase A–P, legacy)

> **Superseded for production operations.** This guide describes the Phase
> A–P static-clone milestone, when the app inbox still used mock data and
> Vercel was the only deploy target. The application has since grown a real
> backend (Postgres/SQLite, sessions, background jobs, Shopify integration)
> and deploys to a VPS via Docker. For current operations, see
> [docs/observability/production-readiness.md](observability/production-readiness.md)
> and [docs/DEPLOY.md](DEPLOY.md). This file is kept for historical context
> on the original UI-clone phases only.

Pixel-faithful static UI clone of [chat.bybelt.com](https://chat.bybelt.com) and [bybelt.com/en](https://bybelt.com/en/).

**Status:** Feature-complete (Phases A–O). See [SIGNOFF.md](research/SIGNOFF.md).

---

## Quick start

```bash
npm install
npm run db:seed      # first time — creates SQLite + FashionSis operator
npm run dev          # http://localhost:3000
```

**Login (real auth, Phase U1):** `contact@fashionpara.com` / `fashionsis-dev`

| URL | What |
|-----|------|
| `/` | Inbox app (mock data) |
| `/en` | Marketing homepage |
| `/en/pricing` | Pricing + comparison table |
| `/initiate/login` | Login (mock → inbox) |
| `/settings` | Settings overview (31 detail pages) |

---

## Verification

```bash
npm run check        # lint + typecheck + build
npm run smoke        # 98 production routes
npm run qa:live      # title parity vs bybelt.com
node scripts/deploy-verify.mjs   # check + smoke (pre-deploy)
```

---

## Deploy (Vercel)

```bash
node scripts/deploy-verify.mjs     # gate locally first
npx vercel                         # link project (first time)
npx vercel --prod                  # production deploy
```

Set **`NEXT_PUBLIC_SITE_URL`** in Vercel to your production URL (e.g. `https://website-cloner.vercel.app`).

Post-deploy:

```bash
node scripts/deploy-verify.mjs https://YOUR-URL.vercel.app
```

Full details: [DEPLOY.md](DEPLOY.md)

---

## Architecture

```
src/
  app/              # Next.js routes (97 pages + robots + sitemap)
  components/
    inbox/          # Shared inbox shell
    marketing/      # bybelt.com marketing UI
    settings/       # Settings bento + detail pages
  lib/
    marketing-*.ts  # Page copy + feature landing configs
public/
  images/marketing/ # Localized bybelt.com assets
  fonts/bybelt/      # Aeonik Pro (marketing)
docs/research/      # CLONE_STATUS, VISUAL_QA, LIVE_QA_*
```

**Marketing routing:** `src/app/en/[slug]/page.tsx` switches on `page.variant` (pricing, livechat, feature, …).

**Mock only:** Marketing stays static. App inbox still uses mock conversation data until Phase U2.

---

## Phase history

| Phase | Focus |
|-------|--------|
| A–C | Settings + app + behaviors |
| D–L | Marketing (homepage → full 18 sub-pages) |
| M–O | Smoke, CI, fonts, robots, sign-off |
| P | Deploy verify, 404 page, this guide |

---

## Known gaps

- App font: Inter (Bybelt Sans is proprietary)
- Marketing font: localized Bybelt Aeonik Pro on `/en/*`
- `/en/ai-agent`, `/en/hugo`, `/en/signup`: clone-only routes (404 on live bybelt.com)
