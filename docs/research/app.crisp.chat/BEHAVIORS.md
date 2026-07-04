# Behaviors — chat.bybelt.com

## Global
- **No smooth-scroll library** on login or inbox shell.
- **Font:** "Bybelt Sans" (proprietary) → Inter substitute via `--font-inter`.
- Full-height app shell on inbox; internal column scroll only.
- **Global search:** Ctrl+F opens overlay; filters quick links + conversations as you type.

## Login (`/initiate/login/`)
- **Interaction model:** static form; primary button disabled until email + password filled.
- **Primary button states:**
  - Disabled: `background-color: rgba(25, 114, 245, 0.4)`, white text, radius 4px, height ~48px.
  - Enabled: solid `#1972F5`.
- **Inputs:** wrapper `#F8F9F9`, border `#E8EAEB`, radius 4px, height 44px; inner text 15px `#1C293B`.
- **Labels:** 15px / 700 `#606976`; required fields show red asterisk.
- **Remember me:** checkbox checked by default.
- **Footer links:** signup (underline) left, forgot password right.
- **Feature panel:** 460px blue promo column; auto-rotates every 8s (Triggers, Chatbox, AI Agent).
- No Google sign-in on current live page.

## Inbox (authenticated)
- Conversation card click → selects thread, shows **ConversationDetail** + **CustomerInfoPanel**.
- URL `?conversation={id}` deep-links to a selected thread; search overlay links use this param.
- Empty selection → **ConversationPanel** (centered Bybelt logo on `#F4F6FB`).
- Sidebar **Settings** → `/settings`; **Plugins** → `/plugins`.
- **Get help** → `https://help.bybelt.com/en/` (new tab).
- Hover: nav rows `#F4F6FB` background; conversation cards hover when not selected.

## Settings
- Category accordions expand/collapse on click.
- Overview cards link to detail routes.
- Toggle switches animate thumb translate (CSS transition).

## Out of scope
- Real authentication, Google OAuth, WebSocket messaging, live Bybelt widget.
