-- Migration 004: Chat History Storage
-- Stores complete conversation transcript for debugging, analysis, and continuity

CREATE TABLE IF NOT EXISTS chat_message (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  session_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls TEXT,  -- JSON array of MCP tool calls made (if role='assistant')
  tool_results TEXT,  -- JSON array of tool results received (if role='assistant')
  tokens_used INTEGER,  -- Optional: track token usage per message
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_message_session 
  ON chat_message(session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_chat_message_role
  ON chat_message(session_id, role);
