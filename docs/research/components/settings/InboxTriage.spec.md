# Automatic Triage — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/messaging/triage/`  
**Clone route:** `/settings/inbox/triage`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Automatic Triage |
| Help icon | Not present |
| Saved badge | Automatically Saved |
| Description | "Block and sort your incoming messages, regardless of where they come from." |
| Content width | 710px centered |

## Info panel

Blue info status box (`c-settings-status--info`):

| Element | Live value |
|---------|------------|
| Title | What are Triage Rules? |
| Icon | Question circle, `#0093ee` |
| Body | Two paragraphs explaining triage rules, Block stage, and Sort stage |

## Filters row

Label: **Find a rule**

| Control | Live value |
|---------|------------|
| Search input | Placeholder "Search", magnifier icon left |
| Action picker | **All actions** (200px mini select) |

Options: All actions, Send to Spam, Drop Message, Assign Segment, Set Data Value, Resolve Conversation.

Large grey divider follows.

## Block Ruleset

| Element | Live value |
|---------|------------|
| Heading | Block icon + **Block Ruleset** + `0 active rules` |
| Button | **Add Blocking Rule** (blue bordered mini, plus icon right) |
| Empty state | "There are no block rules" + description about spam inbox |

Large grey divider follows.

## Sort Ruleset

| Element | Live value |
|---------|------------|
| Heading | Sort icon + **Sort Ruleset** + `0 active rules` |
| Button | **Add Sorting Rule** (blue bordered mini) |
| Warning panel | Orange warning icon — "The Sort Ruleset does not replace your Inbox & Routing rules" |
| Empty state | "There are no sort rules" + description about segments & data |

## Notes

- Both rulesets show **0 active rules** on this workspace (empty states visible).
- Add buttons are blue bordered (not solid primary).
- Sort disclaimer uses lighter warning styling (`c-settings-status--warning c-settings-status--lighter`).
