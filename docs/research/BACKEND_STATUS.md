# Backend Status — Bybelt

**Started:** 2026-06-26 · **Data source:** Own SQLite backend

## Phases

| Phase | Scope | Status |
|-------|--------|--------|
| U1 | Auth (login, JWT session, route guard) | **done** |
| U2 | Inbox conversations + messages from DB | **done** |
| U3 | Send message (POST) | **done** |
| U4 | Visitors panel from DB | **done** |
| U5 | Contacts table + search from DB | **done** |
| U6 | Campaigns nav + empty state from DB | **done** |
| U7 | Helpdesk articles from DB | **done** |
| U8 | Analytics dashboards from DB | **done** |
| U9 | Plugins install toggles from DB | **done** |
| U10 | Settings toggles persist | **done** |
| U11 | Global search index API | **done** |
| U12 | Realtime inbox (polling) | **done** |
| U13 | Google OAuth | **done** |
| U14 | Forgot password | **done** |
| U15 | Postgres production | **done** |
| U16 | Inbox SSE stream | **done** |
| U17 | Session + logout wiring | **done** |
| U18 | Backend API smoke tests in CI | **done** |
| U19 | Inbox SSE stream smoke | **done** |
| U20 | Account menu (sidebar footer) | **done** |
| U21 | Operator presence (online/offline) | **done** |
| U22 | Workspace switcher | **done** |
| U23 | Redis inbox pub/sub (optional) | **done** |
| U24 | Availability ↔ presence sync | **done** |
| U25 | Create workspace flow | **done** |
| U26 | Editable account profile | **done** |
| U27 | Auto-available when using app | **done** |
| U28 | Workspace information | **done** |
| U29 | Availability schedule | **done** |
| U30 | Change password | **done** |
| U31 | Account avatar upload | **done** |
| U32 | Email verification | **done** |
| U33 | Account notification preferences | **done** |
| U34 | Account security sessions | **done** |
| U35 | Account interface preferences | **done** |
| U36 | Account keyboard shortcuts | **done** |
| U37 | Inbox message shortcuts | **done** |
| U38 | Inbox customize settings | **done** |
| U39 | Inbox automatic triage | **done** |
| U40 | Inbox sub-inboxes | **done** |
| U41 | Inbox operator routing | **done** |
| U42 | Chatbox appearance settings | **done** |
| U43 | Chatbox behavior settings | **done** |
| U44 | Chatbox Search AI | **done** |
| U45 | Chatbox security settings | **done** |
| U46 | Chatbox restrictions settings | **done** |
| U47 | Chatbox push notifications | **done** |
| U48 | Email behavior settings | **done** |
| U49 | Email domain settings | **done** |
| U50 | Email delivery settings | **done** |
| U51 | Billing plans | **done** |
| U52 | Billing cards | **done** |
| U53 | Billing invoices | **done** |
| U54 | Workspace integrations | **done** |
| U55 | Workspace operators | **done** |
| U56 | Workspace billing | **done** |
| U57 | Workspace transparency log | **done** |
| U58 | Workspace advanced configuration | **done** |
| U59 | Workspace data, limits & legal | **done** |
| U60 | Workspace danger zone | **done** |
| U61 | Conversation status | **done** |
| U62 | Inbox internal notes | **done** |
| U63 | Conversation read/unread | **done** |
| U64 | Mark conversation unread | **done** |
| U65 | Customer email | **done** |
| U66 | Simulated visitor messages | **done** |
| U67 | Conversation operator assignment | **done** |
| U68 | Visitor data KV | **done** |
| U69 | Conversation segments | **done** |
| U70 | Auto-assign on operator reply | **done** |
| U97 | Chatbox allow files toggle | **done** |
| U98 | Chatbox audio recordings | **done** |
| U99 | Attachment size limits | **done** |
| U100 | Inbox sidebar counts API | **done** |
| U101 | Live visitor ping | **done** |
| U102 | Webhook delivery | **done** |
| U103 | Outbound email transport | **done** |
| U104 | Analytics chart series | **done** |
| U105 | Chatbox ask email config | **done** |
| U106 | Create campaign API | **done** |
| U107 | Create helpdesk article API | **done** |
| U108 | Chatbox ask phone | **done** |
| U109 | Force visitor identify | **done** |
| U110 | Routing rules on session create | **done** |
| U111 | Email signature settings | **done** |
| U112 | Public helpdesk articles | **done** |
| U113 | Campaign update/delete | **done** |
| U114 | Helpdesk article update/delete | **done** |
| U115 | Helpdesk categories CRUD | **done** |
| U116 | Contacts CRUD | **done** |
| U117 | Helpdesk article body field | **done** |
| U118 | Public helpdesk article detail | **done** |
| U119 | Chatbox blocked page enforcement | **done** |
| U120 | Chatbox vacation mode | **done** |
| U121 | Patch chatbox restrictions | **done** |
| U122 | Bulk conversation status | **done** |
| U123 | Delete conversation | **done** |
| U124 | Sub-inbox conversation filter | **done** |
| U125 | Spam inbox filter + counts | **done** |
| U126 | Patch chatbox session identity | **done** |
| U127 | Webhook note/status/assigned events | **done** |
| U128 | Audit log on operator invite | **done** |
| U129 | Conversation ratings API | **done** |
| U130 | Analytics visitor chart | **done** |
| U131 | Search campaigns + helpdesk | **done** |
| U132 | Billing plan upgrade API | **done** |
| U133 | Campaign recipients table | **done** |
| U134 | Webhook events column | **done** |
| U135 | Campaign templates CRUD | **done** |
| U136 | Campaign recipients API | **done** |
| U137 | Campaign detail GET | **done** |
| U138 | Campaign send API | **done** |
| U139 | Plan feature flags on upgrade | **done** |
| U140 | Analytics timezone PATCH | **done** |
| U141 | Analytics rating chart | **done** |
| U142 | Analytics ratings list | **done** |
| U143 | Helpdesk article detail GET | **done** |
| U144 | Contact detail GET | **done** |
| U145 | Public helpful vote | **done** |
| U146 | Contacts segment filter | **done** |
| U147 | Chatbox domain lock | **done** |
| U148 | Hide chatbox when away | **done** |
| U149 | Hide chatbox on mobile | **done** |
| U150 | Routing rules master toggle | **done** |
| U151 | Routing rerun when offline | **done** |
| U152 | Operators limit enforcement | **done** |
| U153 | Non-owner delete guard | **done** |
| U154 | Ratings enabled gate | **done** |
| U155 | Operator privacy read receipts | **done** |
| U156 | MagicType typing gate | **done** |
| U157 | Bulk conversation delete | **done** |
| U158 | Webhook created/deleted events | **done** |
| U159 | Login + settings audit log | **done** |
| U160 | Webhook test delivery | **done** |
| U161 | Operator role PATCH | **done** |
| U162 | File upload limit counter | **done** |
| U163 | Google OAuth unlink | **done** |
| U164 | Helpdesk create body field | **done** |
| U165 | Campaign recipient usage count | **done** |
| U166 | Search visitors index | **done** |
| U167 | Search message shortcuts | **done** |
| U168 | Transparency collect gate | **done** |
| U169 | Custom SMTP email transport | **done** |
| U170 | Helpdesk write plan gate | **done** |
| U171 | Visitors API query filter | **done** |
| U172 | Campaign recipients GET | **done** |
| U173 | Global search overlay extended sections | **done** |
| U174 | Google OAuth unlink UI | **done** |
| U175 | Helpdesk categories plan gate | **done** |
| U176 | Campaign send email dispatch | **done** |
| U177 | SMTP credential fields | **done** |
| U178 | Conversations API query filter | **done** |
| U179 | Helpdesk category detail GET | **done** |
| U180 | Analytics write plan gate | **done** |
| U181 | Campaign sent webhook event | **done** |
| U182 | Campaign send/create UI wiring | **done** |
| U183 | Helpdesk panel search wired | **done** |
| U184 | Helpdesk New Article UI | **done** |
| U185 | Helpdesk New Category UI | **done** |
| U186 | Campaign recipients modal UI | **done** |
| U187 | Inbox conversation list search | **done** |
| U188 | Contact preview modal | **done** |
| U189 | Campaign delete UI | **done** |
| U190 | Contacts New Contact UI | **done** |
| U191 | Helpdesk article delete UI | **done** |
| U192 | Campaign POST contactIds | **done** |
| U193 | Helpdesk upgrade overlay → Plus | **done** |
| U194 | Analytics upgrade overlay → Essentials | **done** |
| U195 | Helpdesk category delete + rename | **done** |
| U196 | Contact delete in preview modal | **done** |
| U197 | Campaign rename PATCH UI | **done** |
| U198 | Analytics conversation chart from API | **done** |
| U199 | Plugins panel search | **done** |
| U200 | Helpdesk article status toggle | **done** |
| U201 | Contact edit PATCH in preview | **done** |
| U202 | Analytics timezone selector PATCH | **done** |
| U203 | Campaign templates panel UI | **done** |
| U204 | Visitors filter → API `?q=` | **done** |
| U205 | Contacts segment filter UI | **done** |
| U206 | Analytics ratings list | **done** |
| U207 | Analytics visitor chart from API | **done** |
| U208 | Helpdesk article detail modal | **done** |
| U209 | Settings UpgradeGatePanel upgrade | **done** |
| U210 | BillingPlansPanel Change Plan | **done** |
| U211 | Campaign create with contactIds | **done** |
| U212 | Plugin View Details modal | **done** |
| U213 | Campaign detail modal GET | **done** |
| U214 | Helpdesk article edit in modal | **done** |
| U215 | Helpdesk category detail modal | **done** |
| U216 | Contact location/company edit | **done** |
| U217 | Campaign status cycle PATCH | **done** |
| U218 | Analytics rating chart from API | **done** |
| U219 | Helpdesk article category assign | **done** |
| U220 | Inbox bulk delete UI | **done** |
| U221 | Billing invoice detail modal | **done** |
| U222 | Contacts row quick delete | **done** |
| U223 | Inbox bulk status UI | **done** |
| U224 | Contact segment edit in preview | **done** |
| U225 | Plugin install toggle in modal | **done** |
| U226 | Visitor detail panel on select | **done** |
| U227 | Campaign template category cycle | **done** |
| U228 | Billing invoice delete in modal | **done** |
| U229 | Analytics period date range | **done** |
| U230 | Helpdesk public article preview | **done** |
| U231 | Campaign tags route header label | **done** |
| U232 | Campaign create type selector | **done** |
| U233 | Inbox spam sidebar filter | **done** |
| U234 | Sub-inbox sidebar list + create | **done** |
| U235 | Conversation delete from thread | **done** |
| U236 | Webhook test delivery button | **done** |
| U237 | Operator role edit | **done** |
| U238 | Email signature settings panel | **done** |
| U239 | Composer Shortcuts tab picker | **done** |
| U240 | Campaign detail send + recipients | **done** |
| U241 | Helpdesk helpful vote in preview | **done** |
| U242 | Block visitor from conversation | **done** |
| U243 | Get Started sidebar → unassigned filter | **done** |
| U244 | Chatbox max attachment size panel | **done** |
| U245 | Widget post-chat star rating | **done** |
| U246 | Sub-inbox rename + segment edit | **done** |
| U247 | Inbox sidebar Upgrade button | **done** |
| U248 | Helpdesk preview domain from session | **done** |
| U249 | Conversation list Filters popover | **done** |
| U250 | Sub-inbox unread sidebar badges | **done** |
| U251 | Agent page upgrade CTA | **done** |
| U252 | Contact create modal | **done** |
| U253 | POST `/api/conversations` + list Plus button | **done** |
| U254 | Contact saved filters (localStorage) + sidebar create | **done** |
| U255 | Visitor `conversationId` + Open in Inbox link | **done** |
| U256 | Analytics period dropdown (7/14/30 days) | **done** |
| U257 | Analytics sub-route label in header | **done** |
| U258 | Transparency audit log date range filters | **done** |
| U259 | Contacts bulk delete UI + API | **done** |
| U260 | Campaign tags route filter UI | **done** |
| U261 | Agent onboarding step CTAs | **done** |
| U262 | Settings top bar back/forward navigation | **done** |
| U263 | Plugin install banners (Overlay / Watchdog) | **done** |
| U264 | Integrations setup links + channel tiles | **done** |
| U265 | Conversation list sort dropdown | **done** |
| U266 | Widget identity PATCH on blur | **done** |
| U267 | Widget public helpdesk article browse | **done** |
| U268 | Billing plans alert → cards settings | **done** |
| U269 | Contacts row ⋯ menu Preview/Delete | **done** |
| U270 | Contacts bulk segment tag | **done** |
| U271 | Inbox list Share deep-link copy | **done** |
| U272 | Contacts column picker + docs link | **done** |
| U273 | Inbox list footer ⋯ menu (bulk select, share, customize) | **done** |
| U274 | Thread header ⋯ Mark unread + copy link | **done** |
| U275 | Thread header Phone/Video from visitor phone | **done** |
| U276 | Composer Aa / Smile / ⋯ toolbar shortcuts | **done** |
| U277 | Campaigns Documentation + Actions dropdown | **done** |
| U278 | Helpdesk Documentation + Actions dropdown | **done** |
| U279 | Email Delivery Dedicated IP plugin install | **done** |
| U280 | Account Information delete footer → workspace danger | **done** |
| U281 | Campaign tags row click → `?tag=` filter | **done** |
| U282 | Analytics `/analytics/messaging/ratings` view | **done** |
| U283 | Analytics messaging/workload heatmap view | **done** |
| U284 | Analytics messaging/operators list view | **done** |
| U285 | Analytics messaging/responsiveness KPIs | **done** |
| U286 | Analytics visitors/website-visits chart view | **done** |
| U287 | Inbox composer Knowledge Base article insert | **done** |
| U288 | Inbox LiveTranslate toggle in thread | **done** |
| U289 | Email domain verify setup button | **done** |
| U290 | Billing invoices generate sample invoice UI | **done** |
| U291 | Workspace data Setup Knowledge Base → helpdesk | **done** |
| U292 | Analytics dashboard/new create form | **done** |
| U293 | Analytics messaging/automations view | **done** |
| U294 | Analytics messaging/channels view | **done** |
| U295 | Analytics messaging/sla view | **done** |
| U296 | Analytics messaging/segments view | **done** |
| U297 | Analytics messaging/shortcuts view | **done** |
| U298 | Analytics visitors/triggers view | **done** |
| U299 | Analytics helpdesk/visits article views | **done** |
| U300 | Analytics contacts/contacts-saved view | **done** |
| U301 | Inbox composer Edit tab + PATCH operator message | **done** |
| U302 | Analytics contacts/campaigns-reach + transparency smoke fix | **done** |
| U303 | Analytics helpdesk/search frequent queries view | **done** |
| U304 | Analytics helpdesk/articles performance view | **done** |
| U305 | Analytics contacts/campaigns-activity view | **done** |
| U306 | Analytics status/downtimes KPI view | **done** |
| U307 | Inbox composer tab chevron overflow menu | **done** |
| U308 | Agent upgrade → workspace data training | **done** |
| U309 | Analytics upgrade Payment tab → billing plans | **done** |
| U310 | Analytics overview Copy report button | **done** |
| U311 | Analytics nav routes fully dedicated (no generic sub-routes) | **done** |
| U312 | Smoke chatbox domain lock reset + session domain | **done** |
| U313 | Settings upgradeLinkRow navigable links | **done** |
| U314 | Settings showHelp icon → Help Center | **done** |
| U315 | Analytics upgrade Get Started → `/agent` | **done** |
| U316 | Analytics upgrade Play video → Help Center | **done** |
| U317 | Inbox sidebar upgrade → billing plans after success | **done** |
| U318 | Visitors Start conversation from detail panel | **done** |
| U319 | Contacts Export CSV API + Actions menu | **done** |
| U320 | Analytics helpdesk/search empty CTA → Search AI settings | **done** |
| U321 | Settings billing alert action → billing cards | **done** |
| U322 | Helpdesk upgrade Play video + Get Started wired | **done** |
| U323 | Login signup CTA → www.bybelt.com/signup | **done** |
| U324 | Marketing feature cards → real `/pricing` paths (no `#`) | **done** |
| U325 | Marketing use cases → feature landing links | **done** |
| U326 | Brand URL centralization (`BRAND_*` in app shell) | **done** |
| U327 | Help center public article list + search | **done** |
| U328 | Help center article detail at `/article/[id]` | **done** |
| U329 | Developer docs → API token + integration links | **done** |
| U330 | Branded auth emails (reset + verify HTML) | **done** |
| U331 | Auth URLs prefer `NEXT_PUBLIC_APP_URL` (chat.bybelt.com) | **done** |
| U332 | Smoke batch u323–u332 integrations | **done** |
| U333 | `status.bybelt.com` → operational status page | **done** |
| U334 | Help article “Was this helpful?” public vote | **done** |
| U335 | Sitemap includes help/docs/status origins | **done** |
| U336 | Central doc URLs (`docs-links.ts`) for app panels | **done** |
| U337 | Developer docs anchor sections (API, webhooks, etc.) | **done** |
| U338 | Copy conversation link uses `appUrl()` (chat.bybelt.com) | **done** |
| U339 | Helpdesk “Public help center” → help.bybelt.com | **done** |
| U340 | Campaigns/contacts doc buttons → docs.bybelt.com anchors | **done** |
| U341 | Help article related articles + cleaner footer | **done** |
| U342 | Smoke batch u333–u342 integrations | **done** |
| U343 | Help URL helpers (`helpArticleUrl`, `helpCategoryUrl`) | **done** |
| U344 | Auth carousel + login help links centralized | **done** |
| U345 | Settings help URLs → `BRAND_HELP_URL` base | **done** |
| U346 | Marketing footer/mega menu → `BRAND_*` constants | **done** |
| U347 | Analytics/plugins/visitors doc buttons → docs anchors | **done** |
| U348 | Chatbox widget preview → `appUrl('/widget')` | **done** |
| U349 | Settings registry API/email links → brand helpers | **done** |
| U350 | Help center ↔ status/docs cross-links | **done** |
| U351 | Developer docs settings links + `robots.ts` marketing origin | **done** |
| U352 | Smoke batch u343–u352 integrations | **done** |
| U353 | Remaining marketing hardcoded URLs → `BRAND_*` / `appUrl` | **done** |
| U354 | Apps page platform links → `appUrl('/initiate/login')` | **done** |
| U355 | AI Agent doc link → `docs.bybelt.com#ai-agent` | **done** |
| U356 | Pricing enterprise + FAQ contact → `BRAND_CONTACT_URL` | **done** |
| U357 | Subdomain SEO metadata (`marketingPageMetadata`) | **done** |
| U358 | Help article canonical URLs → `helpArticleUrl()` | **done** |
| U359 | Inbox sidebar “Developer docs” → `#inbox` anchor | **done** |
| U360 | Developer docs `#ai-agent` + `#inbox` sections | **done** |
| U361 | Chatbox embed snippet prefers `NEXT_PUBLIC_APP_URL` | **done** |
| U362 | Smoke batch u353–u362 integrations | **done** |
| U363 | `appLoginUrl()` + `marketingSignupUrl()` helpers | **done** |
| U364 | Marketing signup/login CTAs → `appLoginUrl()` | **done** |
| U365 | `getSiteUrl()` defaults to `BRAND_MARKETING_URL` | **done** |
| U366 | Password reset + verify email URLs use `appUrl()` | **done** |
| U367 | Help article links use `helpArticleUrl()` | **done** |
| U368 | Sitemap includes public help article URLs from DB | **done** |
| U369 | Marketing header/hero/apps CTAs → `appLoginUrl()` | **done** |
| U370 | Developer docs `#chat-widget` + settings doc link | **done** |
| U371 | Auth layout logo → `marketingUrl('/')` | **done** |
| U372 | Smoke batch u363–u372 integrations | **done** |
| U373 | `marketingSignupPath()` + `MARKETING_SIGNUP_PATH` constant | **done** |
| U374 | All marketing signup CTAs → `marketingSignupPath()` | **done** |
| U375 | Pricing plan `ctaHref` → `marketingSignupPath()` | **done** |
| U376 | System status service labels use `domains.ts` hosts | **done** |
| U377 | Help center getting started → `marketingSignupUrl()` | **done** |
| U378 | Login page signup CTA → `marketingSignupUrl()` | **done** |
| U379 | Settings keyboard shortcuts → `SETTINGS_KEYBOARD_SHORTCUTS_URL` | **done** |
| U380 | Developer docs helpdesk section links to `BRAND_HELP_URL` | **done** |
| U381 | `robots.ts` sitemap uses `getSiteUrl()` | **done** |
| U382 | Smoke batch u373–u382 integrations | **done** |
| U383 | Auth path constants (`APP_AUTH_*_PATH`) | **done** |
| U384 | Auth pages + session logout use auth path constants | **done** |
| U385 | `appHomeUrl()` + `marketingFeatureUrl()` helpers | **done** |
| U386 | Developer docs → `docs-links` + `appSettingsUrl()` | **done** |
| U387 | `appSettingsPath()` / `appSettingsUrl()` for settings deep links | **done** |
| U388 | Settings registry internal links → `appSettingsPath()` | **done** |
| U389 | Sitemap includes reset + verify-email auth paths | **done** |
| U390 | System status marketing link → `marketingUrl('/')` | **done** |
| U391 | Agent welcome steps → `appSettingsPath()` | **done** |
| U392 | Smoke batch u383–u392 integrations | **done** |
| U393 | `appWidgetUrl()` + `appConversationUrl()` + `marketingHomeUrl()` | **done** |
| U394 | User account menu → `appSettingsPath()` | **done** |
| U395 | Settings overview cards → `appSettingsPath()` | **done** |
| U396 | Analytics panel settings CTAs → `appSettingsPath()` | **done** |
| U397 | Settings detail fallbacks + widget preview → path helpers | **done** |
| U398 | Inbox copy link → `appConversationUrl()` | **done** |
| U399 | Search API + navigation → `appSettingsPath()` | **done** |
| U400 | Agent welcome widget step → `appWidgetPath()` | **done** |
| U401 | Auth layout + status page → `marketingHomeUrl()` | **done** |
| U402 | Smoke batch u393–u402 integrations | **done** |
| U403 | `appApiBaseUrl()` + `appEmbedScriptUrl()` + path constants | **done** |
| U404 | Developer docs API/embed examples → app URL helpers | **done** |
| U405 | System status “Open app” → `appHomeUrl()` | **done** |
| U406 | `PUBLIC_STATUS_URL` in `docs-links.ts` | **done** |
| U407 | Settings nav tree → `appSettingsPath()` | **done** |
| U408 | Settings sidebar help/status links wired | **done** |
| U409 | Embed snippet uses `APP_*_PATH` constants | **done** |
| U410 | Inbox sidebar help → `PUBLIC_HELP_CENTER_URL` | **done** |
| U411 | Sitemap includes `/embed.js` + `/widget` | **done** |
| U412 | Smoke batch u403–u412 integrations | **done** |
| U413 | App module path constants + `appModulePath()` helpers | **done** |
| U414 | Inbox sidebar PRIMARY_NAV → `APP_*_PATH` | **done** |
| U415 | `marketing-data.ts` feature hrefs → `marketingFeaturePath()` | **done** |
| U416 | `PUBLIC_DOCS_URL`, `PUBLIC_CONTACT_URL` in `docs-links.ts` | **done** |
| U417 | Help center → `PUBLIC_*` cross-domain links | **done** |
| U418 | Marketing footer + integrations page → `PUBLIC_*` | **done** |
| U419 | Search navigation + search API → app module paths | **done** |
| U420 | `helpdesk-routes.ts` → `appHelpdeskPath()` | **done** |
| U421 | Analytics/Campaigns/Helpdesk panels + workspace danger → app paths | **done** |
| U422 | Smoke batch u413–u422 integrations | **done** |
| U423 | Developer docs → `PUBLIC_*` cross-domain links | **done** |
| U424 | System status → `PUBLIC_*` cross-domain links | **done** |
| U425 | Auth layout + login → `PUBLIC_HELP_CENTER_URL` | **done** |
| U426 | Help article page → `PUBLIC_HELP_CENTER_URL` | **done** |
| U427 | Settings help URL fallback → `PUBLIC_HELP_CENTER_URL` | **done** |
| U428 | SettingsDetail knowledge base CTA → `appHelpdeskPath()` | **done** |
| U429 | PluginsNav → `APP_PLUGINS_PATH` | **done** |
| U430 | Integrations page plugins CTA → `appPluginsUrl()` | **done** |
| U431 | `campaigns-routes.ts` → `appCampaignsPath()` | **done** |
| U432 | `analytics-routes.ts` → `appAnalyticsPath()` + smoke batch | **done** |
| U433 | Pricing contact CTAs → `PUBLIC_CONTACT_URL` | **done** |
| U434 | Auth email templates → `appHomeUrl()` | **done** |
| U435 | Marketing page internal CTAs → `marketingFeaturePath()` | **done** |
| U436 | Marketing header/footer home + apps → `marketingFeaturePath()` | **done** |
| U437 | Inbox sidebar analytics + path checks → `APP_*_PATH` | **done** |
| U438 | PluginsNav + SettingsDetail integrations → `APP_PLUGINS_PATH` | **done** |
| U439 | GlobalSearchOverlay nav icons → path constants | **done** |
| U440 | `sitemap.ts` + `robots.ts` + middleware → `APP_*_PATH` | **done** |
| U441 | `not-found` + login + SettingsNav → path helpers | **done** |
| U442 | Static route params + smoke batch u433–u442 | **done** |
| U443 | Remaining marketing page CTAs → `marketingFeaturePath()` | **done** |
| U444 | Marketing footer testimonials anchor → `marketingFeaturePath()` | **done** |
| U445 | Agent welcome inbox step → `APP_INBOX_PATH` | **done** |
| U446 | Visitor detail panel → `appInboxConversationPath()` | **done** |
| U447 | Session workspace switch/create → `APP_INBOX_PATH` | **done** |
| U448 | Login post-auth redirect → `APP_INBOX_PATH` | **done** |
| U449 | `APP_AUTH_ROOT_PATH` + middleware public prefix | **done** |
| U450 | `site-url.ts` → `marketingHomeUrl()` | **done** |
| U451 | `appPluginsPath()` helper + PluginsNav | **done** |
| U452 | Smoke batch u443–u452 | **done** |
| U453 | Satellite path constants (`HELP_CENTER_PATH`, etc.) | **done** |
| U454 | Middleware → satellite + widget/embed path constants | **done** |
| U455 | `helpArticleUrl` / `helpCategoryUrl` → `docs-links.ts` | **done** |
| U456 | `marketingExternalUrl` → `marketing-paths.ts` | **done** |
| U457 | Settings help URLs import from `docs-links.ts` | **done** |
| U458 | Help center articles → `helpCenterArticlePath()` | **done** |
| U459 | `public-helpdesk.ts` + sitemap help → shared helpers | **done** |
| U460 | Chatbox embed loader → `APP_WIDGET_PATH` | **done** |
| U461 | `appContactsPath()` + inbox contact filters | **done** |
| U462 | Smoke batch u453–u462 | **done** |
| U463 | `docsSectionUrl()` + `DOCS_*` refactor | **done** |
| U464 | `MARKETING_CONTACT_PATH` + `marketingContactUrl()` | **done** |
| U465 | `marketing-paths` fallbacks → `domains.ts` | **done** |
| U466 | `brand.ts` URLs derive from `domains.ts` | **done** |
| U467 | Sitemap satellite paths | **done** |
| U468 | `APP_AUTH_GOOGLE_PATH` + LoginPage | **done** |
| U469 | Public helpdesk API path helpers | **done** |
| U470 | Help center consumers wired | **done** |
| U471 | Widget + helpdesk modal API paths | **done** |
| U472 | Smoke batch u463–u472 | **done** |

