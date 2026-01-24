-- Migration 003: Learner Terms
-- Track vocabulary terms introduced to learners

CREATE TABLE IF NOT EXISTS learner_term (
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

CREATE INDEX IF NOT EXISTS idx_learner_term_learner
  ON learner_term(learner_id);
