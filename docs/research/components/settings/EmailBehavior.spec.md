# Email Behavior — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/email/behavior/`  
**Clone route:** `/settings/email/behavior`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Email Behavior |
| Help icon | Not present |
| Saved badge | Automatically Saved (inline in header) |
| Description | None |
| Content width | 710px centered |

## Section 1 — General Options

| Field | Type | Live value |
|-------|------|------------|
| Email users transcripts of conversations | Toggle | **ON** |
| Enable ratings (in chatbox and transcript emails) | Toggle | **ON** |
| Send emails that might be junk to the Spam inbox | Toggle | **ON** |

Large grey divider follows.

## Section 2 — Custom Email Signature

| Element | Live value |
|---------|------------|
| Section badge | **disabled** — orange filled badge with dot (`c-base-badge--orange c-base-badge--with-dot`) |
| Append a text signature at the bottom of all sent emails | Toggle | **OFF** |

When signature toggle is OFF, no signature editor is shown on live.

## Notes

- Live route `/email/behavior/` matches plan slug.
- Transcripts toggle is ON on this workspace (was incorrectly OFF in early registry).
- Custom Email Signature section is marked disabled (paid/unavailable) but toggle remains interactive-looking on live.
