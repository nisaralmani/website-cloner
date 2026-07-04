# Push Notifications — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/website/11a815c2-135f-464d-93ba-2d8c6ad1791a/chatbox/notifications/`  
**Clone route:** `/settings/chatbox/push`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | Push Notifications |
| Help icon | Present (`icon-question_circle`, 24px `#777f89`) |
| Saved badge | Automatically Saved (inline in header) |
| Description | 14px `#8d949d` — "Enable push notifications for your chatbox mobile SDKs for mobile apps." |
| Content width | 710px centered |

## Firebase Cloud Messaging section

| Element | Live value |
|---------|------------|
| Section heading | Firebase Cloud Messaging (18px bold `#1c293b`) |
| Status badge | Orange filled pill with dot — **disabled** |
| Toggle | Notify users using Android — **OFF** |

Large grey divider follows.

## Apple Push Notification Service section

| Element | Live value |
|---------|------------|
| Section heading | Apple Push Notification Service |
| Status badge | Orange filled pill with dot — **disabled** |
| Toggle | Notify users using iOS — **OFF** |

## Notes

- Live route slug is `/chatbox/notifications/` (not `/chatbox/push/`); clone keeps `chatbox/push` as nav slug.
- Both push providers show **disabled** badges because FCM/APNS are not configured on this workspace.
- No extra buttons or configuration fields on this page — only section headers, badges, and toggles.
