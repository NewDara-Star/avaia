/**
 * Database Seeder
 * Populates the database with curriculum content: concepts, misconceptions, sandboxes, diagnostics
 * All data from data set.md and avaia-curriculum-v4.md
 */

import { getDatabase, runMigrations, toJson } from './db/index.js';

// =============================================================================
// Seed Data
// =============================================================================

const concepts = [
    // Project 1: Memory Game
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

    // Project 2: Task Tracker
    { id: 'array-map', name: 'Array.map()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'array-filter', name: 'Array.filter()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'array-find', name: 'Array.find()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'array-foreach', name: 'Array.forEach()', category: 'Data Structures', cluster: 'array-methods', prerequisites: ['arrays', 'functions'] },
    { id: 'form-handling', name: 'Form Handling', category: 'DOM & Events', cluster: null, prerequisites: ['events', 'dom-manipulation'] },
    { id: 'template-literals', name: 'Template Literals', category: 'JavaScript Core', cluster: null, prerequisites: [] },
    { id: 'data-attributes', name: 'Data Attributes', category: 'DOM & Events', cluster: null, prerequisites: ['dom-manipulation'] },

    // Project 3: Weather Dashboard
    { id: 'callbacks', name: 'Callbacks', category: 'Async', cluster: 'async-patterns', prerequisites: ['functions'] },
    { id: 'event-loop', name: 'Event Loop', category: 'Async', cluster: 'async-patterns', prerequisites: ['settimeout'], sandbox_id: 'sandbox-event-loop' },
    { id: 'promises', name: 'Promises', category: 'Async', cluster: 'async-patterns', prerequisites: ['event-loop', 'callbacks'], sandbox_id: 'sandbox-callback-hell' },
    { id: 'async-await', name: 'async/await', category: 'Async', cluster: 'async-patterns', prerequisites: ['promises'] },
    { id: 'fetch', name: 'fetch API', category: 'APIs', cluster: null, prerequisites: ['promises'] },
    { id: 'try-catch', name: 'try/catch', category: 'Error Handling', cluster: null, prerequisites: ['async-await'] },
    { id: 'race-conditions', name: 'Race Conditions', category: 'Async', cluster: null, prerequisites: ['promises'], sandbox_id: 'sandbox-race-condition' },
    { id: 'debouncing', name: 'Debouncing', category: 'Performance', cluster: null, prerequisites: ['settimeout', 'events'] },

    // Project 4a: API Server
    { id: 'sql', name: 'SQL', category: 'Database', cluster: null, prerequisites: [], sandbox_id: 'sandbox-json-database' },
    { id: 'nodejs', name: 'Node.js', category: 'Backend', cluster: null, prerequisites: [] },
    { id: 'express', name: 'Express', category: 'Backend', cluster: null, prerequisites: ['nodejs'] },

    // Project 4b: Auth Deep Dive
    { id: 'hashing', name: 'Password Hashing', category: 'Security', cluster: null, prerequisites: [], sandbox_id: 'sandbox-localstorage-password' },
    { id: 'sessions', name: 'Sessions', category: 'Auth', cluster: 'auth-strategies', prerequisites: ['hashing'] },
    { id: 'jwt', name: 'JWT', category: 'Auth', cluster: 'auth-strategies', prerequisites: ['hashing'] },

    // Project 5: Real-time Chat
    { id: 'websockets', name: 'WebSockets', category: 'Real-time', cluster: null, prerequisites: ['nodejs'], sandbox_id: 'sandbox-polling' },
];

// All misconceptions from data set.md
const misconceptions = [
    // DOM Manipulation
    { id: 'dom-001', concept_id: 'dom-manipulation', name: 'DOM vs HTML', description: 'DOM and HTML are the same thing', trigger_answer: 'The DOM is just the HTML file', remediation_strategy: 'Show: HTML is static text file, DOM is live object tree. Change DOM via JS, HTML file unchanged.', contrasting_case: null },
    { id: 'dom-002', concept_id: 'dom-manipulation', name: 'appendChild copies', description: 'appendChild copies the element', trigger_answer: 'Expects element to appear twice', remediation_strategy: 'Show: appendChild MOVES element. To copy, use cloneNode(true) first.', contrasting_case: null },
    { id: 'dom-003', concept_id: 'dom-manipulation', name: 'innerHTML vs textContent', description: 'innerHTML and textContent are interchangeable', trigger_answer: 'Uses innerHTML for user input', remediation_strategy: 'Show: innerHTML parses HTML tags, textContent is safe. Script injection demo.', contrasting_case: null },
    { id: 'dom-004', concept_id: 'dom-manipulation', name: 'querySelector returns all', description: 'querySelector returns all matches', trigger_answer: 'Expects array, gets single element', remediation_strategy: 'Show: querySelector = first match, querySelectorAll = NodeList of all.', contrasting_case: null },

    // Events
    { id: 'event-001', concept_id: 'events', name: 'Event bubbling', description: 'Events only fire on clicked element', trigger_answer: 'The parent handler won\'t run', remediation_strategy: 'Show: click child, parent handler fires. Diagram bubbling up the tree.', contrasting_case: null },
    { id: 'event-002', concept_id: 'events', name: 'this in handlers', description: 'this always refers to function owner', trigger_answer: 'this is the card object', remediation_strategy: 'Show: in event handler, this = element that triggered. Arrow functions don\'t bind this.', contrasting_case: null },
    { id: 'event-003', concept_id: 'events', name: 'removeEventListener', description: 'Can remove listener with anonymous function', trigger_answer: 'Expects removal to work', remediation_strategy: 'Show: must pass same function reference. Store function in variable.', contrasting_case: null },
    { id: 'event-004', concept_id: 'events', name: 'preventDefault', description: 'preventDefault stops event bubbling', trigger_answer: 'Confuses with stopPropagation', remediation_strategy: 'Show: preventDefault stops default action, stopPropagation stops bubbling.', contrasting_case: null },

    // State & Variables
    { id: 'state-001', concept_id: 'state-management', name: 'State vs UI', description: 'UI is the source of truth', trigger_answer: 'Reads flipped status from DOM classes', remediation_strategy: 'Show: DOM can desync. State object is authoritative. UI reflects state, not vice versa.', contrasting_case: null },
    { id: 'scope-001', concept_id: 'scope', name: 'Inner let modifies outer', description: 'Believes inner let modifies outer variable', trigger_answer: '0', remediation_strategy: 'Show two scopes side by side, trace variable lookup', contrasting_case: { case_a: { code: 'let score = 10;\nfunction reset() { score = 0; }\nreset();\nconsole.log(score);', output: '0', label: 'Modifies outer' }, case_b: { code: 'let score = 10;\nfunction reset() { let score = 0; }\nreset();\nconsole.log(score);', output: '10', label: 'Shadows outer' } } },
    { id: 'scope-002', concept_id: 'scope', name: 'var hoisting', description: 'var declarations aren\'t hoisted', trigger_answer: 'Predicts ReferenceError', remediation_strategy: 'Show: var hoisted (undefined), let has TDZ.', contrasting_case: null },
    { id: 'scope-003', concept_id: 'scope', name: 'Block scope', description: 'var respects block scope', trigger_answer: 'Expects var in if-block to be scoped', remediation_strategy: 'Show: var leaks out of blocks, let doesn\'t.', contrasting_case: null },

    // setTimeout
    { id: 'timeout-001', concept_id: 'settimeout', name: 'setTimeout is blocking', description: 'setTimeout pauses execution', trigger_answer: 'Code after setTimeout waits', remediation_strategy: 'Show: setTimeout schedules, returns immediately. Code continues.', contrasting_case: null },
    { id: 'timeout-002', concept_id: 'settimeout', name: 'Loop + setTimeout', description: 'Each iteration gets its own i value with var', trigger_answer: 'Expects 0,1,2 but gets 3,3,3', remediation_strategy: 'Contrasting case: var vs let in loop. Closure captures reference vs value.', contrasting_case: null },
    { id: 'timeout-003', concept_id: 'settimeout', name: 'setTimeout(fn(), 1000)', description: 'Parentheses are optional', trigger_answer: 'fn() executes immediately', remediation_strategy: 'Show: fn = reference, fn() = invocation. Pass reference, not result.', contrasting_case: null },

    // Array Methods
    { id: 'array-001', concept_id: 'array-map', name: 'map and forEach interchangeable', description: 'Uses map but ignores return value', trigger_answer: 'Uses map for side effects', remediation_strategy: 'Show: map returns new array, forEach returns undefined', contrasting_case: { case_a: { code: 'const result = [1,2,3].map(x => console.log(x));\nconsole.log(result);', output: '[undefined, undefined, undefined]', label: 'map returns' }, case_b: { code: 'const result = [1,2,3].forEach(x => console.log(x));\nconsole.log(result);', output: 'undefined', label: 'forEach returns' } } },
    { id: 'array-002', concept_id: 'array-filter', name: 'filter mutates', description: 'filter modifies original array', trigger_answer: 'Expects original to shrink', remediation_strategy: 'Show: filter returns NEW array. Original unchanged.', contrasting_case: null },
    { id: 'array-003', concept_id: 'array-find', name: 'find vs filter', description: 'find returns array of matches', trigger_answer: 'Expects array, gets single item', remediation_strategy: 'Show: find = first match (or undefined), filter = all matches (array).', contrasting_case: null },
    { id: 'array-004', concept_id: 'arrays', name: 'indexOf with objects', description: 'indexOf works with object contents', trigger_answer: 'Expects match, gets -1', remediation_strategy: 'Show: indexOf uses ===, objects compared by reference. Use findIndex with callback.', contrasting_case: null },
    { id: 'array-005', concept_id: 'arrays', name: 'splice vs slice', description: 'slice mutates original', trigger_answer: 'Expects original to change', remediation_strategy: 'Show: slice = copy portion (non-mutating), splice = remove/insert (mutating).', contrasting_case: null },

    // Event Delegation
    { id: 'delegation-001', concept_id: 'event-delegation', name: 'event.target', description: 'event.target is always element with listener', trigger_answer: 'Gets child element, expects parent', remediation_strategy: 'Show: target = actual clicked element, currentTarget = element with listener.', contrasting_case: null },
    { id: 'delegation-002', concept_id: 'event-delegation', name: 'Dynamic elements', description: 'Listeners on parent don\'t work for new children', trigger_answer: 'I need to re-add listeners', remediation_strategy: 'Show: delegation works for future elements. Check target in handler.', contrasting_case: null },

    // localStorage
    { id: 'storage-001', concept_id: 'localstorage', name: 'localStorage types', description: 'localStorage stores objects directly', trigger_answer: 'Stores object, gets [object Object]', remediation_strategy: 'Show: localStorage only stores strings. JSON.stringify to save, JSON.parse to load.', contrasting_case: null },
    { id: 'storage-002', concept_id: 'localstorage', name: 'localStorage sync', description: 'localStorage updates automatically sync to variable', trigger_answer: 'Expects variable to update', remediation_strategy: 'Show: must re-read from storage. Storage event only fires in OTHER tabs.', contrasting_case: null },

    // Promises & Async
    { id: 'async-001', concept_id: 'promises', name: 'fetch returns data directly', description: 'Tries to use response without await', trigger_answer: 'Response data immediately', remediation_strategy: 'Step through event loop — fetch SCHEDULES work, returns promise immediately', contrasting_case: { case_a: { code: 'const data = fetch("/api");\nconsole.log(data);', output: 'Promise {<pending>}', label: 'No await' }, case_b: { code: 'const response = await fetch("/api");\nconst data = await response.json();\nconsole.log(data);', output: '{actual data}', label: 'With await' } } },
    { id: 'async-002', concept_id: 'async-await', name: 'await blocks everything', description: 'await freezes the entire browser', trigger_answer: 'UI should freeze during await', remediation_strategy: 'Show: await yields control. Other code runs. Only this function waits.', contrasting_case: null },
    { id: 'async-003', concept_id: 'promises', name: 'Promise execution timing', description: 'Promise doesn\'t start until .then()', trigger_answer: 'Promise waits for me to consume it', remediation_strategy: 'Show: Promise executor runs immediately on creation. .then() just attaches handler.', contrasting_case: null },
    { id: 'async-004', concept_id: 'event-loop', name: 'Sync can use async result', description: 'Tries to use async result in sync code', trigger_answer: 'undefined', remediation_strategy: 'Trace execution order — sync completes before ANY callbacks run', contrasting_case: { case_a: { code: 'let data;\nfetch("/api").then(r => data = r);\nconsole.log(data);', output: 'undefined', label: 'Sync after async' }, case_b: { code: 'fetch("/api").then(r => {\n  const data = r;\n  console.log(data);\n});', output: '{data}', label: 'Inside callback' } } },
    { id: 'async-005', concept_id: 'try-catch', name: 'try/catch with promises', description: 'try/catch catches Promise rejections without await', trigger_answer: 'Expects catch to fire', remediation_strategy: 'Show: try/catch only works with await or in async function. Otherwise use .catch().', contrasting_case: null },
    { id: 'async-006', concept_id: 'promises', name: 'Promise.all failure', description: 'Promise.all continues if one fails', trigger_answer: 'Expects partial results', remediation_strategy: 'Show: Promise.all fails fast. One rejection = entire Promise.all rejects. Use Promise.allSettled.', contrasting_case: null },

    // HTTP & APIs
    { id: 'http-001', concept_id: 'fetch', name: '404 throws error', description: 'fetch throws on 404', trigger_answer: 'No try/catch because 404 is an error', remediation_strategy: 'Show: fetch only throws on network failure. 404 is successful response with status. Check response.ok.', contrasting_case: null },
    { id: 'http-002', concept_id: 'fetch', name: 'response.json()', description: 'response.json() is synchronous', trigger_answer: 'Forgets to await response.json()', remediation_strategy: 'Show: response.json() returns Promise. Need second await.', contrasting_case: null },
    { id: 'http-003', concept_id: 'fetch', name: 'CORS is server fault', description: 'CORS errors mean server is broken', trigger_answer: 'Fix your API', remediation_strategy: 'Show: CORS is browser security. Server must send headers. Not an error in server logic.', contrasting_case: null },
];

const diagnosticQuestions = [
    // Scope
    { id: 'diag-scope-001', concept_id: 'scope', code_snippet: 'let score = 10;\nfunction reset() {\n  let score = 0;\n}\nreset();\nconsole.log(score);', prompt: 'What does this code print?', correct_answer: '10', distractors: [{ answer: '0', misconception_id: 'scope-001' }, { answer: 'undefined', misconception_id: 'scope-002' }, { answer: 'Error', misconception_id: null }] },
    { id: 'diag-scope-002', concept_id: 'scope', code_snippet: 'console.log(x);\nvar x = 5;', prompt: 'What does this code print?', correct_answer: 'undefined', distractors: [{ answer: '5', misconception_id: null }, { answer: 'ReferenceError', misconception_id: 'scope-002' }, { answer: 'null', misconception_id: null }] },
    { id: 'diag-scope-003', concept_id: 'scope', code_snippet: 'if (true) {\n  var x = 5;\n}\nconsole.log(x);', prompt: 'What does this code print?', correct_answer: '5', distractors: [{ answer: 'undefined', misconception_id: 'scope-003' }, { answer: 'ReferenceError', misconception_id: 'scope-003' }, { answer: 'Error', misconception_id: null }] },

    // Promises
    { id: 'diag-async-001', concept_id: 'promises', code_snippet: 'const result = fetch("/api/data");\nconsole.log(result);', prompt: 'What gets logged?', correct_answer: 'Promise {<pending>}', distractors: [{ answer: 'The API response data', misconception_id: 'async-001' }, { answer: 'undefined', misconception_id: null }, { answer: 'Error: fetch is not defined', misconception_id: null }] },
    { id: 'diag-async-002', concept_id: 'promises', code_snippet: 'new Promise((resolve) => {\n  console.log("A");\n  resolve();\n}).then(() => console.log("B"));\nconsole.log("C");', prompt: 'What is the output order?', correct_answer: 'A, C, B', distractors: [{ answer: 'A, B, C', misconception_id: 'async-003' }, { answer: 'C, A, B', misconception_id: null }, { answer: 'B, A, C', misconception_id: null }] },

    // Event Loop
    { id: 'diag-eventloop-001', concept_id: 'event-loop', code_snippet: 'let data;\nfetch("/api").then(r => data = r);\nconsole.log(data);', prompt: 'What gets logged?', correct_answer: 'undefined', distractors: [{ answer: 'The response object', misconception_id: 'async-004' }, { answer: 'null', misconception_id: null }, { answer: 'Promise', misconception_id: null }] },

    // Array Methods
    { id: 'diag-array-001', concept_id: 'array-map', code_snippet: 'const nums = [1, 2, 3];\nconst doubled = nums.map(n => n * 2);\nconsole.log(nums);', prompt: 'What does nums contain after this code runs?', correct_answer: '[1, 2, 3]', distractors: [{ answer: '[2, 4, 6]', misconception_id: 'array-002' }, { answer: 'undefined', misconception_id: null }, { answer: 'Error', misconception_id: null }] },
    { id: 'diag-array-002', concept_id: 'array-filter', code_snippet: 'const arr = [1, 2, 3, 4];\narr.filter(x => x > 2);\nconsole.log(arr);', prompt: 'What does arr contain?', correct_answer: '[1, 2, 3, 4]', distractors: [{ answer: '[3, 4]', misconception_id: 'array-002' }, { answer: '[]', misconception_id: null }, { answer: 'undefined', misconception_id: null }] },
    { id: 'diag-array-003', concept_id: 'array-find', code_snippet: 'const users = [{name: "Alice"}, {name: "Bob"}];\nconst result = users.find(u => u.name === "Bob");', prompt: 'What is result?', correct_answer: '{name: "Bob"}', distractors: [{ answer: '[{name: "Bob"}]', misconception_id: 'array-003' }, { answer: '1 (index)', misconception_id: null }, { answer: 'true', misconception_id: null }] },

    // DOM
    { id: 'diag-dom-001', concept_id: 'dom-manipulation', code_snippet: 'const items = document.querySelector(".item");\nconsole.log(typeof items);', prompt: 'What is logged if there are 3 .item elements?', correct_answer: 'object (one element)', distractors: [{ answer: 'array (NodeList)', misconception_id: 'dom-004' }, { answer: 'undefined', misconception_id: null }, { answer: 'number (3)', misconception_id: null }] },

    // Events
    { id: 'diag-event-001', concept_id: 'events', code_snippet: 'button.addEventListener("click", () => console.log(this));', prompt: 'In a browser, what is "this" inside the arrow function?', correct_answer: 'Window object', distractors: [{ answer: 'The button element', misconception_id: 'event-002' }, { answer: 'undefined', misconception_id: null }, { answer: 'The event object', misconception_id: null }] },

    // setTimeout
    { id: 'diag-timeout-001', concept_id: 'settimeout', code_snippet: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}', prompt: 'What gets logged?', correct_answer: '3, 3, 3', distractors: [{ answer: '0, 1, 2', misconception_id: 'timeout-002' }, { answer: '2, 2, 2', misconception_id: null }, { answer: 'undefined, undefined, undefined', misconception_id: null }] },
    { id: 'diag-timeout-002', concept_id: 'settimeout', code_snippet: 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nconsole.log("C");', prompt: 'What is the output order?', correct_answer: 'A, C, B', distractors: [{ answer: 'A, B, C', misconception_id: 'timeout-001' }, { answer: 'C, A, B', misconception_id: null }, { answer: 'B, A, C', misconception_id: null }] },

    // localStorage
    { id: 'diag-storage-001', concept_id: 'localstorage', code_snippet: 'const user = {name: "Alice"};\nlocalStorage.setItem("user", user);\nconsole.log(localStorage.getItem("user"));', prompt: 'What gets logged?', correct_answer: '[object Object]', distractors: [{ answer: '{name: "Alice"}', misconception_id: 'storage-001' }, { answer: 'undefined', misconception_id: null }, { answer: 'null', misconception_id: null }] },

    // fetch
    { id: 'diag-fetch-001', concept_id: 'fetch', code_snippet: 'fetch("/nonexistent-page").then(r => console.log(r.status));', prompt: 'If the page returns 404, does this throw an error?', correct_answer: 'No, logs 404', distractors: [{ answer: 'Yes, throws FetchError', misconception_id: 'http-001' }, { answer: 'Logs undefined', misconception_id: null }, { answer: 'Logs "Not Found"', misconception_id: null }] },
];

// All 6 sandboxes from data set.md
const sandboxes = [
    {
        id: 'sandbox-event-loop',
        concept_id: 'event-loop',
        problem_statement: `Make JavaScript wait 3 seconds before printing "Done" to the console.

Rules:
- Try at least 3 DIFFERENT approaches
- For each approach, write down: What did you try? What happened?
- Don't search for the answer — the goal is to discover why your approaches fail`,
        setup_code: null,
        expected_failures: [
            { id: 'blocking-while', description: 'While loop checking Date.now()', code_pattern: 'while.*Date\\.now\\(\\)', learner_symptoms: ['Browser froze', 'Page unresponsive', 'Couldn\'t click'], is_correct_failure: true },
            { id: 'busy-wait', description: 'For loop counting high', code_pattern: 'for.*i\\s*<\\s*\\d{6,}', learner_symptoms: ['Page slow', 'CPU high'], is_correct_failure: true },
            { id: 'setTimeout-outside', description: 'setTimeout but log outside', code_pattern: 'setTimeout.*\\n.*console\\.log', learner_symptoms: ['Printed immediately'], is_correct_failure: true },
        ],
        min_attempts: 2,
        reflection_questions: ['Why did the while loop freeze the browser?', 'Why did setTimeout with log outside print immediately?', 'What does this tell you about how JavaScript executes code?'],
        teaching_transition: 'Your browser froze because JavaScript is single-threaded. While that loop ran, NOTHING else could happen. This is why JavaScript has the Event Loop...',
    },
    {
        id: 'sandbox-callback-hell',
        concept_id: 'promises',
        problem_statement: `Simulate three API calls using setTimeout (each takes 1 second):
1. Get user data
2. Using user ID, get their posts
3. Using first post ID, get comments

Print the final comments. Use ONLY callbacks.`,
        setup_code: 'function fakeAPI(endpoint, callback) {\n  setTimeout(() => callback({ data: endpoint }), 1000);\n}',
        expected_failures: [
            { id: 'callback-pyramid', description: 'Nested callbacks 3+ levels', code_pattern: null, learner_symptoms: ['Code is ugly', 'Hard to read', 'Pyramid shape'], is_correct_failure: true },
            { id: 'error-nightmare', description: 'Can\'t handle errors', code_pattern: null, learner_symptoms: ['How do I handle errors?', 'try/catch doesn\'t work'], is_correct_failure: true },
        ],
        min_attempts: 1,
        reflection_questions: ['How many levels of nesting?', 'How would you handle an error in step 2?', 'Would you want to maintain this code?'],
        teaching_transition: 'This is Callback Hell. Promises flatten this structure and give you consistent error handling...',
    },
    {
        id: 'sandbox-race-condition',
        concept_id: 'race-conditions',
        problem_statement: `Build a page with two buttons: "London Weather" and "Tokyo Weather". Display result in one div.

Test:
1. Click London, wait, click Tokyo
2. Click London then immediately Tokyo
3. Click Tokyo then immediately London (London is faster)`,
        setup_code: 'async function fakeWeatherAPI(city) {\n  const delay = city === "London" ? 500 : 2000;\n  await new Promise(r => setTimeout(r, delay));\n  return { city, temp: Math.floor(Math.random() * 30) };\n}',
        expected_failures: [
            { id: 'last-response-wins', description: 'Wrong city displayed', code_pattern: null, learner_symptoms: ['Shows wrong city', 'London appeared but clicked Tokyo'], is_correct_failure: true },
        ],
        min_attempts: 1,
        reflection_questions: ['In scenario 3, which city appears? Expected?', 'Is last-response-wins same as last-click-wins?', 'How to ensure display matches LAST CLICK?'],
        teaching_transition: 'This is a race condition. Solutions: request ID, AbortController, or Promise.all...',
    },
    {
        id: 'sandbox-json-database',
        concept_id: 'sql',
        problem_statement: `Store this data in a JSON file:
- Users: id, name, email, city
- Posts: id, title, body, authorId

Create at least 3 users (one from Dublin) and 5 posts.

Now write JavaScript functions for these queries:
1. Find all posts by users from Dublin
2. Find all users who have written more than 2 posts
3. Update a user's city and make sure their posts still work

Write down: How did you structure the JSON? How complex was each query?`,
        setup_code: null,
        expected_failures: [
            { id: 'data-duplication', description: 'Stores full user data in each post', code_pattern: 'posts.*author.*name|posts.*author.*email', learner_symptoms: ['I stored user info in each post', 'Data is duplicated', 'Updating user means updating all posts'], is_correct_failure: true },
            { id: 'nested-loops', description: 'Query #1 requires nested loops', code_pattern: 'for.*for|forEach.*forEach|\\.filter.*\\.filter', learner_symptoms: ['Had to loop twice', 'O(n²) complexity', 'Code is slow/ugly'], is_correct_failure: true },
            { id: 'manual-joins', description: 'Had to manually connect users and posts', code_pattern: null, learner_symptoms: ['Had to look up user for each post', 'No automatic way to join'], is_correct_failure: true },
            { id: 'update-nightmare', description: 'Updating user city is complex', code_pattern: null, learner_symptoms: ['Had to update in multiple places', 'Easy to miss a spot', 'Data could get out of sync'], is_correct_failure: true },
        ],
        min_attempts: 1,
        reflection_questions: ['How much data is duplicated in your structure?', 'How many loops did you need for the Dublin query?', 'If you update a user\'s email, how many places need to change?', 'What happens if two requests try to write the file at the same time?'],
        teaching_transition: 'Every problem you just hit is solved by relational databases: Normalization eliminates duplication, JOINs replace nested loops, Foreign keys ensure consistency, Transactions handle concurrent writes. Let me show you SQL...',
    },
    {
        id: 'sandbox-localstorage-password',
        concept_id: 'hashing',
        problem_statement: `Build a simple login system:
1. A "Register" form that saves username and password
2. A "Login" form that checks if credentials match

Store the credentials in localStorage.

After you build it:
1. Register a user with username "admin" and password "secret123"
2. Open DevTools (F12)
3. Go to Application tab → Local Storage
4. What do you see?`,
        setup_code: null,
        expected_failures: [
            { id: 'plaintext-visible', description: 'Password visible in DevTools', code_pattern: null, learner_symptoms: ['I can see the password!', 'It shows secret123', 'Anyone can read it'], is_correct_failure: true },
            { id: 'json-visible', description: 'Stored as JSON, still readable', code_pattern: null, learner_symptoms: ['It\'s in JSON but still readable', 'Encoding isn\'t hiding it'], is_correct_failure: true },
        ],
        min_attempts: 1,
        reflection_questions: ['Could anyone using this browser see the password?', 'If this were a server database that got hacked, what would attackers see?', 'Many people reuse passwords. What\'s the risk?', 'How do you think real systems store passwords?'],
        teaching_transition: 'You just discovered why we NEVER store passwords in plain text — not in localStorage, not in databases, not anywhere. If anyone gains access, they see everything. The solution is hashing: a one-way function that converts the password into a fixed-length string that can\'t be reversed. Let me show you bcrypt...',
    },
    {
        id: 'sandbox-polling',
        concept_id: 'websockets',
        problem_statement: `Build "real-time" chat by polling:

1. Create an endpoint GET /messages that returns all messages
2. In the browser, fetch /messages every 100ms
3. Display any new messages

Open the chat in two browser tabs. Send messages back and forth.

Now open DevTools → Network tab. Let it run for 30 seconds.
Count the requests. Calculate requests per minute.`,
        setup_code: null,
        expected_failures: [
            { id: 'request-flood', description: 'Hundreds of requests in Network tab', code_pattern: null, learner_symptoms: ['So many requests!', 'Network tab is flooded', '600 requests per minute'], is_correct_failure: true },
            { id: 'server-load', description: 'Realizes server load scales badly', code_pattern: null, learner_symptoms: ['What if 1000 users?', 'Server would die', '6 million requests per minute?!'], is_correct_failure: true },
            { id: 'battery-drain', description: 'Notices resource usage', code_pattern: null, learner_symptoms: ['Phone would die', 'CPU usage is high', 'Laptop fan turned on'], is_correct_failure: true },
            { id: 'still-not-instant', description: 'Notices latency', code_pattern: null, learner_symptoms: ['Still up to 100ms delay', 'Not truly instant', 'Can see the lag'], is_correct_failure: true },
        ],
        min_attempts: 1,
        reflection_questions: ['How many requests did you count in 30 seconds? Per minute?', 'If you have 1000 users polling every 100ms, how many requests per minute hit your server?', 'Is this truly "real-time"? What\'s the worst-case latency?', 'What would this do to mobile battery life?'],
        teaching_transition: 'Polling creates requests even when nothing changed. With 1000 users at 100ms: 10 requests/second × 1000 users = 10,000 requests/second. WebSockets solve this with a single persistent connection. The server pushes messages ONLY when they exist. Let me show you...',
    },
];

// =============================================================================
// Seed Function
// =============================================================================

async function seed() {
    console.log('Running migrations...');
    runMigrations();

    const db = getDatabase();

    console.log('Seeding concepts...');
    const insertConcept = db.prepare(`
    INSERT OR REPLACE INTO concept (id, name, category, cluster, prerequisites, sandbox_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    for (const c of concepts) {
        insertConcept.run(
            c.id,
            c.name,
            c.category,
            c.cluster,
            toJson(c.prerequisites),
            (c as { sandbox_id?: string }).sandbox_id || null
        );
    }
    console.log(`  Inserted ${concepts.length} concepts`);

    console.log('Seeding misconceptions...');
    const insertMisconception = db.prepare(`
    INSERT OR REPLACE INTO misconception (id, concept_id, name, description, trigger_answer, remediation_strategy, contrasting_case)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    for (const m of misconceptions) {
        insertMisconception.run(
            m.id,
            m.concept_id,
            m.name,
            m.description,
            m.trigger_answer,
            m.remediation_strategy,
            m.contrasting_case ? toJson(m.contrasting_case) : null
        );
    }
    console.log(`  Inserted ${misconceptions.length} misconceptions`);

    console.log('Seeding diagnostic questions...');
    const insertDiagnostic = db.prepare(`
    INSERT OR REPLACE INTO diagnostic_question (id, concept_id, code_snippet, prompt, correct_answer, distractors)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    for (const q of diagnosticQuestions) {
        insertDiagnostic.run(
            q.id,
            q.concept_id,
            q.code_snippet,
            q.prompt,
            q.correct_answer,
            toJson(q.distractors)
        );
    }
    console.log(`  Inserted ${diagnosticQuestions.length} diagnostic questions`);

    console.log('Seeding sandboxes...');
    const insertSandbox = db.prepare(`
    INSERT OR REPLACE INTO sandbox (id, concept_id, problem_statement, setup_code, expected_failures, min_attempts, reflection_questions, teaching_transition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const s of sandboxes) {
        insertSandbox.run(
            s.id,
            s.concept_id,
            s.problem_statement,
            s.setup_code,
            toJson(s.expected_failures),
            s.min_attempts,
            toJson(s.reflection_questions),
            s.teaching_transition
        );
    }
    console.log(`  Inserted ${sandboxes.length} sandboxes`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`   ${concepts.length} concepts`);
    console.log(`   ${misconceptions.length} misconceptions`);
    console.log(`   ${diagnosticQuestions.length} diagnostic questions`);
    console.log(`   ${sandboxes.length} sandboxes`);
}

export { seed };
