CREATE TABLE IF NOT EXISTS ai_agent_log (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  conversation_id TEXT,
  message_id TEXT,
  category TEXT DEFAULT 'unknown' NOT NULL,
  sentiment TEXT DEFAULT 'neutral' NOT NULL,
  risk TEXT DEFAULT 'low' NOT NULL,
  is_spam INTEGER DEFAULT 0 NOT NULL,
  is_vip INTEGER DEFAULT 0 NOT NULL,
  confidence INTEGER DEFAULT 0 NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  model TEXT DEFAULT 'rules' NOT NULL,
  summary TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS conversation_ai (
  conversation_id TEXT PRIMARY KEY NOT NULL,
  summary TEXT,
  sentiment TEXT,
  category TEXT,
  confidence INTEGER,
  is_vip INTEGER DEFAULT 0 NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_review_queue (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  conversation_id TEXT,
  message_id TEXT,
  channel TEXT DEFAULT 'chat' NOT NULL,
  state TEXT DEFAULT 'pending_review' NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  confidence INTEGER DEFAULT 0 NOT NULL,
  confidence_level TEXT DEFAULT 'low' NOT NULL,
  draft_text TEXT,
  reviewer TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  resolved_at INTEGER
);
