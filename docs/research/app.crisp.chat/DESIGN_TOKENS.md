# Design Tokens — Bybelt Inbox (chat.bybelt.com)

Sampled via getComputedStyle + pixel zoom. Font "Bybelt Sans" → substituted with **Inter**.

## Colors
| Token | Hex | Usage |
|-------|-----|-------|
| bybelt-blue | `#0093EE` | visitor names, unread badge, "Get help" link |
| bybelt-blue-strong | `#1972F5` | logo, primary actions |
| bybelt-ink | `#2C405A` | primary text / nav labels |
| bybelt-ink-strong | `#1C293B` | active "Inbox" label |
| bybelt-muted | `#828EA1` | timestamps, secondary |
| bybelt-orange | `#F97316` | Upgrade button (solid) |
| bybelt-green | `#40B630` | Get Started button (solid) |
| bybelt-red | `#E11900` | "8" notification badge |
| bybelt-pending | `#EBF3FE` | unread/pending conversation card bg |
| bybelt-panel | `#F4F6FB` | empty main panel bg |
| bybelt-line | `#E6EAF0` | hairline borders |
| white | `#FFFFFF` | sidebar + list column bg |

## Layout (desktop)
- Left sidebar: **200px** fixed, white, `flex-col`.
- Conversation menu (list) column: **326px**, white shell + `#F4F6FB` scroll area.
- Main conversation panel: fills remaining width; empty state = centered Bybelt logo on white.
- Full viewport height; no page scroll (each column scrolls internally).

## Typography
- Base font: Inter, 16px / line-height 24px, color `#2C405A`.
- Sidebar item labels: **14px / 700**.
- Active "Inbox" label color `#1C293B`.
- Visitor name (card): 14–15px / 700, color `#0093EE`.
- Timestamp: ~12px, `#828EA1`.
- Message preview: ~14px / 600, `#1C293B` (unread) — truncated with ellipsis.

## Components / radii
- Buttons (Upgrade/Get Started): full-width, height 32px content (≈40px box w/ padding), radius 8px, white bold label + leading icon.
- Get Started has a trailing red circular badge ("8"): bg `#E11900`, white, ~18px circle.
- Conversation card: padding `14px 16px 16px`, height ~75px, radius 8px; pending bg `#EBF3FE`; selected adds 3px left border `#0093EE`.
- Avatar bubble: ~40px circle, linear-gradient fill, white person glyph; small country flag badge bottom-right.
- Unread badge: blue `#0093EE` circle ~20px, white number.

## Header (conversation list)
- Row with: "All ▾" pill (left), "Filters" + funnel icon (center), "+" button (right). ~56px tall, bottom hairline.

## Login page (initiate/login)
| Token | Hex | Usage |
|-------|-----|-------|
| bybelt-login-label | `#606976` | field labels |
| bybelt-login-input-bg | `#F8F9F9` | input wrapper background |
| bybelt-login-input-border | `#E8EAEB` | input wrapper border |
| bybelt-help-link | `#3B86FB` | "Need help?" header link |

## Out of scope
- Live Bybelt chat bubble widget, "Get Started" onboarding floater (27%), real data, real auth.
