/**
 * Data Structures & Algorithms Curriculum Seeder
 * Seeds the complete 15-project DS&A / Interview Prep curriculum
 * Source: /Users/Star/avaia/concept-research/Building CS Fundamentals with Projects.md
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

// =============================================================================
// DS&A Learning Track
// =============================================================================

const dsaTrack = {
    id: 'dsa-interview',
    name: 'Data Structures & Algorithms (FAANG Interview Prep)',
    description: 'Master algorithmic thinking through 15 real-world projects. Build text editors, social network analyzers, and caching systems while learning Gap Buffers, BFS, Dynamic Programming, and System Design patterns. Mapped to LeetCode problems.',
    language: null, // Language-agnostic (can be done in any language)
    domain: 'algorithms',
    difficulty: 'advanced',
    is_preseeded: true,
    created_by: 'system'
};

// =============================================================================
// 15 Project Templates
// =============================================================================

const projectTemplates = [
    // =========================================================================
    // TIER 1: LINEAR FOUNDATIONS (Projects 1-4)
    // =========================================================================
    {
        id: 'dsa_01_text_editor',
        sequence_order: 1,
        name: 'TextForge: Gap Buffer Editor',
        description: 'A high-performance text editor. Teaches the cost of array insertions (memmove) and cache locality through Gap Buffer implementation.',
        estimated_hours: 15,
        milestones: [
            { id: 1, name: 'Naive String Implementation', description: 'Build editor with simple string concatenation to experience O(N) insertion lag' },
            { id: 2, name: 'Gap Buffer Architecture', description: 'Implement Gap Buffer with cursor as gap position' },
            { id: 3, name: 'Cursor Movement Optimization', description: 'Handle gap shifting when cursor moves' },
            { id: 4, name: 'Performance Benchmarking', description: 'Compare naive vs Gap Buffer with 10^5 operations' }
        ],
        concepts: [
            { id: 'gap_buffer', name: 'Gap Buffer', milestone: 2, relationship: 'introduces' },
            { id: 'amortized_analysis', name: 'Amortized Analysis', milestone: 2, relationship: 'introduces' },
            { id: 'cache_locality', name: 'Cache Locality', milestone: 3, relationship: 'introduces' },
            { id: 'time_complexity_tradeoffs', name: 'Time Complexity Tradeoffs', milestone: 4, relationship: 'reinforces' }
        ],
        leetcode_mapping: ['LC 2296 Design a Text Editor'],
        misconceptions: [
            { id: 'mis_string_efficient', concept: 'gap_buffer', belief: 'Strings are efficient for all text operations', reality: 'Inserting at position K requires shifting N-K characters - O(N) for each keystroke' },
            { id: 'mis_rope_always_better', concept: 'cache_locality', belief: 'O(log N) Rope is always better than O(K) Gap Buffer', reality: 'Gap Buffer wins for local editing due to cache locality; Ropes suffer from pointer chasing' }
        ]
    },
    {
        id: 'dsa_02_undo_redo',
        sequence_order: 2,
        name: 'TimeTraveler: Undo/Redo System',
        description: 'A time travel system for state history. Teaches Doubly Linked Lists and the Command Pattern.',
        estimated_hours: 12,
        milestones: [
            { id: 1, name: 'Snapshot-Based History', description: 'Naive approach storing full state copies to experience memory explosion' },
            { id: 2, name: 'Command Pattern Design', description: 'Store operations (deltas) instead of states with execute/unexecute' },
            { id: 3, name: 'Doubly Linked List Navigation', description: 'Implement DLL for O(1) branch pruning when new action after undo' },
            { id: 4, name: 'Branch Pruning Logic', description: 'Handle Undo → New Action sequence correctly' }
        ],
        concepts: [
            { id: 'doubly_linked_list', name: 'Doubly Linked List', milestone: 3, relationship: 'introduces' },
            { id: 'command_pattern', name: 'Command Pattern', milestone: 2, relationship: 'introduces' },
            { id: 'pointer_manipulation', name: 'Pointer Manipulation', milestone: 3, relationship: 'reinforces' },
            { id: 'space_complexity', name: 'Space Complexity', milestone: 1, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 1472 Design Browser History'],
        misconceptions: [
            { id: 'mis_snapshot_efficient', concept: 'space_complexity', belief: 'Storing full snapshots is acceptable for history', reality: 'O(T × N) space explodes quickly; store deltas instead for O(T × ΔS)' },
            { id: 'mis_array_history', concept: 'doubly_linked_list', belief: 'Array index is sufficient for undo/redo pointer', reality: 'Branch pruning (Undo → New Action) requires O(N) array truncation vs O(1) DLL pointer update' }
        ]
    },
    {
        id: 'dsa_03_calculator',
        sequence_order: 3,
        name: 'CalcEngine: RPN Calculator',
        description: 'A mathematical expression parser. Teaches Stacks and the Shunting Yard Algorithm for operator precedence.',
        estimated_hours: 14,
        milestones: [
            { id: 1, name: 'Tokenization', description: 'Parse string into tokens handling multi-digit numbers and unary operators' },
            { id: 2, name: 'Shunting Yard Algorithm', description: 'Convert infix to Reverse Polish Notation using operator stack' },
            { id: 3, name: 'RPN Evaluation', description: 'Evaluate RPN using operand stack' },
            { id: 4, name: 'Edge Case Handling', description: 'Handle parentheses, whitespace, and implicit multiplication' }
        ],
        concepts: [
            { id: 'stack_data_structure', name: 'Stack Data Structure', milestone: 2, relationship: 'introduces' },
            { id: 'shunting_yard', name: 'Shunting Yard Algorithm', milestone: 2, relationship: 'introduces' },
            { id: 'reverse_polish_notation', name: 'Reverse Polish Notation', milestone: 3, relationship: 'introduces' },
            { id: 'operator_precedence', name: 'Operator Precedence', milestone: 2, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 224 Basic Calculator', 'LC 150 Evaluate Reverse Polish Notation'],
        misconceptions: [
            { id: 'mis_left_to_right', concept: 'operator_precedence', belief: 'Evaluate left-to-right like reading', reality: 'PEMDAS requires respecting precedence; 3+4*2 ≠ (3+4)*2' },
            { id: 'mis_unary_minus', concept: 'shunting_yard', belief: 'Subtraction is always binary 5-3', reality: 'Context determines if - is subtraction or negation: (-3) vs (5-3)' }
        ]
    },
    {
        id: 'dsa_04_task_scheduler',
        sequence_order: 4,
        name: 'JobMaster: Priority Task Scheduler',
        description: 'A CPU task scheduler simulation. Teaches Priority Queues/Heaps and Greedy algorithms.',
        estimated_hours: 16,
        milestones: [
            { id: 1, name: 'Sorted List Approach', description: 'Naive approach with re-sorting to experience O(N log N) per operation' },
            { id: 2, name: 'Binary Heap Implementation', description: 'Implement Min-Heap for O(log N) insert and extract' },
            { id: 3, name: 'Cooling Interval Logic', description: 'Handle task cooling constraint using greedy approach' },
            { id: 4, name: 'Dynamic Priority Updates', description: 'Support priority changes without corrupting heap invariant' }
        ],
        concepts: [
            { id: 'priority_queue', name: 'Priority Queue', milestone: 2, relationship: 'introduces' },
            { id: 'binary_heap', name: 'Binary Heap', milestone: 2, relationship: 'introduces' },
            { id: 'greedy_algorithm', name: 'Greedy Algorithm', milestone: 3, relationship: 'introduces' },
            { id: 'heap_invariant', name: 'Heap Invariant', milestone: 4, relationship: 'reinforces' }
        ],
        leetcode_mapping: ['LC 621 Task Scheduler', 'LC 1834 Single-Threaded CPU'],
        misconceptions: [
            { id: 'mis_sort_each_time', concept: 'priority_queue', belief: 'Sort the list after each insertion', reality: 'Sorting is O(N log N); Heap maintains order with O(log N) operations' },
            { id: 'mis_modify_heap_array', concept: 'heap_invariant', belief: 'Can modify heap array directly', reality: 'Direct modification breaks heap invariant; must re-heapify or use decrease-key' }
        ]
    },

    // =========================================================================
    // TIER 2: NON-LINEAR STRUCTURES (Projects 5-8)
    // =========================================================================
    {
        id: 'dsa_05_file_system',
        sequence_order: 5,
        name: 'VFS: Virtual File System',
        description: 'An in-memory file system. Teaches N-ary Trees, DFS/BFS traversal, and recursion limits.',
        estimated_hours: 18,
        milestones: [
            { id: 1, name: 'Tree Structure Design', description: 'Model directories as N-ary tree with HashMap children' },
            { id: 2, name: 'Recursive Traversal', description: 'Implement ls -R and find using recursion' },
            { id: 3, name: 'Stack Overflow Prevention', description: 'Convert to iterative with explicit stack for deep trees' },
            { id: 4, name: 'Serialization/Deserialization', description: 'Save and restore tree state to file using preorder encoding' }
        ],
        concepts: [
            { id: 'n_ary_tree', name: 'N-ary Tree', milestone: 1, relationship: 'introduces' },
            { id: 'tree_dfs', name: 'Depth-First Search (Tree)', milestone: 2, relationship: 'introduces' },
            { id: 'tree_bfs', name: 'Breadth-First Search (Tree)', milestone: 2, relationship: 'introduces' },
            { id: 'iterative_dfs', name: 'Iterative DFS with Stack', milestone: 3, relationship: 'introduces' },
            { id: 'tree_serialization', name: 'Tree Serialization', milestone: 4, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 588 Design In-Memory File System', 'LC 297 Serialize/Deserialize Binary Tree'],
        misconceptions: [
            { id: 'mis_recursion_safe', concept: 'iterative_dfs', belief: 'Recursion depth is unlimited', reality: 'Call stack is limited (~1000-10000 frames); deep trees cause stack overflow' },
            { id: 'mis_list_children', concept: 'n_ary_tree', belief: 'List is fine for directory children', reality: 'HashMap gives O(1) child lookup vs O(N) for List' }
        ]
    },
    {
        id: 'dsa_06_autocomplete',
        sequence_order: 6,
        name: 'TypeAhead: Autocomplete Service',
        description: 'An intelligent search autocomplete. Teaches Tries (Prefix Trees) and result caching for low-latency reads.',
        estimated_hours: 20,
        milestones: [
            { id: 1, name: 'Trie Construction', description: 'Build Trie from dictionary with insert and search' },
            { id: 2, name: 'Prefix Matching', description: 'Return all words with given prefix' },
            { id: 3, name: 'Top-K Results Caching', description: 'Cache top 3 weighted results at each node for O(1) retrieval' },
            { id: 4, name: 'Radix Tree Compression', description: 'Merge single-child nodes to reduce memory' }
        ],
        concepts: [
            { id: 'trie', name: 'Trie (Prefix Tree)', milestone: 1, relationship: 'introduces' },
            { id: 'radix_tree', name: 'Radix Tree / Compressed Trie', milestone: 4, relationship: 'introduces' },
            { id: 'prefix_search', name: 'Prefix Search', milestone: 2, relationship: 'introduces' },
            { id: 'memoization_caching', name: 'Memoization / Caching', milestone: 3, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 208 Implement Trie', 'LC 642 Design Search Autocomplete System'],
        misconceptions: [
            { id: 'mis_linear_prefix', concept: 'trie', belief: 'Scan dictionary for prefix matches', reality: 'Linear scan is O(W × L); Trie reduces to O(L) independent of dictionary size' },
            { id: 'mis_traverse_each_query', concept: 'memoization_caching', belief: 'Traverse subtree for each query to find top results', reality: 'Pre-compute and cache top-K at each node for O(1) retrieval' }
        ]
    },
    {
        id: 'dsa_07_social_graph',
        sequence_order: 7,
        name: 'ConnectNet: Social Network Analyzer',
        description: 'A social graph analyzer for degrees of separation. Teaches Graphs, BFS, and Bidirectional Search.',
        estimated_hours: 22,
        milestones: [
            { id: 1, name: 'Graph Representation', description: 'Build adjacency list from user-friendship data' },
            { id: 2, name: 'Standard BFS', description: 'Implement shortest path using single-direction BFS' },
            { id: 3, name: 'Bidirectional BFS', description: 'Search from both source and target simultaneously' },
            { id: 4, name: 'Scaling Analysis', description: 'Benchmark performance on million-node graphs' }
        ],
        concepts: [
            { id: 'graph_adjacency_list', name: 'Graph Adjacency List', milestone: 1, relationship: 'introduces' },
            { id: 'graph_bfs', name: 'Breadth-First Search (Graph)', milestone: 2, relationship: 'introduces' },
            { id: 'bidirectional_bfs', name: 'Bidirectional BFS', milestone: 3, relationship: 'introduces' },
            { id: 'small_world_networks', name: 'Small World Networks', milestone: 4, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 127 Word Ladder', 'LC 752 Open the Lock'],
        misconceptions: [
            { id: 'mis_single_bfs_scale', concept: 'bidirectional_bfs', belief: 'Standard BFS scales to large graphs', reality: 'BFS visits O(B^d) nodes; Bidirectional visits O(2 × B^(d/2)) - exponentially faster' },
            { id: 'mis_dfs_shortest', concept: 'graph_bfs', belief: 'DFS finds shortest path', reality: 'DFS finds A path; BFS guarantees shortest in unweighted graphs' }
        ]
    },
    {
        id: 'dsa_08_sudoku_solver',
        sequence_order: 8,
        name: 'GridMaster: Sudoku Solver',
        description: 'A constraint satisfaction solver. Teaches Backtracking with pruning and Minimum Remaining Values heuristic.',
        estimated_hours: 16,
        milestones: [
            { id: 1, name: 'Naive Backtracking', description: 'Fill cells left-to-right, 1-9, backtrack on violation' },
            { id: 2, name: 'Constraint Propagation', description: 'Check row/column/box validity before branching' },
            { id: 3, name: 'MRV Heuristic', description: 'Always pick cell with fewest valid options' },
            { id: 4, name: 'Hard Puzzle Benchmarking', description: 'Solve "Hard" puzzles in under 1 second' }
        ],
        concepts: [
            { id: 'backtracking', name: 'Backtracking', milestone: 1, relationship: 'introduces' },
            { id: 'constraint_propagation', name: 'Constraint Propagation', milestone: 2, relationship: 'introduces' },
            { id: 'mrv_heuristic', name: 'Minimum Remaining Values Heuristic', milestone: 3, relationship: 'introduces' },
            { id: 'branch_and_bound', name: 'Branch and Bound', milestone: 3, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 37 Sudoku Solver', 'LC 51 N-Queens'],
        misconceptions: [
            { id: 'mis_brute_force', concept: 'backtracking', belief: 'Try all 9^81 combinations', reality: 'Backtracking prunes invalid branches early, reducing search space dramatically' },
            { id: 'mis_fixed_order', concept: 'mrv_heuristic', belief: 'Fill cells in reading order (left-to-right, top-to-bottom)', reality: 'MRV prioritizes constrained cells, failing faster and succeeding sooner' }
        ]
    },

    // =========================================================================
    // TIER 3: OPTIMIZATION (Projects 9-12)
    // =========================================================================
    {
        id: 'dsa_09_lru_cache',
        sequence_order: 9,
        name: 'QuickCache: LRU Implementation',
        description: 'A Least Recently Used cache. Teaches composite data structures (HashMap + DLL) for O(1) operations.',
        estimated_hours: 18,
        milestones: [
            { id: 1, name: 'HashMap-Only Approach', description: 'Experience lack of ordering for eviction' },
            { id: 2, name: 'LinkedList-Only Approach', description: 'Experience O(N) key lookup' },
            { id: 3, name: 'Composite Structure', description: 'HashMap maps keys to DLL nodes for O(1) access + ordering' },
            { id: 4, name: 'Synchronization Challenge', description: 'Keep both structures in sync on every operation' }
        ],
        concepts: [
            { id: 'lru_cache', name: 'LRU Cache', milestone: 3, relationship: 'introduces' },
            { id: 'composite_data_structure', name: 'Composite Data Structure', milestone: 3, relationship: 'introduces' },
            { id: 'hashmap_internals', name: 'HashMap Internals', milestone: 2, relationship: 'reinforces' },
            { id: 'dll_operations', name: 'DLL Operations', milestone: 3, relationship: 'reinforces' }
        ],
        leetcode_mapping: ['LC 146 LRU Cache', 'LC 460 LFU Cache'],
        misconceptions: [
            { id: 'mis_linkedhashmap', concept: 'composite_data_structure', belief: 'Just use LinkedHashMap', reality: 'Goal is understanding WHY it works - HashMap gives O(1) lookup, DLL gives O(1) reordering' },
            { id: 'mis_get_readonly', concept: 'lru_cache', belief: 'get() is a read-only operation', reality: 'get() must move accessed node to head of DLL (updating recency)' }
        ]
    },
    {
        id: 'dsa_10_dna_aligner',
        sequence_order: 10,
        name: 'BioAlign: DNA Sequence Aligner',
        description: 'A genetic sequence comparison tool. Teaches Dynamic Programming with memoization and space optimization.',
        estimated_hours: 22,
        milestones: [
            { id: 1, name: 'Recursive Solution', description: 'Implement LCS recursively to experience 2^N complexity' },
            { id: 2, name: 'Memoization', description: 'Add top-down caching for O(N × M) time' },
            { id: 3, name: 'Bottom-Up Tabulation', description: 'Convert to iterative DP table' },
            { id: 4, name: 'Space Optimization', description: 'Reduce O(N × M) space to O(min(N, M)) using rolling array' }
        ],
        concepts: [
            { id: 'dynamic_programming', name: 'Dynamic Programming', milestone: 2, relationship: 'introduces' },
            { id: 'memoization_dp', name: 'Memoization (DP)', milestone: 2, relationship: 'introduces' },
            { id: 'tabulation_dp', name: 'Tabulation (DP)', milestone: 3, relationship: 'introduces' },
            { id: 'space_optimization_dp', name: 'Space Optimization (DP)', milestone: 4, relationship: 'introduces' },
            { id: 'lcs_algorithm', name: 'Longest Common Subsequence', milestone: 2, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 1143 Longest Common Subsequence', 'LC 72 Edit Distance'],
        misconceptions: [
            { id: 'mis_greedy_lcs', concept: 'dynamic_programming', belief: 'Greedy matching works for LCS', reality: 'Greedy fails; must consider all subproblems. DP stores optimal solutions to subproblems' },
            { id: 'mis_full_table_required', concept: 'space_optimization_dp', belief: 'Need full N×M table for reconstruction', reality: 'Only need previous row to calculate current row; O(min(N,M)) space suffices for length' }
        ]
    },
    {
        id: 'dsa_11_bloom_filter',
        sequence_order: 11,
        name: 'SpellGuard: Bloom Filter',
        description: 'A probabilistic spell checker. Teaches Bloom Filters, hashing, and false positive analysis.',
        estimated_hours: 16,
        milestones: [
            { id: 1, name: 'HashSet Baseline', description: 'Implement with HashSet to measure memory usage' },
            { id: 2, name: 'Bloom Filter Implementation', description: 'Use bit array with multiple hash functions' },
            { id: 3, name: 'Hash Function Design', description: 'Implement MurmurHash or similar for uniform distribution' },
            { id: 4, name: 'False Positive Analysis', description: 'Calculate and verify FP rate based on parameters' }
        ],
        concepts: [
            { id: 'bloom_filter', name: 'Bloom Filter', milestone: 2, relationship: 'introduces' },
            { id: 'probabilistic_data_structures', name: 'Probabilistic Data Structures', milestone: 2, relationship: 'introduces' },
            { id: 'hash_functions', name: 'Hash Functions', milestone: 3, relationship: 'introduces' },
            { id: 'false_positive_rate', name: 'False Positive Rate', milestone: 4, relationship: 'introduces' }
        ],
        leetcode_mapping: ['Conceptual - System Design Component'],
        misconceptions: [
            { id: 'mis_exact_membership', concept: 'bloom_filter', belief: 'HashSet is required for membership testing', reality: 'Bloom Filter uses ~1MB for 1M items vs ~50MB for HashSet, with 1% FP tradeoff' },
            { id: 'mis_bloom_delete', concept: 'bloom_filter', belief: 'Can delete from Bloom Filter', reality: 'Standard Bloom Filter does not support deletion; need Counting Bloom Filter' }
        ]
    },
    {
        id: 'dsa_12_rate_limiter',
        sequence_order: 12,
        name: 'GateKeeper: API Rate Limiter',
        description: 'A traffic flow controller. Teaches Sliding Window pattern and temporal data management.',
        estimated_hours: 14,
        milestones: [
            { id: 1, name: 'Fixed Window Counter', description: 'Simple approach with window boundary issues' },
            { id: 2, name: 'Sliding Window Log', description: 'Use Deque to store timestamps for exact precision' },
            { id: 3, name: 'Token Bucket Algorithm', description: 'Implement for burst allowance with refill rate' },
            { id: 4, name: 'Multi-User Scaling', description: 'Design for thousands of concurrent users' }
        ],
        concepts: [
            { id: 'sliding_window_log', name: 'Sliding Window Log', milestone: 2, relationship: 'introduces' },
            { id: 'token_bucket', name: 'Token Bucket', milestone: 3, relationship: 'introduces' },
            { id: 'deque', name: 'Double-Ended Queue (Deque)', milestone: 2, relationship: 'introduces' },
            { id: 'rate_limiting', name: 'Rate Limiting', milestone: 1, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 359 Logger Rate Limiter', 'LC 346 Moving Average'],
        misconceptions: [
            { id: 'mis_fixed_window', concept: 'sliding_window_log', belief: 'Fixed time windows are precise enough', reality: 'Fixed windows allow bursts at boundaries; sliding window is exact' },
            { id: 'mis_counter_only', concept: 'token_bucket', belief: 'Simple counter suffices', reality: 'Counter resets lose burst history; token bucket allows controlled bursts' }
        ]
    },

    // =========================================================================
    // TIER 4: SYSTEM DESIGN CAPSTONE (Projects 13-15)
    // =========================================================================
    {
        id: 'dsa_13_url_shortener',
        sequence_order: 13,
        name: 'TinyLink: Distributed URL Shortener',
        description: 'A scalable URL shortener. Teaches Base62 encoding and Consistent Hashing for distributed systems.',
        estimated_hours: 25,
        milestones: [
            { id: 1, name: 'Base62 Encoding', description: 'Convert database IDs to short alphanumeric strings' },
            { id: 2, name: 'Modulo Sharding', description: 'Distribute keys across N nodes with id % N' },
            { id: 3, name: 'Consistent Hashing', description: 'Implement hash ring to minimize remapping on node changes' },
            { id: 4, name: 'Virtual Nodes', description: 'Add virtual nodes for even load distribution' }
        ],
        concepts: [
            { id: 'base62_encoding', name: 'Base62 Encoding', milestone: 1, relationship: 'introduces' },
            { id: 'consistent_hashing', name: 'Consistent Hashing', milestone: 3, relationship: 'introduces' },
            { id: 'virtual_nodes', name: 'Virtual Nodes', milestone: 4, relationship: 'introduces' },
            { id: 'distributed_systems_intro', name: 'Distributed Systems Intro', milestone: 2, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 535 Encode/Decode TinyURL', 'System Design Interview'],
        misconceptions: [
            { id: 'mis_modulo_sharding', concept: 'consistent_hashing', belief: 'id % N is fine for distribution', reality: 'Adding/removing nodes remaps ~100% of keys; Consistent Hashing remaps only K/N keys' },
            { id: 'mis_random_ids', concept: 'base62_encoding', belief: 'Use random IDs for URLs', reality: 'Sequential IDs with Base62 are predictable but efficient; random IDs require collision checks' }
        ]
    },
    {
        id: 'dsa_14_stock_analyzer',
        sequence_order: 14,
        name: 'TradeView: Market Analysis Tool',
        description: 'A financial data analyzer. Teaches Monotonic Stacks for Next Greater Element patterns.',
        estimated_hours: 18,
        milestones: [
            { id: 1, name: 'Brute Force Analysis', description: 'Nested loop O(N²) for Next Greater Element' },
            { id: 2, name: 'Monotonic Stack Pattern', description: 'Maintain decreasing stack to find NGE in O(N)' },
            { id: 3, name: 'Stock Span Problem', description: 'Apply pattern to consecutive day spans' },
            { id: 4, name: 'Histogram Area', description: 'Calculate maximum rectangle using monotonic stack' }
        ],
        concepts: [
            { id: 'monotonic_stack', name: 'Monotonic Stack', milestone: 2, relationship: 'introduces' },
            { id: 'next_greater_element', name: 'Next Greater Element', milestone: 2, relationship: 'introduces' },
            { id: 'stock_span', name: 'Stock Span Problem', milestone: 3, relationship: 'introduces' },
            { id: 'histogram_area', name: 'Largest Rectangle in Histogram', milestone: 4, relationship: 'introduces' }
        ],
        leetcode_mapping: ['LC 84 Largest Rectangle in Histogram', 'LC 901 Online Stock Span', 'LC 496 Next Greater Element'],
        misconceptions: [
            { id: 'mis_stack_just_parsing', concept: 'monotonic_stack', belief: 'Stacks are only for parsing expressions', reality: 'Stacks maintain "pending" elements in linear scans for range queries' },
            { id: 'mis_nge_needs_sort', concept: 'next_greater_element', belief: 'Need to sort to find greater elements', reality: 'Monotonic stack processes in order, each element pushed/popped once for O(N)' }
        ]
    },
    {
        id: 'dsa_15_interview_simulator',
        sequence_order: 15,
        name: 'AlgoPrep: Interview Simulator',
        description: 'A mock interview platform (Capstone). Synthesizes queues, state machines, and multi-structure coordination.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'User Matching Queue', description: 'FIFO queue with priority buckets for skill matching' },
            { id: 2, name: 'Session State Machine', description: 'Model interview lifecycle: Searching → Connected → Coding → Feedback' },
            { id: 3, name: 'Code Execution Sandbox', description: 'Command pattern for running user code safely' },
            { id: 4, name: 'Concurrency Handling', description: 'Handle race conditions in simultaneous matching' }
        ],
        concepts: [
            { id: 'queue_data_structure', name: 'Queue Data Structure', milestone: 1, relationship: 'reinforces' },
            { id: 'state_machine', name: 'State Machine', milestone: 2, relationship: 'introduces' },
            { id: 'system_integration', name: 'System Integration', milestone: 3, relationship: 'introduces' },
            { id: 'concurrency_basics', name: 'Concurrency Basics', milestone: 4, relationship: 'introduces' }
        ],
        leetcode_mapping: ['System Design - Full Integration'],
        misconceptions: [
            { id: 'mis_single_lock', concept: 'concurrency_basics', belief: 'One global lock is simplest', reality: 'Global lock creates bottleneck; fine-grained locking enables parallelism' },
            { id: 'mis_list_queue', concept: 'queue_data_structure', belief: 'List can be used as queue', reality: 'List removal is O(N); LinkedList or ArrayDeque provides O(1) operations' }
        ]
    }
];

// =============================================================================
// Seeding Function
// =============================================================================

async function seedDSACurriculum() {
    const db = getDatabase();

    console.log('Creating DS&A Interview Prep track...');

    // 1. Insert the learning track
    db.prepare(`
        INSERT OR REPLACE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        dsaTrack.id,
        dsaTrack.name,
        dsaTrack.description,
        dsaTrack.language,
        dsaTrack.domain,
        dsaTrack.difficulty,
        dsaTrack.is_preseeded ? 1 : 0,
        dsaTrack.created_by
    );

    console.log(`Created track: ${dsaTrack.name}`);

    let templatesCreated = 0;
    let conceptsCreated = 0;
    let misconceptionsCreated = 0;

    for (const project of projectTemplates) {
        // 2. Insert project template
        db.prepare(`
            INSERT OR REPLACE INTO project_template (id, track_id, sequence_order, name, description, estimated_hours, milestones, prerequisites)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            project.id,
            dsaTrack.id,
            project.sequence_order,
            project.name,
            project.description,
            project.estimated_hours,
            toJson(project.milestones),
            toJson(project.leetcode_mapping || [])
        );
        templatesCreated++;

        // 3. Insert concepts
        for (const concept of project.concepts) {
            db.prepare(`
                INSERT OR REPLACE INTO concept (id, name, category)
                VALUES (?, ?, ?)
            `).run(concept.id, concept.name, 'Data Structures & Algorithms');

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
    console.log('\nDS&A curriculum seeding complete!');
}

// Run if called directly
seedDSACurriculum().catch(console.error);
