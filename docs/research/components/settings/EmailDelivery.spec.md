# Email Delivery — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/email/delivery/`  
**Clone route:** `/settings/email/delivery`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Email Delivery |
| Help icon | Not present |
| Saved badge | Automatically Saved (inline in header) |
| Description | None |
| Content width | 710px centered |

## Section 1 — Outbound Email IPs

### Info block (`c-settings-status--info c-settings-status--with-content`)

| Element | Live value |
|---------|------------|
| Title | What are outbound email IPs? (blue question icon) |
| Paragraph 1 (bold) | "When emails are sent to your users for your Bybelt messages and campaigns, they are sent using an IP address that has a reputation attached to it. The likelihood that your emails go to spam is based on the IP reputation." |
| Paragraph 2 | "You can either use a default shared IP pool, or a dedicated IP address to improve email deliverability." |

### IP status subgroup (`c-settings-ip-status`)

| Element | Live value |
|---------|------------|
| Header | Lightbulb icon + **Your outbound email IP status** + green badge **High** (small) |
| Active row | "You are using the shared email IP pool" + **Install the Dedicated Email IP plugin** (black bordered mini, plus icon left) |
| Pool row | Green badge **High** (medium) + "Using high-reputation shared pool" + link **Why?** → `https://help.bybelt.com/en/article/2egyqk/` |

Large grey divider follows.

## Section 2 — Custom Email SMTP

| Element | Live value |
|---------|------------|
| Section badge | **inactive** — orange filled badge with dot |
| Send all emails using my custom outbound SMTP server | Toggle | **OFF** |

## Notes

- Live route `/email/delivery/` matches plan slug.
- "Why?" link is external help article, lowercase on live (`why?` in DOM class but displays as "Why?").
- Plugin install button is black bordered mini, not solid primary blue.
