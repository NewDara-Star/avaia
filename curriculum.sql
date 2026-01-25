-- ============================================================================
-- AVAIA DATABASE SCHEMA V2.0
-- ============================================================================
-- Date: January 24, 2026
-- Architecture: Hybrid (Global curriculum.db + Per-profile progress.db)
-- 
-- TWO DATABASES:
-- 1. curriculum.db (GLOBAL - shared, read-only)
-- 2. progress.db (PER-PROFILE - isolated, read-write)
-- ============================================================================

-- ============================================================================
-- DATABASE 1: curriculum.db (GLOBAL)
-- ============================================================================
-- Location: ~/.avaia/curriculum.db
-- Updated: Remote fetch on app startup (if no active project)
-- Versioned: curriculum.json downloaded from GitHub
-- ============================================================================

-- METADATA
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO metadata (key, value) VALUES ('version', '2026-01-24T14:30:00Z');
INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', '2.0.0');

-- LEARNING TRACKS
CREATE TABLE IF NOT EXISTS learning_track (
  id TEXT PRIMARY KEY,                    -- 'js-web-v1'
  name TEXT NOT NULL,                     -- 'JavaScript/Web Development'
  description TEXT,
  difficulty TEXT DEFAULT 'beginner',     -- beginner, intermediate, advanced
  version TEXT NOT NULL,                  -- '1.0.0'
  deprecated BOOLEAN DEFAULT FALSE,
  deprecated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CONCEPTS (The knowledge units)
CREATE TABLE IF NOT EXISTS concept (
  id TEXT PRIMARY KEY,                    -- 'async-await'
  name TEXT NOT NULL,                     -- 'async/await'
  category TEXT,                          -- 'Async'
  cluster TEXT,                           -- For interleaving: 'async-patterns'
  complexity INTEGER DEFAULT 1 CHECK(complexity BETWEEN 1 AND 5),
  
  -- Prerequisites (concepts that must be learned first)
  prerequisites TEXT DEFAULT '[]',        -- JSON: ['promises', 'callbacks']
  
  -- Productive Failure
  sandbox_id TEXT,                        -- References sandbox.id (if concept needs PF)
  
  -- Multi-modal teaching
  decomposition_path TEXT DEFAULT '[]',  -- JSON: ['async-1', 'async-2', 'async-3']
  alternative_patterns TEXT DEFAULT '[]', -- JSON: ['promise-chains', 'callback-hell']
  
  -- Resources
  visualizations TEXT DEFAULT '[]',       -- JSON: [urls]
  
  FOREIGN KEY (sandbox_id) REFERENCES sandbox(id)
);

CREATE INDEX idx_concept_category ON concept(category);
CREATE INDEX idx_concept_cluster ON concept(cluster);

-- MISCONCEPTIONS (Common mistakes)
CREATE TABLE IF NOT EXISTS misconception (
  id TEXT PRIMARY KEY,                    -- 'async-001'
  concept_id TEXT NOT NULL,
  name TEXT NOT NULL,                     -- 'fetch returns data directly'
  description TEXT,
  trigger_answer TEXT,                    -- Which wrong answer reveals this
  remediation_strategy TEXT,
  contrasting_case TEXT,                  -- JSON: {case_a: {...}, case_b: {...}}
  
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

CREATE INDEX idx_misconception_concept ON misconception(concept_id);

-- DIAGNOSTIC QUESTIONS (Verification MCQs)
CREATE TABLE IF NOT EXISTS diagnostic_question (
  id TEXT PRIMARY KEY,                    -- 'diag-async-001'
  concept_id TEXT NOT NULL,
  code_snippet TEXT,
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  distractors TEXT NOT NULL,              -- JSON: [{answer, misconception_id}, ...]
  difficulty INTEGER DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 3),
  question_type TEXT NOT NULL DEFAULT 'application',
  
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

CREATE INDEX idx_diagnostic_concept ON diagnostic_question(concept_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_concept_type
  ON diagnostic_question(concept_id, question_type);

-- SANDBOXES (Productive Failure exercises)
CREATE TABLE IF NOT EXISTS sandbox (
  id TEXT PRIMARY KEY,                    -- 'sandbox-async-race'
  concept_id TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  setup_code TEXT,
  expected_failures TEXT NOT NULL,        -- JSON: [{pattern_id, recognition_criteria}, ...]
  min_attempts INTEGER DEFAULT 2,
  max_attempts INTEGER DEFAULT 5,
  reflection_questions TEXT NOT NULL,     -- JSON: [questions]
  teaching_transition TEXT,               -- Bridge from failure to teaching
  
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

CREATE INDEX idx_sandbox_concept ON sandbox(concept_id);

-- PROJECT TEMPLATES
CREATE TABLE IF NOT EXISTS project_template (
  id TEXT PRIMARY KEY,                    -- 'project-todo-app'
  track_id TEXT NOT NULL,
  name TEXT NOT NULL,                     -- 'Todo List App'
  description TEXT,
  difficulty TEXT DEFAULT 'beginner',
  estimated_hours INTEGER,
  sequence_order INTEGER,                 -- 1st project, 2nd project, etc.
  
  FOREIGN KEY (track_id) REFERENCES learning_track(id)
);

CREATE INDEX idx_project_track ON project_template(track_id);

-- MILESTONES (Project sub-goals)
CREATE TABLE IF NOT EXISTS milestone_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_template_id TEXT NOT NULL,
  name TEXT NOT NULL,                     -- 'Build add todo form'
  description TEXT,
  sequence_order INTEGER NOT NULL,
  estimated_minutes INTEGER,
  
  FOREIGN KEY (project_template_id) REFERENCES project_template(id)
);

CREATE INDEX idx_milestone_project ON milestone_template(project_template_id);

-- MILESTONE → CONCEPT MAPPING
CREATE TABLE IF NOT EXISTS milestone_concept (
  milestone_id INTEGER NOT NULL,
  concept_id TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,       -- Optional concepts can be skipped
  
  PRIMARY KEY (milestone_id, concept_id),
  FOREIGN KEY (milestone_id) REFERENCES milestone_template(id),
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

-- ============================================================================