## U1 — Auth

| Feature | Live parity | Status |
|---------|-------------|--------|
| Email + password login | chat.bybelt.com/initiate/login | **done** |
| Invalid credentials error | Yes | **done** |
| Submit disabled until fields filled | Yes | **done** |
| Redirect to inbox after login | Yes | **done** |
| App routes require session | Yes | **done** |
| Marketing `/en` public | Yes | **done** |
| Google OAuth | Live has button | **done** |
| Remember me persistence | Live | **done** (U17) |
| Forgot password | Live has link | **done** |
| Session API wired to sidebar | Live | **done** (U17) |
| Logout from app shell | Live | **done** (U17) |

## Dev setup

```bash
npm run db:seed
npm run dev
```

Login: `contact@fashionpara.com` / `fashionsis-dev` (or `SEED_USER_PASSWORD`)

## U2 — Inbox

| Feature | Status |
|---------|--------|
| `GET /api/conversations` | **done** |
| `GET /api/conversations/[id]` | **done** (messages + customer details) |
| Inbox list wired to API | **done** |
| Global search uses API | **unified index (U11)** |
| Send message | **done** |
| Realtime polling (list + thread) | **done** |
| SSE stream (`/api/inbox/stream`) | **done** |

## U4 — Visitors

| Feature | Status |
|---------|--------|
| `GET /api/visitors` | **done** |
| Visitors list wired to API | **done** |
| MagicMap stats + markers | **done** |
| Filter by name/city | **done** |
| Sidebar online count badge | **done** |

