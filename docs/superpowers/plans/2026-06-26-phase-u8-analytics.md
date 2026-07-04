# Phase U8 — Analytics

**Goal:** Analytics KPIs + upgrade gate from DB read models.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U8.1 | `workspaces.analytics_enabled` + timezone | **done** |
| U8.2 | `GET /api/analytics` read model | **done** |
| U8.3 | Wire AnalyticsPanel KPIs + filters | **done** |
| U8.4 | Upgrade overlay when locked | **done** |
| U8.5 | Docs + verify | **done** |

## Compare checklist

- [x] `/analytics/messaging/overview` KPIs show 0/0/0 when locked
- [x] Timezone **Asia/Karachi** from workspace
- [x] Upgrade overlay when `analyticsEnabled` is false
- [x] When enabled, KPIs derive from conversations + visitors counts
- [x] `npm run check` passes

## API

```
GET /api/analytics
Response: {
  analyticsEnabled, timezone, periodLabel,
  kpis: { conversations, visitors, rating },
  hasChartData
}
```
