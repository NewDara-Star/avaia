#!/usr/bin/env npx tsx
/**
 * Generate SQL seed migration from seed.ts data
 * 
 * Usage: npx tsx scripts/generate-seed-sql.ts > src/server/db/migrations/006_seed_curriculum.sql
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import seed data by reading and evaluating the file
const seedPath = join(__dirname, '..', 'src', 'server', 'seed.ts');

// Helper to escape SQL strings
function esc(s: any): string {
    if (s === null || s === undefined) return 'NULL';
    return "'" + String(s).replace(/'/g, "''") + "'";
}

// Re-define seed data arrays (copy from seed.ts)
const concepts = [
    { id: 'dom-manipulation', name: 'DOM Manipulation', category: 'DOM & Events', cluster: 'dom-selection', prerequisites: [] },
    { id: 'events', name: 'Event Listeners', category: 'DOM & Events', cluster: 'event-handling', prerequisites: ['dom-manipulation'] },
    { id: 'event-delegation', name: 'Event Delegation', category: 'DOM & Events', cluster: 'event-handling', prerequisites: ['events'] },
    { id: 'functions', name: 'Functions', category: 'Functions', cluster: null, prerequisites: [] },
    { id: 'scope', name: 'Scope', category: 'Functions', cluster: 'variable-declarations', prerequisites: ['functions'] },
    { id: 'closures', name: 'Closures', category: 'Functions', cluster: null, prerequisites: ['scope'] },
    { id: 'arrays', name: 'Arrays', category: 'Data Structures', cluster: 'array-methods', prerequisites: [] },
    { id: 'objects', name: 'Objects', category: 'Data Structures', cluster: null, prerequisites: ['arrays'] },
    { id: 'conditionals', name: 'Conditionals', category: 'Control Flow', cluster: null, prerequisites: [] },
    { id: 'loops', name: 'Loops', category: 'Control Flow', cluster: 'loop-constructs', prerequisites: ['conditionals'] },
    { id: 'state-management', name: 'State Management', category: 'Architecture', cluster: null, prerequisites: ['objects'] },
    { id: 'settimeout', name: 'setTimeout', category: 'Async', cluster: 'async-patterns', prerequisites: ['functions', 'scope'] },
    { id: 'localstorage', name: 'localStorage', category: 'Browser APIs', cluster: 'storage-options', prerequisites: ['objects'] },
    { id: 'array-map', name: 'Array.map()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'array-filter', name: 'Array.filter()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'array-find', name: 'Array.find()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'array-foreach', name: 'Array.forEach()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'form-handling', name: 'Form Handling', category: 'DOM & Events', cluster: null, prerequisites: ['events', 'dom-manipulation'] },
    { id: 'template-literals', name: 'Template Literals', category: 'JavaScript Core', cluster: null, prerequisites: [] },
    { id: 'data-attributes', name: 'Data Attributes', category: 'DOM & Events', cluster: null, prerequisites: ['dom-manipulation'] },
    { id: 'callbacks', name: 'Callbacks', category: 'Async', cluster: 'async-patterns', prerequisites: ['functions'] },
    { id: 'event-loop', name: 'Event Loop', category: 'Async', cluster: 'async-patterns', prerequisites: ['settimeout'], sandbox_id: 'sandbox-event-loop' },
    { id: 'promises', name: 'Promises', category: 'Async', cluster: 'async-patterns', prerequisites: ['event-loop', 'callbacks'], sandbox_id: 'sandbox-callback-hell' },
    { id: 'async-await', name: 'async/await', category: 'Async', cluster: 'async-patterns', prerequisites: ['promises'] },
    { id: 'fetch', name: 'fetch API', category: 'APIs', cluster: null, prerequisites: ['promises'] },
    { id: 'try-catch', name: 'try/catch', category: 'Error Handling', cluster: null, prerequisites: ['async-await'] },
    { id: 'race-conditions', name: 'Race Conditions', category: 'Async', cluster: null, prerequisites: ['promises'], sandbox_id: 'sandbox-race-condition' },
    { id: 'debouncing', name: 'Debouncing', category: 'Performance', cluster: null, prerequisites: ['settimeout', 'events'] },
    { id: 'sql', name: 'SQL', category: 'Database', cluster: null, prerequisites: [], sandbox_id: 'sandbox-json-database' },
    { id: 'nodejs', name: 'Node.js', category: 'Backend', cluster: null, prerequisites: [] },
    { id: 'express', name: 'Express', category: 'Backend', cluster: null, prerequisites: ['nodejs'] },
    { id: 'hashing', name: 'Password Hashing', category: 'Security', cluster: null, prerequisites: [], sandbox_id: 'sandbox-localstorage-password' },
    { id: 'sessions', name: 'Sessions', category: 'Auth', cluster: 'auth-strategies', prerequisites: ['hashing'] },
    { id: 'jwt', name: 'JWT', category: 'Auth', cluster: 'auth-strategies', prerequisites: ['hashing'] },
    { id: 'websockets', name: 'WebSockets', category: 'Real-time', cluster: null, prerequisites: ['nodejs'], sandbox_id: 'sandbox-polling' },
];

const misconceptions = [
    { id: 'dom-001', concept_id: 'dom-manipulation', name: 'DOM vs HTML', description: 'DOM and HTML are the same thing', trigger_answer: 'The DOM is just the HTML file', remediation_strategy: 'Show: HTML is static text file, DOM is live object tree. Change DOM via JS, HTML file unchanged.', contrasting_case: null },
    { id: 'dom-002', concept_id: 'dom-manipulation', name: 'appendChild copies', description: 'appendChild copies the element', trigger_answer: 'Expects element to appear twice', remediation_strategy: 'Show: appendChild MOVES element. To copy, use cloneNode(true) first.', contrasting_case: null },
    { id: 'event-001', concept_id: 'events', name: 'Event bubbling', description: 'Events only fire on clicked element', trigger_answer: 'The parent handler won\'t run', remediation_strategy: 'Show: click child, parent handler fires. Diagram bubbling up the tree.', contrasting_case: null },
    { id: 'scope-001', concept_id: 'scope', name: 'Inner let modifies outer', description: 'Believes inner let modifies outer variable', trigger_answer: '0', remediation_strategy: 'Show two scopes side by side, trace variable lookup', contrasting_case: { case_a: { code: 'let score = 10;\nfunction reset() { score = 0; }\nreset();\nconsole.log(score);', output: '0', label: 'Modifies outer' }, case_b: { code: 'let score = 10;\nfunction reset() { let score = 0; }\nreset();\nconsole.log(score);', output: '10', label: 'Shadows outer' } } },
    { id: 'async-001', concept_id: 'promises', name: 'fetch returns data directly', description: 'Tries to use response without await', trigger_answer: 'Response data immediately', remediation_strategy: 'Step through event loop — fetch SCHEDULES work, returns promise immediately', contrasting_case: null },
];

const diagnosticQuestions = [
    { id: 'diag-scope-001', concept_id: 'scope', code_snippet: 'let score = 10;\nfunction reset() {\n  let score = 0;\n}\nreset();\nconsole.log(score);', prompt: 'What does this code print?', correct_answer: '10', distractors: [{ answer: '0', misconception_id: 'scope-001' }, { answer: 'undefined', misconception_id: 'scope-002' }, { answer: 'Error', misconception_id: null }] },
    { id: 'diag-async-001', concept_id: 'promises', code_snippet: 'const result = fetch("/api/data");\nconsole.log(result);', prompt: 'What gets logged?', correct_answer: 'Promise {<pending>}', distractors: [{ answer: 'The API response data', misconception_id: 'async-001' }, { answer: 'undefined', misconception_id: null }, { answer: 'Error: fetch is not defined', misconception_id: null }] },
];

// Generate SQL
console.log('-- Migration 006: Seed Curriculum v1');
console.log('-- Avaia JavaScript Web Development Curriculum');
console.log('-- Generated: ' + new Date().toISOString());
console.log('');

// Concepts
console.log('-- =============================================================================');
console.log('-- Concepts (' + concepts.length + ' total)');
console.log('-- =============================================================================');
console.log('');
for (const c of concepts) {
    const prereqs = JSON.stringify(c.prerequisites);
    const sandbox = (c as any).sandbox_id || null;
    console.log(`INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES (${esc(c.id)}, ${esc(c.name)}, ${esc(c.category)}, ${esc(c.cluster)}, ${esc(prereqs)}, ${esc(sandbox)});`);
}
console.log('');

// Misconceptions
console.log('-- =============================================================================');
console.log('-- Misconceptions (' + misconceptions.length + ' total)');
console.log('-- =============================================================================');
console.log('');
for (const m of misconceptions) {
    const contrasting = m.contrasting_case ? JSON.stringify(m.contrasting_case) : null;
    console.log(`INSERT OR REPLACE INTO misconception (id, concept_id, name, description, trigger_answer, remediation_strategy, contrasting_case) VALUES (${esc(m.id)}, ${esc(m.concept_id)}, ${esc(m.name)}, ${esc(m.description)}, ${esc(m.trigger_answer)}, ${esc(m.remediation_strategy)}, ${esc(contrasting)});`);
}
console.log('');

// Diagnostics
console.log('-- =============================================================================');
console.log('-- Diagnostic Questions (' + diagnosticQuestions.length + ' total)');
console.log('-- =============================================================================');
console.log('');
for (const q of diagnosticQuestions) {
    console.log(`INSERT OR REPLACE INTO diagnostic_question (id, concept_id, code_snippet, prompt, correct_answer, distractors) VALUES (${esc(q.id)}, ${esc(q.concept_id)}, ${esc(q.code_snippet)}, ${esc(q.prompt)}, ${esc(q.correct_answer)}, ${esc(JSON.stringify(q.distractors))});`);
}
console.log('');

console.log('-- End of seed data');
