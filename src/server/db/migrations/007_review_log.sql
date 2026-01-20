-- Migration 007: Review Log Table
-- Tracks individual review attempts for streak calculation and analytics

CREATE TABLE IF NOT EXISTS review_log (
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

CREATE INDEX IF NOT EXISTS idx_review_log_learner_date
  ON review_log(learner_id, date(timestamp));

CREATE INDEX IF NOT EXISTS idx_review_log_concept
  ON review_log(learner_id, concept_id, timestamp);
