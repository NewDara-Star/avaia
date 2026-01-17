-- Migration 002: Add session notes for natural language session summaries
-- Enables continuity between sessions by capturing nuanced context

ALTER TABLE session ADD COLUMN session_notes TEXT;
