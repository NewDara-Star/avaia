/**
 * Progress Database Service
 *
 * Manages per-profile progress.db files at {userData}/profiles/{profile_id}/progress.db.
 * Initializes schema from progress.sql when missing.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { app } from "electron";

let cachedProgressSchema: string | null = null;

/**
 * Generate a canonical profile ID: profile_[32-char hex]
 */
export function generateProfileId(): string {
  const hex = crypto.randomBytes(16).toString("hex");
  return `profile_${hex}`;
}

/**
 * Get the profiles root directory
 */
export function getProfilesRoot(): string {
  const userData = app.getPath("userData");
  return path.join(userData, "profiles");
}

/**
 * Get the path to a profile's progress.db
 */
export function getProgressDbPath(profileId: string): string {
  return path.join(getProfilesRoot(), profileId, "progress.db");
}

function resolveProgressSchemaPath(): string {
  const candidates = [
    path.join(app.getAppPath(), "progress.sql"),
    typeof process.resourcesPath === "string"
      ? path.join(process.resourcesPath, "progress.sql")
      : null,
    path.join(process.cwd(), "progress.sql"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  console.error(
    `[progress-db] progress.sql not found. Tried: ${candidates.join(", ")}`
  );
  throw new Error(
    `progress.sql not found. Tried: ${candidates.join(", ")}`
  );
}

function getProgressSchema(): string {
  if (cachedProgressSchema) return cachedProgressSchema;
  const schemaPath = resolveProgressSchemaPath();
  cachedProgressSchema = fs.readFileSync(schemaPath, "utf-8");
  return cachedProgressSchema;
}

function ensureProgressSchema(db: Database): void {
  db.pragma("foreign_keys = ON");
  const hasProfileTable = db
    .prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'profile'"
    )
    .get();
  if (hasProfileTable) return;

  const schema = getProgressSchema();
  db.exec(schema);
}

/**
 * Open and initialize a profile's progress.db
 */
export function openProgressDb(profileId: string): Database {
  const dbPath = getProgressDbPath(profileId);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("busy_timeout = 5000");

  try {
    db.pragma("journal_mode = WAL");
  } catch {
    // WAL might not be available on all systems
  }

  ensureProgressSchema(db);
  return db;
}

/**
 * Open an existing progress.db in read-only mode
 */
export function openExistingProgressDb(dbPath: string): Database | null {
  if (!fs.existsSync(dbPath)) return null;
  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    db.pragma("foreign_keys = ON");
    return db;
  } catch {
    return null;
  }
}

/**
 * Helper: Execute a function with the database and ensure cleanup
 */
export function withProgressDb<T>(
  profileId: string,
  fn: (db: Database) => T
): T {
  const db = openProgressDb(profileId);
  try {
    return fn(db);
  } finally {
    try {
      db.close();
    } catch {
      // Already closed or error closing
    }
  }
}
