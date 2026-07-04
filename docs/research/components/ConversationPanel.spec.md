# ConversationPanel Specification

## Overview
- **Target file:** `src/components/inbox/ConversationPanel.tsx`
- **Interaction model:** static empty state (no conversation selected).
- **Width:** fills remaining space (`flex-1`), full height.

## Layout
- Background: `#F4F6FB` (very light, near-white). `flex items-center justify-center`.
- Centered content: the **Bybelt logo lockup** — use `BybeltLogo` from `@/components/icons` at a large size (markSize ≈ 56). That renders the blue speech-bubble mark + "bybelt" wordmark in dark navy `#1C293B`.
- Nothing else (matches the live "no conversation selected" empty state).

## Imports available
- `BybeltLogo` from `@/components/icons`
- `cn` from `@/lib/utils` (optional)

## Verify
- `npx tsc --noEmit` passes. Default export `ConversationPanel`, no props.
