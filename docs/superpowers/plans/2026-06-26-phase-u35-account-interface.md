# Phase U35 — Account interface preferences

**Goal:** Persist language and appearance preferences per user on `/settings/account/interface`.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U35.1 | Interface preference types + validation | **done** |
| U35.2 | User-scoped GET/PATCH for `account/interface` | **done** |
| U35.3 | Settings UI selects wired + appearance applier | **done** |
| U35.4 | Smoke: field save + workspace switch persistence | **done** |
| U35.5 | Docs + verify | **done** |

## Compare checklist

- [x] Language select with full option list
- [x] Appearance select (Same as System / Light / Dark)
- [x] Defaults match registry
- [x] PATCH saves per user in `user_settings`
- [x] Values survive workspace switch
- [x] `html` lang + dark class applied on load/save
- [x] `npm run check` passes
- [x] `npm run smoke:api` passes (35 steps)

## Storage

```
user_settings (user_id, setting_key, value)
setting_key = account/interface::language | account/interface::appearance
```

## Deferred

- Full dark-mode parity across inbox shell
- i18n string catalogs per language selection
- Real SMTP / GeoIP (from prior phases)
