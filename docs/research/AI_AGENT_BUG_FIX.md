# AI Agent Chat Auto-Reply — Bug & Fix

## How AI agent works (chat channel)
1. Visitor message hits `POST /api/chatbox/sessions/[sessionId]/messages` (src/app/api/chatbox/sessions/[sessionId]/messages/route.ts:205).
2. Calls `maybeSendChatAiReply` (src/lib/chatbox/ai-auto-reply.ts).
3. That calls `processAiReply` (src/lib/ai/orchestrator.ts) → `generateChatAiReply` (src/lib/chatbox/ai-reply.ts) which hits OpenAI (falls back to template replies if `OPENAI_API_KEY` unset).
4. Reply passes through `runUnifiedAiDecision` (src/lib/ai/safety-pipeline.ts) → confidence score (src/lib/ai/confidence.ts) + safety gate (src/lib/ai/safety.ts) → AUTO_SEND / CREATE_DRAFT / HUMAN_REVIEW / BLOCK_REPLY.
5. AUTO_SEND inserts the reply as an operator message; anything else is held as an internal draft note.

Email/Instagram channel runs the same orchestrator + safety pipeline via `src/lib/email/ai-auto-responder.ts`.

## Bug found
`maybeSendChatAiReply` gated the whole chat auto-reply feature on the **wrong setting**:

```ts
if (!(await isSearchAiEnabled(db, workspaceId))) { return null; }
```

`isSearchAiEnabled` read the `chatbox/search-ai` toggle — an unrelated FAQ-search-widget feature (requires the "Overlay" plugin, default **off** — src/lib/settings-registry.ts:1258). It has nothing to do with the merchant's actual "AI Agent" toggle (`agent-config.ts` → `channels.chat.aiAgent`, default **on**).

The email/Instagram pipeline gates correctly on that same flag:
```ts
// src/lib/email/ai-auto-responder.ts:78
if (!opts.force && !cfg.channels[channelKey]?.aiAgent) { return { acted: "skipped", ... }; }
```

Net effect: chat AI auto-reply could never fire for any workspace (real gate defaulted off and was disconnected from the merchant's AI Agent settings page), while turning the merchant's chat AI Agent toggle on/off had zero effect on chat behavior.

## Fix
`src/lib/chatbox/ai-auto-reply.ts`:
- Removed `isSearchAiEnabled` and its now-unused imports (`workspaceSettings`, `toggleSettingKey`, `SEARCH_AI_ENABLE_TOGGLE_KEY`, drizzle `and`/`eq`).
- Fetch `cfg = getWorkspaceAgentConfig(db, workspaceId)` up front and gate on `cfg.channels.chat.aiAgent`, matching the email pipeline's pattern exactly.

Verified: no remaining references to `isSearchAiEnabled`, `tsc --noEmit` clean on the changed file.
