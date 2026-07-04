# Phase O — Production ship & CI

**Goal:** Harden CI, add robots.txt, final sign-off document.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| O1 | `SMOKE_BASE_URL` support for remote / CI smoke | **done** |
| O2 | CI workflow runs smoke after build | **done** |
| O3 | `src/app/robots.ts` | **done** |
| O4 | `docs/research/SIGNOFF.md` | **done** |

## Post-ship (optional)

- `npx vercel --prod` + `SMOKE_BASE_URL=... node scripts/smoke-routes.mjs`
- Authenticated inbox pixel diff vs chat.bybelt.com