## U5 — Contacts

| Feature | Status |
|---------|--------|
| `GET /api/contacts` | **done** |
| Contacts table wired to API | **done** |
| Header total from workspace | **done** |
| Search by name/email/location | **done** |

## U6 — Campaigns

| Feature | Status |
|---------|--------|
| `GET /api/campaigns` | **done** |
| Empty campaigns state from API | **done** |
| Nav template count badges | **done** |
| Type filter (all/automated/one-shot) | **done** |

## U7 — Helpdesk

| Feature | Status |
|---------|--------|
| `GET /api/helpdesk` | **done** |
| Article/category counts from API | **done** |
| Upgrade overlay when locked | **done** |
| Status filter (draft/visible/hidden) | **done** |

## U8 — Analytics

| Feature | Status |
|---------|--------|
| `GET /api/analytics` | **done** |
| KPI cards from API | **done** |
| Timezone + period from workspace | **done** |
| Upgrade overlay when locked | **done** |

## U9 — Plugins

| Feature | Status |
|---------|--------|
| `GET /api/plugins` | **done** |
| `PATCH /api/plugins/[id]` install toggle | **done** |
| Plugin grid wired to API | **done** |
| Category + installed filters | **done** |

## U10 — Settings

| Feature | Status |
|---------|--------|
| `GET /api/settings/[...slug]` | **done** |
| `PATCH /api/settings/[...slug]` toggle save | **done** |
| Settings toggles wired to API | **done** |

