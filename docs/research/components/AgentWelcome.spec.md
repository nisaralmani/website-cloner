# AgentWelcome Specification

## Overview
- **Target file:** `src/components/agent/AgentWelcome.tsx`
- **Route:** `/agent`
- **Live URL:** `/website/{id}/agent/`
- **Interaction model:** static onboarding welcome; CTA button is visual only.

## Layout
- Full-height scrollable main panel, white base.
- **Hero header** (~557px): noise texture + radial gradient `#FFFFFF` → `#EBF3FE`, padding-top 32px.
  - Container: max-width 1456px, horizontal padding **100px**.
  - **H1** `Meet Hugo, your brand's most efficient support teammate.` — 64px/400, line-height 76px, `#2C405A`, margin-bottom ~165px, max visual width ~985px.
- **Content** section: container padding `0 100px`, bottom padding 100px.
  - **Grid:** 2 columns **402px**, gap **40px 24px** (row col).
  - Cell 1 — intro block (402×546):
    - Title `Four Steps.` — 40px/400, `#1C293B`, line-height 52px.
    - Subtitle `From setup to conversations in minutes.` — 40px/400, `rgba(0,0,0,0.48)`, line-height 52px.
    - CTA button `Upgrade and setup your AI Agent` — blue `#1972F5`, white text 14/700, height 43px, radius 4px, chevron-right icon, width ~269px, margin-top 24px.
  - Cells 2–5 — step cards (402px wide, flex-col, gap 24px):
    - **Index pill:** 40px circle, bg `#1C1C1C`, white 14px mono `01`–`04`.
    - **Title:** 18px/400 `#1C293B`, line-height 26px.
    - **Description:** 14px/400 `#777F89`, line-height 20px.
    - **Illustration:** `/images/agent/step_N.png`, width 402px (image 400px tall).

## Step copy (verbatim)
| # | Title | Description |
|---|-------|-------------|
| 01 | Feed Hugo your knowledge. | Upload your docs, FAQs, whatever you've got. |
| 02 | Make it yours. | Tweak how Hugo responds and set routing rules. |
| 03 | Test it out. | Use the real chat widget to test it before going live. |
| 04 | Let it run. | Watch Hugo handle conversations. |

## Assets
- `public/images/agent/noise.png` — hero background texture
- `public/images/agent/step_1.png` … `step_4.png`

## Sidebar (when on /agent)
- **AI Agent** nav item active: inner bg radial gradient `#707070` → `#1C1C1C`, radius 8px, text/icon `#0093EE`, padding 8px 14px.

## Verify
- Default export `AgentWelcome`. `npm run check` passes.
