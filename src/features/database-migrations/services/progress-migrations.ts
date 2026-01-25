/**
 * Progress DB Migration Runner (idempotent + guarded) — GOLD
 *
 * Guarantees:
 * - Safe to run multiple times (idempotent via _migrations table)
 * - Safe on partially-upgraded installs
 * - Concurrency-safe (BEGIN IMMEDIATE prevents races)
 * - ALTER TABLE ADD COLUMN guarded via PRAGMA table_info (with strict table whitelist)
 * - Proper busy_timeout + always closes DB handle
 *
 * ADR-015 Compliance:
 * - _migrations gate (run-once semantics)
 * - Transactional application (BEGIN IMMEDIATE + COMMIT/ROLLBACK)
 * - Guarded ALTER TABLE via PRAGMA table_info checks
 * - Re-checks applied state inside transaction to prevent races
 *
 * FEAT-021 Required Migrations:
 * - project_file table
 * - review_defer_log table
 * - diagnostic_question.question_type column
 *
 * Notes:
 * - This runs against progress.db only (per-profile).
 * - curriculum.db is REPLACE-ONLY (ADR-014); do NOT migrate it here.
 */

import Database from "better-sqlite3";

type Migration = {
  id: string;
  description: string;
  run: (db: Database) => void;
};

/**
 * Strict allow-list for tables that can be used with PRAGMA table_info.
 * SQLite doesn't allow parameterized table names in PRAGMA,
 * so we whitelist instead of attempting to sanitize.
 */
const TABLE_WHITELIST = new Set<string>([
  "session",
  "concept_memory",
  "diagnostic_question",
]);

function assertWhitelistedTable(table: string): void {
  if (!TABLE_WHITELIST.has(table)) {
    throw new Error(`Refusing PRAGMA on non-whitelisted table: ${table}`);
  }
}

function tableExists(db: Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  return !!row;
}

function hasColumn(db: Database, table: string, column: string): boolean {
  assertWhitelistedTable(table);
  if (!tableExists(db, table)) return false;

  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return cols.some((c) => c.name === column);
}

function ensureMigrationsTable(db: Database): void {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      app_version TEXT
    )
  `).run();
}

function applyMigration(
  db: Database,
  m: Migration,
  appVersion?: string
): void {
  // BEGIN IMMEDIATE acquires a write lock immediately,
  // preventing concurrent migrators from racing.
  db.prepare("BEGIN IMMEDIATE").run();

  try {
    // Defensive: verify _migrations table exists
    const migTable = db
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='_migrations'"
      )
      .get();
    if (!migTable) {
      throw new Error(
        "_migrations table missing (ensureMigrationsTable must run first)"
      );
    }

    // Re-check inside lock: if another process already applied this, skip.
    const alreadyApplied = db
      .prepare("SELECT 1 FROM _migrations WHERE id=?")
      .get(m.id);
    if (alreadyApplied) {
      db.prepare("COMMIT").run();
      return;
    }

    // Run the migration
    m.run(db);

    // INSERT OR IGNORE: if another process recorded it first, don't explode.
    db.prepare(
      "INSERT OR IGNORE INTO _migrations (id, app_version) VALUES (?, ?)"
    ).run(m.id, appVersion ?? null);

    db.prepare("COMMIT").run();
  } catch (err) {
    db.prepare("ROLLBACK").run();
    throw err;
  }
}

/**
 * All migrations for progress.db.
 *
 * Migration IDs use ISO date prefix for natural sort order.
 * Each migration must be idempotent (safe if table/column already exists).
 */
const MIGRATIONS: Migration[] = [
  {
    id: "2026-01-24_001_add_project_file_table",
    description: "Add project_file table for WebContainer file persistence",
    run: (db) => {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS project_file (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          file_path TEXT NOT NULL,
          content TEXT NOT NULL,
          last_modified TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (project_id, file_path)
        )
      `).run();

      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_project_file_project
        ON project_file(project_id)
      `).run();
    },
  },
  {
    id: "2026-01-24_002_add_review_defer_log",
    description: "Add review_defer_log table for review deferral analytics",
    run: (db) => {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS review_defer_log (
          id TEXT PRIMARY KEY,
          profile_id TEXT NOT NULL,
          deferred_at TEXT NOT NULL DEFAULT (datetime('now')),
          reason TEXT NOT NULL
        )
      `).run();

      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_review_defer_profile
        ON review_defer_log(profile_id)
      `).run();
    },
  },
  {
    id: "2026-01-24_003_add_diagnostic_question_type",
    description:
      "Add question_type column to diagnostic_question for Layer 3 discrimination questions (FEAT-021)",
    run: (db) => {
      // NOTE: SQLite ALTER TABLE ADD COLUMN doesn't reliably support CHECK constraints
      // across all builds, so we add the column without CHECK and normalize data instead.
      if (tableExists(db, "diagnostic_question")) {
        // Add column if missing
        if (!hasColumn(db, "diagnostic_question", "question_type")) {
          db.prepare(`
            ALTER TABLE diagnostic_question
            ADD COLUMN question_type TEXT NOT NULL DEFAULT 'application'
          `).run();
        }

        // Always normalize: covers partial/corrupt states even if column existed
        db.prepare(`
          UPDATE diagnostic_question
          SET question_type = 'application'
          WHERE question_type IS NULL
             OR question_type NOT IN ('application', 'discrimination')
        `).run();
      }
    },
  },
  {
    id: "2026-01-24_004_add_session_curriculum_version",
    description: "Add curriculum_version column to session table",
    run: (db) => {
      if (
        tableExists(db, "session") &&
        !hasColumn(db, "session", "curriculum_version")
      ) {
        db.prepare(
          `ALTER TABLE session ADD COLUMN curriculum_version INTEGER`
        ).run();
      }
    },
  },
  {
    id: "2026-01-24_005_add_concept_memory_last_reviewed",
    description: "Add last_reviewed_at column to concept_memory table",
    run: (db) => {
      if (
        tableExists(db, "concept_memory") &&
        !hasColumn(db, "concept_memory", "last_reviewed_at")
      ) {
        db.prepare(
          `ALTER TABLE concept_memory ADD COLUMN last_reviewed_at TEXT`
        ).run();
      }
    },
  },
];

/**
 * Run all pending migrations against a progress.db file.
 *
 * @param progressDbPath - Path to the profile's progress.db
 * @param appVersion - Optional app version string to record in _migrations
 */
export function runProgressMigrations(
  progressDbPath: string,
  appVersion?: string
): void {
  const db = new Database(progressDbPath);

  try {
    // Reduce "database is locked" flakiness (FEAT-021: busy_timeout=5000)
    db.pragma("busy_timeout = 5000");

    // WAL mode is more concurrent-friendly for desktop apps
    try {
      db.pragma("journal_mode = WAL");
    } catch {
      // Some SQLite builds don't support WAL; non-fatal
    }

    // Enable foreign keys for referential integrity
    db.pragma("foreign_keys = ON");

    // Ensure _migrations table exists before applying migrations
    ensureMigrationsTable(db);

    // Apply migrations in sorted order (IDs are date-prefixed)
    const sortedMigrations = [...MIGRATIONS].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    for (const migration of sortedMigrations) {
      applyMigration(db, migration, appVersion);
    }
  } finally {
    // Always close DB handle (FEAT-021 requirement)
    db.close();
  }
}

// Usage:
// import { runProgressMigrations } from "./progress-migrations";
//
// const profileProgressDb = path.join(userData, "profiles", profileId, "progress.db");
// runProgressMigrations(profileProgressDb, app.getVersion());
