/**
 * Database Migration Runner
 * Runs all pending SQL migrations
 */

import { runMigrations, closeDatabase } from '../src/server/db/index.js';

console.log('Running migrations...');

try {
    runMigrations();
    console.log('✅ Migrations complete!');
} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
} finally {
    closeDatabase();
}
