# Phase P — Deploy execution & clone guide

**Goal:** Production deploy path, post-deploy verification, branded 404, project guide.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| P1 | `scripts/deploy-verify.mjs` (check + remote smoke) | **done** |
| P2 | Branded `not-found.tsx` | **done** |
| P3 | `docs/CLONE_README.md` | **done** |
| P4 | Vercel deploy attempt | **blocked** — run `vercel login` then `npx vercel --prod` |

## Commands

```bash
npm run deploy:verify
npm run deploy:verify -- https://your-app.vercel.app
npx vercel --prod
```
