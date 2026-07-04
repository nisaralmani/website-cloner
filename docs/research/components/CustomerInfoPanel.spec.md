# CustomerInfoPanel Specification

## Overview
- **Target file:** `src/components/inbox/CustomerInfoPanel.tsx`
- **Interaction model:** static collapsible sections (visual only)

## Layout
- Width **268px**, white, left border `#E6EAF0`, `overflow-y-auto`
- **Header:** 56px avatar + flag badge, name 18/700 `#1C293B`, "set email" link `#0093EE`, location `#828EA1`
- **Sections** with label row 44px + chevron: Main information, Visitor device, Quick jump, Shared image files (chevron right), Segments for conversation (text input)

## Rows (Main information)
- MapPin location, Clock local time + timezone, Globe flag, ArrowLeftRight channel "Chat"
- Visitor device: Compass browser string, Wifi masked IP

## Verify
- Default export, prop `conversation: Conversation`
