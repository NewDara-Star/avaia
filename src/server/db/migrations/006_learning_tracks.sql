-- Migration 006: Multi-Track Curriculum Architecture
-- Enables pre-seeded and dynamic learning tracks with project templates

-- =============================================================================
-- Learning Tracks (collections of projects for a learning path)
-- =============================================================================

CREATE TABLE IF NOT EXISTS learning_track (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,               -- "JavaScript Web Development"
  description TEXT,
  language TEXT,                    -- javascript, python, c, rust, etc.
  domain TEXT,                      -- web, data, systems, mobile, ai
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_preseeded BOOLEAN DEFAULT FALSE,
  created_by TEXT,                  -- 'system' for pre-seeded, learner_id for dynamic
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_track_preseeded
  ON learning_track(is_preseeded) WHERE is_preseeded = TRUE;

-- =============================================================================
-- Project Templates (blueprints for projects, not learner instances)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_template (
  id TEXT PRIMARY KEY,
  track_id TEXT,                    -- NULL = standalone project
  sequence_order INTEGER,           -- 1, 2, 3... within track
  name TEXT NOT NULL,
  description TEXT,
  estimated_hours INTEGER,
  milestones TEXT DEFAULT '[]',     -- JSON: [{id: 1, name: "Setup", description: "..."}]
  prerequisites TEXT DEFAULT '[]',  -- concept_ids required before starting this project
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES learning_track(id)
);

CREATE INDEX IF NOT EXISTS idx_project_template_track
  ON project_template(track_id, sequence_order);

-- =============================================================================
-- Milestone-Concept Mapping (which concepts each milestone teaches/requires)
-- =============================================================================

CREATE TABLE IF NOT EXISTS milestone_concept (
  project_template_id TEXT NOT NULL,
  milestone_number INTEGER NOT NULL,
  concept_id TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('introduces', 'requires', 'reinforces')),
  PRIMARY KEY (project_template_id, milestone_number, concept_id),
  FOREIGN KEY (project_template_id) REFERENCES project_template(id),
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

CREATE INDEX IF NOT EXISTS idx_milestone_concept_project
  ON milestone_concept(project_template_id);

CREATE INDEX IF NOT EXISTS idx_milestone_concept_concept
  ON milestone_concept(concept_id);

-- =============================================================================
-- Add track reference to learner (which track they're currently on)
-- Note: SQLite ignores ALTER TABLE errors if column already exists
-- =============================================================================

-- This will fail silently if column already exists (SQLite behavior in executescript)
ALTER TABLE learner ADD COLUMN current_track_id TEXT REFERENCES learning_track(id);

-- =============================================================================
-- Add template reference to project (which template this project was created from)
-- =============================================================================

-- This will fail silently if column already exists
ALTER TABLE project ADD COLUMN template_id TEXT REFERENCES project_template(id);

-- =============================================================================
-- Seed the default JavaScript Web Development track
-- (This ensures existing learners can be backfilled)
-- =============================================================================

INSERT OR IGNORE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
VALUES (
  'js-web',
  'JavaScript Web Development',
  'Learn to build interactive web applications from scratch. Progress from DOM manipulation to full-stack development through 5 real-world projects.',
  'javascript',
  'web',
  'beginner',
  TRUE,
  'system'
);

-- Seed the Memory Game project template
INSERT OR IGNORE INTO project_template (id, track_id, sequence_order, name, description, estimated_hours, milestones)
VALUES (
  'memory-game',
  'js-web',
  1,
  'Memory Game',
  'Build a classic memory matching game. Learn DOM manipulation, event handling, state management, and timing functions.',
  15,
  '[
    {"id": 1, "name": "HTML Structure", "description": "Create the grid of cards using HTML"},
    {"id": 2, "name": "CSS Styling", "description": "Style the cards and grid layout"},
    {"id": 3, "name": "Card Click Handler", "description": "Add click events to reveal cards"},
    {"id": 4, "name": "Matching Logic", "description": "Implement card matching with setTimeout"},
    {"id": 5, "name": "Game State", "description": "Track flipped cards, matches, and score"},
    {"id": 6, "name": "Shuffle & Reset", "description": "Add shuffle on start and reset functionality"}
  ]'
);

-- Seed milestone-concept mappings for Memory Game
INSERT OR IGNORE INTO milestone_concept (project_template_id, milestone_number, concept_id, relationship)
VALUES
  ('memory-game', 1, 'dom-manipulation', 'introduces'),
  ('memory-game', 3, 'events', 'introduces'),
  ('memory-game', 3, 'functions', 'introduces'),
  ('memory-game', 4, 'settimeout', 'introduces'),
  ('memory-game', 4, 'conditionals', 'introduces'),
  ('memory-game', 4, 'state-management', 'introduces'),
  ('memory-game', 5, 'arrays', 'introduces'),
  ('memory-game', 5, 'objects', 'introduces'),
  ('memory-game', 6, 'array-foreach', 'introduces');

-- =============================================================================
-- Backfill: Assign existing learners to js-web track
-- =============================================================================

UPDATE learner SET current_track_id = 'js-web' WHERE current_track_id IS NULL;

-- =============================================================================
-- Backfill: Link existing Memory Game projects to template
-- =============================================================================

UPDATE project SET template_id = 'memory-game' WHERE name = 'Memory Game' AND template_id IS NULL;
