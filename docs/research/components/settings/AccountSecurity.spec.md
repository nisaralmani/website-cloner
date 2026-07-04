# Security — Settings Page Spec

**Live URL:** `https://chat.bybelt.com/settings/account/security/`  
**Clone route:** `/settings/account/security`  
**Scraped:** 2026-06-26

## Page chrome

| Element | Live value |
|---------|------------|
| Title h2 | 40px / 600 + help icon |
| Description | "Manage apps connected to your Bybelt account. Review session history." |
| Password / 2-Step | **Not on this page** (those live on Account information) |

## Section: Authorized apps

Table columns: **User Agent** (47%) · **Location** (35%) · **Actions** (18%)

8 live sessions with **Close session** text actions.

## Section: Recent login history

Table columns: **Date** (47%) · **Location** (35%) · **State** (18%)

10 rows with date + `from {agent}`, location with PK flag, state badge (`Authorized` green / `Closed` grey).
