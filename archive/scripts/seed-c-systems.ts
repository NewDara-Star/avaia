/**
 * C Systems Programming Curriculum Seeder
 * Seeds the complete 12-project C Systems curriculum
 * Source: /Users/Star/avaia/concept-research/C Systems Programming Project Curriculum.md
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

// =============================================================================
// C Systems Learning Track
// =============================================================================

const cSystemsTrack = {
    id: 'c-systems',
    name: 'Systems Programming in C',
    description: 'Master low-level programming through 12 real-world projects. Build hexdumps, shells, memory allocators, and HTTP servers. Learn pointers, syscalls, concurrency, and the Unix philosophy. Demystify the machine.',
    language: 'c',
    domain: 'systems',
    difficulty: 'advanced',
    is_preseeded: true,
    created_by: 'system'
};

// =============================================================================
// 12 Project Templates
// =============================================================================

const projectTemplates = [
    // =========================================================================
    // TIER 1: C FOUNDATIONS (Binary Reality)
    // =========================================================================
    {
        id: 'c_01_hexdump',
        sequence_order: 1,
        name: 'The De-Mystifier (Hexdump)',
        description: 'Build a hex dump utility. Transition from "magic text processing" to byte manipulation.',
        estimated_hours: 10,
        milestones: [
            { id: 1, name: 'Binary File Reading', description: 'Open files in binary mode using fopen/fread with buffer management' },
            { id: 2, name: 'Hex Formatting', description: 'Convert bytes to hex representation with proper padding' },
            { id: 3, name: 'ASCII Display', description: 'Filter and sanitize non-printable characters for display' },
            { id: 4, name: 'Endianness Handling', description: 'Implement flags for Big Endian vs Little Endian display' }
        ],
        concepts: [
            { id: 'binary_file_io', name: 'Binary File I/O', milestone: 1, relationship: 'introduces' },
            { id: 'unsigned_char', name: 'unsigned char vs char', milestone: 1, relationship: 'introduces' },
            { id: 'endianness', name: 'Endianness', milestone: 4, relationship: 'introduces' },
            { id: 'twos_complement', name: 'Twos Complement', milestone: 2, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_text_vs_binary_c', concept: 'binary_file_io', belief: 'Text and binary files are fundamentally different', reality: 'All files are bytes. "Text" is just bytes interpreted as ASCII/UTF-8' },
            { id: 'mis_sign_extension', concept: 'unsigned_char', belief: 'char always holds values 0-255', reality: 'signed char interprets 0xFF as -1; printf promotes to int causing sign extension to 0xFFFFFFFF' }
        ]
    },
    {
        id: 'c_02_unix_tools',
        sequence_order: 2,
        name: 'The Unix Toolchain (cat & grep)',
        description: 'Reimplement cat and grep. Understand streams, buffering, and the "Everything is a File" philosophy.',
        estimated_hours: 12,
        milestones: [
            { id: 1, name: 'mycat Implementation', description: 'Read files and write to stdout, handling stdin with - argument' },
            { id: 2, name: 'Error Handling', description: 'Use errno and perror for proper file access error reporting' },
            { id: 3, name: 'mygrep Implementation', description: 'Pattern matching using strstr with bounds checking' },
            { id: 4, name: 'Buffer Size Experimentation', description: 'Compare fgetc (byte-by-byte) vs fread (block) performance' }
        ],
        concepts: [
            { id: 'stdio_streams', name: 'Standard I/O Streams', milestone: 1, relationship: 'introduces' },
            { id: 'errno_handling', name: 'errno and perror', milestone: 2, relationship: 'introduces' },
            { id: 'buffered_io', name: 'Buffered I/O', milestone: 4, relationship: 'introduces' },
            { id: 'buffer_overflow_intro', name: 'Buffer Overflow Introduction', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_unbuffered_fine', concept: 'buffered_io', belief: 'Reading byte-by-byte is fine for small files', reality: 'Each read is a potential syscall; buffering minimizes user/kernel transitions by 1000x' }
        ]
    },
    {
        id: 'c_03_data_packer',
        sequence_order: 3,
        name: 'The Data Packer (Binary Zip/RLE)',
        description: 'Build Run-Length Encoding compression. Master struct alignment, bitwise operations, and serialization.',
        estimated_hours: 14,
        milestones: [
            { id: 1, name: 'RLE Algorithm', description: 'Implement Run-Length Encoding (aaaaabbb → 5a3b)' },
            { id: 2, name: 'Binary Output Format', description: 'Write compressed data as binary (4-byte count + 1-byte char)' },
            { id: 3, name: 'Struct Definition', description: 'Define struct for run representation' },
            { id: 4, name: 'Serialization Discovery', description: 'Discover padding issues when writing structs directly to disk' }
        ],
        concepts: [
            { id: 'struct_layout', name: 'Struct Layout and Padding', milestone: 4, relationship: 'introduces' },
            { id: 'serialization_c', name: 'Serialization in C', milestone: 2, relationship: 'introduces' },
            { id: 'bitwise_ops', name: 'Bitwise Operations', milestone: 1, relationship: 'introduces' },
            { id: 'packed_attribute', name: '__attribute__((packed))', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_struct_contiguous', concept: 'struct_layout', belief: 'Struct fields are stored contiguously', reality: 'Compiler inserts padding for alignment; {int, char} may be 8 bytes, not 5' }
        ]
    },

    // =========================================================================
    // TIER 2: MEMORY MASTERY (Pointer Arena)
    // =========================================================================
    {
        id: 'c_04_memory_visualizer',
        sequence_order: 4,
        name: 'The Memory Visualizer (Stack vs Heap)',
        description: 'Build a tool that inspects its own memory to prove the physical separation of stack and heap.',
        estimated_hours: 10,
        milestones: [
            { id: 1, name: 'Stack Visualization', description: 'Recursively call function, print local variable addresses to show stack growth' },
            { id: 2, name: 'Heap Visualization', description: 'Allocate via malloc in loop, print addresses to show heap growth' },
            { id: 3, name: 'Segment Mapping', description: 'Print addresses of global variables (Data) and function pointers (Text)' },
            { id: 4, name: 'Stack Overflow Induction', description: 'Trigger stack overflow via infinite recursion to observe the limit' }
        ],
        concepts: [
            { id: 'memory_layout', name: 'Process Memory Layout', milestone: 3, relationship: 'introduces' },
            { id: 'stack_segment', name: 'Stack Segment', milestone: 1, relationship: 'introduces' },
            { id: 'heap_segment', name: 'Heap Segment', milestone: 2, relationship: 'introduces' },
            { id: 'stack_overflow_c', name: 'Stack Overflow', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_memory_flat', concept: 'memory_layout', belief: 'Memory is a flat array from 0 to infinity', reality: 'Process has distinct segments: Text, Data, BSS, Heap (grows up), Stack (grows down)' },
            { id: 'mis_memory_infinite', concept: 'stack_overflow_c', belief: 'Memory is effectively unlimited', reality: 'Stack has hardware limit (~1-8MB); exceeding causes SIGSEGV' }
        ]
    },
    {
        id: 'c_05_generic_list',
        sequence_order: 5,
        name: 'The Generic Container (Linked List)',
        description: 'Build a generic linked list using void*. Master function pointers and Valgrind debugging.',
        estimated_hours: 16,
        milestones: [
            { id: 1, name: 'Node Structure', description: 'Define struct with void* data and struct node* next' },
            { id: 2, name: 'Basic Operations', description: 'Implement insert, delete, traverse' },
            { id: 3, name: 'Function Pointer API', description: 'Accept void (*free_func)(void*) for polymorphic cleanup' },
            { id: 4, name: 'Valgrind Integration', description: 'Run leak-free under Valgrind; debug double-free and dangling pointers' }
        ],
        concepts: [
            { id: 'void_pointer', name: 'void* (Generic Pointer)', milestone: 1, relationship: 'introduces' },
            { id: 'function_pointers', name: 'Function Pointers', milestone: 3, relationship: 'introduces' },
            { id: 'linked_list_c', name: 'Linked List in C', milestone: 2, relationship: 'introduces' },
            { id: 'valgrind', name: 'Valgrind Memory Debugging', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_free_then_access', concept: 'valgrind', belief: 'free() just marks memory as available', reality: 'Accessing freed memory is undefined behavior; pointer is "dangling" and must not be dereferenced' },
            { id: 'mis_double_free', concept: 'valgrind', belief: 'Calling free twice is just redundant', reality: 'Double free corrupts allocator metadata; causes crashes or security vulnerabilities' }
        ]
    },
    {
        id: 'c_06_hash_table',
        sequence_order: 6,
        name: 'The Associative Array (Hash Table)',
        description: 'Build a hash table with separate chaining. Manage pointers-to-pointers and dynamic resizing.',
        estimated_hours: 18,
        milestones: [
            { id: 1, name: 'Hash Function', description: 'Implement djb2 or FNV-1a hashing algorithm' },
            { id: 2, name: 'Collision Resolution', description: 'Use separate chaining with linked list from Project 5' },
            { id: 3, name: 'Dynamic Resizing', description: 'Track load factor; reallocate and rehash when > 0.75' },
            { id: 4, name: 'Memory Management', description: 'Handle realloc edge cases; prevent data loss during resize' }
        ],
        concepts: [
            { id: 'hash_function_c', name: 'Hash Functions (djb2, FNV)', milestone: 1, relationship: 'introduces' },
            { id: 'separate_chaining', name: 'Separate Chaining', milestone: 2, relationship: 'introduces' },
            { id: 'pointer_to_pointer', name: 'Pointer to Pointer (**)', milestone: 2, relationship: 'introduces' },
            { id: 'realloc_mechanics', name: 'realloc Mechanics', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_realloc_extend', concept: 'realloc_mechanics', belief: 'realloc just extends the current block', reality: 'realloc may allocate new memory and copy; old pointer becomes invalid' }
        ]
    },

    // =========================================================================
    // TIER 3: SYSTEMS CONCEPTS (Kernel Interface)
    // =========================================================================
    {
        id: 'c_07_syscall_interceptor',
        sequence_order: 7,
        name: 'The System Interceptor (File I/O & Syscalls)',
        description: 'Reimplement cp using raw syscalls. Understand the user/kernel boundary cost.',
        estimated_hours: 14,
        milestones: [
            { id: 1, name: 'Raw Syscall Usage', description: 'Use open, read, write, close instead of fopen/fread' },
            { id: 2, name: 'File Descriptors', description: 'Understand FDs as kernel table indices vs FILE* pointers' },
            { id: 3, name: 'Buffer Size Benchmark', description: 'Compare 1-byte vs 4KB buffer performance on 100MB file' },
            { id: 4, name: 'Context Switch Analysis', description: 'Measure and explain the cost of each syscall' }
        ],
        concepts: [
            { id: 'syscalls', name: 'System Calls', milestone: 1, relationship: 'introduces' },
            { id: 'file_descriptors', name: 'File Descriptors', milestone: 2, relationship: 'introduces' },
            { id: 'context_switch', name: 'Context Switching', milestone: 4, relationship: 'introduces' },
            { id: 'user_kernel_boundary', name: 'User/Kernel Boundary', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_syscall_cheap', concept: 'context_switch', belief: 'System calls are as cheap as function calls', reality: 'Each syscall requires mode switch, register save, kernel code execution - 100x+ overhead' }
        ]
    },
    {
        id: 'c_08_process_supervisor',
        sequence_order: 8,
        name: 'The Process Supervisor',
        description: 'Build a daemon that spawns and monitors child processes. Master fork/exec and signal handling.',
        estimated_hours: 20,
        milestones: [
            { id: 1, name: 'Configuration Parser', description: 'Read config file listing programs to supervise' },
            { id: 2, name: 'Process Spawning', description: 'Use fork() and execvp() to launch child processes' },
            { id: 3, name: 'Process Monitoring', description: 'Use waitpid() to detect child exits' },
            { id: 4, name: 'Resurrection Logic', description: 'Restart crashed children; handle SIGCHLD asynchronously' }
        ],
        concepts: [
            { id: 'fork_exec', name: 'fork() and exec()', milestone: 2, relationship: 'introduces' },
            { id: 'process_lifecycle', name: 'Process Lifecycle', milestone: 3, relationship: 'introduces' },
            { id: 'waitpid', name: 'waitpid() and Child Reaping', milestone: 3, relationship: 'introduces' },
            { id: 'sigchld', name: 'SIGCHLD Signal', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_zombie_rare', concept: 'waitpid', belief: 'Zombie processes are rare bugs', reality: 'Any parent that does not wait() on children creates zombies; they fill up the process table' },
            { id: 'mis_orphan_bad', concept: 'process_lifecycle', belief: 'Orphan processes are always bad', reality: 'Orphans are adopted by init (PID 1); zombies are the real problem' }
        ]
    },
    {
        id: 'c_09_parallel_zip',
        sequence_order: 9,
        name: 'The Parallel Processor (Parallel Zip)',
        description: 'Build a multi-threaded compressor. Experience race conditions and learn synchronization.',
        estimated_hours: 22,
        milestones: [
            { id: 1, name: 'Memory Mapping', description: 'Map input file with mmap to avoid I/O blocking' },
            { id: 2, name: 'Thread Pool', description: 'Create worker threads using pthread_create' },
            { id: 3, name: 'Parallel Compression', description: 'Divide file into chunks; compress in parallel using RLE from Project 3' },
            { id: 4, name: 'Output Ordering', description: 'Use mutex and condition variables to write chunks in correct order' }
        ],
        concepts: [
            { id: 'mmap', name: 'Memory Mapping (mmap)', milestone: 1, relationship: 'introduces' },
            { id: 'pthreads', name: 'POSIX Threads (pthread)', milestone: 2, relationship: 'introduces' },
            { id: 'mutex', name: 'Mutex Locks', milestone: 4, relationship: 'introduces' },
            { id: 'condition_variables', name: 'Condition Variables', milestone: 4, relationship: 'introduces' },
            { id: 'race_conditions', name: 'Race Conditions', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_threads_just_fast', concept: 'race_conditions', belief: 'Threads just make things faster', reality: 'Unsynchronized shared memory causes data corruption, deadlocks, and nondeterministic bugs' },
            { id: 'mis_race_deterministic', concept: 'race_conditions', belief: 'Race conditions cause consistent failures', reality: 'Race conditions are nondeterministic; may fail only 1 in 1000 runs' }
        ]
    },

    // =========================================================================
    // TIER 4: CAPSTONE ARCHITECTURES
    // =========================================================================
    {
        id: 'c_10_shell',
        sequence_order: 10,
        name: 'The Shell (Process Management Capstone)',
        description: 'Build a fully functional Unix shell with job control, I/O redirection, and signal handling.',
        estimated_hours: 30,
        milestones: [
            { id: 1, name: 'REPL', description: 'Implement Read-Eval-Print Loop with command parsing' },
            { id: 2, name: 'Built-in Commands', description: 'Implement cd, jobs, fg, bg, exit' },
            { id: 3, name: 'I/O Redirection', description: 'Use dup2 to implement < and > operators' },
            { id: 4, name: 'Signal Handling', description: 'Handle SIGINT, SIGTSTP, SIGCHLD with proper blocking' }
        ],
        concepts: [
            { id: 'process_groups', name: 'Process Groups', milestone: 2, relationship: 'introduces' },
            { id: 'dup2', name: 'dup2 for I/O Redirection', milestone: 3, relationship: 'introduces' },
            { id: 'signal_handling', name: 'Signal Handling', milestone: 4, relationship: 'introduces' },
            { id: 'sigprocmask', name: 'Signal Blocking (sigprocmask)', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_signal_automatic', concept: 'signal_handling', belief: 'The OS handles signals automatically', reality: 'Default actions (terminate) occur unless you install custom handlers' },
            { id: 'mis_signal_race', concept: 'sigprocmask', belief: 'Signal handlers run at predictable times', reality: 'Signals interrupt asynchronously; must block during critical sections to prevent races' }
        ]
    },
    {
        id: 'c_11_malloc',
        sequence_order: 11,
        name: 'The Memory Allocator (Malloc Capstone)',
        description: 'Implement your own malloc, free, and realloc. Demystify the heap.',
        estimated_hours: 35,
        milestones: [
            { id: 1, name: 'Heap Primitives', description: 'Use sbrk or simulated cursor to request raw memory' },
            { id: 2, name: 'Block Structure', description: 'Design header with size and allocation status bit' },
            { id: 3, name: 'Free List Management', description: 'Implicit list (scanning) → Explicit list (embedded pointers)' },
            { id: 4, name: 'Coalescing', description: 'Merge adjacent free blocks to reduce fragmentation' }
        ],
        concepts: [
            { id: 'sbrk', name: 'sbrk and Heap Growth', milestone: 1, relationship: 'introduces' },
            { id: 'block_headers', name: 'Block Headers', milestone: 2, relationship: 'introduces' },
            { id: 'free_list', name: 'Free List Management', milestone: 3, relationship: 'introduces' },
            { id: 'coalescing', name: 'Coalescing Free Blocks', milestone: 4, relationship: 'introduces' },
            { id: 'alignment_c', name: 'Memory Alignment', milestone: 2, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_malloc_kernel', concept: 'sbrk', belief: 'malloc is a kernel function', reality: 'malloc is user-space code managing heap; it uses sbrk/mmap for raw pages' },
            { id: 'mis_free_returns_os', concept: 'free_list', belief: 'free() returns memory to the OS', reality: 'free() marks block available in process heap; memory stays with process' }
        ]
    },
    {
        id: 'c_12_http_server',
        sequence_order: 12,
        name: 'The Network Daemon (HTTP Server Capstone)',
        description: 'Build a concurrent HTTP server. Combine file I/O, networking, and threading.',
        estimated_hours: 35,
        milestones: [
            { id: 1, name: 'Socket Foundation', description: 'Implement socket, bind, listen, accept loop' },
            { id: 2, name: 'HTTP Parsing', description: 'Parse request lines like GET /index.html HTTP/1.1' },
            { id: 3, name: 'Concurrent Handling', description: 'Use thread pool to handle multiple clients' },
            { id: 4, name: 'Content Serving', description: 'Map URLs to filesystem; handle stat and streaming' }
        ],
        concepts: [
            { id: 'sockets', name: 'Socket Programming', milestone: 1, relationship: 'introduces' },
            { id: 'http_protocol', name: 'HTTP Protocol', milestone: 2, relationship: 'introduces' },
            { id: 'concurrent_server', name: 'Concurrent Server', milestone: 3, relationship: 'introduces' },
            { id: 'short_counts', name: 'Short Counts in Network I/O', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_socket_like_file', concept: 'short_counts', belief: 'Sockets behave exactly like files', reality: 'read() may return partial data (short count) due to network latency; must buffer and retry' },
            { id: 'mis_tcp_reliable', concept: 'sockets', belief: 'TCP guarantees message boundaries', reality: 'TCP is a byte stream; application must parse delimiters or length prefixes' }
        ]
    }
];

// =============================================================================
// Seeding Function
// =============================================================================

async function seedCSystemsCurriculum() {
    const db = getDatabase();

    console.log('Creating C Systems Programming track...');

    // 1. Insert the learning track
    db.prepare(`
        INSERT OR REPLACE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        cSystemsTrack.id,
        cSystemsTrack.name,
        cSystemsTrack.description,
        cSystemsTrack.language,
        cSystemsTrack.domain,
        cSystemsTrack.difficulty,
        cSystemsTrack.is_preseeded ? 1 : 0,
        cSystemsTrack.created_by
    );

    console.log(`Created track: ${cSystemsTrack.name}`);

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
            cSystemsTrack.id,
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
            `).run(concept.id, concept.name, 'Systems Programming');

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
    console.log('\nC Systems curriculum seeding complete!');
}

// Run if called directly
seedCSystemsCurriculum().catch(console.error);
