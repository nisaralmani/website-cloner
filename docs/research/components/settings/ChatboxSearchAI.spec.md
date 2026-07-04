# Chatbox Search AI — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/chatbox/search/`  
**Clone route:** `/settings/chatbox/search-ai`  
**Scraped:** 2026-06-26

## Layout

Two-column **sided** layout: main **500px** + preview aside **400px** (not centered 710px).

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible inline in header on live |
| Description | 14px `#8d949d` — "Let your users use AI search to find answers from your AI Agent training data, right from your chatbox." |

## Plugin banner

Dark `#3F536E` banner: "Please install the Overlay plugin to use Search AI on your chatbox." + **Install Plugin**

## Section 1 — Search AI Setup

| Toggle | State |
|--------|-------|
| Enable Search AI on my Bybelt Chatbox widget | OFF, **disabled** |
| Direct users to use search before reaching out | OFF, **disabled** |

Large divider follows.

## Section 2 — Search Interface

Expandable card **Frequent searches** (list icon header):

- Description paragraph (13–14px `#75869c`)
- **Add** button (blue mini, plus icon) — right aligned
- **Default language** locale pill (globe icon, blue outline)
- Empty: "There is nothing there (yet!)."

## Preview aside

- **Preview** your widget: title
- 660px white preview area with chat bubble button bottom-right
- Info note: simulated chatbox disclaimer
