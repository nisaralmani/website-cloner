# Phase U49 — Email domain settings

**Goal:** Persist basic and custom email domain fields on `/settings/email/domain`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U49.1 | Email domain field keys + validation | **done** |
| U49.2 | Workspace field pages registry + settings API | **done** |
| U49.3 | Basic suffix + custom domain inputs wired | **done** |
| U49.4 | Smoke + docs + verify | **done** |

## Compare checklist

- [x] Basic domain suffix field persists (`basicDomain`)
- [x] Custom domain field persists (`customDomain`, empty allowed)
- [x] Domain validation rejects invalid basic slugs
- [x] Setup status + verify button remain static UI
- [x] Per-workspace isolation on switch
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (49 steps)

## Storage

```
workspace_settings (
  email/domain::basicDomain,
  email/domain::customDomain
)
```

## Deferred

- DNS verification workflow for custom domains
- Dynamic status row when custom domain is configured
- Outbound email routing from saved domain values
