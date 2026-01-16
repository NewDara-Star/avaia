-- Migration 001: Initial Schema
-- Avaia Cognitive AI Teacher Database

-- =============================================================================
-- Core Entities
-- =============================================================================

-- Learner profile
CREATE TABLE IF NOT EXISTS learner (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  preferred_teaching_method TEXT DEFAULT 'example_first',  -- example_first, concept_first, try_first
  best_session_times TEXT DEFAULT '[]',  -- JSON array
  onboarding_complete BOOLEAN DEFAULT FALSE
);

-- Project tracking
CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',  -- not_started, in_progress, completed
  current_milestone INTEGER DEFAULT 1,
  milestones_completed TEXT DEFAULT '[]',  -- JSON array
  time_spent_minutes INTEGER DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  FOREIGN KEY (learner_id) REFERENCES learner(id)
);

-- Concept definitions (static curriculum data)
CREATE TABLE IF NOT EXISTS concept (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  cluster TEXT,  -- For interleaving similar concepts
  prerequisites TEXT DEFAULT '[]',  -- JSON array of concept IDs
  sandbox_id TEXT,
  visualizations TEXT DEFAULT '[]'  -- JSON array of URLs
);

-- =============================================================================
-- Learning State (per learner per concept)
-- =============================================================================

CREATE TABLE IF NOT EXISTS learner_concept (
  learner_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  
  -- FSRS-5 Algorithm State
  stability REAL DEFAULT 0,
  difficulty REAL DEFAULT 5,
  scheduled_days INTEGER DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state TEXT DEFAULT 'new',  -- new, learning, review, relearning
  last_review_date DATETIME,
  next_review_date DATETIME,
  
  -- Mastery Tracking
  introduced_at DATETIME,
  verified BOOLEAN DEFAULT FALSE,
  verified_at DATETIME,
  contexts_applied TEXT DEFAULT '[]',  -- JSON array
  
  -- Performance Metrics
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  attempts_without_hints INTEGER DEFAULT 0,
  
  -- Scaffolding
  independence_score INTEGER DEFAULT 0,  -- 0-100
  
  -- Confidence Tracking
  confidence_history TEXT DEFAULT '[]',  -- JSON array
  
  -- Stubborn Bugs
  stubborn_misconceptions TEXT DEFAULT '[]',  -- JSON array
  
  PRIMARY KEY (learner_id, concept_id),
  FOREIGN KEY (learner_id) REFERENCES learner(id),
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

-- =============================================================================
-- Misconceptions Database
-- =============================================================================

CREATE TABLE IF NOT EXISTS misconception (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_answer TEXT,  -- Which wrong answer reveals this
  remediation_strategy TEXT,
  contrasting_case TEXT,  -- JSON with two code snippets
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

-- =============================================================================
-- Diagnostic Questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS diagnostic_question (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  code_snippet TEXT,
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  distractors TEXT NOT NULL,  -- JSON array of {answer, misconception_id}
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

-- =============================================================================
-- Sandbox (Productive Failure)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sandbox (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  setup_code TEXT,
  expected_failures TEXT NOT NULL,  -- JSON array of failure patterns
  min_attempts INTEGER DEFAULT 2,
  reflection_questions TEXT NOT NULL,  -- JSON array
  teaching_transition TEXT,
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

CREATE TABLE IF NOT EXISTS sandbox_attempt (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  sandbox_id TEXT NOT NULL,
  learner_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  code_submitted TEXT,
  approach_description TEXT,
  outcome TEXT,
  matched_failure_pattern TEXT,
  articulation_quality TEXT,  -- none, partial, complete
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sandbox_id) REFERENCES sandbox(id),
  FOREIGN KEY (learner_id) REFERENCES learner(id)
);

-- =============================================================================
-- Code Snippets (Token-Efficient SRS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS concept_instance (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  learner_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  milestone_id INTEGER NOT NULL,
  code_snippet TEXT NOT NULL,  -- Max ~500 chars
  snippet_context TEXT,  -- "Task Tracker, handleSubmit function"
  line_numbers TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learner_id) REFERENCES learner(id),
  FOREIGN KEY (concept_id) REFERENCES concept(id),
  FOREIGN KEY (project_id) REFERENCES project(id)
);

-- =============================================================================
-- Session Tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  project_id TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  
  -- Progress
  milestones_attempted TEXT DEFAULT '[]',
  milestones_completed TEXT DEFAULT '[]',
  concepts_introduced TEXT DEFAULT '[]',
  concepts_verified TEXT DEFAULT '[]',
  
  -- SRS
  srs_reviews_given INTEGER DEFAULT 0,
  srs_reviews_passed INTEGER DEFAULT 0,
  
  -- Emotional States
  emotional_states TEXT DEFAULT '[]',  -- JSON array
  
  -- Questions
  learner_questions TEXT DEFAULT '[]',  -- JSON array
  
  -- Exit Ticket
  exit_ticket_concept TEXT,
  exit_ticket_passed BOOLEAN,
  
  FOREIGN KEY (learner_id) REFERENCES learner(id),
  FOREIGN KEY (project_id) REFERENCES project(id)
);

-- Message timing for emotional state inference
CREATE TABLE IF NOT EXISTS message_timing (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  session_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  gap_since_previous_ms INTEGER,
  message_type TEXT NOT NULL,  -- user, assistant
  message_length INTEGER,
  contains_help_request BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (session_id) REFERENCES session(id)
);

-- Learner question patterns (aggregated)
CREATE TABLE IF NOT EXISTS learner_question_patterns (
  learner_id TEXT PRIMARY KEY,
  total_questions INTEGER DEFAULT 0,
  avg_questions_per_session REAL DEFAULT 0,
  sessions_without_questions INTEGER DEFAULT 0,
  question_type_distribution TEXT DEFAULT '{}',  -- JSON
  last_unprompted_question_at DATETIME,
  FOREIGN KEY (learner_id) REFERENCES learner(id)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_learner_concept_review 
  ON learner_concept(learner_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_learner_concept_state
  ON learner_concept(learner_id, state);

CREATE INDEX IF NOT EXISTS idx_session_learner 
  ON session(learner_id, start_time);

CREATE INDEX IF NOT EXISTS idx_concept_instance_learner 
  ON concept_instance(learner_id, concept_id);

CREATE INDEX IF NOT EXISTS idx_sandbox_attempt_learner 
  ON sandbox_attempt(learner_id, sandbox_id);

CREATE INDEX IF NOT EXISTS idx_message_timing_session
  ON message_timing(session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_project_learner
  ON project(learner_id, status);

CREATE INDEX IF NOT EXISTS idx_concept_cluster
  ON concept(cluster);
