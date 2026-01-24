-- AVAIA v3 Migration Notes
-- IMPORTANT:
-- 1) curriculum.db is REPLACE-ONLY. Do not run migrations against it at runtime.
-- 2) progress.db uses runtime migrations via TypeScript migration runner with:
--    - _migrations tracking
--    - BEGIN IMMEDIATE transactions
--    - PRAGMA guards for ALTER TABLE ADD COLUMN

CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  app_version TEXT
);

CREATE TABLE IF NOT EXISTS project_file (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  last_modified TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, file_path)
);
CREATE INDEX IF NOT EXISTS idx_project_file_project ON project_file(project_id);

CREATE TABLE IF NOT EXISTS review_defer_log (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  deferred_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_review_defer_profile ON review_defer_log(profile_id);

-- If upgrading from a build that created review_skip_log, do a guarded rename:
-- ALTER TABLE review_skip_log RENAME TO review_defer_log;


-- Guarded example columns (DO NOT run blindly without checking PRAGMA table_info)
-- Guarded required column (PRD: FEAT-021)
-- ALTER TABLE diagnostic_question ADD COLUMN question_type TEXT NOT NULL DEFAULT 'application' CHECK (question_type IN ('application','discrimination'));

-- ALTER TABLE session ADD COLUMN curriculum_version INTEGER;
-- ALTER TABLE concept_memory ADD COLUMN last_reviewed_at TEXT;