# ConversationDetail Specification

## Overview
- **Target file:** `src/components/inbox/ConversationDetail.tsx`
- **Interaction model:** static thread + local composer state (no send)

## Layout
- `flex-col flex-1 min-w-0 bg-white h-full`
- **Header** 52px: left icons (Phone, Video, Ban, MoreHorizontal) `#828EA1`; right blue "Pending" pill `#1972F5`
- **Thread** `flex-1 overflow-y-auto px-6 py-5 gap-4`:
  - Centered "Start LiveTranslate" chip (border `#E6EAF0`, text `#5D6B98`)
  - Date label "5 February" centered `#828EA1` 12px
  - Visitor bubbles: left, gray `#F4F4F5`, avatar 28px gradient circle
  - Operator bubbles: right, `#1972F5` white text
  - Timestamps below bubbles 11px `#828EA1`
- **Composer** bordered card `m-4`: tabs (Reply active `#1972F5`), textarea, attach/Aa/emoji icons, blue send circle

## Verify
- Default export, prop `conversation: Conversation`
