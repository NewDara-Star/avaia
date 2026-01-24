/**
 * Software Engineering Curriculum Seeder
 * Seeds the complete 12-project Software Engineering curriculum
 * Based on Productive Failure pedagogy
 * Source: /Users/Star/avaia/concept-research/Software Engineering Curriculum Design.md
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

// =============================================================================
// Software Engineering Learning Track
// =============================================================================

const softwareEngineeringTrack = {
    id: 'software-engineering',
    name: 'Software Engineering Fundamentals',
    description: 'Master software architecture through 12 real-world projects. Build games, parsers, web servers, and distributed systems. Learn design patterns, concurrency, and system trade-offs through productive failure.',
    language: 'javascript', // Language-agnostic concepts, but JS for implementation
    domain: 'software-engineering',
    difficulty: 'intermediate',
    is_preseeded: true,
    created_by: 'system'
};

// =============================================================================
// 12 Project Templates
// =============================================================================

const projectTemplates = [
    // =========================================================================
    // TIER 1: LOGIC & LINEAR BREAKDOWN (Projects 1-3)
    // =========================================================================
    {
        id: 'se_01_naval_combat',
        sequence_order: 1,
        name: 'Grid-Based Naval Combat Simulator',
        description: 'Build a Battleship-style strategy game requiring 2D array management, input validation, and game loop state tracking.',
        estimated_hours: 15,
        milestones: [
            { id: 1, name: 'Grid Architecture', description: 'Design the 2D board as a data structure with coordinate indexing' },
            { id: 2, name: 'Atomic Placement', description: 'Implement logic to place ships only if the entire space is valid' },
            { id: 3, name: 'The Game Loop', description: 'Create the main input-process-render loop' },
            { id: 4, name: 'Win Condition Analysis', description: 'Efficiently check if the game is over after every turn' }
        ],
        concepts: [
            { id: '2d_arrays', name: '2D Arrays and Matrix Indexing', milestone: 1, relationship: 'introduces' },
            { id: 'atomic_validation', name: 'Atomic Validation', milestone: 2, relationship: 'introduces' },
            { id: 'game_loop_pattern', name: 'Game Loop Pattern', milestone: 3, relationship: 'introduces' },
            { id: 'optimization_basics', name: 'Optimization Basics', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_string_grid', concept: '2d_arrays', belief: 'Grids should be strings', reality: 'Coordinate math requires integer indexing [row][col]; string parsing is inefficient' },
            { id: 'mis_visual_vs_logical', concept: '2d_arrays', belief: 'The printed board string IS the game state', reality: 'The internal data model must be separate from the visual representation' }
        ]
    },
    {
        id: 'se_02_markdown_parser',
        sequence_order: 2,
        name: 'Markdown-to-HTML Parser',
        description: 'Build a state-aware text parser that transforms structured text into HTML markup.',
        estimated_hours: 20,
        milestones: [
            { id: 1, name: 'Context Tracking', description: 'Implement state machine to track parsing context' },
            { id: 2, name: 'The Nesting Problem', description: 'Handle nested elements like bold text inside a list item' },
            { id: 3, name: 'Edge Case Validation', description: 'Ensure the parser handles malformed input gracefully' },
            { id: 4, name: 'Output Generation', description: 'Assemble the parsed tokens into a final HTML file' }
        ],
        concepts: [
            { id: 'state_machines', name: 'State Machines', milestone: 1, relationship: 'introduces' },
            { id: 'parsing_context', name: 'Parsing Context', milestone: 1, relationship: 'introduces' },
            { id: 'recursive_parsing', name: 'Recursive Parsing', milestone: 2, relationship: 'introduces' },
            { id: 'error_recovery', name: 'Error Recovery', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_regex_all', concept: 'parsing_context', belief: 'Regex can parse everything', reality: 'Context-dependent syntax requires state tracking; regex fails on nested structures' }
        ]
    },
    {
        id: 'se_03_task_scheduler',
        sequence_order: 3,
        name: 'Persistent Task Scheduler',
        description: 'Develop a CLI tool for CRUD operations on tasks, managing data persistence.',
        estimated_hours: 15,
        milestones: [
            { id: 1, name: 'Data Modeling', description: 'Design a task structure and manage it in memory' },
            { id: 2, name: 'Persistence Layer', description: 'Save the state to a file and reload it on startup' },
            { id: 3, name: 'CRUD Logic', description: 'Implement Update and Delete functionality' },
            { id: 4, name: 'Search & Filter', description: 'Find tasks based on criteria' }
        ],
        concepts: [
            { id: 'data_structures', name: 'Data Structures', milestone: 1, relationship: 'introduces' },
            { id: 'serialization', name: 'Serialization', milestone: 2, relationship: 'introduces' },
            { id: 'crud_operations', name: 'CRUD Operations', milestone: 3, relationship: 'introduces' },
            { id: 'data_normalization', name: 'Data Normalization', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_parallel_arrays', concept: 'data_structures', belief: 'Parallel arrays are fine for related data', reality: 'Sorting/modifying one array desynchronizes the data; use objects/structs' }
        ]
    },

    // =========================================================================
    // TIER 2: MODULAR DECOMPOSITION (Projects 4-6)
    // =========================================================================
    {
        id: 'se_04_text_adventure',
        sequence_order: 4,
        name: 'Text Adventure Engine',
        description: 'Architect an Object-Oriented engine for a non-linear text adventure game.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'World Graph', description: 'Model rooms as nodes in a graph with connections' },
            { id: 2, name: 'The State Machine', description: 'Implement a Finite State Machine for the player and environment' },
            { id: 3, name: 'Polymorphic Items', description: 'Create items with unique behaviors using inheritance/interfaces' },
            { id: 4, name: 'Parsing Commands', description: 'Interpret complex natural language inputs' }
        ],
        concepts: [
            { id: 'graph_structures', name: 'Graph Structures', milestone: 1, relationship: 'introduces' },
            { id: 'finite_state_machines', name: 'Finite State Machines', milestone: 2, relationship: 'introduces' },
            { id: 'polymorphism', name: 'Polymorphism', milestone: 3, relationship: 'introduces' },
            { id: 'command_pattern', name: 'Command Pattern', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_boolean_states', concept: 'finite_state_machines', belief: 'Boolean flags can model all states', reality: 'Booleans allow impossible states (e.g., door both locked and open); use enums/FSM' },
            { id: 'mis_god_class', concept: 'polymorphism', belief: 'One class can handle everything', reality: 'God classes become unmaintainable; use polymorphism to distribute behavior' }
        ]
    },
    {
        id: 'se_05_plugin_calculator',
        sequence_order: 5,
        name: 'Plugin-Based Calculator',
        description: 'Design a system that accepts external modules to extend functionality without core code modification.',
        estimated_hours: 20,
        milestones: [
            { id: 1, name: 'Interface Design', description: 'Define the contract all plugins must follow' },
            { id: 2, name: 'Dependency Injection', description: 'Inject dependencies/plugins at runtime' },
            { id: 3, name: 'Dynamic Loading', description: 'Load plugins from a directory at runtime' },
            { id: 4, name: 'Configuration Management', description: 'Control which plugins are active via config' }
        ],
        concepts: [
            { id: 'interfaces', name: 'Interfaces', milestone: 1, relationship: 'introduces' },
            { id: 'dependency_injection', name: 'Dependency Injection', milestone: 2, relationship: 'introduces' },
            { id: 'plugin_architecture', name: 'Plugin Architecture', milestone: 3, relationship: 'introduces' },
            { id: 'open_closed_principle', name: 'Open/Closed Principle', milestone: 1, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_switch_extensible', concept: 'open_closed_principle', belief: 'Switch statements are fine for extensibility', reality: 'Adding features requires modifying core code; use interfaces and DI' }
        ]
    },
    {
        id: 'se_06_payment_gateway',
        sequence_order: 6,
        name: 'Multi-Provider Payment Gateway',
        description: 'Build a unified checkout layer that abstracts multiple third-party payment APIs.',
        estimated_hours: 25,
        milestones: [
            { id: 1, name: 'Adapter Pattern', description: 'Normalize different provider APIs into a common interface' },
            { id: 2, name: 'Resilience & Mocking', description: 'Handle API failures gracefully without crashing the checkout' },
            { id: 3, name: 'The Facade', description: 'Simplify the checkout process for the frontend' },
            { id: 4, name: 'Logging & Auditing', description: 'Track every transaction attempt securely' }
        ],
        concepts: [
            { id: 'adapter_pattern', name: 'Adapter Pattern', milestone: 1, relationship: 'introduces' },
            { id: 'circuit_breaker', name: 'Circuit Breaker Pattern', milestone: 2, relationship: 'introduces' },
            { id: 'facade_pattern', name: 'Facade Pattern', milestone: 3, relationship: 'introduces' },
            { id: 'distributed_tracing', name: 'Distributed Tracing', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_if_else_providers', concept: 'adapter_pattern', belief: 'If/else for each provider is fine', reality: 'Adding providers requires modifying core code; use adapter pattern' }
        ]
    },

    // =========================================================================
    // TIER 3: ARCHITECTURAL ABSTRACTION (Projects 7-9)
    // =========================================================================
    {
        id: 'se_07_async_etl',
        sequence_order: 7,
        name: 'Concurrent ETL Pipeline',
        description: 'Construct a non-blocking data pipeline using async/await and streams.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'Streaming Architecture', description: 'Process files in chunks without loading entire contents into memory' },
            { id: 2, name: 'Concurrency Control', description: 'Process multiple files in parallel but limit the concurrency' },
            { id: 3, name: 'Async Error Handling', description: 'Handle errors in asynchronous tasks without crashing the main process' },
            { id: 4, name: 'Observability', description: 'Track progress of concurrent tasks' }
        ],
        concepts: [
            { id: 'streams', name: 'Streams', milestone: 1, relationship: 'introduces' },
            { id: 'async_await', name: 'Async/Await', milestone: 2, relationship: 'introduces' },
            { id: 'worker_pools', name: 'Worker Pools', milestone: 2, relationship: 'introduces' },
            { id: 'async_error_handling', name: 'Async Error Handling', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_load_all_memory', concept: 'streams', belief: 'Load the entire file into memory', reality: 'Large files cause OOM errors; use streams to process chunks' },
            { id: 'mis_unlimited_threads', concept: 'worker_pools', belief: 'Spawn a thread for every task', reality: 'Context switching overhead kills performance; use bounded worker pools' }
        ]
    },
    {
        id: 'se_08_http_server',
        sequence_order: 8,
        name: 'Raw HTTP Server & Middleware Engine',
        description: 'Build a web server from scratch to understand protocol parsing and middleware chains.',
        estimated_hours: 35,
        milestones: [
            { id: 1, name: 'TCP Parsing', description: 'Parse raw HTTP request strings from TCP sockets' },
            { id: 2, name: 'Routing Logic', description: 'Map URLs and Methods to functions' },
            { id: 3, name: 'The Middleware Chain', description: 'Implement a system where functions can pre-process requests' },
            { id: 4, name: 'Static Asset Serving', description: 'Serve files from disk securely' }
        ],
        concepts: [
            { id: 'tcp_sockets', name: 'TCP Sockets', milestone: 1, relationship: 'introduces' },
            { id: 'http_protocol', name: 'HTTP Protocol', milestone: 1, relationship: 'introduces' },
            { id: 'middleware_pattern', name: 'Middleware Pattern', milestone: 3, relationship: 'introduces' },
            { id: 'path_traversal', name: 'Path Traversal Security', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_duplicate_middleware', concept: 'middleware_pattern', belief: 'Copy authentication logic to every route', reality: 'DRY violation; use middleware chain to share cross-cutting concerns' }
        ]
    },
    {
        id: 'se_09_event_notifications',
        sequence_order: 9,
        name: 'Pub/Sub Notification System',
        description: 'Decouple system components using an Event Bus and Observer pattern.',
        estimated_hours: 25,
        milestones: [
            { id: 1, name: 'Event Bus', description: 'Build a central bus where services emit and subscribe to events' },
            { id: 2, name: 'Asynchronous Processing', description: 'Handle events without blocking the emitter' },
            { id: 3, name: 'Retry Logic', description: 'Ensure events are not lost if a handler fails' },
            { id: 4, name: 'Wildcard Subscriptions', description: 'Listen to patterns of events' }
        ],
        concepts: [
            { id: 'pub_sub', name: 'Pub/Sub Pattern', milestone: 1, relationship: 'introduces' },
            { id: 'observer_pattern', name: 'Observer Pattern', milestone: 1, relationship: 'introduces' },
            { id: 'event_sourcing', name: 'Event Sourcing', milestone: 3, relationship: 'introduces' },
            { id: 'pattern_matching', name: 'Pattern Matching', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_direct_calls', concept: 'pub_sub', belief: 'Directly call other services', reality: 'Creates tight coupling; failures cascade; use event bus for decoupling' }
        ]
    },

    // =========================================================================
    // TIER 4: SYSTEM DESIGN & TRADE-OFFS (Projects 10-12)
    // =========================================================================
    {
        id: 'se_10_distributed_kv',
        sequence_order: 10,
        name: 'Distributed Key-Value Store',
        description: 'Implement a sharded, replicated data store handling network partitions.',
        estimated_hours: 45,
        milestones: [
            { id: 1, name: 'Replication', description: 'Replicate data across multiple nodes for fault tolerance' },
            { id: 2, name: 'Sharding', description: 'Distribute data across nodes based on keys' },
            { id: 3, name: 'Gossip Protocol', description: 'Nodes detect other nodes automatically' },
            { id: 4, name: 'Quorum Reads', description: 'Configurable consistency levels' }
        ],
        concepts: [
            { id: 'cap_theorem', name: 'CAP Theorem', milestone: 1, relationship: 'introduces' },
            { id: 'consistent_hashing', name: 'Consistent Hashing', milestone: 2, relationship: 'introduces' },
            { id: 'gossip_protocol', name: 'Gossip Protocol', milestone: 3, relationship: 'introduces' },
            { id: 'quorum_consensus', name: 'Quorum Consensus', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_perfect_consistency', concept: 'cap_theorem', belief: 'Can have consistency, availability, and partition tolerance', reality: 'CAP theorem proves you can only pick 2 of 3' },
            { id: 'mis_split_brain', concept: 'quorum_consensus', belief: 'Simple replication solves availability', reality: 'Network partitions cause split brain; need quorum consensus' }
        ]
    },
    {
        id: 'se_11_microservices',
        sequence_order: 11,
        name: 'Microservices E-Commerce Backend',
        description: 'Refactor a monolith into communicating services, handling distributed transactions.',
        estimated_hours: 40,
        milestones: [
            { id: 1, name: 'Service Decomposition', description: 'Break monolith into independent services' },
            { id: 2, name: 'Distributed Transactions', description: 'Implement the Saga Pattern' },
            { id: 3, name: 'Idempotency', description: 'Handle duplicate requests safely' },
            { id: 4, name: 'API Gateway', description: 'Unified entry point for the frontend' }
        ],
        concepts: [
            { id: 'microservices', name: 'Microservices Architecture', milestone: 1, relationship: 'introduces' },
            { id: 'saga_pattern', name: 'Saga Pattern', milestone: 2, relationship: 'introduces' },
            { id: 'idempotency', name: 'Idempotency', milestone: 3, relationship: 'introduces' },
            { id: 'api_gateway', name: 'API Gateway Pattern', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_distributed_tx', concept: 'saga_pattern', belief: 'Use database transactions across services', reality: 'Services have separate databases; use sagas for compensating transactions' },
            { id: 'mis_retry_safe', concept: 'idempotency', belief: 'Retrying requests is always safe', reality: 'Non-idempotent operations cause duplicates; use idempotency keys' }
        ]
    },
    {
        id: 'se_12_traffic_control',
        sequence_order: 12,
        name: 'Rate Limiter & Load Balancer',
        description: 'Build high-performance traffic control infrastructure.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'Rate Limiting Algorithm', description: 'Implement token bucket or sliding window' },
            { id: 2, name: 'Load Balancing Strategies', description: 'Distribute traffic across backends' },
            { id: 3, name: 'Sliding Window Log', description: 'Implement precise time-based limiting' },
            { id: 4, name: 'IP Deny List', description: 'Block malicious actors' }
        ],
        concepts: [
            { id: 'token_bucket', name: 'Token Bucket Algorithm', milestone: 1, relationship: 'introduces' },
            { id: 'load_balancing', name: 'Load Balancing', milestone: 2, relationship: 'introduces' },
            { id: 'sliding_window', name: 'Sliding Window', milestone: 3, relationship: 'introduces' },
            { id: 'bloom_filters', name: 'Bloom Filters', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_local_counter', concept: 'token_bucket', belief: 'Use local variable for counting', reality: 'Distributed systems need centralized state (e.g., Redis) to prevent split brain' },
            { id: 'mis_race_conditions', concept: 'token_bucket', belief: 'Simple counter check is atomic', reality: 'Race conditions let extra requests through; need atomic operations' }
        ]
    }
];

// =============================================================================
// Seeding Function
// =============================================================================

async function seedSoftwareEngineeringCurriculum() {
    const db = getDatabase();

    console.log('Creating Software Engineering Fundamentals track...');

    // 1. Insert the learning track
    db.prepare(`
        INSERT OR REPLACE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        softwareEngineeringTrack.id,
        softwareEngineeringTrack.name,
        softwareEngineeringTrack.description,
        softwareEngineeringTrack.language,
        softwareEngineeringTrack.domain,
        softwareEngineeringTrack.difficulty,
        softwareEngineeringTrack.is_preseeded ? 1 : 0,
        softwareEngineeringTrack.created_by
    );

    console.log(`Created track: ${softwareEngineeringTrack.name}`);

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
            softwareEngineeringTrack.id,
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
            `).run(concept.id, concept.name, 'Software Engineering');

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

    console.log(`Created ${templatesCreated} project templates`);
    console.log(`Created ${conceptsCreated} concepts`);
    console.log(`Created ${misconceptionsCreated} misconceptions`);
    console.log('\nSoftware Engineering curriculum seeding complete!');
}

// Run if called directly
seedSoftwareEngineeringCurriculum().catch(console.error);
