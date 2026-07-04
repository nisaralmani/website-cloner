# LoginPage Specification

## Overview
- **Target file:** `src/components/auth/LoginPage.tsx`
- **Route:** `src/app/initiate/login/page.tsx`
- **Interaction model:** static form; enable submit when email + password non-empty

## Layout (1400×900 desktop)
Two-column split:
- **Left stack** (~940px): header + centered form column `max-w-[600px]`
- **Right feature panel** (460px): blue `#4091E7` promo with illustration

### Top bar (`h-20`, `px-6`)
- Left: `BybeltLogo` markSize 32
- Right: "Need help?" `#3B86FB` semibold + divider + "🇬🇧 English ▾"

### Form column
- H1 "Login" — 28px / 600 black
- Subtitle — 16px / 500 `#8D949D`
- Fields with 20px vertical gap

### Fields (verbatim)
- "Sign in with your email address *" — placeholder "Enter your email…" (pre-filled `contact@fashionpara.com` on live)
- "Password *" — placeholder "Enter your password…"
- Checkbox "Remember me" (default checked)

### Input wrapper
- bg `#F8F9F9`, border `#E8EAEB`, h-11, radius 4px

### Primary button
- "Sign in to Dashboard" — full width, h-12, `#1972F5` (disabled at 40% opacity)

### Footer links (`mt-9`, flex justify-between)
- Left: "Don't have an account yet? Get started." — semibold underline `#333E4F`
- Right: "Forgot Password?" — `#75869C`

### Feature panel (Triggers rotation on live)
- Title: "Get 2x More Sales Using Triggers"
- Subtitle + **Learn More** white link
- Illustration: `InitiateLoginFeature/triggers.png`

## Removed vs earlier clone
- No "Sign in with Google" on current live page

## Verify
- `npm run check` passes.
