-- AVAIA ADR v2 migrations
-- Apply to the correct DB:
--   curriculum.db: concept, diagnostic_question
--   progress.db: project_file, review_defer_log

PRAGMA foreign_keys=ON;

-- =========================
-- Curriculum DB migrations
-- =========================

-- Soft deprecation support (never delete/reuse concept IDs)
ALTER TABLE concept ADD COLUMN deprecated_at DATETIME;

-- Layer 3 discrimination question sourcing
ALTER TABLE diagnostic_question
  ADD COLUMN question_type TEXT NOT NULL DEFAULT 'application';

CREATE INDEX IF NOT EXISTS idx_diagnostic_concept_type
  ON diagnostic_question(concept_id, question_type);

-- =========================
-- Progress DB migrations
-- =========================

-- WebContainer file persistence
CREATE TABLE IF NOT EXISTS project_file (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
  UNIQUE (project_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_project_file_project
  ON project_file(project_id);

-- Review defer logging (reviews cannot be skipped)
CREATE TABLE IF NOT EXISTS review_defer_log (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  deferred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_count INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'user_choice',
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_defer_profile_time
  ON review_defer_log(profile_id, deferred_at);
