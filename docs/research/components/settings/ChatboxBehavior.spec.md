# Chatbox Behavior — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/chatbox/behavior/`  
**Clone route:** `/settings/chatbox/behavior`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | Visible inline in header on live |
| Description | 14px `#8d949d` — "Enable or disable features on your chatbox." |
| Content width | 710px centered |

Eight sections separated by large dividers.

## Chatbox Home

| Control | Value / state |
|---------|----------------|
| Default section to show when the chatbox is opened | Messages (default) — horizontal 300px |
| Show a home section in the chatbox | OFF |

## Visitors

| Toggle | State |
|--------|-------|
| Ask visitors for their email address | **ON** |
| Ask visitors for their phone number | OFF |
| Force visitors to identify themselves (email or phone) | OFF |

## Files

| Toggle | State |
|--------|-------|
| Allow files to be sent from the chatbox | **ON** |
| Allow audio recordings to be sent from the chatbox | **ON** |

## Knowledge Base

| Control | Value / state |
|---------|----------------|
| Show Knowledge Base in the chatbox | **ON** |
| Knowledge Base-only mode on the chatbox | OFF |
| Knowledge Base navigation mode on the chatbox | Frequently-Read Articles |

## Status

| Toggle | State |
|--------|-------|
| Show an alert when status reports dead | **ON** |

## Hide Chatbox

| Control | Value / state |
|---------|----------------|
| Hide the chatbox if all operators are away | OFF |
| Hide the chatbox on mobile devices | OFF |
| Advanced Chatbox restrictions | link **Go to restrictions** |

## Privacy

| Toggle | State |
|--------|-------|
| Operator privacy mode | OFF |
| Operators can see what visitors write in real-time (MagicType) | **ON** |

## Other

| Toggle | State |
|--------|-------|
| Allow visitors to create new conversations | **ON** |
| Suggest to play a wait game when operators are slow to reply | **ON** |

Active toggle labels `#1c293b`; inactive `#8d949d`.