## U11 — Global search

| Feature | Status |
|---------|--------|
| `GET /api/search` | **done** |
| Conversations + contacts + plugins | **done** |
| Settings pages in results | **done** |
| Overlay wired with debounce | **done** |

## U12 — Realtime inbox

| Feature | Status |
|---------|--------|
| Visibility-aware polling hook | **done** |
| List refresh every 5s | **done** |
| Thread incremental poll every 3s | **done** |
| `GET .../messages?after=` cursor | **done** |

## U13 — Google OAuth

| Feature | Status |
|---------|--------|
| `GET /api/auth/google` | **done** |
| `GET /api/auth/google/callback` | **done** |
| Link by Google sub or email | **done** |
| Login button when configured | **done** |

## U14 — Forgot password

| Feature | Status |
|---------|--------|
| `POST /api/auth/forgot-password` | **done** |
| `GET/POST /api/auth/reset-password` | **done** |
| `/initiate/forgot` page | **done** |
| `/initiate/reset?token=` page | **done** |
| Dev reset link in response | **done** |

## API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| PATCH | `/api/auth/presence` | Set operator online/offline |
| GET/POST | `/api/auth/workspace` | List / switch active workspace |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/auth/session` | Current user + workspace |
| GET | `/api/auth/providers` | Enabled auth providers |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/google/callback` | Complete Google OAuth |
| POST | `/api/auth/forgot-password` | Request password reset |
| GET | `/api/auth/reset-password` | Validate reset token |
| POST | `/api/auth/reset-password` | Set new password |
| GET | `/api/conversations` | List inbox conversations |
| GET | `/api/conversations/[id]` | Thread + customer details |
| POST | `/api/conversations/[id]/messages` | Send operator message |
| GET | `/api/conversations/[id]/messages?after=` | Poll new messages |
| GET | `/api/visitors` | Live visitors + stats |
| GET | `/api/contacts` | Contacts list + total |
| GET | `/api/campaigns` | Campaigns list + template counts |
| GET | `/api/helpdesk` | Articles/categories + plan gate |
| GET | `/api/analytics` | KPIs + plan gate |
| GET | `/api/plugins` | Plugin catalog + install state |
| PATCH | `/api/plugins/[id]` | Install/uninstall plugin |
| GET | `/api/settings/[...slug]` | Settings toggles for page |
| PATCH | `/api/settings/[...slug]` | Persist toggle value |
| GET | `/api/inbox/stream` | Inbox SSE realtime |
| GET | `/api/search` | Unified global search |

## U15 — Postgres production

| Feature | Status |
|---------|--------|
| `DATABASE_URL` postgres dialect | **done** |
| `schema.pg.ts` + `db:push:pg` | **done** |
| Async unified `getDb()` | **done** |
| libSQL for local SQLite file | **done** |

## U16 — Inbox SSE stream

| Feature | Status |
|---------|--------|
| `GET /api/inbox/stream` | **done** |
| Push on message send | **done** |
| Single stream in `useInboxApp` | **done** |
| Polling fallback when disconnected | **done** |

