/**
 * Database Connection and Initialization
 * Uses better-sqlite3 for synchronous, fast SQLite operations
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

// =============================================================================
// Configuration
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_DIR = join(homedir(), '.avaia');
const DB_PATH = join(CONFIG_DIR, 'avaia.db');
const MIGRATIONS_DIR = join(__dirname, 'migrations');

// =============================================================================
// Database Singleton
// =============================================================================

let db: Database.Database | null = null;

/**
 * Ensure the config directory exists
 */
function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

/**
 * Get or create the database connection
 */
export function getDatabase(): Database.Database {
    if (db) return db;

    ensureConfigDir();

    db = new Database(DB_PATH);

    // Enable foreign keys and WAL mode for better performance
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Run all pending migrations
 */
export function runMigrations(): void {
    const database = getDatabase();

    // Create migrations tracking table
    database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Get list of applied migrations
    const applied = new Set(
        database.prepare('SELECT name FROM _migrations').all()
            .map((row: unknown) => (row as { name: string }).name)
    );

    // Get all migration files
    if (!existsSync(MIGRATIONS_DIR)) {
        console.error('No migrations directory found at:', MIGRATIONS_DIR);
        return;
    }

    const files = readdirSync(MIGRATIONS_DIR)
        .filter((f: string) => f.endsWith('.sql'))
        .sort();

    // Apply each migration in order
    for (const file of files) {
        if (applied.has(file)) continue;

        console.error(`Applying migration: ${file}`);

        const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

        database.transaction(() => {
            database.exec(sql);
            database.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        })();

        console.error(`Applied migration: ${file}`);
    }
}

// =============================================================================
// Helper Functions for Common Queries
// =============================================================================

/**
 * Generate a random ID
 */
export function generateId(prefix: string = ''): string {
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Parse JSON from database column, with fallback
 */
export function parseJson<T>(value: string | null, fallback: T): T {
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

/**
 * Stringify JSON for database storage
 */
export function toJson(value: unknown): string {
    return JSON.stringify(value);
}

// Export paths for external use
export { CONFIG_DIR, DB_PATH };
