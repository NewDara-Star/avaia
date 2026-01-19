#!/usr/bin/env npx tsx
/**
 * Seed all learning tracks into the database
 * Run this after database migrations to populate curriculum
 */

import { getDatabase } from '../src/server/db/index.js';

// Import all seeders
async function seedAllTracks() {
    console.log('='.repeat(80));
    console.log('AVAIA CURRICULUM SEEDER');
    console.log('Seeding all learning tracks...');
    console.log('='.repeat(80));
    console.log('');

    const db = getDatabase();

    // Check if database exists
    try {
        db.prepare('SELECT COUNT(*) FROM learning_track').get();
    } catch (error) {
        console.error('ERROR: Database not initialized. Run migrations first:');
        console.error('  npm run db:migrate');
        process.exit(1);
    }

    // Track seeding order
    const seeders = [
        { name: 'Avaia Core', path: './seed-avaia-core.ts' },
        { name: 'JavaScript Web', path: './seed-js-curriculum.ts' },
        { name: 'Python Data Science', path: './seed-python-data.ts' },
        { name: 'C Systems Programming', path: './seed-c-systems.ts' },
        { name: 'Software Engineering Fundamentals', path: './seed-software-engineering.ts' },
        { name: 'Data Structures & Algorithms', path: './seed-dsa-curriculum.ts' },
        { name: 'CS Theory', path: './seed-cs-theory.ts' },
        { name: 'ML Engineering', path: './seed-ml-engineering.ts' }
    ];

    for (const seeder of seeders) {
        try {
            console.log(`\n📚 Seeding ${seeder.name}...`);
            console.log('-'.repeat(80));

            // Dynamically import and run the seeder
            const module = await import(seeder.path);
            const seedFunction = Object.values(module)[0];

            if (typeof seedFunction === 'function') {
                await seedFunction();
            } else {
                console.warn(`⚠️  No seed function found in ${seeder.path}`);
            }

            console.log(`✅ ${seeder.name} seeded successfully`);
        } catch (error) {
            console.error(`❌ Error seeding ${seeder.name}:`, error);
        }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ ALL TRACKS SEEDED SUCCESSFULLY');
    console.log('='.repeat(80));

    // Show summary
    const tracks = db.prepare('SELECT COUNT(*) as count FROM learning_track').get() as { count: number };
    const projects = db.prepare('SELECT COUNT(*) as count FROM project_template').get() as { count: number };
    const concepts = db.prepare('SELECT COUNT(*) as count FROM concept').get() as { count: number };
    const misconceptions = db.prepare('SELECT COUNT(*) as count FROM misconception').get() as { count: number };

    console.log('');
    console.log('DATABASE SUMMARY:');
    console.log(`  📚 Learning Tracks: ${tracks.count}`);
    console.log(`  🎯 Project Templates: ${projects.count}`);
    console.log(`  💡 Concepts: ${concepts.count}`);
    console.log(`  ⚠️  Misconceptions: ${misconceptions.count}`);
    console.log('');
}

seedAllTracks().catch(console.error);
