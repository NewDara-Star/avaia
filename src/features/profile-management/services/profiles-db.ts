/**
 * Profiles Database Service
 *
 * Manages the central profiles.db file at {userData}/profiles.db.
 * Tracks profile metadata, names, avatars, and state.
 *
 * Schema:
 * - profiles table: id, name, avatar, created_at, last_opened_at, track
 * - _migrations: application tracking (idempotent)
 *
 * Guarantees:
 * - Idempotent initialization (safe to call multiple times)
 * - Proper cleanup on errors
 * - No data leakage between profiles
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { app } from "electron";

type Migration = {
  id: string;
  description: string;
  run: (db: Database) => void;
};

/**
 * Generate a canonical profile ID: profile_[32-char hex]
 */
export function generateProfileId(): string {
  const hex = crypto.randomBytes(16).toString("hex");
  return `profile_${hex}`;
}

/**
 * Get the path to profiles.db
 */
export function getProfilesDbPath(): string {
  const userData = app.getPath("userData");
  return path.join(userData, "profiles.db");
}

/**
 * Initialize profiles.db schema and apply pending migrations
 * (Idempotent: safe to call multiple times)
 */
function initializeDatabase(db: Database): void {
  db.pragma("foreign_keys = ON");

  // Create migrations table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // Define all migrations
  const migrations: Migration[] = [
    {
      id: "2026-01-25_001_create_profiles_table",
      description: "Create profiles table with core metadata",
      run: (db) => {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            avatar TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            last_opened_at TEXT,
            track TEXT,
            UNIQUE(name)
          )
        `).run();

        db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_profiles_created_at
          ON profiles(created_at)
        `).run();
      },
    },
  ];

  // Apply migrations in order
  for (const migration of migrations) {
    const alreadyApplied = db
      .prepare("SELECT 1 FROM _migrations WHERE id = ?")
      .get(migration.id);

    if (!alreadyApplied) {
      migration.run(db);
      db.prepare("INSERT INTO _migrations (id) VALUES (?)").run(
        migration.id
      );
    }
  }
}

/**
 * Open and initialize profiles.db
 */
export function openProfilesDb(): Database {
  const dbPath = getProfilesDbPath();

  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } catch {
    // Directory might already exist
  }

  const db = new Database(dbPath);
  db.pragma("busy_timeout = 5000");

  try {
    db.pragma("journal_mode = WAL");
  } catch {
    // WAL might not be available on all systems
  }

  initializeDatabase(db);
  return db;
}

/**
 * Close the database connection (important for cleanup)
 */
export function closeProfilesDb(db: Database): void {
  try {
    db.close();
  } catch {
    // Already closed or error closing
  }
}

/**
 * Helper: Execute a function with the database and ensure cleanup
 */
export function withProfilesDb<T>(
  fn: (db: Database) => T
): T {
  const db = openProfilesDb();
  try {
    return fn(db);
  } finally {
    closeProfilesDb(db);
  }
}
