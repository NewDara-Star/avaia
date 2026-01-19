/**
 * JavaScript Web Development Curriculum Seeder
 * Seeds the complete 12-project JS curriculum from Deep Research
 * Source: /Users/Star/avaia/concept-research/JavaScript Curriculum Design Dialog.md
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

// =============================================================================
// JS Web Learning Track (Update existing)
// =============================================================================

const jsWebTrack = {
    id: 'js-web',
    name: 'JavaScript Web Development',
    description: 'Master JavaScript from DOM manipulation to Full-Stack development through 12 real-world projects. Learn by building: pixel art editors, music sequencers, weather dashboards, games, and social networks.',
    language: 'javascript',
    domain: 'web',
    difficulty: 'beginner',
    is_preseeded: true,
    created_by: 'system'
};

// =============================================================================
// 12 Project Templates
// =============================================================================

const projectTemplates = [
    // =========================================================================
    // TIER 1: FOUNDATIONS
    // =========================================================================
    {
        id: 'project_01_pixel_art',
        sequence_order: 1,
        name: 'The Pixel Art Mosaic',
        description: 'A dynamic grid editor where users click and drag to paint pixel art. Forces the transition from writing static HTML to generating UI with JavaScript.',
        estimated_hours: 12,
        milestones: [
            { id: 1, name: 'DOM Creation with Loops', description: 'Build a grid of 1000 pixels using JavaScript loops and DOM APIs' },
            { id: 2, name: 'The Event Delegation Strategy', description: 'Implement painting by listening to clicks on the grid container, not individual pixels' },
            { id: 3, name: 'State Management: The Palette', description: 'Create a variable to store the current color selected by the user' },
            { id: 4, name: 'Clearing the Canvas', description: 'Implement a reset button that clears all colors using querySelectorAll' }
        ],
        concepts: [
            { id: 'dom_creation', name: 'DOM Creation', milestone: 1, relationship: 'introduces' },
            { id: 'for_loops', name: 'For Loops', milestone: 1, relationship: 'introduces' },
            { id: 'create_element', name: 'createElement', milestone: 1, relationship: 'introduces' },
            { id: 'event_delegation', name: 'Event Delegation', milestone: 2, relationship: 'introduces' },
            { id: 'event_target', name: 'event.target vs event.currentTarget', milestone: 2, relationship: 'introduces' },
            { id: 'state_scope', name: 'State Scope', milestone: 3, relationship: 'introduces' },
            { id: 'closure_intro', name: 'Closures Introduction', milestone: 3, relationship: 'introduces' },
            { id: 'query_selector_all', name: 'querySelectorAll', milestone: 4, relationship: 'introduces' },
            { id: 'nodelist_vs_array', name: 'NodeList vs Array', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_html_static', concept: 'dom_creation', belief: 'HTML is written once and JavaScript just styles it', reality: 'JavaScript can create, modify, and delete DOM elements dynamically' },
            { id: 'mis_1000_listeners', concept: 'event_delegation', belief: 'Each clickable element needs its own event listener', reality: 'Event delegation uses bubbling to handle events on a parent element' },
            { id: 'mis_target_confusion', concept: 'event_target', belief: 'event.target refers to the element I added the listener to', reality: 'event.target is the element that was actually clicked; event.currentTarget is the listener owner' },
            { id: 'mis_state_reset', concept: 'state_scope', belief: 'Variables inside event handlers persist between calls', reality: 'Variables declared inside functions are reinitialized on each call; use closure for persistence' },
            { id: 'mis_nodelist_map', concept: 'nodelist_vs_array', belief: 'NodeList has all array methods like map()', reality: 'NodeList only has forEach. Use Array.from() for full array methods' }
        ]
    },
    {
        id: 'project_02_rhythm_sequencer',
        sequence_order: 2,
        name: 'BeatBoxer JS',
        description: 'A musical sequencer that allows users to record and play back beats. Teaches timing, arrays, and the "this" keyword.',
        estimated_hours: 15,
        milestones: [
            { id: 1, name: 'The "this" Keyword', description: 'Create drum pad buttons that respond to clicks' },
            { id: 2, name: 'The Loop Trap (Sequencer)', description: 'Create a playback function using setTimeout with proper closure handling' },
            { id: 3, name: 'Recording State', description: 'Store the sequence of beats in an Array using push' },
            { id: 4, name: 'Visual Feedback', description: 'Animate keys when pressed using CSS classes and transitionend' }
        ],
        concepts: [
            { id: 'this_keyword', name: 'The "this" Keyword', milestone: 1, relationship: 'introduces' },
            { id: 'arrow_functions', name: 'Arrow Functions', milestone: 1, relationship: 'introduces' },
            { id: 'closure_loops', name: 'Closures in Loops', milestone: 2, relationship: 'introduces' },
            { id: 'let_vs_var', name: 'let vs var Scoping', milestone: 2, relationship: 'introduces' },
            { id: 'settimeout', name: 'setTimeout', milestone: 2, relationship: 'introduces' },
            { id: 'array_push', name: 'Array push()', milestone: 3, relationship: 'introduces' },
            { id: 'const_mutation', name: 'const and Mutation', milestone: 3, relationship: 'introduces' },
            { id: 'transitionend_event', name: 'transitionend Event', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_this_arrow', concept: 'this_keyword', belief: 'Arrow functions and regular functions handle "this" the same way', reality: 'Arrow functions inherit "this" from enclosing scope; regular functions get "this" from call site' },
            { id: 'mis_this_function', concept: 'this_keyword', belief: '"this" refers to the function itself', reality: '"this" refers to the execution context (the object that called the function)' },
            { id: 'mis_loop_closure', concept: 'closure_loops', belief: 'Loop variables are copied into setTimeout callbacks', reality: 'var is shared across iterations; use let or IIFE for per-iteration scope' },
            { id: 'mis_const_immutable', concept: 'const_mutation', belief: 'const makes arrays/objects completely immutable', reality: 'const prevents reassignment, not mutation. You can push to a const array' }
        ]
    },
    {
        id: 'project_03_personal_library',
        sequence_order: 3,
        name: 'BookNook Tracker',
        description: 'A CRUD application to manage a reading list. Introduces Objects, Forms, and LocalStorage.',
        estimated_hours: 18,
        milestones: [
            { id: 1, name: 'Object Constructors', description: 'Create a Book constructor/class to model book objects' },
            { id: 2, name: 'Form Handling & Prevention', description: 'Capture user input from a form using preventDefault' },
            { id: 3, name: 'Data Persistence', description: 'Save the library array to LocalStorage with JSON serialization' },
            { id: 4, name: 'Dynamic Rendering', description: 'Render the array of books to the DOM using data-* attributes' }
        ],
        concepts: [
            { id: 'constructors', name: 'Constructor Functions', milestone: 1, relationship: 'introduces' },
            { id: 'prototypes', name: 'Prototypes', milestone: 1, relationship: 'introduces' },
            { id: 'prevent_default', name: 'preventDefault()', milestone: 2, relationship: 'introduces' },
            { id: 'form_data', name: 'Form Data Access', milestone: 2, relationship: 'introduces' },
            { id: 'local_storage', name: 'LocalStorage', milestone: 3, relationship: 'introduces' },
            { id: 'json_stringify', name: 'JSON.stringify()', milestone: 3, relationship: 'introduces' },
            { id: 'json_parse', name: 'JSON.parse()', milestone: 3, relationship: 'introduces' },
            { id: 'data_attributes', name: 'data-* Attributes', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_prototype_confusion', concept: 'prototypes', belief: 'Modifying prototype affects only new instances', reality: 'Modifying the prototype affects ALL instances, including existing ones' },
            { id: 'mis_form_refresh', concept: 'prevent_default', belief: 'Forms just collect data and submit', reality: 'Without preventDefault, forms refresh the page, losing all JS state' },
            { id: 'mis_localstorage_objects', concept: 'local_storage', belief: 'LocalStorage stores JavaScript objects directly', reality: 'LocalStorage only stores strings. Objects become "[object Object]" without JSON.stringify' },
            { id: 'mis_method_loss', concept: 'json_stringify', belief: 'Methods are stored when JSON.stringify is called', reality: 'JSON is a data format; functions are stripped. You must re-instantiate objects after parsing' }
        ]
    },

    // =========================================================================
    // TIER 2: INTERMEDIATE (Async)
    // =========================================================================
    {
        id: 'project_04_weather_dashboard',
        sequence_order: 4,
        name: 'SkyCast Global',
        description: 'A dashboard fetching real-time weather data. Introduces Async/Await, Promises, and robust error handling.',
        estimated_hours: 20,
        milestones: [
            { id: 1, name: 'The Promise Model', description: 'Understand asynchronous code by fetching weather data' },
            { id: 2, name: 'Error Boundaries', description: 'Handle 404s, 500s, and network failures properly' },
            { id: 3, name: 'Data Destructuring', description: 'Extract specific weather data from deep nested objects' },
            { id: 4, name: 'Loading States', description: 'Show spinners/skeletons while fetching, prevent double-clicks' }
        ],
        concepts: [
            { id: 'promises', name: 'Promises', milestone: 1, relationship: 'introduces' },
            { id: 'async_await', name: 'Async/Await', milestone: 1, relationship: 'introduces' },
            { id: 'fetch_api', name: 'Fetch API', milestone: 1, relationship: 'introduces' },
            { id: 'response_ok', name: 'response.ok Check', milestone: 2, relationship: 'introduces' },
            { id: 'http_status_codes', name: 'HTTP Status Codes', milestone: 2, relationship: 'introduces' },
            { id: 'destructuring', name: 'Object Destructuring', milestone: 3, relationship: 'introduces' },
            { id: 'nested_destructuring', name: 'Nested Destructuring', milestone: 3, relationship: 'introduces' },
            { id: 'ui_loading_states', name: 'Loading States', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_promise_sync', concept: 'promises', belief: 'Code after fetch() waits for the response', reality: 'JavaScript continues execution; the result arrives later. Use await or .then()' },
            { id: 'mis_404_reject', concept: 'response_ok', belief: '404 responses trigger the .catch() / catch block', reality: 'fetch only rejects on network failures. A 404 is a successful HTTP response; check response.ok' },
            { id: 'mis_destructuring_rename', concept: 'destructuring', belief: 'Cannot extract two properties with the same name from different objects', reality: 'Use rename syntax: { id: userId } and { id: postId }' }
        ]
    },
    {
        id: 'project_05_meme_stream',
        sequence_order: 5,
        name: 'MemeStream',
        description: 'An infinite-scroll image feed using the Giphy API. Focuses on Array methods (map/filter/reduce) and event optimization.',
        estimated_hours: 18,
        milestones: [
            { id: 1, name: 'Transformation Pipelines', description: 'Process lists of data using map, filter, and reduce' },
            { id: 2, name: 'Infinite Scroll', description: 'Detect when user reaches bottom of page using scroll events with debouncing' },
            { id: 3, name: 'DOM Efficiency', description: 'Append new images without rewriting the whole container using DocumentFragment' },
            { id: 4, name: 'Search & Filter', description: 'Filter the current view instantly using array filter method' }
        ],
        concepts: [
            { id: 'array_map', name: 'Array map()', milestone: 1, relationship: 'introduces' },
            { id: 'array_filter', name: 'Array filter()', milestone: 1, relationship: 'introduces' },
            { id: 'array_reduce', name: 'Array reduce()', milestone: 1, relationship: 'introduces' },
            { id: 'immutability', name: 'Immutability', milestone: 1, relationship: 'introduces' },
            { id: 'debouncing', name: 'Debouncing', milestone: 2, relationship: 'introduces' },
            { id: 'throttling', name: 'Throttling', milestone: 2, relationship: 'introduces' },
            { id: 'scroll_events', name: 'Scroll Events', milestone: 2, relationship: 'introduces' },
            { id: 'document_fragment', name: 'DocumentFragment', milestone: 3, relationship: 'introduces' },
            { id: 'layout_thrashing_intro', name: 'Layout Thrashing Intro', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_sort_mutates', concept: 'immutability', belief: 'Array methods like sort() return new arrays', reality: 'sort() mutates the original array. Use spread [...arr].sort() for immutability' },
            { id: 'mis_scroll_performance', concept: 'debouncing', belief: 'Event listeners are free; can add as many as needed', reality: 'High-frequency events (scroll, resize) can fire 100+ times/sec. Without debounce, you freeze the browser' }
        ]
    },
    {
        id: 'project_06_typing_racer',
        sequence_order: 6,
        name: 'TypeBlitz',
        description: 'A real-time typing test. Teaches precise string matching, intervals, and memory management.',
        estimated_hours: 20,
        milestones: [
            { id: 1, name: 'Interval Management', description: 'Start a timer that updates every second with proper cleanup' },
            { id: 2, name: 'Live Feedback', description: 'Highlight text green/red as user types, understanding string immutability' },
            { id: 3, name: 'Memory Hygiene', description: 'Ensure restarting the game cleans up all listeners using named functions' },
            { id: 4, name: 'Score Persistence', description: 'Save high scores to LocalStorage with proper sorting' }
        ],
        concepts: [
            { id: 'set_interval', name: 'setInterval', milestone: 1, relationship: 'introduces' },
            { id: 'clear_interval', name: 'clearInterval', milestone: 1, relationship: 'introduces' },
            { id: 'string_immutability', name: 'String Immutability', milestone: 2, relationship: 'introduces' },
            { id: 'string_methods', name: 'String Methods', milestone: 2, relationship: 'introduces' },
            { id: 'remove_event_listener', name: 'removeEventListener', milestone: 3, relationship: 'introduces' },
            { id: 'named_functions', name: 'Named Functions for Handlers', milestone: 3, relationship: 'introduces' },
            { id: 'memory_leaks', name: 'Memory Leaks', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_interval_stack', concept: 'set_interval', belief: 'Calling setInterval multiple times is fine', reality: 'Each call creates a NEW timer. Clicking "start" 5 times creates 5 overlapping timers' },
            { id: 'mis_string_mutable', concept: 'string_immutability', belief: 'Strings can be modified like arrays: str[0] = "J"', reality: 'Strings are immutable. You must create a new string using slice, concat, or template literals' },
            { id: 'mis_anonymous_remove', concept: 'remove_event_listener', belief: 'removeEventListener works with anonymous functions', reality: 'removeEventListener needs the SAME function reference. Two identical arrow functions are different objects' }
        ]
    },

    // =========================================================================
    // TIER 3: ADVANCED (Architecture)
    // =========================================================================
    {
        id: 'project_07_kanban_lite',
        sequence_order: 7,
        name: 'KanbanLite Framework',
        description: 'A drag-and-drop task board. Teaches Component architecture, the Observer Pattern, and Drag & Drop API.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'Reactive State (Proxy)', description: 'Make state changes automatically trigger UI updates using Proxy' },
            { id: 2, name: 'Custom Elements', description: 'Build <task-card> using Web Components API with Shadow DOM' },
            { id: 3, name: 'Drag and Drop', description: 'Implement Native Drag and Drop API with preventDefault on dragover' },
            { id: 4, name: 'Module Bundling', description: 'Use Vite/Webpack to bundle the app for production' }
        ],
        concepts: [
            { id: 'proxy', name: 'Proxy Object', milestone: 1, relationship: 'introduces' },
            { id: 'observer_pattern', name: 'Observer Pattern', milestone: 1, relationship: 'introduces' },
            { id: 'web_components', name: 'Web Components', milestone: 2, relationship: 'introduces' },
            { id: 'shadow_dom', name: 'Shadow DOM', milestone: 2, relationship: 'introduces' },
            { id: 'custom_elements', name: 'Custom Elements', milestone: 2, relationship: 'introduces' },
            { id: 'drag_drop_api', name: 'Drag & Drop API', milestone: 3, relationship: 'introduces' },
            { id: 'es_modules', name: 'ES Modules', milestone: 4, relationship: 'introduces' },
            { id: 'bundlers', name: 'Module Bundlers', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_proxy_primitives', concept: 'proxy', belief: 'Proxy works on any value including primitives', reality: 'Proxy only works on objects. For primitives, wrap them in an object' },
            { id: 'mis_shadow_global_css', concept: 'shadow_dom', belief: 'Global CSS styles apply inside Shadow DOM', reality: 'Shadow DOM is encapsulated. External styles do not penetrate; use ::part() or CSS variables' },
            { id: 'mis_dragover_required', concept: 'drag_drop_api', belief: 'Dropping just works if draggable is set', reality: 'You MUST preventDefault on dragover event or the drop will be blocked by the browser' }
        ]
    },
    {
        id: 'project_08_arcade_platformer',
        sequence_order: 8,
        name: 'JS-Vania',
        description: 'A 2D platformer using HTML5 Canvas. Teaches OOP, Circular Dependency resolution, and Game Loops.',
        estimated_hours: 35,
        milestones: [
            { id: 1, name: 'The Game Loop', description: 'Implement a game loop using requestAnimationFrame with delta time' },
            { id: 2, name: 'Modular Entities', description: 'Create Player and Level classes in separate files, handle circular dependencies' },
            { id: 3, name: 'Collision Detection', description: 'Calculate AABB (Axis-Aligned Bounding Box) collisions' },
            { id: 4, name: 'Input Handling', description: 'Map multiple keys to movement vectors using keyboard state object' }
        ],
        concepts: [
            { id: 'request_animation_frame', name: 'requestAnimationFrame', milestone: 1, relationship: 'introduces' },
            { id: 'delta_time', name: 'Delta Time', milestone: 1, relationship: 'introduces' },
            { id: 'game_loop', name: 'Game Loop Pattern', milestone: 1, relationship: 'introduces' },
            { id: 'circular_dependencies', name: 'Circular Dependencies', milestone: 2, relationship: 'introduces' },
            { id: 'dependency_injection', name: 'Dependency Injection', milestone: 2, relationship: 'introduces' },
            { id: 'aabb_collision', name: 'AABB Collision', milestone: 3, relationship: 'introduces' },
            { id: 'keyboard_state', name: 'Keyboard State Object', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_settimeout_animation', concept: 'request_animation_frame', belief: 'Use setTimeout(fn, 16) for 60fps animation', reality: 'requestAnimationFrame syncs with screen refresh, saves battery on hidden tabs, and provides delta time' },
            { id: 'mis_circular_imports', concept: 'circular_dependencies', belief: 'JavaScript handles circular imports automatically', reality: 'Circular imports cause undefined exports. Use dependency injection or restructure your modules' }
        ]
    },
    {
        id: 'project_09_ecommerce_spa',
        sequence_order: 9,
        name: 'ShopCartel',
        description: 'A Single Page Application shopping site. Teaches Routing, History API, and Security.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'Client-Side Routing', description: 'Implement routing using History API with pushState and popstate' },
            { id: 2, name: 'Security (XSS)', description: 'Render product descriptions safely using textContent instead of innerHTML' },
            { id: 3, name: 'Cart Persistence', description: 'Persist cart across sessions using advanced LocalStorage patterns' },
            { id: 4, name: 'Regex Search', description: 'Implement advanced search using Regular Expressions' }
        ],
        concepts: [
            { id: 'history_api', name: 'History API', milestone: 1, relationship: 'introduces' },
            { id: 'push_state', name: 'pushState', milestone: 1, relationship: 'introduces' },
            { id: 'popstate_event', name: 'popstate Event', milestone: 1, relationship: 'introduces' },
            { id: 'xss_prevention', name: 'XSS Prevention', milestone: 2, relationship: 'introduces' },
            { id: 'innerHTML_danger', name: 'innerHTML Dangers', milestone: 2, relationship: 'introduces' },
            { id: 'text_content', name: 'textContent', milestone: 2, relationship: 'introduces' },
            { id: 'regex_basics', name: 'Regular Expressions', milestone: 4, relationship: 'introduces' },
            { id: 'regex_global_flag', name: 'Regex Global Flag', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_spa_refresh', concept: 'history_api', belief: 'pushState handles everything including page refresh', reality: 'Refreshing a SPA route causes 404 because the server doesn\'t know that route. Configure redirects.' },
            { id: 'mis_popstate_auto', concept: 'popstate_event', belief: 'pushState handles the back button automatically', reality: 'You must listen to the popstate event to update content when back/forward is clicked' },
            { id: 'mis_innerhtml_safe', concept: 'innerHTML_danger', belief: 'innerHTML is just a fast way to add HTML', reality: 'innerHTML executes scripts. User content can inject <img onerror=alert()> attacks' },
            { id: 'mis_regex_global_index', concept: 'regex_global_flag', belief: 'Regex with /g flag always returns fresh matches', reality: '/g flag maintains lastIndex state. test() can return true then false on the same string' }
        ]
    },

    // =========================================================================
    // TIER 4: PROFESSIONAL (Full Stack)
    // =========================================================================
    {
        id: 'project_10_realtime_chat',
        sequence_order: 10,
        name: 'WhisperNet',
        description: 'A WebSocket chat app. Teaches Real-time communication, JWT Auth, and Cookie security.',
        estimated_hours: 40,
        milestones: [
            { id: 1, name: 'WebSocket Basics', description: 'Establish bidirectional communication using WebSocket API' },
            { id: 2, name: 'Secure Auth (JWT)', description: 'Implement Login with JWTs, understanding XSS risks with localStorage' },
            { id: 3, name: 'Room Management', description: 'Join/Leave separate chat rooms with proper socket room handling' },
            { id: 4, name: 'Message History', description: 'Load previous messages on connect using database queries' }
        ],
        concepts: [
            { id: 'websocket_api', name: 'WebSocket API', milestone: 1, relationship: 'introduces' },
            { id: 'socket_events', name: 'Socket Events', milestone: 1, relationship: 'introduces' },
            { id: 'jwt_tokens', name: 'JWT Tokens', milestone: 2, relationship: 'introduces' },
            { id: 'httponly_cookies', name: 'HttpOnly Cookies', milestone: 2, relationship: 'introduces' },
            { id: 'xss_token_theft', name: 'XSS Token Theft', milestone: 2, relationship: 'introduces' },
            { id: 'socket_rooms', name: 'Socket Rooms', milestone: 3, relationship: 'introduces' },
            { id: 'nodejs_intro', name: 'Node.js Basics', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_localstorage_secure', concept: 'jwt_tokens', belief: 'LocalStorage is secure for storing auth tokens', reality: 'Any JavaScript can read LocalStorage, including XSS attacks. Use HttpOnly cookies for tokens' },
            { id: 'mis_websocket_http', concept: 'websocket_api', belief: 'WebSockets are just faster HTTP requests', reality: 'WebSockets are persistent bidirectional connections. The server can push without client request' }
        ]
    },
    {
        id: 'project_11_social_network',
        sequence_order: 11,
        name: 'LinkSphere',
        description: 'A social feed with image uploads. Teaches Binary data (FormData), Pagination, and Relational Data.',
        estimated_hours: 45,
        milestones: [
            { id: 1, name: 'Binary Uploads', description: 'Handle file uploads using FormData for multipart encoding' },
            { id: 2, name: 'Feed Pagination', description: 'Cursor-based pagination for posts instead of offset-based' },
            { id: 3, name: 'Relational Data', description: 'Display comments nested under posts with proper joins' },
            { id: 4, name: 'Optimistic UI', description: 'Show Like immediately before server confirms, rollback on failure' }
        ],
        concepts: [
            { id: 'form_data_api', name: 'FormData API', milestone: 1, relationship: 'introduces' },
            { id: 'multipart_encoding', name: 'Multipart Encoding', milestone: 1, relationship: 'introduces' },
            { id: 'cursor_pagination', name: 'Cursor-based Pagination', milestone: 2, relationship: 'introduces' },
            { id: 'offset_vs_cursor', name: 'Offset vs Cursor Pagination', milestone: 2, relationship: 'introduces' },
            { id: 'relational_data', name: 'Relational Data', milestone: 3, relationship: 'introduces' },
            { id: 'data_joins', name: 'Data Joins', milestone: 3, relationship: 'introduces' },
            { id: 'optimistic_ui', name: 'Optimistic UI', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_json_files', concept: 'form_data_api', belief: 'Can send files via JSON.stringify', reality: 'JSON cannot encode binary data. Use FormData with multipart/form-data encoding' },
            { id: 'mis_offset_pagination', concept: 'cursor_pagination', belief: 'OFFSET/LIMIT pagination is always fine', reality: 'With changing data, offset causes missed/duplicate items. Cursor-based is more reliable' }
        ]
    },
    {
        id: 'project_12_analytics_dashboard',
        sequence_order: 12,
        name: 'MetricsPro',
        description: 'High-performance visualization. Teaches Layout Thrashing, Canvas API, and Build Optimization.',
        estimated_hours: 50,
        milestones: [
            { id: 1, name: 'Layout Thrashing Detection', description: 'Understand and fix forced synchronous layout by batching reads/writes' },
            { id: 2, name: 'Canvas Rendering', description: 'Move chart rendering to HTML5 Canvas for better performance' },
            { id: 3, name: 'Virtualization', description: 'Implement a Virtual List for the data table, rendering only visible rows' },
            { id: 4, name: 'Production Build', description: 'Minify, Tree-shake, and Gzip the assets for deployment' }
        ],
        concepts: [
            { id: 'layout_thrashing', name: 'Layout Thrashing', milestone: 1, relationship: 'introduces' },
            { id: 'read_write_batching', name: 'Read/Write Batching', milestone: 1, relationship: 'introduces' },
            { id: 'canvas_api', name: 'Canvas API', milestone: 2, relationship: 'introduces' },
            { id: 'canvas_hit_detection', name: 'Canvas Hit Detection', milestone: 2, relationship: 'introduces' },
            { id: 'virtualization', name: 'Virtualization', milestone: 3, relationship: 'introduces' },
            { id: 'tree_shaking', name: 'Tree Shaking', milestone: 4, relationship: 'introduces' },
            { id: 'minification', name: 'Minification', milestone: 4, relationship: 'introduces' },
            { id: 'gzip_compression', name: 'Gzip Compression', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_layout_thrash', concept: 'layout_thrashing', belief: 'Reading DOM properties is free', reality: 'Reading offsetWidth forces layout. In a loop, read-write-read-write causes forced synchronous layouts' },
            { id: 'mis_canvas_events', concept: 'canvas_hit_detection', belief: 'Canvas elements have individual click events', reality: 'Canvas is a single bitmap. You must calculate what was clicked using math and mouse coordinates' }
        ]
    }
];

// =============================================================================
// Seeding Function
// =============================================================================

async function seedJSCurriculum() {
    const db = getDatabase();

    console.log('Updating JS Web track with 12-project curriculum...');

    // 1. Update the learning track description
    db.prepare(`
        UPDATE learning_track 
        SET description = ?,
            is_preseeded = TRUE
        WHERE id = ?
    `).run(jsWebTrack.description, jsWebTrack.id);

    console.log(`Updated track: ${jsWebTrack.name}`);

    let templatesCreated = 0;
    let conceptsCreated = 0;
    let misconceptionsCreated = 0;

    for (const project of projectTemplates) {
        // 2. Insert project template
        db.prepare(`
            INSERT OR REPLACE INTO project_template (id, track_id, sequence_order, name, description, estimated_hours, milestones)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            project.id,
            jsWebTrack.id,
            project.sequence_order,
            project.name,
            project.description,
            project.estimated_hours,
            toJson(project.milestones)
        );
        templatesCreated++;

        // 3. Insert concepts
        for (const concept of project.concepts) {
            db.prepare(`
                INSERT OR REPLACE INTO concept (id, name, category)
                VALUES (?, ?, ?)
            `).run(concept.id, concept.name, 'JavaScript');

            // Insert milestone-concept mapping
            db.prepare(`
                INSERT OR IGNORE INTO milestone_concept (project_template_id, milestone_number, concept_id, relationship)
                VALUES (?, ?, ?, ?)
            `).run(project.id, concept.milestone, concept.id, concept.relationship);

            conceptsCreated++;
        }

        // 4. Insert misconceptions
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

    console.log(`Created/Updated ${templatesCreated} project templates`);
    console.log(`Created/Updated ${conceptsCreated} concepts`);
    console.log(`Created/Updated ${misconceptionsCreated} misconceptions`);
    console.log('\nJS Web curriculum seeding complete!');
}

// Run if called directly
seedJSCurriculum().catch(console.error);
