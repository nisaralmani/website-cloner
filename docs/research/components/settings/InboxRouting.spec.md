# Operator Routing — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/messaging/routing/`  
**Clone route:** `/settings/inbox/routing`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Operator Routing |
| Help icon | Present (`icon-question_circle`, 24px `#777f89`) |
| Saved badge | Automatically Saved |
| Description | "Enable or disable routing and configure operators to assign based on rules." |
| Content width | 710px centered |

## General Options

| Toggle | State |
|--------|-------|
| Assign operator who responded upon response | **OFF** |

Large grey divider follows.

## Routing Rules

| Element | Live value |
|---------|------------|
| Section heading | Routing Rules |
| Header button | **Add a routing rule** (blue bordered mini, plus icon right) |

| Toggle | State | Notes |
|--------|-------|-------|
| Enable routing rules | **OFF** | — |
| Re-run rules 24h after last operator reply | **OFF** | **Disabled** when routing rules off |
| Re-run rules if assigned operator is offline | **OFF** | **Disabled** when routing rules off |

### Empty state

Globe icon mini empty spot:

| Element | Live value |
|---------|------------|
| Title | You have no routing rule |
| Description | Your routing rules will appear here. |

## Notes

- Re-run toggles are greyed out until "Enable routing rules" is turned on.
- Add button is blue bordered, not solid primary.
- No routing rule entries on this workspace.
