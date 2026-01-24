-- Avaia Database Backup
-- Generated: 2026-01-24
-- Source: ~/.avaia/avaia.db
--
-- This is a complete SQLite dump including:
-- - Schema (all tables, indexes)
-- - Data (all rows from all tables)
-- - Migration history
--
-- To restore: sqlite3 new_database.db < avaia_database_backup.sql

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- ========================================
-- MIGRATION TRACKING
-- ========================================
CREATE TABLE _migrations (
  name TEXT PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO _migrations VALUES('001_initial.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('002_session_notes.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('003_learner_terms.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('004_chat_history.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('005_learning_profiles.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('006_learning_tracks.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('007_review_log.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('008_seed_curriculum.sql','2026-01-20 00:04:00');
INSERT INTO _migrations VALUES('006_seed_curriculum.sql','2026-01-20 00:05:10');

-- ========================================
-- CORE ENTITIES
-- ========================================

-- LEARNER TABLE
CREATE TABLE learner (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  preferred_teaching_method TEXT DEFAULT 'example_first',  -- example_first, concept_first, try_first
  best_session_times TEXT DEFAULT '[]',  -- JSON array
  onboarding_complete BOOLEAN DEFAULT FALSE,
  learning_preferences TEXT DEFAULT '{}',
  current_track_id TEXT REFERENCES learning_track(id)
);

INSERT INTO learner VALUES('learner_b0acae16bc5c','dara','2026-01-20 00:08:17','example_first','[]',0,'{}','js-web');
INSERT INTO learner VALUES('learner_6b2f23218e34','dara','2026-01-20 00:22:47','example_first','[]',0,'{}','js-web');
INSERT INTO learner VALUES('learner_e61659fe557f40ac','Learner','2026-01-20 00:40:50','try_first','[]',0,'{}','js-web');
INSERT INTO learner VALUES('learner_b2a59a8056b14e98','Learner','2026-01-20 00:40:50','try_first','[]',0,'{}','js-web');
INSERT INTO learner VALUES('learner_cf0ea1f8ef65','dara','2026-01-20 00:44:30','example_first','[]',0,'{}','js-web');
INSERT INTO learner VALUES('learner_ef6024aaf3ba','star','2026-01-20 00:46:59','example_first','[]',0,'{}','js-web');
INSERT INTO learner VALUES('learner_ea7d7d759cf8','star','2026-01-20 17:46:03','try_first','[]',0,'{}','js-web');

-- PROJECT TABLE
CREATE TABLE project (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',  -- not_started, in_progress, completed
  current_milestone INTEGER DEFAULT 1,
  milestones_completed TEXT DEFAULT '[]',  -- JSON array
  time_spent_minutes INTEGER DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  template_id TEXT REFERENCES project_template(id),
  FOREIGN KEY (learner_id) REFERENCES learner(id)
);

-- CONCEPT TABLE
CREATE TABLE concept (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  cluster TEXT,  -- For interleaving similar concepts
  prerequisites TEXT DEFAULT '[]',  -- JSON array of concept IDs
  sandbox_id TEXT,
  visualizations TEXT DEFAULT '[]'  -- JSON array of URLs
);

INSERT INTO concept VALUES('dom-manipulation','DOM Manipulation','DOM & Events','dom-selection','[]',NULL,'[]');
INSERT INTO concept VALUES('events','Event Listeners','DOM & Events','event-handling','["dom-manipulation"]',NULL,'[]');
INSERT INTO concept VALUES('event-delegation','Event Delegation','DOM & Events','event-handling','["events"]',NULL,'[]');
INSERT INTO concept VALUES('functions','Functions','Functions',NULL,'[]',NULL,'[]');
INSERT INTO concept VALUES('scope','Scope','Functions','variable-declarations','["functions"]',NULL,'[]');
INSERT INTO concept VALUES('closures','Closures','Functions',NULL,'["scope"]',NULL,'[]');
INSERT INTO concept VALUES('arrays','Arrays','Data Structures','array-methods','[]',NULL,'[]');
INSERT INTO concept VALUES('objects','Objects','Data Structures',NULL,'["arrays"]',NULL,'[]');
INSERT INTO concept VALUES('conditionals','Conditionals','Control Flow',NULL,'[]',NULL,'[]');
INSERT INTO concept VALUES('loops','Loops','Control Flow','loop-constructs','["conditionals"]',NULL,'[]');
INSERT INTO concept VALUES('state-management','State Management','Architecture',NULL,'["objects"]',NULL,'[]');
INSERT INTO concept VALUES('settimeout','setTimeout','Async','async-patterns','["functions","scope"]',NULL,'[]');
INSERT INTO concept VALUES('localstorage','localStorage','Browser APIs','storage-options','["objects"]',NULL,'[]');
INSERT INTO concept VALUES('array-map','Array.map()','Data Structures','array-methods','["arrays","functions"]',NULL,'[]');
INSERT INTO concept VALUES('array-filter','Array.filter()','Data Structures','array-methods','["arrays","functions"]',NULL,'[]');
INSERT INTO concept VALUES('array-find','Array.find()','Data Structures','array-methods','["arrays","functions"]',NULL,'[]');
INSERT INTO concept VALUES('array-foreach','Array.forEach()','Data Structures','array-methods','["arrays","functions"]',NULL,'[]');
INSERT INTO concept VALUES('form-handling','Form Handling','DOM & Events',NULL,'["events","dom-manipulation"]',NULL,'[]');
INSERT INTO concept VALUES('template-literals','Template Literals','JavaScript Core',NULL,'[]',NULL,'[]');
INSERT INTO concept VALUES('data-attributes','Data Attributes','DOM & Events',NULL,'["dom-manipulation"]',NULL,'[]');
INSERT INTO concept VALUES('callbacks','Callbacks','Async','async-patterns','["functions"]',NULL,'[]');
INSERT INTO concept VALUES('event-loop','Event Loop','Async','async-patterns','["settimeout"]','sandbox-event-loop','[]');
INSERT INTO concept VALUES('promises','Promises','Async','async-patterns','["event-loop","callbacks"]','sandbox-callback-hell','[]');
INSERT INTO concept VALUES('async-await','async/await','Async','async-patterns','["promises"]',NULL,'[]');
INSERT INTO concept VALUES('fetch','fetch API','APIs',NULL,'["promises"]',NULL,'[]');
INSERT INTO concept VALUES('try-catch','try/catch','Error Handling',NULL,'["async-await"]',NULL,'[]');
INSERT INTO concept VALUES('race-conditions','Race Conditions','Async',NULL,'["promises"]','sandbox-race-condition','[]');
INSERT INTO concept VALUES('debouncing','Debouncing','Performance',NULL,'["settimeout","events"]',NULL,'[]');
INSERT INTO concept VALUES('sql','SQL','Database',NULL,'[]','sandbox-json-database','[]');
INSERT INTO concept VALUES('nodejs','Node.js','Backend',NULL,'[]',NULL,'[]');
INSERT INTO concept VALUES('express','Express','Backend',NULL,'["nodejs"]',NULL,'[]');
INSERT INTO concept VALUES('hashing','Password Hashing','Security',NULL,'[]','sandbox-localstorage-password','[]');
INSERT INTO concept VALUES('sessions','Sessions','Auth','auth-strategies','["hashing"]',NULL,'[]');
INSERT INTO concept VALUES('jwt','JWT','Auth','auth-strategies','["hashing"]',NULL,'[]');
INSERT INTO concept VALUES('websockets','WebSockets','Real-time',NULL,'["nodejs"]','sandbox-polling','[]');

-- LEARNER_CONCEPT TABLE (FSRS-5 state tracking)
CREATE TABLE learner_concept (
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

-- MISCONCEPTION TABLE
CREATE TABLE misconception (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_answer TEXT,  -- Which wrong answer reveals this
  remediation_strategy TEXT,
  contrasting_case TEXT,  -- JSON with two code snippets
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

INSERT INTO misconception VALUES('dom-001','dom-manipulation','DOM vs HTML','DOM and HTML are the same thing','The DOM is just the HTML file','Show: HTML is static text file, DOM is live object tree. Change DOM via JS, HTML file unchanged.',NULL);
INSERT INTO misconception VALUES('dom-002','dom-manipulation','appendChild copies','appendChild copies the element','Expects element to appear twice','Show: appendChild MOVES element. To copy, use cloneNode(true) first.',NULL);
INSERT INTO misconception VALUES('event-001','events','Event bubbling','Events only fire on clicked element','The parent handler won''t run','Show: click child, parent handler fires. Diagram bubbling up the tree.',NULL);
INSERT INTO misconception VALUES('scope-001','scope','Inner let modifies outer','Believes inner let modifies outer variable','0','Show two scopes side by side, trace variable lookup','{"case_a":{"code":"let score = 10;\nfunction reset() { score = 0; }\nreset();\nconsole.log(score);","output":"0","label":"Modifies outer"},"case_b":{"code":"let score = 10;\nfunction reset() { let score = 0; }\nreset();\nconsole.log(score);","output":"10","label":"Shadows outer"}}');
INSERT INTO misconception VALUES('async-001','promises','fetch returns data directly','Tries to use response without await','Response data immediately','Step through event loop — fetch SCHEDULES work, returns promise immediately',NULL);

-- DIAGNOSTIC_QUESTION TABLE
CREATE TABLE diagnostic_question (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  code_snippet TEXT,
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  distractors TEXT NOT NULL,  -- JSON array of {answer, misconception_id}
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

INSERT INTO diagnostic_question VALUES('diag-scope-001','scope',unistr('let score = 10;\u000afunction reset() {\u000a  let score = 0;\u000a}\u000areset();\u000aconsole.log(score);'),'What does this code print?','10','[{"answer":"0","misconception_id":"scope-001"},{"answer":"undefined","misconception_id":"scope-002"},{"answer":"Error","misconception_id":null}]');
INSERT INTO diagnostic_question VALUES('diag-async-001','promises',unistr('const result = fetch("/api/data");\u000aconsole.log(result);'),'What gets logged?','Promise {<pending>}','[{"answer":"The API response data","misconception_id":"async-001"},{"answer":"undefined","misconception_id":null},{"answer":"Error: fetch is not defined","misconception_id":null}]');

-- SANDBOX TABLE (Productive Failure exercises)
CREATE TABLE sandbox (
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

-- SANDBOX_ATTEMPT TABLE
CREATE TABLE sandbox_attempt (
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

-- CONCEPT_INSTANCE TABLE (code snippets for SRS)
CREATE TABLE concept_instance (
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

-- ========================================
-- SESSION TRACKING
-- ========================================

CREATE TABLE session (
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
  session_notes TEXT,

  FOREIGN KEY (learner_id) REFERENCES learner(id),
  FOREIGN KEY (project_id) REFERENCES project(id)
);

INSERT INTO session VALUES('session_4e0731aaf319494a','learner_b0acae16bc5c',NULL,'2026-01-20T00:13:26.183371Z',NULL,60,NULL,'[]','[]','[]','[]',0,0,'[]','[]',NULL,NULL,NULL);
INSERT INTO session VALUES('session_0f7410bb0f604290','learner_ea7d7d759cf8',NULL,'2026-01-20T17:47:23.472286Z',NULL,30,NULL,'[]','[]','[]','[]',0,0,'[]','[]',NULL,NULL,NULL);
INSERT INTO session VALUES('session_a2c9e21b12274a7e','learner_ea7d7d759cf8',NULL,'2026-01-20T17:47:23.478009Z',NULL,30,NULL,'[]','[]','[]','[]',0,0,'[]','[]',NULL,NULL,NULL);

-- MESSAGE_TIMING TABLE (for emotional state inference)
CREATE TABLE message_timing (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  session_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  gap_since_previous_ms INTEGER,
  message_type TEXT NOT NULL,  -- user, assistant
  message_length INTEGER,
  contains_help_request BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (session_id) REFERENCES session(id)
);

-- LEARNER_QUESTION_PATTERNS TABLE (passive learner detection)
CREATE TABLE learner_question_patterns (
  learner_id TEXT PRIMARY KEY,
  total_questions INTEGER DEFAULT 0,
  avg_questions_per_session REAL DEFAULT 0,
  sessions_without_questions INTEGER DEFAULT 0,
  question_type_distribution TEXT DEFAULT '{}',  -- JSON
  last_unprompted_question_at DATETIME,
  FOREIGN KEY (learner_id) REFERENCES learner(id)
);

-- ========================================
-- KNOWLEDGE & COMMUNICATION
-- ========================================

-- LEARNER_TERM TABLE (vocabulary tracking)
CREATE TABLE learner_term (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  learner_id TEXT NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  introduced_with_concept TEXT NOT NULL,
  introduced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learner_id) REFERENCES learner(id),
  FOREIGN KEY (introduced_with_concept) REFERENCES concept(id),
  UNIQUE(learner_id, term)
);

-- CHAT_MESSAGE TABLE (complete conversation history)
CREATE TABLE chat_message (
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

-- ========================================
-- CURRICULUM STRUCTURE
-- ========================================

-- LEARNING_TRACK TABLE
CREATE TABLE learning_track (
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

INSERT INTO learning_track VALUES('js-web','JavaScript Web Development','Learn to build interactive web applications from scratch. Progress from DOM manipulation to full-stack development through 5 real-world projects.','javascript','web','beginner',1,'system','2026-01-20 00:04:00');

-- PROJECT_TEMPLATE TABLE
CREATE TABLE project_template (
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

INSERT INTO project_template VALUES('memory-game','js-web',1,'Memory Game','Build a classic memory matching game. Learn DOM manipulation, event handling, state management, and timing functions.',15,unistr('[\u000a    {"id": 1, "name": "HTML Structure", "description": "Create the grid of cards using HTML"},\u000a    {"id": 2, "name": "CSS Styling", "description": "Style the cards and grid layout"},\u000a    {"id": 3, "name": "Card Click Handler", "description": "Add click events to reveal cards"},\u000a    {"id": 4, "name": "Matching Logic", "description": "Implement card matching with setTimeout"},\u000a    {"id": 5, "name": "Game State", "description": "Track flipped cards, matches, and score"},\u000a    {"id": 6, "name": "Shuffle & Reset", "description": "Add shuffle on start and reset functionality"}\u000a  ]'),'[]','2026-01-20 00:04:00');

-- MILESTONE_CONCEPT TABLE (which concepts are taught in which milestones)
CREATE TABLE milestone_concept (
  project_template_id TEXT NOT NULL,
  milestone_number INTEGER NOT NULL,
  concept_id TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('introduces', 'requires', 'reinforces')),
  PRIMARY KEY (project_template_id, milestone_number, concept_id),
  FOREIGN KEY (project_template_id) REFERENCES project_template(id),
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

INSERT INTO milestone_concept VALUES('memory-game',1,'dom-manipulation','introduces');
INSERT INTO milestone_concept VALUES('memory-game',3,'events','introduces');
INSERT INTO milestone_concept VALUES('memory-game',3,'functions','introduces');
INSERT INTO milestone_concept VALUES('memory-game',4,'settimeout','introduces');
INSERT INTO milestone_concept VALUES('memory-game',4,'conditionals','introduces');
INSERT INTO milestone_concept VALUES('memory-game',4,'state-management','introduces');
INSERT INTO milestone_concept VALUES('memory-game',5,'arrays','introduces');
INSERT INTO milestone_concept VALUES('memory-game',5,'objects','introduces');
INSERT INTO milestone_concept VALUES('memory-game',6,'array-foreach','introduces');

-- ========================================
-- ANALYTICS & TRACKING
-- ========================================

-- REVIEW_LOG TABLE (spaced repetition history)
CREATE TABLE review_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  learner_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('correct', 'incorrect')),
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  response_time_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learner_id) REFERENCES learner(id),
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

-- ========================================
-- INDEXES (Performance optimization)
-- ========================================

CREATE INDEX idx_learner_concept_review
  ON learner_concept(learner_id, next_review_date);
CREATE INDEX idx_learner_concept_state
  ON learner_concept(learner_id, state);
CREATE INDEX idx_session_learner
  ON session(learner_id, start_time);
CREATE INDEX idx_concept_instance_learner
  ON concept_instance(learner_id, concept_id);
CREATE INDEX idx_sandbox_attempt_learner
  ON sandbox_attempt(learner_id, sandbox_id);
CREATE INDEX idx_message_timing_session
  ON message_timing(session_id, timestamp);
CREATE INDEX idx_project_learner
  ON project(learner_id, status);
CREATE INDEX idx_concept_cluster
  ON concept(cluster);
CREATE INDEX idx_learner_term_learner
  ON learner_term(learner_id);
CREATE INDEX idx_chat_message_session
  ON chat_message(session_id, timestamp);
CREATE INDEX idx_chat_message_role
  ON chat_message(session_id, role);
CREATE INDEX idx_learner_preferences
  ON learner(id) WHERE learning_preferences != '{}';
CREATE INDEX idx_learning_track_preseeded
  ON learning_track(is_preseeded) WHERE is_preseeded = TRUE;
CREATE INDEX idx_project_template_track
  ON project_template(track_id, sequence_order);
CREATE INDEX idx_milestone_concept_project
  ON milestone_concept(project_template_id);
CREATE INDEX idx_milestone_concept_concept
  ON milestone_concept(concept_id);
CREATE INDEX idx_review_log_learner_date
  ON review_log(learner_id, date(timestamp));
CREATE INDEX idx_review_log_concept
  ON review_log(learner_id, concept_id, timestamp);

COMMIT;
