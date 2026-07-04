# Chatbox Appearance — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/chatbox/appearance/`  
**Clone route:** `/settings/chatbox/appearance`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible inline in header on live |
| Description | 14px `#8d949d` — "Customize how your chatbox looks like on your website or app." |
| Content width | 710px centered |

## Section 1 — Chatbox Theme

Seven horizontal selects (~145px label + 300px field):

| Label | Live value |
|-------|------------|
| Color theme (chatbox color) | Default (Blue) |
| Layout theme (chatbox header, etc.) | Colorized |
| Color mode (light or dark) | Light Mode |
| Text theme (text visible on chatbox header) | Questions? Chat with us! |
| Welcome message (first message seen by users) | Hello! How can I help you? :) |
| Chatbox background (messages texture) | Death Star |
| Chatbox language (autodetect, or force a language) | Detect from user country |

**Advanced chatbox customization** — horizontal row with blue link **Open advanced customization** (upgrade-gated on live; hover shows Upgrade to Bybelt Mini tooltip).

## Section 2 — Chatbox Button

Six full-width toggles:

| Toggle | State |
|--------|-------|
| Show workspace logo in chatbox button | OFF |
| Show last active operator face in chatbox button (when no chat is ongoing) | OFF |
| Show operator face in chatbox button (when a chat is ongoing) | **ON** |
| Show activity metrics in the chatbox (eg: mean time to reply) | OFF |
| Show the availability tooltip when chatbox is closed | OFF |
| Reverse the position of the chatbox (show on the left) | OFF |

Active toggle label `#1c293b`; inactive labels `#8d949d`.