## U17 — Session wiring

| Feature | Status |
|---------|--------|
| `SessionProvider` + `useSession` | **done** |
| Sidebar user/workspace from API | **done** |
| Logout action | **done** |
| Remember me (7d / 30d) | **done** |

## U18 — API smoke tests

| Feature | Status |
|---------|--------|
| `scripts/smoke-api-tests.mjs` | **done** |
| Runs after HTML smoke in CI | **done** |
| `npm run db:seed` in CI before smoke | **done** |
| `npm run smoke:api` standalone | **done** |

## U19 — SSE stream smoke

| Feature | Status |
|---------|--------|
| Stream 401 without session | **done** |
| `connected` + `conversations` events | **done** |
| Push `messages` on send (in-process bus) | **done** |
| Covered in `smoke-api-tests.mjs` | **done** |

## U20 — Account menu

| Feature | Status |
|---------|--------|
| Footer popover menu | **done** |
| Account settings deep links | **done** |
| Logout from menu | **done** |

## U21 — Operator presence

| Feature | Status |
|---------|--------|
| `users.presence_status` column | **done** |
| `PATCH /api/auth/presence` | **done** |
| Session returns `user.presence` | **done** |
| Account menu Online/Offline toggle | **done** |
| Avatar dot reflects presence | **done** |

## U22 — Workspace switcher

| Feature | Status |
|---------|--------|
| JWT active workspace (`wid`) | **done** |
| `POST /api/auth/workspace` | **done** |
| Second seeded workspace | **done** |
| Sidebar workspace menu | **done** |

## U23 — Redis inbox pub/sub

| Feature | Status |
|---------|--------|
| `REDIS_URL` optional fan-out | **done** |
| In-memory fallback (CI/local) | **done** |
| Per-instance origin dedupe | **done** |

## U24 — Availability presence sync

| Feature | Status |
|---------|--------|
| Force offline ↔ `presence_status` | **done** |
| Settings GET returns `presence` | **done** |
| Live banner Online/Offline | **done** |

## U25 — Create workspace

| Feature | Status |
|---------|--------|
| `POST /api/workspaces` | **done** |
| Sidebar create form | **done** |
| Auto-switch after create | **done** |

## U26 — Account profile

| Feature | Status |
|---------|--------|
| `users.first_name`, `last_name`, `phone` | **done** |
| `GET/PATCH /api/auth/profile` | **done** |
| Account information editable fields | **done** |
| Session refresh after profile save | **done** |

## U27 — Auto-available presence

| Feature | Status |
|---------|--------|
| `users.force_offline`, `auto_available` | **done** |
| Force offline independent of manual presence | **done** |
| `POST /api/auth/activity` | **done** |
| Client activity tracker | **done** |

## U28 — Workspace information

| Feature | Status |
|---------|--------|
| Workspace contact columns | **done** |
| `GET/PATCH /api/workspaces/profile` | **done** |
| `POST/DELETE /api/workspaces/logo` | **done** |
| Settings page editable fields + logo | **done** |

## U29 — Availability schedule

| Feature | Status |
|---------|--------|
| `users.schedule_*` columns | **done** |
| `GET/PATCH /api/auth/availability-schedule` | **done** |
| Schedule toggle + editable days/hours | **done** |
| Auto-available respects schedule | **done** |

## U30 — Change password

| Feature | Status |
|---------|--------|
| `POST /api/auth/change-password` | **done** |
| Change password modal on account information | **done** |
| Wrong current password rejected | **done** |
| Smoke restores seed password | **done** |

## U31 — Account avatar

| Feature | Status |
|---------|--------|
| `users.avatar_url` column | **done** |
| `POST/DELETE /api/auth/avatar` | **done** |
| Account information upload + clear | **done** |
| Sidebar account menu shows avatar | **done** |

## U32 — Email verification

| Feature | Status |
|---------|--------|
| `users.email_verified` column | **done** |
| `POST /api/auth/verify-email/request` | **done** |
| `GET/POST /api/auth/verify-email` | **done** |
| Verify page `/initiate/verify-email` | **done** |
| Account information alert + nav badge | **done** |
| Email change resets verified flag | **done** |
| Google OAuth marks email verified | **done** |

## U33 — Account notifications

| Feature | Status |
|---------|--------|
| `user_settings` table | **done** |
| Per-user toggle storage for `account/notifications` | **done** |
| Persists across workspace switch | **done** |
| Nine notification toggles wired | **done** |

## U34 — Account security sessions

| Feature | Status |
|---------|--------|
| `user_sessions` table | **done** |
| Session id (`sid`) in JWT | **done** |
| `GET/DELETE /api/auth/sessions` | **done** |
| Login/logout creates/revokes sessions | **done** |
| Security settings tables wired | **done** |
| Close session revokes remote login | **done** |

## U35 — Account interface preferences

| Feature | Status |
|---------|--------|
| Per-user language + appearance in `user_settings` | **done** |
| `GET/PATCH /api/settings/account/interface` | **done** |
| Interface settings selects wired | **done** |
| Persists across workspace switch | **done** |
| `html` lang + dark class applied on login | **done** |

## U36 — Account keyboard shortcuts

| Feature | Status |
|---------|--------|
| Per-user shortcut toggles in `user_settings` | **done** |
| `GET/PATCH /api/settings/account/shortcuts` | **done** |
| Three shortcut toggles wired | **done** |
| Persists across workspace switch | **done** |
| Ctrl+F / Ctrl+P gated by preferences | **done** |

## U37 — Inbox message shortcuts

| Feature | Status |
|---------|--------|
| `message_shortcuts` table | **done** |
| `GET/POST /api/message-shortcuts` | **done** |
| `PATCH/DELETE /api/message-shortcuts/[id]` | **done** |
| Settings page create/list/delete wired | **done** |
| Inbox `!bang` expansion on send | **done** |
| Workspace-scoped isolation | **done** |

## U38 — Inbox customize settings

| Feature | Status |
|---------|--------|
| Workspace toggles for `inbox/customize` | **done** |
| Email preview field in `workspace_settings` | **done** |
| Settings select wired | **done** |
| `InboxCustomizeProvider` applies preferences | **done** |
| Per-workspace isolation on switch | **done** |
| Send confirm + list channel column | **done** |

## U39 — Inbox automatic triage

| Feature | Status |
|---------|--------|
| `triage_rules` table | **done** |
| `GET/POST /api/triage-rules` | **done** |
| `PATCH/DELETE /api/triage-rules/[id]` | **done** |
| Block + sort rulesets wired on settings page | **done** |
| Search and action filter | **done** |
| Per-workspace isolation | **done** |

## U40 — Inbox sub-inboxes

| Feature | Status |
|---------|--------|
| `sub_inboxes` table | **done** |
| `GET/POST /api/sub-inboxes` | **done** |
| `PATCH/DELETE /api/sub-inboxes/[id]` | **done** |
| Settings list + add button wired | **done** |
| Enable toggle + delete on list rows | **done** |
| Per-workspace isolation | **done** |

## U41 — Inbox operator routing

| Feature | Status |
|---------|--------|
| Workspace toggles for `inbox/routing` | **done** |
| Dependent re-run toggles disabled when rules off | **done** |
| `routing_rules` table | **done** |
| `GET/POST /api/routing-rules` | **done** |
| `PATCH/DELETE /api/routing-rules/[id]` | **done** |
| Settings list + add button wired | **done** |
| Per-workspace isolation | **done** |

## U42 — Chatbox appearance settings

| Feature | Status |
|---------|--------|
| Seven appearance select fields in `workspace_settings` | **done** |
| `GET/PATCH /api/settings/chatbox/appearance` fields | **done** |
| Chatbox button toggles persist | **done** |
| Settings selects wired on page | **done** |
| Per-workspace isolation | **done** |

## U43 — Chatbox behavior settings

| Feature | Status |
|---------|--------|
| Default section + KB navigation fields | **done** |
| `GET/PATCH /api/settings/chatbox/behavior` fields | **done** |
| Behavior section toggles persist | **done** |
| Settings selects wired on page | **done** |
| Per-workspace isolation | **done** |

## U44 — Chatbox Search AI

| Feature | Status |
|---------|--------|
| Overlay plugin catalog entry | **done** |
| Search AI toggles gated on overlay install | **done** |
| `defaultLanguage` field in `workspace_settings` | **done** |
| `search_ai_frequent_searches` table | **done** |
| `GET/POST /api/search-ai/frequent-searches` | **done** |
| `PATCH/DELETE /api/search-ai/frequent-searches/[id]` | **done** |
| FrequentSearchesPanel wired | **done** |
| Per-workspace isolation | **done** |

