# Setup & Integrations — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/integrations/`  
**Clone route:** `/settings/workspace/integrations`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600, `#1c293b` |
| Help icon | 24px `#777f89` |
| Saved badge | **Hidden** |
| Content width | 710px centered |

## Website ID row

Horizontal layout, 24px gap below:

| Part | Tokens |
|------|--------|
| Label | 140px, 14px bold `#606976` — "Website ID" |
| Input | Flex, 40px, border `#E8EAEB`, 14px semibold `#777f89` readonly UUID |
| Copy button | Black `#1c293b`, 40px height, 13px bold white + copy icon |

## Chatbox row

24px below Website ID:

| Label (140px) | Action |
|---------------|--------|
| Chatbox | Blue button "Chatbox setup instructions" with arrow icon (37px height) |

Large grey divider — 30px vertical margin.

## Section: Integrate with Bybelt

Heading: 18px bold `#1c293b`  
Intro: 14px `#75869c`, 24px margin below — "Integrate Bybelt on one of these channels to get in touch with your customers."

### Channel categories (3-column grid, 226×55px tiles, 16px gap)

| Category | Channels |
|----------|----------|
| Website | HTML, WordPress, Shopify, Prestashop, WooCommerce, WHMCS, Adobe Commerce, iFrame |
| Email | Gmail, Outlook, Email |
| Messaging Plugins | Instagram, Messenger, Slack, Telegram, X (Twitter), WhatsApp, Aircall, Auto-Responder, Bot, Contact Form, Discord, GitHub, Hugo, Klaviyo, Line, Ringover, Ticket Center, Triggers, Twilio, Viber |
| Native App SDKs | iOS SDK, Android SDK, React Native SDK |

Tile tokens: white bg, `#E8EAEB` border, 8px radius, 10×16px padding, 34px icon + 16px medium label.

Category blocks: 32px margin between categories.

Footer: black **See all integrations** button (40px height, 13px bold white).
