-- Migration 005: Learner Learning Style Profiles
-- Stores learner preferences for adaptive teaching

-- Add learning_preferences column to learner table
ALTER TABLE learner ADD COLUMN learning_preferences TEXT DEFAULT '{}';

-- The learning_preferences JSON structure:
-- {
--   "prefers_physical_analogies": true,       -- Use "act it out" before abstract
--   "prefers_direct_feedback": true,          -- Skip platitudes, be straight
--   "struggles_with_abstract_execution": true, -- Needs timelines/walkthroughs for async
--   "needs_emotional_context": true,          -- Frame concepts as narratives/stories
--   "tangent_prone": true,                    -- Needs redirection to verification
--   "prefers_visual_diagrams": false,         -- Use diagrams over code explanations
--   "detected_at": "2026-01-18T12:00:00Z"     -- When these were detected
-- }

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_learner_preferences 
  ON learner(id) WHERE learning_preferences != '{}';
