# Phase U5 — Contacts

**Goal:** Contacts table loads from SQLite via API with search.

---

## Queue

| Step | Task | Status |
|------|------|--------|
| U5.1 | `contacts` schema + seed 15 contacts | **done** |
| U5.2 | Workspace `contact_total` (100) for header parity | **done** |
| U5.3 | `GET /api/contacts?q=` | **done** |
| U5.4 | Wire ContactsPanel + search | **done** |
| U5.5 | Docs + verify | **done** |

## Compare checklist

- [x] `/contacts` header shows **100 Contacts**
- [x] Table shows 15 seeded rows from DB
- [x] Search by name/email/location (Enter) filters results
- [x] `npm run check` passes

## API

```
GET /api/contacts?q=search
Response: { contacts: Contact[], total: 100 }
```
