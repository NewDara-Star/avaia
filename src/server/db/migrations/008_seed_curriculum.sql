-- Migration 006: Seed Curriculum v1
-- Avaia JavaScript Web Development Curriculum
-- Generated: 2026-01-19T18:33:19.619Z

-- =============================================================================
-- Concepts (35 total)
-- =============================================================================

INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('dom-manipulation', 'DOM Manipulation', 'DOM & Events', 'dom-selection', '[]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('events', 'Event Listeners', 'DOM & Events', 'event-handling', '["dom-manipulation"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('event-delegation', 'Event Delegation', 'DOM & Events', 'event-handling', '["events"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('functions', 'Functions', 'Functions', NULL, '[]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('scope', 'Scope', 'Functions', 'variable-declarations', '["functions"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('closures', 'Closures', 'Functions', NULL, '["scope"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('arrays', 'Arrays', 'Data Structures', 'array-methods', '[]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('objects', 'Objects', 'Data Structures', NULL, '["arrays"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('conditionals', 'Conditionals', 'Control Flow', NULL, '[]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('loops', 'Loops', 'Control Flow', 'loop-constructs', '["conditionals"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('state-management', 'State Management', 'Architecture', NULL, '["objects"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('settimeout', 'setTimeout', 'Async', 'async-patterns', '["functions","scope"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('localstorage', 'localStorage', 'Browser APIs', 'storage-options', '["objects"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('array-map', 'Array.map()', 'Data Structures', 'array-methods', '["arrays","functions"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('array-filter', 'Array.filter()', 'Data Structures', 'array-methods', '["arrays","functions"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('array-find', 'Array.find()', 'Data Structures', 'array-methods', '["arrays","functions"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('array-foreach', 'Array.forEach()', 'Data Structures', 'array-methods', '["arrays","functions"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('form-handling', 'Form Handling', 'DOM & Events', NULL, '["events","dom-manipulation"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('template-literals', 'Template Literals', 'JavaScript Core', NULL, '[]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('data-attributes', 'Data Attributes', 'DOM & Events', NULL, '["dom-manipulation"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('callbacks', 'Callbacks', 'Async', 'async-patterns', '["functions"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('event-loop', 'Event Loop', 'Async', 'async-patterns', '["settimeout"]', 'sandbox-event-loop');
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('promises', 'Promises', 'Async', 'async-patterns', '["event-loop","callbacks"]', 'sandbox-callback-hell');
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('async-await', 'async/await', 'Async', 'async-patterns', '["promises"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('fetch', 'fetch API', 'APIs', NULL, '["promises"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('try-catch', 'try/catch', 'Error Handling', NULL, '["async-await"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('race-conditions', 'Race Conditions', 'Async', NULL, '["promises"]', 'sandbox-race-condition');
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('debouncing', 'Debouncing', 'Performance', NULL, '["settimeout","events"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('sql', 'SQL', 'Database', NULL, '[]', 'sandbox-json-database');
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('nodejs', 'Node.js', 'Backend', NULL, '[]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('express', 'Express', 'Backend', NULL, '["nodejs"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('hashing', 'Password Hashing', 'Security', NULL, '[]', 'sandbox-localstorage-password');
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('sessions', 'Sessions', 'Auth', 'auth-strategies', '["hashing"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('jwt', 'JWT', 'Auth', 'auth-strategies', '["hashing"]', NULL);
INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id) VALUES ('websockets', 'WebSockets', 'Real-time', NULL, '["nodejs"]', 'sandbox-polling');

-- =============================================================================
-- Misconceptions (5 total)
-- =============================================================================

INSERT OR REPLACE INTO misconception (id, concept_id, name, description, trigger_answer, remediation_strategy, contrasting_case) VALUES ('dom-001', 'dom-manipulation', 'DOM vs HTML', 'DOM and HTML are the same thing', 'The DOM is just the HTML file', 'Show: HTML is static text file, DOM is live object tree. Change DOM via JS, HTML file unchanged.', NULL);
INSERT OR REPLACE INTO misconception (id, concept_id, name, description, trigger_answer, remediation_strategy, contrasting_case) VALUES ('dom-002', 'dom-manipulation', 'appendChild copies', 'appendChild copies the element', 'Expects element to appear twice', 'Show: appendChild MOVES element. To copy, use cloneNode(true) first.', NULL);
INSERT OR REPLACE INTO misconception (id, concept_id, name, description, trigger_answer, remediation_strategy, contrasting_case) VALUES ('event-001', 'events', 'Event bubbling', 'Events only fire on clicked element', 'The parent handler won''t run', 'Show: click child, parent handler fires. Diagram bubbling up the tree.', NULL);
INSERT OR REPLACE INTO misconception (id, concept_id, name, description, trigger_answer, remediation_strategy, contrasting_case) VALUES ('scope-001', 'scope', 'Inner let modifies outer', 'Believes inner let modifies outer variable', '0', 'Show two scopes side by side, trace variable lookup', '{"case_a":{"code":"let score = 10;\nfunction reset() { score = 0; }\nreset();\nconsole.log(score);","output":"0","label":"Modifies outer"},"case_b":{"code":"let score = 10;\nfunction reset() { let score = 0; }\nreset();\nconsole.log(score);","output":"10","label":"Shadows outer"}}');
INSERT OR REPLACE INTO misconception (id, concept_id, name, description, trigger_answer, remediation_strategy, contrasting_case) VALUES ('async-001', 'promises', 'fetch returns data directly', 'Tries to use response without await', 'Response data immediately', 'Step through event loop — fetch SCHEDULES work, returns promise immediately', NULL);

-- =============================================================================
-- Diagnostic Questions (2 total)
-- =============================================================================

INSERT OR REPLACE INTO diagnostic_question (id, concept_id, code_snippet, prompt, correct_answer, distractors) VALUES ('diag-scope-001', 'scope', 'let score = 10;
function reset() {
  let score = 0;
}
reset();
console.log(score);', 'What does this code print?', '10', '[{"answer":"0","misconception_id":"scope-001"},{"answer":"undefined","misconception_id":"scope-002"},{"answer":"Error","misconception_id":null}]');
INSERT OR REPLACE INTO diagnostic_question (id, concept_id, code_snippet, prompt, correct_answer, distractors) VALUES ('diag-async-001', 'promises', 'const result = fetch("/api/data");
console.log(result);', 'What gets logged?', 'Promise {<pending>}', '[{"answer":"The API response data","misconception_id":"async-001"},{"answer":"undefined","misconception_id":null},{"answer":"Error: fetch is not defined","misconception_id":null}]');

-- End of seed data
