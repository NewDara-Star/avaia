-- DATABASE 2: progress.db (PER-PROFILE)
-- ============================================================================
-- Location: ~/.avaia/profiles/{profile_id}/progress.db
-- One database per user profile (isolated data)
-- ============================================================================

-- PROFILE (The learner)
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY DEFAULT ('profile_' || lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Current learning state
  current_track_id TEXT,                  -- References curriculum.learning_track(id)
  onboarding_complete BOOLEAN DEFAULT FALSE,
  
  -- Settings
  preferred_teaching_method TEXT DEFAULT 'try_first', -- try_first, example_first
  learning_preferences TEXT DEFAULT '{}'  -- JSON: {prefers_physical_analogies: true, ...}
);

CREATE INDEX idx_profile_last_used ON profile(last_used_at);

-- CONCEPT MEMORY (FSRS-5 state)
CREATE TABLE IF NOT EXISTS concept_memory (
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,               -- References curriculum.concept(id)
  
  -- FSRS-5 Algorithm State
  stability REAL DEFAULT 0,
  difficulty REAL DEFAULT 5,
  retrievability REAL DEFAULT 0,
  
  -- State Machine
  state TEXT DEFAULT 'new' CHECK(state IN ('new', 'learning', 'review', 'relearning', 'deferred')),
  
  -- Review Scheduling
  last_review_date DATETIME,
  next_review_date DATETIME,
  
  -- Counters
  total_reviews INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,               -- Times forgotten (FSRS lapse counter)
  
  -- Timestamps
  introduced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (profile_id, concept_id),
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE INDEX idx_concept_memory_due ON concept_memory(profile_id, next_review_date) 
  WHERE state IN ('review', 'relearning');
CREATE INDEX idx_concept_memory_state ON concept_memory(profile_id, state);

-- CONCEPT MASTERY (Verification & Performance)
CREATE TABLE IF NOT EXISTS concept_mastery (
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  
  -- Verification (3-Layer Protocol)
  verified BOOLEAN DEFAULT FALSE,
  verified_at DATETIME,
  verification_attempts INTEGER DEFAULT 0,
  
  -- Scaffolding
  independence_score INTEGER DEFAULT 0 CHECK(independence_score BETWEEN 0 AND 100),
  hint_count INTEGER DEFAULT 0,
  
  -- Confidence Tracking (Hypercorrection)
  high_confidence_errors INTEGER DEFAULT 0,  -- Stubborn bugs counter
  last_confidence INTEGER CHECK(last_confidence BETWEEN 1 AND 5),
  
  -- Performance Metrics
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  
  PRIMARY KEY (profile_id, concept_id),
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE INDEX idx_concept_mastery_verified ON concept_mastery(profile_id, verified);

-- CONCEPT INSTANCES (Code snippets for SRS)
CREATE TABLE IF NOT EXISTS concept_instance (
  id TEXT PRIMARY KEY DEFAULT ('instance_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  
  -- Snippet (max 500 chars for token efficiency)
  code_snippet TEXT NOT NULL,
  snippet_context TEXT,                   -- "TaskTracker, handleSubmit function"
  line_numbers TEXT,                      -- "23-35"
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE INDEX idx_instance_concept ON concept_instance(profile_id, concept_id);
CREATE INDEX idx_instance_project ON concept_instance(project_id);

-- CONCEPT INTERVENTION (Stuck learner handling)
CREATE TABLE IF NOT EXISTS concept_intervention (
  id TEXT PRIMARY KEY DEFAULT ('intervention_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  
  -- Intervention Ladder (Stages 1-6)
  stage_reached INTEGER CHECK(stage_reached BETWEEN 1 AND 6),
  
  -- Multi-modal Teaching
  modality_tried TEXT,                    -- 'physical_analogy', 'diagram', 'use_case'
  modality_effective TEXT,                -- Which one worked (if any)
  
  -- Deferral (Stage 6)
  deferred_at DATETIME,
  retry_date DATETIME,
  deferral_reason TEXT,
  
  -- Outcome
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at DATETIME,
  
  -- Metadata
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE INDEX idx_intervention_profile ON concept_intervention(profile_id, concept_id);
CREATE INDEX idx_intervention_retry ON concept_intervention(retry_date) WHERE deferred_at IS NOT NULL;

-- PROJECTS (Learner's project instances)
CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY DEFAULT ('proj_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  template_id TEXT NOT NULL,              -- References curriculum.project_template(id)
  
  name TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
  
  -- Progress
  current_milestone INTEGER DEFAULT 1,
  milestones_completed TEXT DEFAULT '[]', -- JSON: [milestone_ids]
  
  -- Timing
  time_spent_minutes INTEGER DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_profile ON project(profile_id);
CREATE INDEX idx_project_status ON project(profile_id, status);

-- PROJECT FILES (WebContainer persistence)
CREATE TABLE IF NOT EXISTS project_file (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  last_modified TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
  UNIQUE (project_id, file_path)
);

CREATE INDEX idx_project_file_project ON project_file(project_id);

-- SESSIONS (Learning sessions)
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY DEFAULT ('session_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  project_id TEXT,
  
  -- Timing
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  
  -- Progress
  concepts_introduced TEXT DEFAULT '[]',  -- JSON: [concept_ids]
  concepts_verified TEXT DEFAULT '[]',    -- JSON: [concept_ids]
  reviews_completed INTEGER DEFAULT 0,
  milestones_advanced INTEGER DEFAULT 0,
  
  -- Behavioral Signals
  learner_questions_count INTEGER DEFAULT 0,
  passive_session BOOLEAN DEFAULT FALSE,  -- No questions asked
  emotional_states TEXT DEFAULT '[]',     -- JSON: [{timestamp, state, confidence}]
  
  -- Exit Ticket
  exit_ticket_completed BOOLEAN DEFAULT FALSE,
  exit_ticket_score REAL,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE SET NULL
);

CREATE INDEX idx_session_profile ON session(profile_id);
CREATE INDEX idx_session_project ON session(project_id);
CREATE INDEX idx_session_time ON session(start_time DESC);

-- SANDBOX ATTEMPTS (Productive Failure tracking)
CREATE TABLE IF NOT EXISTS sandbox_attempt (
  id TEXT PRIMARY KEY DEFAULT ('attempt_' || lower(hex(randomblob(16)))),
  sandbox_id TEXT NOT NULL,               -- References curriculum.sandbox(id)
  profile_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  
  attempt_number INTEGER NOT NULL,
  code_submitted TEXT,
  approach_description TEXT,              -- Learner explains what they tried
  outcome TEXT,                           -- 'failed', 'partial', 'success'
  matched_failure_pattern TEXT,           -- Which expected failure did they hit?
  
  -- Articulation Quality
  articulation_quality TEXT CHECK(articulation_quality IN ('none', 'partial', 'complete')),
  
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE INDEX idx_sandbox_attempt_profile ON sandbox_attempt(profile_id, sandbox_id);
CREATE INDEX idx_sandbox_attempt_session ON sandbox_attempt(session_id);

-- REVIEW LOG (FSRS review history)
CREATE TABLE IF NOT EXISTS review_log (
  id TEXT PRIMARY KEY DEFAULT ('review_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  session_id TEXT,
  
  -- Review Context
  review_type TEXT CHECK(review_type IN ('scheduled', 'manual', 'remediation')),
  
  -- Response
  rating TEXT NOT NULL CHECK(rating IN ('again', 'hard', 'good', 'easy')), -- FSRS ratings
  confidence INTEGER CHECK(confidence BETWEEN 1 AND 5),
  response_time_ms INTEGER,
  is_correct BOOLEAN,
  
  -- FSRS State Before Review
  stability_before REAL,
  difficulty_before REAL,
  
  -- FSRS State After Review
  stability_after REAL,
  difficulty_after REAL,
  next_review_date DATETIME,
  
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE SET NULL
);

CREATE INDEX idx_review_log_profile ON review_log(profile_id, timestamp DESC);
CREATE INDEX idx_review_log_concept ON review_log(concept_id);

-- REVIEW DEFER LOG (Explicit deferrals)
CREATE TABLE IF NOT EXISTS review_defer_log (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  deferred_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_defer_profile ON review_defer_log(profile_id);

-- VOCABULARY TERMS (Learner's glossary)
CREATE TABLE IF NOT EXISTS learner_term (
  id TEXT PRIMARY KEY DEFAULT ('term_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  concept_id TEXT,                        -- Optional link to concept
  example TEXT,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

CREATE INDEX idx_learner_term_profile ON learner_term(profile_id);
CREATE UNIQUE INDEX idx_learner_term_unique ON learner_term(profile_id, term);

-- MESSAGE TIMING (Emotional state inference)
CREATE TABLE IF NOT EXISTS message_timing (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  
  timestamp DATETIME NOT NULL,
  time_since_last_msg_ms INTEGER,
  message_count INTEGER,
  
  -- Inferred State
  inferred_state TEXT,                    -- 'productive_thinking', 'confused', 'frustrated', etc.
  confidence REAL,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE INDEX idx_message_timing_session ON message_timing(session_id, timestamp);

-- LEARNER QUESTION PATTERNS (Passive learning detection)
CREATE TABLE IF NOT EXISTS learner_question_patterns (
  profile_id TEXT PRIMARY KEY,
  consecutive_passive_sessions INTEGER DEFAULT 0,
  last_question_at DATETIME,
  total_questions_asked INTEGER DEFAULT 0,
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE
);

-- CHAT HISTORY (Optional - for chat UI persistence)
CREATE TABLE IF NOT EXISTS chat_message (
  id TEXT PRIMARY KEY DEFAULT ('chat_' || lower(hex(randomblob(16)))),
  profile_id TEXT NOT NULL,
  session_id TEXT,
  
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Tool Usage
  tool_calls TEXT,                        -- JSON: [{tool_name, parameters, result}]
  
  FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_message_session ON chat_message(session_id, timestamp);

-- ============================================================================
-- MIGRATIONS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  app_version TEXT
);

-- ============================================================================
-- VIEWS (Convenience queries)
-- ============================================================================

-- Active Profile View
CREATE VIEW IF NOT EXISTS v_active_profile AS
SELECT * FROM profile
ORDER BY last_used_at DESC
LIMIT 1;

-- Due Reviews View
CREATE VIEW IF NOT EXISTS v_due_reviews AS
SELECT 
  cm.profile_id,
  cm.concept_id,
  cm.next_review_date,
  cm.stability,
  cm.state
FROM concept_memory cm
WHERE cm.state IN ('review', 'relearning')
  AND cm.next_review_date <= datetime('now')
ORDER BY cm.next_review_date ASC;

-- Concept Progress Summary View
CREATE VIEW IF NOT EXISTS v_concept_progress AS
SELECT 
  cm.profile_id,
  cm.concept_id,
  cm.state AS memory_state,
  cm.stability,
  cm.next_review_date,
  ma.verified,
  ma.independence_score,
  ma.high_confidence_errors
FROM concept_memory cm
LEFT JOIN concept_mastery ma 
  ON ma.profile_id = cm.profile_id 
  AND ma.concept_id = cm.concept_id;

-- ============================================================================
-- TRIGGERS (Data integrity)
-- ============================================================================

-- Update profile.last_used_at on session creation
CREATE TRIGGER IF NOT EXISTS update_profile_last_used
AFTER INSERT ON session
BEGIN
  UPDATE profile 
  SET last_used_at = datetime('now')
  WHERE id = NEW.profile_id;
END;

-- Increment independence_score when learner solves without hints
CREATE TRIGGER IF NOT EXISTS increment_independence
AFTER UPDATE ON sandbox_attempt
WHEN NEW.outcome = 'success' AND OLD.outcome != 'success'
BEGIN
  UPDATE concept_mastery
  SET independence_score = MIN(100, independence_score + 5)
  WHERE profile_id = NEW.profile_id
    AND concept_id = (SELECT concept_id FROM sandbox WHERE id = NEW.sandbox_id);
END;

-- ============================================================================
-- INDEXES (Performance)
-- ============================================================================

-- Already created inline with tables
-- Additional composite indexes for common queries:

CREATE INDEX IF NOT EXISTS idx_session_profile_project ON session(profile_id, project_id);
CREATE INDEX IF NOT EXISTS idx_concept_memory_profile_state ON concept_memory(profile_id, state);

-- ============================================================================
-- SCHEMA VERSION
-- ============================================================================

PRAGMA user_version = 2;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