## U45 — Chatbox security settings

| Feature | Status |
|---------|--------|
| Domain lock toggle in `workspace_settings` | **done** |
| `GET/PATCH /api/settings/chatbox/security` | **done** |
| Privacy status rows (static UI) | **done** |
| Per-workspace isolation | **done** |

## U46 — Chatbox restrictions settings

| Feature | Status |
|---------|--------|
| Vacation toggle in `workspace_settings` | **done** |
| `chatbox_restrictions` table | **done** |
| `GET/POST /api/chatbox/restrictions` | **done** |
| `DELETE /api/chatbox/restrictions/[id]` | **done** |
| `POST /api/chatbox/restrictions/clear-blocked-visitors` | **done** |
| Blocked pages table + add buttons wired | **done** |
| Seed cart + checkout blocked pages | **done** |
| Per-workspace isolation | **done** |

## U47 — Chatbox push notifications

| Feature | Status |
|---------|--------|
| Android FCM toggle in `workspace_settings` | **done** |
| iOS APNs toggle in `workspace_settings` | **done** |
| `GET/PATCH /api/settings/chatbox/push` | **done** |
| Disabled section badges (static UI) | **done** |
| Per-workspace isolation | **done** |

## U48 — Email behavior settings

| Feature | Status |
|---------|--------|
| Four behavior toggles in `workspace_settings` | **done** |
| `GET/PATCH /api/settings/email/behavior` | **done** |
| Custom signature section badge (static UI) | **done** |
| Per-workspace isolation | **done** |

## U49 — Email domain settings

| Feature | Status |
|---------|--------|
| `basicDomain` + `customDomain` in `workspace_settings` | **done** |
| `GET/PATCH /api/settings/email/domain` fields | **done** |
| Basic suffix + custom domain inputs wired | **done** |
| Domain slug validation | **done** |
| Setup status rows (static UI) | **done** |
| Per-workspace isolation | **done** |

## U50 — Email delivery settings

| Feature | Status |
|---------|--------|
| Custom SMTP toggle in `workspace_settings` | **done** |
| `GET/PATCH /api/settings/email/delivery` | **done** |
| Outbound IP status panel (static UI) | **done** |
| Custom SMTP inactive badge (static UI) | **done** |
| Per-workspace isolation | **done** |

## U51 — Billing plans

| Feature | Status |
|---------|--------|
| `workspace_subscriptions` table per workspace | **done** |
| `payment_methods` table (user-scoped) | **done** |
| `GET /api/billing/plans` | **done** |
| Plan cards + monthly total banner from DB | **done** |
| Free plan seeded for member workspaces | **done** |
| New workspaces auto-get subscription row | **done** |

## U52 — Billing cards

| Feature | Status |
|---------|--------|
| `GET/POST /api/billing/cards` (user-scoped) | **done** |
| `DELETE /api/billing/cards/[id]` | **done** |
| Mock add-card flow (defaults to Visa ·4242) | **done** |
| Cards list + add/remove on `/settings/billing/cards` | **done** |
| Empty-state alert hidden when cards exist | **done** |
| `hasPaymentMethod` on plans API reflects cards | **done** |

## U53 — Billing invoices

| Feature | Status |
|---------|--------|
| `billing_invoices` table (user-scoped) | **done** |
| `GET/POST /api/billing/invoices` | **done** |
| `DELETE /api/billing/invoices/[id]` | **done** |
| Invoice list + empty state on `/settings/billing/invoices` | **done** |
| Populated invoice table (date, number, amount, status) | **done** |

## U54 — Workspace integrations

| Feature | Status |
|---------|--------|
| `GET /api/workspaces/integrations` | **done** |
| Website ID from active workspace | **done** |
| Integration catalog served from shared lib | **done** |
| Per-workspace isolation on switch | **done** |

## U55 — Workspace operators

| Feature | Status |
|---------|--------|
| `GET/POST /api/workspaces/operators` | **done** |
| `DELETE /api/workspaces/operators/[userId]` | **done** |
| Operators list from `workspace_members` + `users` | **done** |
| Options toggles via settings API | **done** |
| Support status banner from operator presence | **done** |
| Invite by email + remove (owner protected) | **done** |
| Per-workspace isolation on switch | **done** |

## U56 — Workspace billing

| Feature | Status |
|---------|--------|
| `GET/PATCH /api/workspaces/billing` | **done** |
| Per-workspace `paymentMethodId` in `workspace_settings` | **done** |
| User cards list + selected card on `/settings/workspace/billing` | **done** |
| Add card + auto-select for workspace | **done** |
| Per-workspace isolation on switch | **done** |

## U57 — Workspace transparency log

| Feature | Status |
|---------|--------|
| `GET /api/workspaces/transparency` | **done** |
| `workspace_audit_logs` table + seed | **done** |
| Collect logs toggle via settings API | **done** |
| Audit filters (operator + action) | **done** |
| Audit log table wired from API | **done** |
| Per-workspace isolation on switch | **done** |

## U58 — Workspace advanced configuration

| Feature | Status |
|---------|--------|
| `GET/POST /api/workspaces/api-tokens` | **done** |
| `DELETE /api/workspaces/api-tokens/[id]` | **done** |
| `GET/POST /api/workspaces/webhooks` | **done** |
| `PATCH/DELETE /api/workspaces/webhooks/[id]` | **done** |
| Default language field via settings API | **done** |
| Identity verification toggle via settings API | **done** |
| Dynamic webhook count + identity badges | **done** |
| Per-workspace isolation on switch | **done** |

## U59 — Workspace data, limits & legal

| Feature | Status |
|---------|--------|
| `GET /api/workspaces/data` | **done** |
| `POST /api/workspaces/data/training` | **done** |
| `PATCH /api/workspaces/data/limits` | **done** |
| `POST /api/workspaces/data/contract` | **done** |
| MagicReply training + disclaimer state | **done** |
| Usage limits with live operator count | **done** |
| GDPR contract signed state | **done** |
| Per-workspace isolation on switch | **done** |

## U60 — Workspace danger zone

| Feature | Status |
|---------|--------|
| `GET /api/workspaces/danger` | **done** |
| `POST /api/workspaces/leave` | **done** |
| `DELETE /api/workspaces` | **done** |
| Eligibility rules (sole owner, last workspace) | **done** |
| Cascade delete workspace data | **done** |
| Session switch after leave/delete | **done** |
| Danger zone UI wiring | **done** |

## U61 — Conversation status

| Feature | Status |
|---------|--------|
| `PATCH /api/conversations/[id]` | **done** |
| Status validation (pending/resolved/unassigned) | **done** |
| Inbox list SSE refresh on status change | **done** |
| Thread header status dropdown wired | **done** |
| List card pending highlight follows status | **done** |

## U62 — Inbox internal notes

| Feature | Status |
|---------|--------|
| `POST /api/conversations/[id]/notes` | **done** |
| Note messages stored as `from: "note"` | **done** |
| Conversation preview `Note: …` prefix | **done** |
| Note composer tab wired | **done** |
| Yellow internal note bubbles in thread | **done** |
| Hide note preview via inbox customize toggle | **done** |

## U63 — Conversation read/unread

| Feature | Status |
|---------|--------|
| `PATCH /api/conversations/[id]` unread field | **done** |
| Unread validation (0–999) | **done** |
| Auto mark read when opening thread | **done** |
| Unread badge + list highlight | **done** |
| Inbox SSE refresh on unread change | **done** |

## U64 — Mark conversation unread

| Feature | Status |
|---------|--------|
| List checkbox toggles unread/read | **done** |
| `toggleUnread` / `markAsUnread` hooks | **done** |
| Auto-read only when selecting a thread | **done** |
| Combined status + unread PATCH | **done** |

## U65 — Customer email

| Feature | Status |
|---------|--------|
| `conversations.customer_email` column | **done** |
| `PATCH /api/conversations/[id]` customerEmail | **done** |
| Email validation + clear via null | **done** |
| Customer info panel inline editor | **done** |
| Seed email on conversation c7 | **done** |

## U66 — Simulated visitor messages

| Feature | Status |
|---------|--------|
| Shared `insertConversationMessage` helper | **done** |
| `POST /api/conversations/[id]/visitor-messages` | **done** |
| Visitor message increments unread | **done** |
| Resolved → pending on new visitor message | **done** |
| Inbox SSE fan-out | **done** |
| `simulateVisitorMessage` hook | **done** |
| Auto-read when visitor message on open thread | **done** |

