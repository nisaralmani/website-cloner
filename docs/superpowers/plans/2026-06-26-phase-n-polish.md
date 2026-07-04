# Phase N — Typography & live marketing QA

**Goal:** Localize Bybelt marketing fonts and validate titles against live bybelt.com.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| N1 | Localize Aeonik Pro + Inter from `bybelt.com/_crisp/` | **done** |
| N2 | Wire fonts on `/en/*` via `bybelt-fonts.css` + `en/layout.tsx` | **done** |
| N3 | `scripts/live-qa-marketing.mjs` — title diff vs live | **done** |
| N4 | `LIVE_QA_N.md` + doc updates | **done** |

## Commands

```bash
node scripts/localize-crisp-fonts.mjs
node scripts/live-qa-marketing.mjs
node scripts/live-qa-marketing.mjs http://127.0.0.1:3000  # with dev server
```

## Clone complete (Phase O)

See `docs/research/SIGNOFF.md`. Optional: Vercel deploy + remote smoke.
