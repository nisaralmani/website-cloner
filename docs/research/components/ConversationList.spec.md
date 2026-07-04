# ConversationList Specification

## Overview
- **Target file:** `src/components/inbox/ConversationList.tsx` (also defines `ConversationCard` in same file)
- **Interaction model:** static list; hover highlight on non-pending cards; one card is `selected`.
- **Width:** **326px** (item width on live), full height, white column shell, `flex flex-col`, right hairline `#E6EAF0`.

## Structure
### 1. Header row (top, **45px**, px 16, items-center, bottom hairline `#E6EAF0`)
- Left: **"Most Recent ▾"** — text "Most Recent" bold 14 `#1C293B` + lucide `ChevronDown` (small). Subtle button (hover bg `#F4F6FB`, radius 6px, px-2 py-1).
- Center/right: **"Filters"** — lucide `ListFilter` + label "Filters" (14/600 `#2C405A`).
- Far right: **"+"** button — lucide `Plus`, `#0093EE`, in a ~28px hover-tile.

### 2. Scrollable conversation list (`flex-1 overflow-y-auto`, bg `#F4F6FB`, padding 8px, gap 4px)
Render `conversations` from mock as `ConversationCard`.

#### ConversationCard
- Container: `flex items-center gap-2`, padding **`14px 16px 16px`**, min-height **75px**, radius 8px.
- **Checkbox** on far left (16px, border `#D7DCE5`).
- If `status === "pending"`: bg **`#EBF3FE`**.
- If `selected`: add **3px left border** `#0093EE` (inset padding).
- Non-pending: bg white, hover bg `#F4F6FB`.
- **Avatar** (left): 40px circle, gradient, initials or `PersonGlyph`. Bottom-right: `CountryFlag` in white ring.
- **Middle** (`flex-1 min-w-0`):
  - Row 1: name (bold 14 `#0093EE`, truncate) + time (12/500 `#828EA1`, right).
  - Row 2: preview (14 bold `#25374F` when unread else 14/500 `#5D6B98`, truncate) + unread badge (if `unread > 0`: `#2494E8` circle ~20px) + **chevron circle** (21px `#2494E8`, white `ChevronRight`).

### 3. Footer toolbar (bottom, ~52px, top hairline `#E6EAF0`, items-center, px 16, justify-between)
- Left: lucide `Share2` + small `ChevronUp` (`#828EA1`).
- Center: assignee avatar ~28px gradient + green online dot (`currentUser.avatarGradient`).
- Right: lucide `MoreHorizontal` (`#828EA1`).

## Imports available
- `cn` from `@/lib/utils`
- `conversations`, `currentUser` from `@/lib/mock-inbox`
- `Conversation` type from `@/types/inbox`
- `PersonGlyph`, `CountryFlag` from `@/components/icons`
- icons from `lucide-react`

## Verify
- `npx tsc --noEmit` passes. Default export `ConversationList`. Use exact hex tokens.
