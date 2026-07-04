# Phase M — Sign-off, full smoke test & deploy readiness

**Goal:** Verify all marketing routes in production build, update QA docs, confirm Vercel deploy path.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| M1 | Expand smoke to all marketing routes | **done** |
| M2 | Sitemap validation | **done** |
| M3 | VISUAL_QA + CLONE_STATUS | **done** |
| M4 | `docs/DEPLOY.md` | **done** |

## Deploy (manual)

```bash
npm run check
npm run smoke
npx vercel --prod
# Set NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app in Vercel project env
```

## Clone complete

Further work is optional polish (authenticated app pixel diff, deploy to production).
