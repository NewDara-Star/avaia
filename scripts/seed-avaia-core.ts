/**
 * Avaia Core Curriculum Seeder (V4)
 * The ORIGINAL curriculum from /Users/Star/avaia/docs/avaia-curriculum-v4.md
 * 7 projects, 22-32 weeks, includes Sandbox Milestones
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

const avaiaCoreTrack = {
    id: 'avaia-core',
    name: 'Avaia Core Curriculum',
    description: '7 real-world projects from Memory Game to Capstone. Includes Productive Failure sandboxes before complex concepts (Event Loop, Promises, SQL, Hashing, WebSockets). 22-32 weeks to full-stack mastery.',
    language: 'javascript',
    domain: 'fullstack',
    difficulty: 'beginner',
    is_preseeded: true,
    created_by: 'system'
};

const projectTemplates = [
    {
        id: 'avaia_p1_memory_game',
        sequence_order: 1,
        name: 'Memory Game',
        description: 'Card matching game in browser. Core JavaScript through immediate visual feedback.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'Display Grid of Cards', description: 'Render 16 cards face-down', concepts: ['HTML structure', 'CSS Grid/Flexbox', 'Arrays', 'DOM manipulation'] },
            { id: 2, name: 'Flip Cards on Click', description: 'Click a card, it flips to reveal its face', concepts: ['Event listeners', 'Functions', 'CSS classes', 'this keyword'] },
            { id: 3, name: 'Track Game State', description: 'Remember which cards are flipped, check for matches', concepts: ['Variables for state', 'Objects', 'Conditionals', 'State vs UI'] },
            { id: 4, name: 'Complete Game Logic', description: 'Full game loop with matching, scoring, win condition', concepts: ['State machines', 'setTimeout', 'Loops', 'Score tracking'] },
            { id: 5, name: 'Polish and Deploy', description: 'Animations, difficulty levels, high scores, deployment', concepts: ['CSS animations', 'localStorage', 'Configuration', 'Deployment'] }
        ],
        concepts: [
            { id: 'html_structure', name: 'HTML Structure', milestone: 1, relationship: 'introduces' },
            { id: 'css_grid_flexbox', name: 'CSS Grid/Flexbox', milestone: 1, relationship: 'introduces' },
            { id: 'arrays_basics', name: 'Arrays', milestone: 1, relationship: 'introduces' },
            { id: 'dom_manipulation', name: 'DOM Manipulation', milestone: 1, relationship: 'introduces' },
            { id: 'event_listeners', name: 'Event Listeners', milestone: 2, relationship: 'introduces' },
            { id: 'functions_basics', name: 'Functions', milestone: 2, relationship: 'introduces' },
            { id: 'css_classes', name: 'CSS Classes', milestone: 2, relationship: 'introduces' },
            { id: 'this_keyword_intro', name: 'this Keyword', milestone: 2, relationship: 'introduces' },
            { id: 'variables_state', name: 'Variables for State', milestone: 3, relationship: 'introduces' },
            { id: 'objects_basics', name: 'Objects', milestone: 3, relationship: 'introduces' },
            { id: 'conditionals', name: 'Conditionals', milestone: 3, relationship: 'introduces' },
            { id: 'state_vs_ui', name: 'State vs UI', milestone: 3, relationship: 'introduces' },
            { id: 'state_machines', name: 'State Machines', milestone: 4, relationship: 'introduces' },
            { id: 'settimeout_basics', name: 'setTimeout', milestone: 4, relationship: 'introduces' },
            { id: 'loops_basics', name: 'Loops', milestone: 4, relationship: 'introduces' },
            { id: 'css_animations', name: 'CSS Animations', milestone: 5, relationship: 'introduces' },
            { id: 'localstorage_basics', name: 'localStorage', milestone: 5, relationship: 'introduces' },
            { id: 'deployment_basics', name: 'Deployment', milestone: 5, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_dom_is_state', concept: 'state_vs_ui', belief: 'I can just look at the DOM to know game state', reality: 'DOM is display layer. State should be in JS variables. Query DOM for reading state = fragile code.' },
            { id: 'mis_settimeout_blocks', concept: 'settimeout_basics', belief: 'setTimeout pauses code execution', reality: 'setTimeout schedules callback; code continues immediately. This is the Event Loop.' }
        ]
    },
    {
        id: 'avaia_p2_task_tracker',
        sequence_order: 2,
        name: 'Task Tracker',
        description: 'Todo app with CRUD operations and local persistence.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'Display and Add Tasks', description: 'Show task list, add new tasks via form', concepts: ['Form handling', 'Array methods (push, map)', 'Template literals', 'Input validation'] },
            { id: 2, name: 'Delete and Complete Tasks', description: 'Remove tasks, mark as complete', concepts: ['Event delegation', 'filter/find/findIndex', 'Data attributes', 'Immutable updates'] },
            { id: 3, name: 'Edit Tasks', description: 'Modify existing task text', concepts: ['UI modes (view/edit)', 'contentEditable', 'Blur event', 'Optimistic UI'] },
            { id: 4, name: 'Persistence with localStorage', description: 'Tasks survive page refresh', concepts: ['localStorage API', 'JSON stringify/parse', 'Data hydration', 'Storage events'] },
            { id: 5, name: 'Categories and Filters', description: 'Organize tasks by category, filter view', concepts: ['Data modeling', 'Filter functions', 'Active state', 'Derived state'] }
        ],
        concepts: [
            { id: 'form_handling', name: 'Form Handling', milestone: 1, relationship: 'introduces' },
            { id: 'array_push_map', name: 'Array push/map', milestone: 1, relationship: 'introduces' },
            { id: 'template_literals', name: 'Template Literals', milestone: 1, relationship: 'introduces' },
            { id: 'input_validation', name: 'Input Validation', milestone: 1, relationship: 'introduces' },
            { id: 'event_delegation_avaia', name: 'Event Delegation', milestone: 2, relationship: 'introduces' },
            { id: 'array_filter_find', name: 'filter/find/findIndex', milestone: 2, relationship: 'introduces' },
            { id: 'data_attributes', name: 'Data Attributes', milestone: 2, relationship: 'introduces' },
            { id: 'immutable_updates', name: 'Immutable Updates', milestone: 2, relationship: 'introduces' },
            { id: 'ui_modes', name: 'UI Modes (view/edit)', milestone: 3, relationship: 'introduces' },
            { id: 'content_editable', name: 'contentEditable', milestone: 3, relationship: 'introduces' },
            { id: 'blur_event', name: 'Blur Event', milestone: 3, relationship: 'introduces' },
            { id: 'optimistic_ui_intro', name: 'Optimistic UI', milestone: 3, relationship: 'introduces' },
            { id: 'json_stringify_parse', name: 'JSON stringify/parse', milestone: 4, relationship: 'introduces' },
            { id: 'data_hydration', name: 'Data Hydration', milestone: 4, relationship: 'introduces' },
            { id: 'data_modeling', name: 'Data Modeling', milestone: 5, relationship: 'introduces' },
            { id: 'derived_state', name: 'Derived State', milestone: 5, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_prevent_default', concept: 'form_handling', belief: 'Forms just collect data, no special handling needed', reality: 'Without preventDefault(), form submission refreshes the page, losing all JS state.' },
            { id: 'mis_listener_per_button', concept: 'event_delegation_avaia', belief: 'Each delete button needs its own event listener', reality: 'Event delegation: one listener on parent, use event.target to identify which child was clicked.' }
        ]
    },
    {
        id: 'avaia_p3_weather_dashboard',
        sequence_order: 3,
        name: 'Weather Dashboard',
        description: 'Real-time weather from API. Introduces asynchronous programming.',
        estimated_hours: 45,
        milestones: [
            { id: 1, name: 'SANDBOX: The Blocking Loop', description: 'Make JavaScript wait 3 seconds. Expected: Browser freezes.', type: 'sandbox', concepts: ['Event Loop'] },
            { id: 2, name: 'Display Hardcoded Weather', description: 'Render weather data from a JS object', concepts: ['Component thinking', 'Data-driven UI', 'Separation of concerns'] },
            { id: 3, name: 'SANDBOX: Callback Hell', description: 'Get user, then posts, then comments using only callbacks. Expected: Nested 3+ levels.', type: 'sandbox', concepts: ['Promises'] },
            { id: 4, name: 'Fetch from Weather API', description: 'Get real weather data using fetch()', concepts: ['Event loop', 'Promises', 'async/await', '.then() chains'] },
            { id: 5, name: 'SANDBOX: The Weather Race', description: 'Click London then Tokyo fast. Expected: Wrong city shown.', type: 'sandbox', concepts: ['Race conditions'] },
            { id: 6, name: 'Handle Errors Gracefully', description: 'App does not crash when things go wrong', concepts: ['try/catch with async', 'HTTP status codes', 'Error states', 'Loading states'] },
            { id: 7, name: 'Location Search', description: 'User can search for any city', concepts: ['Dynamic API calls', 'Geocoding', 'Debouncing', 'URL encoding'] },
            { id: 8, name: 'Polish and Deploy', description: '5-day forecast, units toggle, deployment', concepts: ['Environment variables', 'Build process', 'Responsive design', 'Caching'] }
        ],
        concepts: [
            { id: 'event_loop', name: 'Event Loop', milestone: 1, relationship: 'introduces' },
            { id: 'component_thinking', name: 'Component Thinking', milestone: 2, relationship: 'introduces' },
            { id: 'data_driven_ui', name: 'Data-Driven UI', milestone: 2, relationship: 'introduces' },
            { id: 'promises_intro', name: 'Promises', milestone: 4, relationship: 'introduces' },
            { id: 'async_await_intro', name: 'async/await', milestone: 4, relationship: 'introduces' },
            { id: 'fetch_api_avaia', name: 'Fetch API', milestone: 4, relationship: 'introduces' },
            { id: 'race_conditions_js', name: 'Race Conditions', milestone: 5, relationship: 'introduces' },
            { id: 'try_catch_async', name: 'try/catch with async', milestone: 6, relationship: 'introduces' },
            { id: 'http_status_codes_avaia', name: 'HTTP Status Codes', milestone: 6, relationship: 'introduces' },
            { id: 'loading_error_states', name: 'Loading/Error States', milestone: 6, relationship: 'introduces' },
            { id: 'debouncing_avaia', name: 'Debouncing', milestone: 7, relationship: 'introduces' },
            { id: 'url_encoding', name: 'URL Encoding', milestone: 7, relationship: 'introduces' },
            { id: 'environment_variables', name: 'Environment Variables', milestone: 8, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_while_true_wait', concept: 'event_loop', belief: 'while(Date.now() < futureTime) {} will wait without blocking', reality: 'This blocks the entire thread. Browser freezes. Event loop explanation needed.' },
            { id: 'mis_fetch_sync', concept: 'promises_intro', belief: 'Code after fetch() waits for the response', reality: 'fetch() returns immediately with a Promise. Execution continues. Use await or .then().' },
            { id: 'mis_404_catch', concept: 'http_status_codes_avaia', belief: '404 errors are caught by catch block', reality: 'fetch only rejects on network failure. 404/500 are successful HTTP responses. Check response.ok.' }
        ]
    },
    {
        id: 'avaia_p4a_api_server',
        sequence_order: 4,
        name: 'API Server',
        description: 'REST API with database. Auth via Firebase (black box for now).',
        estimated_hours: 45,
        milestones: [
            { id: 1, name: 'Node.js Server Basics', description: 'Create a server that responds to HTTP requests', concepts: ['Node.js', 'HTTP module', 'Request/response cycle', 'Routing'] },
            { id: 2, name: 'Express and REST API', description: 'Build a REST API for blog posts', concepts: ['Express', 'Middleware', 'REST conventions', 'JSON responses'] },
            { id: 3, name: 'SANDBOX: JSON File Database', description: 'Store users and posts in JSON. Find all posts by Dublin users. Expected: Nested loops, no joins.', type: 'sandbox', concepts: ['SQL'] },
            { id: 4, name: 'Database with SQLite', description: 'Store posts in a database', concepts: ['SQL basics', 'Tables/schemas', 'better-sqlite3', 'Migrations'] },
            { id: 5, name: 'Third-Party Auth (Firebase)', description: 'Add authentication using Firebase Auth (black box)', concepts: ['Auth as a service', 'JWT verification', 'Protected routes', 'User context'] },
            { id: 6, name: 'Deploy Backend', description: 'Deploy API to production', concepts: ['Production env vars', 'Database hosting', 'CORS', 'Logging'] }
        ],
        concepts: [
            { id: 'nodejs', name: 'Node.js', milestone: 1, relationship: 'introduces' },
            { id: 'http_module', name: 'HTTP Module', milestone: 1, relationship: 'introduces' },
            { id: 'request_response_cycle', name: 'Request/Response Cycle', milestone: 1, relationship: 'introduces' },
            { id: 'express', name: 'Express', milestone: 2, relationship: 'introduces' },
            { id: 'middleware', name: 'Middleware', milestone: 2, relationship: 'introduces' },
            { id: 'rest_conventions', name: 'REST Conventions', milestone: 2, relationship: 'introduces' },
            { id: 'sql_basics', name: 'SQL Basics', milestone: 4, relationship: 'introduces' },
            { id: 'tables_schemas', name: 'Tables/Schemas', milestone: 4, relationship: 'introduces' },
            { id: 'migrations', name: 'Migrations', milestone: 4, relationship: 'introduces' },
            { id: 'jwt_verification', name: 'JWT Verification', milestone: 5, relationship: 'introduces' },
            { id: 'protected_routes', name: 'Protected Routes', milestone: 5, relationship: 'introduces' },
            { id: 'cors', name: 'CORS', milestone: 6, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_middleware_order', concept: 'middleware', belief: 'Middleware order does not matter', reality: 'Middleware executes in order. Auth before routes. Error handler last. Order is everything.' },
            { id: 'mis_json_joins', concept: 'sql_basics', belief: 'JSON files work fine for relational data', reality: 'No joins, nested loops, concurrent write issues, no indexes. This is why SQL exists.' }
        ]
    },
    {
        id: 'avaia_p4b_auth_deep_dive',
        sequence_order: 5,
        name: 'Auth Deep Dive',
        description: 'Implement authentication from scratch. Replace Firebase with your own implementation.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'SANDBOX: localStorage Password', description: 'Store username and password in localStorage. Open DevTools. Expected: Password visible.', type: 'sandbox', concepts: ['Password hashing'] },
            { id: 2, name: 'Password Hashing', description: 'Store passwords securely with bcrypt', concepts: ['Hashing vs encryption', 'Salt', 'bcrypt', 'Timing attacks'] },
            { id: 3, name: 'Session-Based Auth', description: 'Implement login with server-side sessions', concepts: ['Sessions', 'Session ID', 'Cookies', 'Session store'] },
            { id: 4, name: 'JWT-Based Auth', description: 'Implement login with JSON Web Tokens', concepts: ['JWT structure', 'Signing', 'Stateless auth', 'Token storage'] },
            { id: 5, name: 'Compare and Choose', description: 'Understand tradeoffs, replace Firebase', concepts: ['Sessions vs JWT tradeoffs'] },
            { id: 6, name: 'Protected Routes', description: 'Users can only edit their own posts', concepts: ['Authentication vs authorization', 'Ownership checks', 'Roles'] }
        ],
        concepts: [
            { id: 'password_hashing', name: 'Password Hashing', milestone: 2, relationship: 'introduces' },
            { id: 'bcrypt', name: 'bcrypt', milestone: 2, relationship: 'introduces' },
            { id: 'salt', name: 'Salt', milestone: 2, relationship: 'introduces' },
            { id: 'sessions', name: 'Sessions', milestone: 3, relationship: 'introduces' },
            { id: 'cookies', name: 'Cookies', milestone: 3, relationship: 'introduces' },
            { id: 'jwt_structure', name: 'JWT Structure', milestone: 4, relationship: 'introduces' },
            { id: 'stateless_auth', name: 'Stateless Auth', milestone: 4, relationship: 'introduces' },
            { id: 'authn_vs_authz', name: 'Authentication vs Authorization', milestone: 6, relationship: 'introduces' },
            { id: 'ownership_checks', name: 'Ownership Checks', milestone: 6, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_localstorage_password', concept: 'password_hashing', belief: 'Storing passwords in localStorage is fine for now', reality: 'Anyone can open DevTools and see credentials. NEVER store plain passwords.' },
            { id: 'mis_encryption_hashing', concept: 'password_hashing', belief: 'Hashing and encryption are the same', reality: 'Encryption is reversible (with key). Hashing is one-way. Passwords must be hashed, never encrypted.' }
        ]
    },
    {
        id: 'avaia_p4c_frontend_integration',
        sequence_order: 6,
        name: 'Frontend Integration',
        description: 'Connect a React frontend to your API. Complete the full-stack picture.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'React Basics', description: 'Build blog UI with React components', concepts: ['Components', 'Props', 'State', 'JSX'] },
            { id: 2, name: 'Fetch from Your API', description: 'Display posts from your backend', concepts: ['useEffect', 'Loading/error states', 'CORS', 'Environment variables'] },
            { id: 3, name: 'Auth Flow', description: 'Login, signup, protected pages', concepts: ['Auth context', 'Token storage', 'Attaching tokens', 'Redirects'] },
            { id: 4, name: 'Optimistic UI', description: 'Update display before server confirms', concepts: ['Optimistic updates', 'Rollback', 'Pending states', 'Cache invalidation'] },
            { id: 5, name: 'Full-Stack Deploy', description: 'Deploy frontend and backend together', concepts: ['Static vs server hosting', 'Environment URLs', 'Build optimization', 'Monitoring'] }
        ],
        concepts: [
            { id: 'react_components', name: 'React Components', milestone: 1, relationship: 'introduces' },
            { id: 'props', name: 'Props', milestone: 1, relationship: 'introduces' },
            { id: 'react_state', name: 'React State', milestone: 1, relationship: 'introduces' },
            { id: 'jsx', name: 'JSX', milestone: 1, relationship: 'introduces' },
            { id: 'useeffect', name: 'useEffect', milestone: 2, relationship: 'introduces' },
            { id: 'auth_context', name: 'Auth Context', milestone: 3, relationship: 'introduces' },
            { id: 'token_storage', name: 'Token Storage', milestone: 3, relationship: 'introduces' },
            { id: 'optimistic_updates', name: 'Optimistic Updates', milestone: 4, relationship: 'introduces' },
            { id: 'cache_invalidation', name: 'Cache Invalidation', milestone: 4, relationship: 'introduces' },
            { id: 'build_optimization', name: 'Build Optimization', milestone: 5, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_token_where', concept: 'token_storage', belief: 'localStorage is the best place for auth tokens', reality: 'localStorage is vulnerable to XSS. HttpOnly cookies are safer. Know the tradeoffs.' }
        ]
    },
    {
        id: 'avaia_p5_realtime_chat',
        sequence_order: 7,
        name: 'Real-time Chat',
        description: 'WebSocket chat app with instant message delivery.',
        estimated_hours: 45,
        milestones: [
            { id: 1, name: 'SANDBOX: Polling Disaster', description: 'Build live chat by polling every 100ms. Open Network tab. Expected: Hundreds of requests.', type: 'sandbox', concepts: ['WebSockets'] },
            { id: 2, name: 'WebSocket Basics', description: 'Two-way communication between browser and server', concepts: ['HTTP limitations', 'WebSocket protocol', 'Socket.io', 'Events'] },
            { id: 3, name: 'Broadcasting Messages', description: 'Message from one user appears for all', concepts: ['Broadcasting', 'Rooms', 'Namespaces', 'Client identification'] },
            { id: 4, name: 'Typing Indicators and Presence', description: 'Show who is typing, who is online', concepts: ['Ephemeral state', 'Throttling', 'Connection tracking', 'Disconnect handling'] },
            { id: 5, name: 'Persistence and History', description: 'Messages saved to database, load history on join', concepts: ['Message storage', 'Loading history', 'Pagination', 'REST + WebSocket hybrid'] },
            { id: 6, name: 'Scaling and Deploy', description: 'Handle many users, deploy with WebSocket support', concepts: ['Sticky sessions', 'Redis adapter', 'Connection limits', 'WS-compatible hosting'] }
        ],
        concepts: [
            { id: 'websocket_protocol', name: 'WebSocket Protocol', milestone: 2, relationship: 'introduces' },
            { id: 'socketio', name: 'Socket.io', milestone: 2, relationship: 'introduces' },
            { id: 'broadcasting', name: 'Broadcasting', milestone: 3, relationship: 'introduces' },
            { id: 'rooms_namespaces', name: 'Rooms/Namespaces', milestone: 3, relationship: 'introduces' },
            { id: 'ephemeral_state', name: 'Ephemeral State', milestone: 4, relationship: 'introduces' },
            { id: 'throttling_avaia', name: 'Throttling', milestone: 4, relationship: 'introduces' },
            { id: 'connection_tracking', name: 'Connection Tracking', milestone: 4, relationship: 'introduces' },
            { id: 'rest_ws_hybrid', name: 'REST + WebSocket Hybrid', milestone: 5, relationship: 'introduces' },
            { id: 'sticky_sessions', name: 'Sticky Sessions', milestone: 6, relationship: 'introduces' },
            { id: 'redis_adapter', name: 'Redis Adapter', milestone: 6, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_polling_fine', concept: 'websocket_protocol', belief: 'Polling every 100ms is fine for real-time', reality: 'Hundreds of requests/minute, server overload, battery drain, still not instant. WebSockets solve this.' },
            { id: 'mis_http_bidirectional', concept: 'websocket_protocol', belief: 'HTTP can push data to the client', reality: 'HTTP is request-response. Server cannot push. Long-polling/SSE are workarounds. WebSockets are bidirectional.' }
        ]
    },
    {
        id: 'avaia_p6_capstone',
        sequence_order: 8,
        name: 'Capstone',
        description: 'Design and build your own application. Demonstrate mastery.',
        estimated_hours: 60,
        milestones: [
            { id: 1, name: 'Ideation and Scope', description: 'Define what you are building and why', concepts: ['Problem definition', 'User stories', 'MVP scoping', 'Technical feasibility'] },
            { id: 2, name: 'Architecture Planning', description: 'Design the system before building', concepts: ['Data modeling', 'API design', 'Tech stack decisions', 'Deployment strategy'] },
            { id: 3, name: 'Core Functionality', description: 'Build the essential features', concepts: ['Vertical slice', 'Integration first', 'Continuous deployment', 'Testing'] },
            { id: 4, name: 'Feature Completion', description: 'Build remaining features, polish UX', concepts: ['Feature prioritization', 'Edge cases', 'UX polish', 'Performance'] },
            { id: 5, name: 'Launch', description: 'Ship it, get real users', concepts: ['Launch checklist', 'Documentation', 'Demo', 'Feedback loop'] }
        ],
        concepts: [
            { id: 'problem_definition', name: 'Problem Definition', milestone: 1, relationship: 'introduces' },
            { id: 'user_stories', name: 'User Stories', milestone: 1, relationship: 'introduces' },
            { id: 'mvp_scoping', name: 'MVP Scoping', milestone: 1, relationship: 'introduces' },
            { id: 'api_design', name: 'API Design', milestone: 2, relationship: 'introduces' },
            { id: 'tech_stack_decisions', name: 'Tech Stack Decisions', milestone: 2, relationship: 'introduces' },
            { id: 'vertical_slice', name: 'Vertical Slice', milestone: 3, relationship: 'introduces' },
            { id: 'testing_intro', name: 'Testing', milestone: 3, relationship: 'introduces' },
            { id: 'feature_prioritization', name: 'Feature Prioritization', milestone: 4, relationship: 'introduces' },
            { id: 'ux_polish', name: 'UX Polish', milestone: 4, relationship: 'introduces' },
            { id: 'launch_checklist', name: 'Launch Checklist', milestone: 5, relationship: 'introduces' }
        ],
        misconceptions: []
    }
];

async function seedAvaiaCurriculum() {
    const db = getDatabase();

    console.log('Creating Avaia Core Curriculum track...');

    db.prepare(`
        INSERT OR REPLACE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        avaiaCoreTrack.id,
        avaiaCoreTrack.name,
        avaiaCoreTrack.description,
        avaiaCoreTrack.language,
        avaiaCoreTrack.domain,
        avaiaCoreTrack.difficulty,
        avaiaCoreTrack.is_preseeded ? 1 : 0,
        avaiaCoreTrack.created_by
    );

    console.log(`Created track: ${avaiaCoreTrack.name}`);

    let templatesCreated = 0;
    let conceptsCreated = 0;
    let misconceptionsCreated = 0;

    for (const project of projectTemplates) {
        db.prepare(`
            INSERT OR REPLACE INTO project_template (id, track_id, sequence_order, name, description, estimated_hours, milestones)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            project.id,
            avaiaCoreTrack.id,
            project.sequence_order,
            project.name,
            project.description,
            project.estimated_hours,
            toJson(project.milestones)
        );
        templatesCreated++;

        for (const concept of project.concepts) {
            db.prepare(`
                INSERT OR REPLACE INTO concept (id, name, category)
                VALUES (?, ?, ?)
            `).run(concept.id, concept.name, 'Avaia Core');

            db.prepare(`
                INSERT OR IGNORE INTO milestone_concept (project_template_id, milestone_number, concept_id, relationship)
                VALUES (?, ?, ?, ?)
            `).run(project.id, concept.milestone, concept.id, concept.relationship);

            conceptsCreated++;
        }

        for (const misc of project.misconceptions) {
            db.prepare(`
                INSERT OR REPLACE INTO misconception (id, concept_id, name, description, remediation_strategy)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                misc.id,
                misc.concept,
                misc.belief.substring(0, 100),
                misc.belief,
                misc.reality
            );
            misconceptionsCreated++;
        }
    }

    console.log(`Created ${templatesCreated} project templates`);
    console.log(`Created ${conceptsCreated} concepts`);
    console.log(`Created ${misconceptionsCreated} misconceptions`);

    // Update daramola's track to avaia-core
    const result = db.prepare(`
        UPDATE learner SET current_track_id = ? WHERE id = ?
    `).run(avaiaCoreTrack.id, 'learner_mkhlhvff578nejgw');

    console.log(`\nUpdated learner daramola to track: ${avaiaCoreTrack.id}`);
    console.log('Avaia Core curriculum seeding complete!');
}

seedAvaiaCurriculum().catch(console.error);