## U67 — Conversation operator assignment

| Feature | Status |
|---------|--------|
| `conversations.assigned_operator_id` column | **done** |
| `PATCH /api/conversations/[id]` assignedOperatorId | **done** |
| Workspace membership validation | **done** |
| Assignee on list/detail responses | **done** |
| Inbox SSE refresh on assignment | **done** |
| `updateAssignedOperator` hook | **done** |
| Thread header assignee label | **done** |
| Seed assignee on conversation c1 | **done** |

## U68 — Visitor data KV

| Feature | Status |
|---------|--------|
| `conversation_visitor_data` table | **done** |
| `PUT /api/conversations/[id]/visitor-data` upsert | **done** |
| `DELETE /api/conversations/[id]/visitor-data` | **done** |
| `details.visitorData` on GET thread | **done** |
| Key/value validation | **done** |
| Info panel save/list/remove UI | **done** |
| Seed `order_id` on conversation c7 | **done** |

## U69 — Conversation segments

| Feature | Status |
|---------|--------|
| `conversation_segments` table | **done** |
| `POST /api/conversations/[id]/segments` | **done** |
| `DELETE /api/conversations/[id]/segments` | **done** |
| `details.segments` on GET thread | **done** |
| `conversation.segments` on list API | **done** |
| Info panel add/remove UI | **done** |
| List segment pills via customize toggle | **done** |
| Seed `refund` on conversation c7 | **done** |

## U70 — Auto-assign on operator reply

| Feature | Status |
|---------|--------|
| Reads `inbox/routing::0-0` workspace toggle | **done** |
| Auto-assign on operator `POST …/messages` | **done** |
| Skips when assignee already set | **done** |
| Skips when toggle disabled | **done** |
| Inbox SSE list refresh includes assignee | **done** |

## U71 — Assignee picker UI

| Feature | Status |
|---------|--------|
| `AssigneePicker` in thread header | **done** |
| Operators dropdown + unassign | **done** |
| `savingAssignment` loading state | **done** |
| List footer session avatar gradient | **done** |
| Smoke: session + operators picker fields | **done** |

## U72 — Note author

| Feature | Status |
|---------|--------|
| `messages.author_user_id` column | **done** |
| Author set on `POST …/notes` | **done** |
| Author join on thread/poll/SSE fetches | **done** |
| `message.author { id, name }` on notes | **done** |
| Thread note label shows author name | **done** |

## U73 — List card assignee avatar

| Feature | Status |
|---------|--------|
| **Show assignee** customize toggle (`1-6`) | **done** |
| `showAssignee` in inbox customize preferences | **done** |
| Assignee badge on list card when enabled | **done** |
| Smoke: toggle + list assignee on c1 | **done** |

## U74 — Simulate visitor message UI

| Feature | Status |
|---------|--------|
| **Simulate visitor** section in info panel | **done** |
| `onSimulateVisitorMessage` wired through `InboxApp` | **done** |
| `simulatingVisitor` loading state | **done** |
| Smoke: stacked visitor unread + preview | **done** |

## U75 — Note author avatar

| Feature | Status |
|---------|--------|
| `author.avatarGradient` on note messages | **done** |
| Note header avatar in thread | **done** |
| Smoke: author gradient matches session | **done** |

## U76 — List assignee name label

| Feature | Status |
|---------|--------|
| Assignee name on list card when **Show assignee** on | **done** |
| Smoke: assignee name matches session on list/detail | **done** |

## U77 — Delete notes

| Feature | Status |
|---------|--------|
| `DELETE …/notes/[messageId]` | **done** |
| Preview resync after delete | **done** |
| `deleteNote` hook + trash on note bubble | **done** |
| Smoke: delete + reject non-note + 404 | **done** |

## U78 — Edit notes

| Feature | Status |
|---------|--------|
| `PATCH …/notes/[messageId]` | **done** |
| Preview update when latest note edited | **done** |
| Inline edit UI (`NoteMessageBubble`) | **done** |
| `updateNote` hook + list refresh | **done** |
| Smoke: edit + empty + non-note reject | **done** |

## U79 — Triage runtime on visitor messages

| Feature | Status |
|---------|--------|
| Block triage before visitor message insert | **done** |
| Drop Message / Send to Spam | **done** |
| Sort: segment, visitor data, resolve | **done** |
| `triage` payload on visitor POST | **done** |
| Smoke: drop, segment, resolve | **done** |

## U80 — Author-only note edit/delete

| Feature | Status |
|---------|--------|
| `not_author` on PATCH/DELETE notes | **done** |
| `403` for non-author operators | **done** |
| UI hides edit/delete for others' notes | **done** |
| Seed `team@fashionpara.com` operator | **done** |
| Smoke: non-author 403 + author allowed | **done** |

## U81 — Triage spam + Set Data Value

| Feature | Status |
|---------|--------|
| Send to Spam: message kept + `spam` segment | **done** |
| Set Data Value: visitor data from message | **done** |
| Smoke: spam block + data sort rules | **done** |

## U82 — Bulk assignment from list selection

| Feature | Status |
|---------|--------|
| `PATCH /api/conversations/bulk-assign` | **done** |
| Batch assign / unassign with validation | **done** |
| Ctrl/Cmd-click list selection | **done** |
| Footer bulk assign picker | **done** |
| Smoke: assign, clear, invalid, missing | **done** |

## U83 — Reminder tab wiring

| Feature | Status |
|---------|--------|
| `conversation_reminders` table | **done** |
| POST/GET/DELETE reminder routes | **done** |
| Reminder composer tab + presets | **done** |
| Thread reminder bubble + cancel | **done** |
| Smoke: create, list, cancel, past reject | **done** |

## U84 — Snooze until reminder due

| Feature | Status |
|---------|--------|
| Hide snoozed conversations from default list | **done** |
| `snoozedUntil` on conversation payload | **done** |
| `?includeSnoozed=1` query param | **done** |
| SSE list respects snooze filter | **done** |
| Smoke: hide, include, restore | **done** |

## U85 — Seeded triage rules smoke

| Feature | Status |
|---------|--------|
| Seeded `noreply` → Send to Spam | **done** |
| Seeded `vip` → Assign Segment | **done** |
| Smoke on conversation `c2` | **done** |

## U86 — Show snoozed conversations UI

| Feature | Status |
|---------|--------|
| Inbox customize toggle `Show snoozed conversations` (`1-7`) | **done** |
| List fetch uses `?includeSnoozed=1` when enabled | **done** |
| SSE stream respects `includeSnoozed` | **done** |
| Snoozed badge on list cards | **done** |
| SSE merge keeps snoozed rows when publish omits them | **done** |
| Smoke: customize toggle + includeSnoozed pairing | **done** |

## U87 — Checkbox bulk list selection

| Feature | Status |
|---------|--------|
| Select mode header + Cancel / Select all | **done** |
| Per-row bulk checkboxes (separate from unread) | **done** |
| Row click toggles selection in select mode | **done** |
| Ctrl/Cmd-click still toggles bulk select | **done** |
| Smoke: bulk-assign dedupes duplicate ids | **done** |

## U88 — Reminder due processing

| Feature | Status |
|---------|--------|
| `fulfilledAt` on `conversation_reminders` | **done** |
| `processDueRemindersForWorkspace` | **done** |
| Auto-run on list fetch + SSE poll | **done** |
| `POST /api/inbox/process-due-reminders` | **done** |
| Unsnooze + unread bump + reopen resolved | **done** |
| SSE publish on due processing | **done** |
| Smoke: asOf processing + idempotency | **done** |

## U89 — Public visitor chatbox ingest

| Feature | Status |
|---------|--------|
| `visitor_chat_sessions` table | **done** |
| `GET /api/chatbox/config` | **done** |
| `POST /api/chatbox/sessions` create/resume | **done** |
| `POST/GET …/sessions/[id]/messages` | **done** |
| Shared `ingestVisitorMessage` + triage | **done** |
| Blocked visitor check | **done** |
| Public `/widget` page + `VisitorChatWidget` | **done** |
| Smoke: unauthenticated ingest + operator inbox | **done** |

## U90 — Chatbox widget SSE

| Feature | Status |
|---------|--------|
| `GET /api/chatbox/sessions/[id]/stream` | **done** |
| Operator replies push over public SSE | **done** |
| Notes/reminders filtered from widget stream | **done** |
| `useChatboxStream` + poll fallback when disconnected | **done** |
| Smoke: operator reply via SSE | **done** |

## U91 — Chatbox embed script

