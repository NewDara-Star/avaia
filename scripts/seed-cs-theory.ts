/**
 * Core CS Theory Concepts Seeder
 * Seeds the 50 foundational CS concepts from Path D research
 * Source: /Users/Star/avaia/concept-research/AI Tutor CS Concept Graph.md
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

// =============================================================================
// Core CS Theory Learning Track
// =============================================================================

const csTheoryTrack = {
    id: 'cs-theory',
    name: 'Core CS Theory & Algorithms',
    description: 'Master the theoretical foundations of computer science: logic, proofs, sets, relations, combinatorics, probability, complexity analysis, graphs, trees, and computational limits. Designed to take you from 0 to interview-ready.',
    language: null, // Language-agnostic theory
    domain: 'theory',
    difficulty: 'intermediate',
    is_preseeded: true,
    created_by: 'system'
};

// =============================================================================
// 50 Core CS Concepts (Path D)
// =============================================================================

const concepts = [
    // =========================================================================
    // TIER 1: Logic & Proofs (Concepts 1-11)
    // =========================================================================
    {
        id: 'propositional_logic',
        name: 'Propositional Logic',
        category: 'Fundamentals',
        prerequisites: [],
        misconceptions: [
            { id: 'prop-001', belief: 'Logical statements track causality or temporal sequence', reality: 'Propositional logic evaluates static truth values, not causation' },
            { id: 'prop-002', belief: 'The truth of a statement equals its relevance', reality: 'A statement can be logically true but completely irrelevant to the context' }
        ],
        sandbox: 'Design a logic gate circuit for a security system. Natural language rules like "Door opens if Admin OR (Employee AND Shift)" cause unexpected access due to operator precedence ambiguity.'
    },
    {
        id: 'logical_operators',
        name: 'Logical Operators',
        category: 'Fundamentals',
        prerequisites: ['propositional_logic'],
        misconceptions: [
            { id: 'op-001', belief: 'OR is exclusive (like natural language "soup or salad")', reality: 'Boolean OR is inclusive - both can be true' },
            { id: 'op-002', belief: 'NOT means "opposite" semantically', reality: 'NOT only negates the truth value, not the semantic meaning' }
        ],
        sandbox: 'Evaluate a complex boolean expression in code without parentheses. The system grants admin privileges to a guest due to precedence errors.'
    },
    {
        id: 'truth_tables',
        name: 'Truth Tables',
        category: 'Fundamentals',
        prerequisites: ['logical_operators'],
        misconceptions: [
            { id: 'tt-001', belief: 'Testing a few inputs is sufficient verification', reality: 'Truth tables require exhaustive 2^n row verification for all possible worlds' }
        ],
        sandbox: 'Verify if two complex logic circuits are equivalent. Random testing passes, but the system fails in production on the one specific input combination missed.'
    },
    {
        id: 'logical_equivalence',
        name: 'Logical Equivalence',
        category: 'Fundamentals',
        prerequisites: ['truth_tables'],
        misconceptions: [
            { id: 'eq-001', belief: 'Implication (p→q) and equivalence (p↔q) are the same', reality: 'Implication is unidirectional; equivalence is bidirectional' },
            { id: 'eq-002', belief: 'De Morgan: ¬(A∧B) = ¬A∧¬B', reality: 'De Morgan: ¬(A∧B) = ¬A∨¬B - the operator must flip' }
        ],
        sandbox: 'Refactor a messy "if" statement condition to be more readable. Incorrect application of De Morgan\'s Law reverses the logic, locking out valid users.'
    },
    {
        id: 'predicates_and_quantifiers',
        name: 'Predicates and Quantifiers',
        category: 'Fundamentals',
        prerequisites: ['logical_equivalence'],
        misconceptions: [
            { id: 'pq-001', belief: '∀x∃y and ∃y∀x are equivalent', reality: 'Quantifier order matters dramatically - these have opposite meanings' },
            { id: 'pq-002', belief: 'Scope in programming is unrelated to logic', reality: 'Variable scope in code is directly derived from quantifier scope in logic' }
        ],
        sandbox: 'Query a database: "Find a student who has taken every course". Swapping quantifiers results in "Find a course taken by every student", returning wrong data.'
    },
    {
        id: 'rules_of_inference',
        name: 'Rules of Inference',
        category: 'Fundamentals',
        prerequisites: ['predicates_and_quantifiers'],
        misconceptions: [
            { id: 'inf-001', belief: 'If p→q and q is true, then p is true (Affirming the Consequent)', reality: 'This is a logical fallacy - the implication only goes one way' },
            { id: 'inf-002', belief: 'Passing tests proves code is correct', reality: 'Tests prove presence of bugs, not their absence (Dijkstra)' }
        ],
        sandbox: 'Debug a faulty AI reasoning engine. It concludes "It is raining" because "The ground is wet" (Fallacy of affirming the consequent).'
    },
    {
        id: 'direct_proofs',
        name: 'Direct Proofs',
        category: 'Fundamentals',
        prerequisites: ['rules_of_inference'],
        misconceptions: [
            { id: 'dp-001', belief: 'Examples constitute a proof', reality: 'Mathematical proof requires deductive certainty, not empirical examples' },
            { id: 'dp-002', belief: 'Testing is equivalent to proving', reality: 'Testing covers finite cases; proofs cover infinite domains' }
        ],
        sandbox: 'Prove that the sum of two odd integers is even. Student tries to show it for 1+3 and 5+7. The system rejects this as insufficient evidence.'
    },
    {
        id: 'proof_by_contradiction',
        name: 'Proof by Contradiction',
        category: 'Fundamentals',
        prerequisites: ['direct_proofs'],
        misconceptions: [
            { id: 'pc-001', belief: 'We can directly prove every statement', reality: 'Some statements are only provable by assuming the opposite and finding a contradiction' },
            { id: 'pc-002', belief: 'Forgetting to negate the conclusion completely', reality: 'Contradiction requires negating the entire conclusion, not parts' }
        ],
        sandbox: 'Prove there are infinitely many primes. Student gets stuck trying to find a direct generative formula, which is mathematically difficult/impossible.'
    },
    {
        id: 'proof_by_contrapositive',
        name: 'Proof by Contrapositive',
        category: 'Fundamentals',
        prerequisites: ['logical_equivalence', 'direct_proofs'],
        misconceptions: [
            { id: 'pcp-001', belief: 'Contrapositive is the same as converse', reality: 'Contrapositive (¬q→¬p) is logically equivalent to original; converse (q→p) is not' }
        ],
        sandbox: 'Optimize an intrusion detection rule: "If signature matches, block IP". Expensive check. Contrapositive reasoning needed for optimization.'
    },
    {
        id: 'mathematical_induction',
        name: 'Mathematical Induction',
        category: 'Fundamentals',
        prerequisites: ['direct_proofs'],
        misconceptions: [
            { id: 'ind-001', belief: 'Proving the inductive step alone is sufficient (Domino Fallacy)', reality: 'Both base case AND inductive step are required' },
            { id: 'ind-002', belief: 'Induction is circular reasoning or "magic"', reality: 'Induction is a constructable chain of truth from base to any n' }
        ],
        sandbox: 'Implement a recursive function for a formula derived by induction. Without the correct base case logic, the recursion overflows the stack.'
    },
    {
        id: 'strong_induction',
        name: 'Strong Induction',
        category: 'Fundamentals',
        prerequisites: ['mathematical_induction'],
        misconceptions: [
            { id: 'si-001', belief: 'Weak induction can always replace strong induction', reality: 'Strong induction is needed when P(k+1) depends on P(j) for j < k, not just P(k)' }
        ],
        sandbox: 'Prime Factorization Engine. Proving a number can be factored using weak induction fails because factors aren\'t necessarily n-1.'
    },

    // =========================================================================
    // TIER 2: Sets, Relations, Functions (Concepts 12-20)
    // =========================================================================
    {
        id: 'sets_and_subsets',
        name: 'Sets and Subsets',
        category: 'Data Structures',
        prerequisites: ['predicates_and_quantifiers'],
        misconceptions: [
            { id: 'set-001', belief: 'Element x and set {x} are the same', reality: 'x is an element, {x} is a set containing that element - different types' },
            { id: 'set-002', belief: 'int and List<int> are interchangeable', reality: 'This is the programming manifestation of x vs {x} confusion' }
        ],
        sandbox: 'Implement a permission system where groups can contain users or other groups. Type errors occur if Set<User> is conflated with User.'
    },
    {
        id: 'set_operations',
        name: 'Set Operations',
        category: 'Data Structures',
        prerequisites: ['sets_and_subsets'],
        misconceptions: [
            { id: 'setop-001', belief: 'Union and Intersection are interchangeable in queries', reality: 'Union expands results (OR), Intersection restricts (AND)' },
            { id: 'setop-002', belief: 'Difference A\\B equals B\\A', reality: 'Set difference is not commutative' }
        ],
        sandbox: 'Filter a mailing list: "Send to customers in US but NOT in CA". Wrong set operation sends emails to wrong people.'
    },
    {
        id: 'cartesian_products',
        name: 'Cartesian Products',
        category: 'Data Structures',
        prerequisites: ['set_operations'],
        misconceptions: [
            { id: 'cart-001', belief: 'A×B produces linear-size output like A∪B', reality: 'Cartesian product is O(|A|×|B|) - combinatorial explosion' },
            { id: 'cart-002', belief: 'SQL JOINs without conditions are safe', reality: 'Unfiltered JOIN is a Cartesian product - can crash the server' }
        ],
        sandbox: 'Generate all coordinates for a grid. Joining tables without a filter (accidental Cartesian product) crashes the database server.'
    },
    {
        id: 'relations_and_properties',
        name: 'Relations and Properties',
        category: 'Data Structures',
        prerequisites: ['cartesian_products'],
        misconceptions: [
            { id: 'rel-001', belief: 'All relations are symmetric like "equals"', reality: 'Many relations (parent-of, follows) are asymmetric' },
            { id: 'rel-002', belief: '"Follow" is mutual like "friend"', reality: 'Follow is directional; friendship is bidirectional' }
        ],
        sandbox: 'Model a "friendship" database. If the relation isn\'t symmetric, User A sees User B as a friend, but B doesn\'t see A.'
    },
    {
        id: 'equivalence_relations',
        name: 'Equivalence Relations',
        category: 'Data Structures',
        prerequisites: ['relations_and_properties'],
        misconceptions: [
            { id: 'eqrel-001', belief: 'Any "similarity" metric defines valid equivalence classes', reality: 'Must be reflexive, symmetric, AND transitive to partition properly' },
            { id: 'eqrel-002', belief: 'Fuzzy matching is transitive', reality: 'A~B and B~C does not guarantee A~C in fuzzy matching' }
        ],
        sandbox: 'Group files by hash checksum. If the relation isn\'t transitive (hash collisions handled poorly), grouping fails and data is lost.'
    },
    {
        id: 'partial_orders',
        name: 'Partial Orders',
        category: 'Data Structures',
        prerequisites: ['relations_and_properties'],
        misconceptions: [
            { id: 'po-001', belief: 'All elements can be compared (Total Order Bias)', reality: 'In partial orders, some pairs are incomparable (parallel tasks, vector clocks)' },
            { id: 'po-002', belief: 'Standard sorting works on partial orders', reality: 'Partial orders require topological sort, not comparison sort' }
        ],
        sandbox: 'Schedule tasks with dependencies. A standard sort fails because some tasks can be done in parallel (incomparable).'
    },
    {
        id: 'functions_definitions',
        name: 'Function Definitions',
        category: 'Data Structures',
        prerequisites: ['sets_and_subsets'],
        misconceptions: [
            { id: 'fn-001', belief: 'Any mapping is a function', reality: 'A function must map each input to exactly one output (no one-to-many)' },
            { id: 'fn-002', belief: 'Dictionary with duplicate keys is valid', reality: 'Duplicate keys violate the function property - undefined behavior' }
        ],
        sandbox: 'Design a lookup table. If keys are not unique (one-to-many), the data structure is invalid as a function and lookups fail.'
    },
    {
        id: 'injectivity_surjectivity',
        name: 'Injectivity and Surjectivity',
        category: 'Data Structures',
        prerequisites: ['functions_definitions'],
        misconceptions: [
            { id: 'inj-001', belief: 'All hash functions are injective (no collisions)', reality: 'By Pigeonhole Principle, hash functions must have collisions' },
            { id: 'inj-002', belief: 'Bijection is just "one-to-one"', reality: 'Bijection requires BOTH injective (no collisions) AND surjective (full coverage)' }
        ],
        sandbox: 'Assign unique IDs to users. If the mapping is not injective, two users get the same ID (Collision).'
    },
    {
        id: 'cardinality_and_countability',
        name: 'Cardinality and Countability',
        category: 'Fundamentals',
        prerequisites: ['injectivity_surjectivity'],
        misconceptions: [
            { id: 'card-001', belief: 'Infinity is a single number', reality: 'There are different "sizes" of infinity (countable vs uncountable)' },
            { id: 'card-002', belief: 'All infinite sets can be indexed by integers', reality: 'Uncountable sets (reals) cannot be indexed by integers (Cantor)' }
        ],
        sandbox: 'Try to assign a unique integer index to every real number between 0 and 1. Fails (Cantor\'s Diagonal argument).'
    },

    // =========================================================================
    // TIER 3: Combinatorics & Probability (Concepts 21-28)
    // =========================================================================
    {
        id: 'counting_sum_product_rules',
        name: 'Sum and Product Rules',
        category: 'Fundamentals',
        prerequisites: ['sets_and_subsets'],
        misconceptions: [
            { id: 'cnt-001', belief: 'Always multiply options together', reality: 'Multiply when independent (AND); Add when mutually exclusive (OR)' },
            { id: 'cnt-002', belief: 'Order of counting doesn\'t matter', reality: 'The counting method depends on whether choices are sequential or alternatives' }
        ],
        sandbox: 'Count valid passwords. Mixing up sum/product rules results in vastly incorrect entropy calculation.'
    },
    {
        id: 'pigeonhole_principle',
        name: 'Pigeonhole Principle',
        category: 'Fundamentals',
        prerequisites: ['counting_sum_product_rules'],
        misconceptions: [
            { id: 'pig-001', belief: 'Hash tables can avoid all collisions with good hash function', reality: 'If items > buckets, collisions are mathematically guaranteed' },
            { id: 'pig-002', belief: 'Lossless compression can always reduce file size', reality: 'Pigeonhole proves some files must get larger under any compression' }
        ],
        sandbox: 'Guarantee a collision in a hash table of size N. Student inputs N items, but N+1 are needed for absolute guarantee.'
    },
    {
        id: 'permutations_and_combinations',
        name: 'Permutations and Combinations',
        category: 'Fundamentals',
        prerequisites: ['counting_sum_product_rules'],
        misconceptions: [
            { id: 'perm-001', belief: 'Combination locks use combinations (order irrelevant)', reality: 'They actually use permutations - order matters!' },
            { id: 'perm-002', belief: 'Poker hands care about deal order', reality: 'Poker hands are combinations - only the set of cards matters' }
        ],
        sandbox: 'Calculate lottery odds. Using Permutations (order matters) instead of Combinations results in impossibly low probability.'
    },
    {
        id: 'binomial_theorem',
        name: 'Binomial Theorem',
        category: 'Fundamentals',
        prerequisites: ['permutations_and_combinations'],
        misconceptions: [
            { id: 'binom-001', belief: '(a+b)^n = a^n + b^n', reality: 'Binomial expansion has n+1 terms with coefficients from Pascal\'s triangle' }
        ],
        sandbox: 'Expand a polynomial for an error-correcting code. Missing coefficients leads to wrong checksum.'
    },
    {
        id: 'discrete_probability_basics',
        name: 'Discrete Probability Basics',
        category: 'Fundamentals',
        prerequisites: ['permutations_and_combinations'],
        misconceptions: [
            { id: 'prob-001', belief: 'Gambler\'s Fallacy: past affects independent future', reality: 'Each coin flip is independent of history - "tails isn\'t due"' },
            { id: 'prob-002', belief: 'All outcomes are equally likely', reality: 'Equiprobability must be verified, not assumed' }
        ],
        sandbox: 'Predict coin toss streaks. Student betting strategy fails because they assume "tails is due" after heads streak.'
    },
    {
        id: 'conditional_probability',
        name: 'Conditional Probability',
        category: 'Fundamentals',
        prerequisites: ['discrete_probability_basics'],
        misconceptions: [
            { id: 'cond-001', belief: 'P(A|B) = P(B|A) (Inverse Fallacy)', reality: 'Conditional probability is not symmetric' },
            { id: 'cond-002', belief: 'Independent events means one doesn\'t affect the other\'s occurrence', reality: 'Independence means P(A∩B) = P(A)·P(B), a precise mathematical condition' }
        ],
        sandbox: 'Medical diagnosis bot. It assumes symptom A and B are independent, leading to wrong diagnosis probability.'
    },
    {
        id: 'bayes_theorem',
        name: 'Bayes\' Theorem',
        category: 'Fundamentals',
        prerequisites: ['conditional_probability'],
        misconceptions: [
            { id: 'bayes-001', belief: 'Prior probability can be ignored', reality: 'The prior is critical - rare diseases need strong evidence' },
            { id: 'bayes-002', belief: 'High sensitivity = high probability of disease when positive', reality: 'This ignores base rate (prior) and specificity' }
        ],
        sandbox: 'Spam filter. Flags all "urgent" emails as spam because it ignores the high base rate of legitimate urgent emails.'
    },
    {
        id: 'expected_value',
        name: 'Expected Value',
        category: 'Fundamentals',
        prerequisites: ['discrete_probability_basics'],
        misconceptions: [
            { id: 'ev-001', belief: 'Optimize for most likely outcome', reality: 'Expected value weights ALL outcomes by probability, including rare events' },
            { id: 'ev-002', belief: 'EV tells you what will happen', reality: 'EV is a long-run average, not a prediction for single trials' }
        ],
        sandbox: 'Casino game design. House loses money because student calculated "most likely outcome" but ignored rare, high-payout jackpot EV.'
    },

    // =========================================================================
    // TIER 4: Asymptotics & Recurrences (Concepts 29-33)
    // =========================================================================
    {
        id: 'sequences_and_summations',
        name: 'Sequences and Summations',
        category: 'Fundamentals',
        prerequisites: ['functions_definitions'],
        misconceptions: [
            { id: 'seq-001', belief: 'Off-by-one in summation limits doesn\'t matter', reality: 'Off-by-one can change complexity class or break algorithms' },
            { id: 'seq-002', belief: 'Geometric and arithmetic progressions behave similarly', reality: 'Geometric grows exponentially; arithmetic grows linearly' }
        ],
        sandbox: 'Calculate total runtime of nested loops. Incorrect summation formula leads to wrong complexity estimation.'
    },
    {
        id: 'asymptotic_notation_big_o',
        name: 'Asymptotic Notation (Big O)',
        category: 'Algorithms',
        prerequisites: ['sequences_and_summations'],
        misconceptions: [
            { id: 'bigo-001', belief: 'O(n) always beats O(n²) in practice', reality: 'Constants matter for small n; O(1000n) loses to O(n²) until n=1000' },
            { id: 'bigo-002', belief: 'Big O IS the runtime', reality: 'Big O is an UPPER BOUND; actual runtime may be lower' },
            { id: 'bigo-003', belief: 'Micro-optimizing inner loops is the priority', reality: 'Reducing complexity class has far greater impact' }
        ],
        sandbox: 'Choose an algorithm for a real-time system. O(n) with huge constant is chosen over O(n²), but fails latency requirements for small n.'
    },
    {
        id: 'asymptotic_notation_omega_theta',
        name: 'Asymptotic Notation (Omega/Theta)',
        category: 'Algorithms',
        prerequisites: ['asymptotic_notation_big_o'],
        misconceptions: [
            { id: 'omega-001', belief: 'Big O describes actual runtime', reality: 'Big O = upper bound, Omega = lower bound, Theta = tight bound' },
            { id: 'omega-002', belief: 'Lower bounds don\'t matter for algorithm design', reality: 'Lower bounds prove optimality - you can\'t do better' }
        ],
        sandbox: 'Prove a sort is optimal. Using only Big O fails to show the lower bound (Omega) required for the proof.'
    },
    {
        id: 'recurrence_relations',
        name: 'Recurrence Relations',
        category: 'Algorithms',
        prerequisites: ['sequences_and_summations', 'mathematical_induction'],
        misconceptions: [
            { id: 'rec-001', belief: 'Splitting a problem in half always gives O(n)', reality: 'T(n) = 2T(n/2) + n gives O(n log n), not O(n)' },
            { id: 'rec-002', belief: 'Recursion overhead is the main cost', reality: 'The recurrence relation determines asymptotic cost, not call overhead' }
        ],
        sandbox: 'Analyze Merge Sort. Ignoring the recurrence relation leads to guessing O(n) instead of O(n log n).'
    },
    {
        id: 'master_theorem',
        name: 'Master Theorem',
        category: 'Algorithms',
        prerequisites: ['recurrence_relations'],
        misconceptions: [
            { id: 'master-001', belief: 'Master Theorem applies to all recurrences', reality: 'Only applies to T(n) = aT(n/b) + f(n) form with specific conditions' },
            { id: 'master-002', belief: 'Confusing which case (1, 2, 3) applies', reality: 'Compare f(n) to n^(log_b(a)) carefully using regularity conditions' }
        ],
        sandbox: 'Solve T(n) = 2T(n/2) + n log n. Master Theorem applies, but student picks wrong case due to log factor.'
    },

    // =========================================================================
    // TIER 5: Graphs & Trees (Concepts 34-45)
    // =========================================================================
    {
        id: 'graph_definitions',
        name: 'Graph Definitions',
        category: 'Data Structures',
        prerequisites: ['sets_and_subsets', 'relations_and_properties'],
        misconceptions: [
            { id: 'graph-001', belief: 'Graphs are just for social networks', reality: 'Graphs model roads, dependencies, circuits, state machines, and more' },
            { id: 'graph-002', belief: 'All graphs are undirected', reality: 'Directed graphs (digraphs) model one-way relationships' }
        ],
        sandbox: 'Route planning. Treating one-way streets as two-way (Undirected vs Directed) causes illegal path.'
    },
    {
        id: 'graph_representations',
        name: 'Graph Representations',
        category: 'Data Structures',
        prerequisites: ['graph_definitions'],
        misconceptions: [
            { id: 'repr-001', belief: 'Adjacency Matrix is always the best choice', reality: 'Matrix uses O(V²) space; List uses O(V+E) - critical for sparse graphs' },
            { id: 'repr-002', belief: 'Representation doesn\'t affect algorithm efficiency', reality: 'Wrong representation can change O(E) to O(V²)' }
        ],
        sandbox: 'Store a social graph of 1M users. Adjacency Matrix causes OutOfMemoryError. Adjacency List is required.'
    },
    {
        id: 'graph_isomorphism',
        name: 'Graph Isomorphism',
        category: 'Data Structures',
        prerequisites: ['graph_definitions'],
        misconceptions: [
            { id: 'iso-001', belief: 'Same node/edge count means graphs are identical', reality: 'Isomorphism requires preserving all adjacency relationships' },
            { id: 'iso-002', belief: 'Isomorphism check is easy (polynomial)', reality: 'Isomorphism complexity is notoriously hard to classify' }
        ],
        sandbox: 'Identify duplicate chemical molecules. Visual inspection fails; requires canonical labeling or isomorphism check.'
    },
    {
        id: 'connectivity_and_paths',
        name: 'Connectivity and Paths',
        category: 'Algorithms',
        prerequisites: ['graph_definitions'],
        misconceptions: [
            { id: 'conn-001', belief: 'If there\'s a path A→B, there\'s a path B→A', reality: 'Only true in undirected graphs; digraphs need strong connectivity' },
            { id: 'conn-002', belief: 'Connected = Strongly Connected', reality: 'Weak connectivity allows one direction; strong requires both' }
        ],
        sandbox: 'Web crawler. Traps itself in a component because it didn\'t check for Strong Connectivity (cannot return to start).'
    },
    {
        id: 'euler_and_hamilton_paths',
        name: 'Euler and Hamilton Paths',
        category: 'Algorithms',
        prerequisites: ['connectivity_and_paths'],
        misconceptions: [
            { id: 'euler-001', belief: 'Visiting every node = visiting every edge', reality: 'Euler (edges) is polynomial; Hamilton (nodes) is NP-Complete' },
            { id: 'euler-002', belief: 'Seven Bridges of Königsberg is about shortest paths', reality: 'It\'s about Euler paths - visiting each bridge exactly once' }
        ],
        sandbox: 'Garbage truck route. Student tries to visit every house (Hamilton) instead of every street (Euler), making problem unsolvable.'
    },
    {
        id: 'trees_and_properties',
        name: 'Trees and Properties',
        category: 'Data Structures',
        prerequisites: ['graph_definitions', 'mathematical_induction'],
        misconceptions: [
            { id: 'tree-001', belief: 'Trees can have cycles', reality: 'By definition, a tree is a connected acyclic graph' },
            { id: 'tree-002', belief: 'Removing any edge from a tree keeps it connected', reality: 'Removing ANY edge disconnects a tree (no redundancy)' }
        ],
        sandbox: 'Network topology design. System partitions because student removed an edge from a tree (Trees have no redundancy).'
    },
    {
        id: 'spanning_trees',
        name: 'Spanning Trees',
        category: 'Algorithms',
        prerequisites: ['trees_and_properties'],
        misconceptions: [
            { id: 'span-001', belief: 'Shortest path tree = Minimum spanning tree', reality: 'SPT minimizes distance from source; MST minimizes total edge weight' },
            { id: 'span-002', belief: 'MST is unique for any graph', reality: 'Multiple MSTs can exist if edges have equal weights' }
        ],
        sandbox: 'Broadcast network. Using Shortest Path Tree (Dijkstra) costs more cable than MST (Prim/Kruskal).'
    },
    {
        id: 'binary_search_algorithm_analysis',
        name: 'Binary Search Analysis',
        category: 'Algorithms',
        prerequisites: ['asymptotic_notation_big_o'],
        misconceptions: [
            { id: 'bsearch-001', belief: 'mid = (low + high) / 2 is always correct', reality: 'Integer overflow bug when low + high exceeds INT_MAX' },
            { id: 'bsearch-002', belief: 'Off-by-one errors are minor', reality: 'Causes infinite loops or missed elements' }
        ],
        sandbox: 'Guess the number. Algorithm loops infinitely on 2-element array due to wrong mid-point calculation.'
    },
    {
        id: 'sorting_lower_bounds',
        name: 'Sorting Lower Bounds',
        category: 'Algorithms',
        prerequisites: ['binary_search_algorithm_analysis'],
        misconceptions: [
            { id: 'sortlb-001', belief: 'There exists an O(n) comparison-based sort', reality: 'Decision tree argument proves Ω(n log n) for comparison sorts' },
            { id: 'sortlb-002', belief: 'Lower bounds limit all sorting algorithms', reality: 'Non-comparison sorts (Radix, Counting) can be O(n)' }
        ],
        sandbox: 'Optimize a comparison sort. Student wastes time trying to achieve O(n), which is mathematically impossible.'
    },
    {
        id: 'merge_sort_analysis',
        name: 'Merge Sort Analysis',
        category: 'Algorithms',
        prerequisites: ['recurrence_relations'],
        misconceptions: [
            { id: 'merge-001', belief: 'Merge Sort is always in-place', reality: 'Standard Merge Sort uses O(n) auxiliary space' },
            { id: 'merge-002', belief: 'Divide-and-conquer always improves time complexity', reality: 'The merge step adds O(n) work per level; total is O(n log n)' }
        ],
        sandbox: 'Sort data on a low-memory embedded device. Merge Sort crashes due to O(n) memory overhead.'
    },
    {
        id: 'quick_sort_analysis',
        name: 'Quick Sort Analysis',
        category: 'Algorithms',
        prerequisites: ['recurrence_relations', 'discrete_probability_basics'],
        misconceptions: [
            { id: 'quick-001', belief: 'Average case = Worst case for QuickSort', reality: 'Average is O(n log n); Worst is O(n²) with bad pivot' },
            { id: 'quick-002', belief: 'First-element pivot is always acceptable', reality: 'Sorted input causes O(n²) with first-element pivot' }
        ],
        sandbox: 'Sort a nearly sorted list. Standard QuickSort with first-element pivot hits O(n²) worst case and times out.'
    },
    {
        id: 'hash_functions_theory',
        name: 'Hash Functions Theory',
        category: 'Data Structures',
        prerequisites: ['functions_definitions', 'pigeonhole_principle'],
        misconceptions: [
            { id: 'hash-001', belief: 'Good hash = no collisions ever', reality: 'Pigeonhole guarantees collisions; good hash distributes them uniformly' },
            { id: 'hash-002', belief: 'Simple hash (id % n) works well', reality: 'Modular hashing clusters if inputs share factors with n' }
        ],
        sandbox: 'Store dictionary words. Using string length as hash function causes massive collisions and O(n) lookup.'
    },

    // =========================================================================
    // TIER 6: Complexity Theory (Concepts 46-50)
    // =========================================================================
    {
        id: 'p_class',
        name: 'Class P',
        category: 'Complexity',
        prerequisites: ['asymptotic_notation_big_o'],
        misconceptions: [
            { id: 'pclass-001', belief: 'P = "practically fast"', reality: 'O(n^100) is in P but completely impractical' },
            { id: 'pclass-002', belief: 'All useful algorithms are in P', reality: 'Many useful problems (SAT solvers) work despite not being in P' }
        ],
        sandbox: 'Run an algorithm with O(n^10) complexity. It\'s in P, but practically runs forever on n=100.'
    },
    {
        id: 'np_class',
        name: 'Class NP',
        category: 'Complexity',
        prerequisites: ['p_class'],
        misconceptions: [
            { id: 'npclass-001', belief: 'NP = Non-Polynomial = exponential', reality: 'NP = Nondeterministic Polynomial = verifiable in polynomial time' },
            { id: 'npclass-002', belief: 'P ⊂ NP means P ≠ NP', reality: 'Whether P = NP is the biggest open problem in CS' }
        ],
        sandbox: 'Verify a Sudoku solution. Easy (P). Generate a solution. Hard. Illustrates verification vs solution.'
    },
    {
        id: 'np_completeness_reductions',
        name: 'NP-Completeness and Reductions',
        category: 'Complexity',
        prerequisites: ['np_class'],
        misconceptions: [
            { id: 'npc-001', belief: 'Reduce MY problem to SAT to prove it\'s hard', reality: 'Must reduce SAT TO your problem, not the other way' },
            { id: 'npc-002', belief: 'NP-Complete problems have no solutions', reality: 'They have solutions; finding optimal ones efficiently is hard' }
        ],
        sandbox: 'Prove a new scheduling problem is hard. Student reduces their problem to SAT (wrong direction), proving nothing.'
    },
    {
        id: 'halting_problem',
        name: 'The Halting Problem',
        category: 'Complexity',
        prerequisites: ['np_class'],
        misconceptions: [
            { id: 'halt-001', belief: 'Sophisticated static analysis can detect all infinite loops', reality: 'Halting Problem is undecidable - no algorithm can solve it generally' },
            { id: 'halt-002', belief: 'Undecidability is just impractical, not impossible', reality: 'It\'s provably impossible, not just hard' }
        ],
        sandbox: 'Write a program that checks if any code has an infinite loop. It fails on self-referential paradox snippets.'
    },
    {
        id: 'undecidability',
        name: 'Undecidability',
        category: 'Complexity',
        prerequisites: ['halting_problem'],
        misconceptions: [
            { id: 'undec-001', belief: 'Undecidable means "not yet solved"', reality: 'Undecidable means PROVABLY IMPOSSIBLE to solve algorithmically' },
            { id: 'undec-002', belief: 'Rice\'s Theorem only applies to obscure problems', reality: 'It shows almost ALL semantic properties of programs are undecidable' }
        ],
        sandbox: 'Build a perfect virus scanner that detects all malicious code. Theoretically impossible due to Rice\'s Theorem.'
    }
];

// =============================================================================
// Seeding Function
// =============================================================================

async function seedCSTheory() {
    const db = getDatabase();

    console.log('Seeding Core CS Theory track...');

    // 1. Insert the learning track
    db.prepare(`
        INSERT OR REPLACE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        csTheoryTrack.id,
        csTheoryTrack.name,
        csTheoryTrack.description,
        csTheoryTrack.language,
        csTheoryTrack.domain,
        csTheoryTrack.difficulty,
        csTheoryTrack.is_preseeded ? 1 : 0,
        csTheoryTrack.created_by
    );

    console.log(`Created track: ${csTheoryTrack.name}`);

    // 2. Insert concepts
    let conceptsCreated = 0;
    let misconceptionsCreated = 0;
    let sandboxesCreated = 0;

    for (const concept of concepts) {
        // Insert concept
        db.prepare(`
            INSERT OR REPLACE INTO concept (id, name, category, prerequisites)
            VALUES (?, ?, ?, ?)
        `).run(
            concept.id,
            concept.name,
            concept.category,
            toJson(concept.prerequisites)
        );
        conceptsCreated++;

        // Insert misconceptions
        for (const misc of concept.misconceptions) {
            db.prepare(`
                INSERT OR REPLACE INTO misconception (id, concept_id, name, description, remediation_strategy)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                misc.id,
                concept.id,
                misc.belief,
                misc.belief,
                misc.reality
            );
            misconceptionsCreated++;
        }

        // Insert sandbox if exists
        if (concept.sandbox) {
            const sandboxId = `sandbox-${concept.id}`;
            db.prepare(`
                INSERT OR REPLACE INTO sandbox (id, concept_id, problem_statement, expected_failures, min_attempts, reflection_questions, teaching_transition)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                sandboxId,
                concept.id,
                concept.sandbox,
                toJson(['Student uses intuitive but flawed approach']),
                2,
                toJson(['Why did your initial approach fail?', 'What assumption was incorrect?']),
                `Now let's learn about ${concept.name} to understand why this happened.`
            );

            // Update concept with sandbox_id
            db.prepare(`UPDATE concept SET sandbox_id = ? WHERE id = ?`).run(sandboxId, concept.id);
            sandboxesCreated++;
        }
    }

    console.log(`Created ${conceptsCreated} concepts`);
    console.log(`Created ${misconceptionsCreated} misconceptions`);
    console.log(`Created ${sandboxesCreated} sandboxes`);

    console.log('\nCS Theory seeding complete!');
}

// Run if called directly
seedCSTheory().catch(console.error);
