# Email Domain — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/email/domain/`  
**Clone route:** `/settings/email/domain`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Email Domain |
| Help icon | Not present |
| Saved badge | Automatically Saved (inline in header) |
| Description | None |
| Content width | 710px centered |

## Section — Custom Email Domain

| Field | Type | Live value |
|-------|------|------------|
| Basic domain | Suffix input | **fabzop** + suffix `.on.bybelt.com` (placeholder `acme`, required *) |
| Custom domain | Text input | Empty (placeholder `emails.acme.com`) |

### Setup status block

| Element | Live value |
|---------|------------|
| Info banner | Blue check icon + "This domain does not require any setup (default domain provided by Bybelt)." (`c-settings-status--info`) |
| Status row | Green italic bold text left: **This domain is currently in use on your workspace.** |
| Verify button | **Verify domain setup** — green bordered, disabled, check icon left (`c-base-button--green c-base-button--bordered c-base-button--disabled`) |

## Notes

- Live route `/email/domain/` matches plan slug.
- Basic domain uses inline suffix field, not a plain text field.
- Verify button is disabled when domain is already active on workspace.
