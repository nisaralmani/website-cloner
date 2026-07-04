# Settings Overview — Page Spec

**Live URL:** `https://chat.bybelt.com/settings/`  
**Clone route:** `/settings`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Top bar | **Settings** label + Search (via `SettingsTopBar`) |
| Content bg | White |
| Bento grid width | 864px |
| Row gap | 20px |

## Bento cards (`c-feature-bento`)

| Card | Size | Button style |
|------|------|--------------|
| Invite your team | 563×360 | Blue primary — **Add Operators** |
| Adjust your Chatbox design… | 281×360 | Light grey — **Customize Chatbox** |
| Boost efficiency with Shortcuts | 375×401 | Light grey — **Add Shortcuts** |
| Set your Availability days and hours | 469×401 | Blue primary — **Define availability schedule** |

### Card tokens

| Token | Value |
|-------|-------|
| Border | `#E8EAEB` ~0.67px |
| Radius | 8px |
| Padding | 20px 18px 26px |
| Title | 17.5px / 800, `#2c405a` |
| Subtitle | 13px, `#75869c` |

### Media images (from live CDN)

- `bento_media_operators.webp`
- `bento_media_chatbox.webp`
- `bento_media_shortcuts.webp`
- `bento_media_schedule.webp`

Stored in `public/images/settings/`.

## Layout

Two rows, not a uniform 2×2 grid:

```
[ Invite your team (563) ] [ Chatbox (281) ]
[ Shortcuts (375)        ] [ Availability (469) ]
```

## Notes

- No arrow icons on action buttons on live.
- Settings nav shows collapsed categories on overview (no active sub-page).