| Feature | Status |
|---------|--------|
| `GET /api/chatbox/embed` (public + authenticated) | **done** |
| Copy-paste HTML snippet with `BYBELT_CHAT` config | **done** |
| Public `/embed.js` iframe bubble loader | **done** |
| `/widget?embed=1` iframe-friendly layout | **done** |
| Smoke: embed API + loader script | **done** |

## U92 — Chatbox typing indicators

| Feature | Status |
|---------|--------|
| `typing` SSE event on inbox + chatbox streams | **done** |
| `POST /api/conversations/[id]/typing` | **done** |
| `POST /api/chatbox/sessions/[id]/typing` | **done** |
| Operator typing visible in widget | **done** |
| Visitor typing visible in inbox thread | **done** |
| Typing cleared on message send | **done** |
| Smoke: bidirectional typing over SSE | **done** |

## U93 — Message delivery & read receipts

| Feature | Status |
|---------|--------|
| `delivered_at` / `read_at` on messages | **done** |
| Visitor messages auto-delivered on ingest | **done** |
| `POST …/messages/[id]/receipt` (widget + inbox) | **done** |
| Visitor messages marked read when unread cleared | **done** |
| `receipt` SSE event | **done** |
| Checkmark UI in inbox + Read label in widget | **done** |
| Smoke: operator read + visitor read receipts | **done** |

## U94 — Visitor message attachments

| Feature | Status |
|---------|--------|
| Attachment columns on `messages` | **done** |
| Multipart `POST …/sessions/[id]/messages` | **done** |
| Files stored via `GET /api/chatbox/files/…` | **done** |
| Widget paperclip upload + inbox preview | **done** |
| Smoke: upload + operator inbox visibility | **done** |

## U95 — Settings embed install snippet

| Feature | Status |
|---------|--------|
| `htmlSnippet` on `GET /api/workspaces/integrations` | **done** |
| Website ID + Install code copy fields | **done** |
| Multiline snippet copy UI | **done** |
| Smoke: snippet matches `/api/chatbox/embed` | **done** |

## U96 — Operator outbound attachments

| Feature | Status |
|---------|--------|
| Multipart `POST /api/conversations/[id]/messages` | **done** |
| Shared file storage via `/api/chatbox/files/…` | **done** |
| Inbox paperclip upload + bubble preview | **done** |
| Widget shows operator attachments | **done** |
| Smoke: operator attachment upload | **done** |

## U97 — Chatbox allow files toggle

| Feature | Status |
|---------|--------|
| `isChatboxFilesAllowed()` reads `chatbox/behavior::2-0` | **done** |
| Visitor upload rejected when toggle off (403) | **done** |
| `allowFiles` on `GET /api/chatbox/config` | **done** |
| Widget paperclip hidden when disabled | **done** |
| Smoke: disable toggle + blocked upload | **done** |

## U98 — Chatbox audio recordings

| Feature | Status |
|---------|--------|
| Audio mime types on upload helper | **done** |
| `allowAudio` enforced separately from files | **done** |
| Widget mic button + `<audio>` preview | **done** |
| Smoke: audio upload + toggle block | **done** |

## U99 — Attachment size limits

| Feature | Status |
|---------|--------|
| `chatbox/attachments::maxBytes` workspace setting | **done** |
| `GET/PATCH /api/settings/chatbox/attachments` | **done** |
| `maxAttachmentBytes` on chatbox config | **done** |
| Smoke: oversized upload rejected | **done** |

## U100 — Inbox sidebar counts

| Feature | Status |
|---------|--------|
| `GET /api/inbox/counts` | **done** |
| `useInboxCounts` hook | **done** |
| Main Inbox + notification badges from API | **done** |
| Smoke: counts payload | **done** |

## U101 — Live visitor ping

| Feature | Status |
|---------|--------|
| `POST /api/chatbox/sessions/[id]/ping` | **done** |
| Upsert visitor row from chat session | **done** |
| Widget periodic presence ping | **done** |
| Smoke: ping + visitors list | **done** |

## U102 — Webhook delivery

| Feature | Status |
|---------|--------|
| `deliverWorkspaceWebhooks()` on operator/visitor messages | **done** |
| POST JSON to enabled webhook URLs | **done** |
| Smoke: local receiver gets `message:operator` | **done** |

## U103 — Outbound email transport

| Feature | Status |
|---------|--------|
| `sendEmail()` with log + Resend transports | **done** |
| Forgot-password dispatches email | **done** |
| Verify-email request dispatches email | **done** |
| `emailDispatched` in API responses | **done** |
| Smoke: forgot + verify dispatch | **done** |

## U104 — Analytics chart series

| Feature | Status |
|---------|--------|
| 7-day `conversationChart` from visitor sessions | **done** |
| Real `periodLabel` / `periodStart` / `periodEnd` | **done** |
| Smoke: chart array length 7 | **done** |

## U105 — Chatbox ask email

| Feature | Status |
|---------|--------|
| `askEmail` on `/api/chatbox/config` | **done** |
| Reads `chatbox/behavior::1-0` toggle | **done** |
| Widget email field when enabled | **done** |
| Smoke: default `askEmail: true` | **done** |

## U106 — Create campaign

| Feature | Status |
|---------|--------|
| `POST /api/campaigns` | **done** |
| Smoke: create + list | **done** |

## U107 — Create helpdesk article

| Feature | Status |
|---------|--------|
| `POST /api/helpdesk` | **done** |
| Smoke: create + list | **done** |

## U108 — Chatbox ask phone

| Feature | Status |
|---------|--------|
| `phone` on visitor chat sessions | **done** |
| `askPhone` on chatbox config | **done** |
| Messages accept `phone` field | **done** |
| Widget phone field | **done** |
| Smoke: phone on message | **done** |

## U109 — Force visitor identify

| Feature | Status |
|---------|--------|
| `forceIdentify` on chatbox config | **done** |
| 403 when unidentified visitor sends | **done** |
| Smoke: block then allow with email | **done** |

## U110 — Routing rules runtime

| Feature | Status |
|---------|--------|
| `applyRoutingRulesOnConversation()` on session create | **done** |
| Match `matchContains` on page URL | **done** |
| Assign online operator (round robin / team) | **done** |
| Smoke: pricing pageUrl assigns operator | **done** |

## U111 — Email signature

| Feature | Status |
|---------|--------|
| `GET/PATCH /api/settings/email/signature` | **done** |
| Signature appended in `sendEmail()` when enabled | **done** |
| Smoke: save + load | **done** |

## U112 — Public helpdesk

| Feature | Status |
|---------|--------|
| `GET /api/helpdesk/public?domain=` | **done** |
| Returns visible articles only (no auth) | **done** |
| Smoke: create visible + public list | **done** |

## U113–U132 — Batch summary

| Phase | Feature | Status |
|-------|---------|--------|
| U113 | `PATCH/DELETE /api/campaigns/[id]` | **done** |
| U114 | `PATCH/DELETE /api/helpdesk/[id]` + body | **done** |
| U115 | `POST/PATCH/DELETE /api/helpdesk/categories` | **done** |
| U116 | `POST/PATCH/DELETE /api/contacts` | **done** |
| U117 | Helpdesk `body` column + PATCH | **done** |
| U118 | `GET /api/helpdesk/public/[id]` + view bump | **done** |
| U119 | Blocked page enforcement on session create | **done** |
| U120 | Vacation mode hides chatbox (`chatboxVisible`) | **done** |
| U121 | `PATCH /api/chatbox/restrictions/[id]` | **done** |
| U122 | `PATCH /api/conversations/bulk-status` | **done** |
| U123 | `DELETE /api/conversations/[id]` cascade | **done** |
| U124 | `GET /api/conversations?subInboxId=` | **done** |
| U125 | `GET /api/conversations?segment=spam` + spam counts | **done** |
| U126 | `PATCH /api/chatbox/sessions/[id]` identity | **done** |
| U127 | Webhooks: note, status, assigned | **done** |
| U128 | Audit log append on operator invite | **done** |
| U129 | `POST …/sessions/[id]/rate` + KPI rating | **done** |
| U130 | `visitorChart` on analytics API | **done** |
| U131 | Search indexes campaigns + helpdesk | **done** |
| U132 | `PATCH /api/billing/plans` upgrade | **done** |

Smoke target: **130/130** checks.

## Notes

- SQLite file: `data/bybelt.db` (local dev; `DATABASE_URL=postgresql://...` for production)
- Smoke/CI sets `SMOKE_BYPASS_AUTH=1` so static route tests still pass
- In-memory bus is per Node process; set `REDIS_URL` for multi-instance SSE fan-out (U23).
