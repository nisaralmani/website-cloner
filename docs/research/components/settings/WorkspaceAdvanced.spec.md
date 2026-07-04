# Advanced configuration — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/advanced/`  
**Clone route:** `/settings/workspace/advanced`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible inline in header on live |
| Description | 14px `#8d949d` — "Configure API token, Web Hooks, identity verification, and more." |
| Content width | 710px centered |

## Section 1 — Workspace Defaults

| Field | Layout |
|-------|--------|
| Workspace default language (if user language is unknown) | Horizontal select, 300px field, value **Do not use any fallback language** |

## Section 2 —REST API + MCP Server Tokens

Section header: title left, **Create Token** mini blue button (+ icon) right.

Empty block (`c-base-empty-spot--mini`):

| Icon | Title | Description |
|------|-------|-------------|
| thunder | You have no API Token | Your API Token will appear here. |

Link below: **View API reference** — 13px semibold `#0093ee`, external arrow → `https://docs.bybelt.com/references/rest-api/v1/`

## Section 3 — Web Hooks

Section header: **Web Hooks** + grey badge **0 hooks** + **Add a Web Hook** button right.

Empty block with globe icon:

| Title | Description |
|-------|-------------|
| You have no Web Hook | Your Web Hooks will appear here. |

## Section 4 — Identity Verification

Section header: title + orange badge **disabled** (with dot).

Toggle OFF: "Verify user emails with cryptographic signatures" — 14px bold `#1c293b`
