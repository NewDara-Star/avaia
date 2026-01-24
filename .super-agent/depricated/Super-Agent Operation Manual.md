# CLAUDE.md - The Constitution (Unified)

**Version:** 2.0  
**Architecture:** Distributed Phase-Driven + Iterative Token Management  
**Engine:** Claude Code (CLI) + Neo4j (Persistent Memory) + MCP (Coordination)

---

## PART I: THE BRIDGE PROTOCOL (External → Internal)

### 1.1 Architecture Overview

This is a **Hybrid Agent System** with two distinct operational modes:

| Phase | Type | Agent Role | Input | Output | Persistence |
|-------|------|-----------|-------|--------|-------------|
| **A1-A2** | External | Claude (separate chat) | User Intent | `specs/prd.json` + `specs/stack.json` | Local files |
| **B3-B5** | Local (Planning) | Claude (local/CLI) | Specs | Architecture + Tickets + Governance | Neo4j + `specs/` |
| **C6-C8** | Local (Build) | Claude (local/CLI) | Tickets | Code + Tests + Reports | `src/` + `SARIF.json` |
| **D9-D10** | Local (Handoff) | Claude (local/CLI) | Reports | Docs + PR + ADR | `docs/` + Git |

**Key Distinction:** Phases A1-A2 happen in **external Claude chat windows** (you manually copy specs into your project). Phases B3-D10 are **local agent operations** with CLI/Claude Code.

**Key Principle:** *Each phase writes to Neo4j before proceeding.* This prevents hallucination and enables rollback.

---

### 1.2 The Three Memory Layers

| Layer | Name | Technology | TTL | Access Pattern |
|-------|------|-----------|-----|-----------------|
| **L1** | The Brain | Claude Context (Ephemeral) | ~30 min | Read/Write (In-session) |
| **L2** | The Notepad | `CLAUDE.md` + `specs/` | Session | Read/Write (Bounded) |
| **L3** | The Library | Neo4j Graph | Permanent | Read/Write (GraphRAG) |

---

## PART II: GOVERNANCE (The Law)

### 2.1 Methodology: Spec-Driven Development (SDD)

**Core Rule:** The specification is the **single source of truth**. All decisions must be traceable to a spec.

```
User Intent → PRD (specs/prd.json) → Architecture (specs/architecture.json) → Code (src/)
                ↓
            Neo4j Graph (Verifiable)
```

### 2.2 Drift Tolerance: **ZERO**

You **cannot**:
- Import libraries not in `specs/stack.json` (Slopsquatting Protection)
- Create code outside `src/features/` (Vertical Slices ONLY)
- Modify Neo4j without documenting the decision
- Skip a phase (A1 → B3 is forbidden; must complete A1 → A2 → B3)

### 2.3 The Folder Structure (Mandatory)

```
my-project/
├── .claude/                    # Agent configuration
├── CLAUDE.md                   # This file (The Constitution)
├── specs/                      # Phase Outputs (Read-Only after generation)
│   ├── prd.json               # Phase A1: Product Intent
│   ├── stack.json             # Phase A2: Technology Stack
│   ├── architecture.json       # Phase B3: System Design
│   ├── tickets/               # Phase B4: Execution Plan
│   │   ├── TKT-001.json
│   │   └── TKT-NNN.json
│   ├── governance.rego        # Phase B5: Policy as Code
│   └── api_contract.yaml      # Phase B5: Contract Definition
├── src/
│   ├── features/              # VERTICAL SLICES (Agent's Workspace)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.test.ts
│   │   └── [feature-name]/
│   └── shared/                # HORIZONTAL LAYERS (Kernel Only)
│       ├── db/
│       └── ui/
├── docs/                      # Phase D9: Knowledge Base (Diataxis)
├── reports/                   # Phase C7-C8: Test & UX Reports
│   ├── SARIF.json
│   └── chaos_report.json
└── .adr/                      # Phase D10: Architecture Decision Records

```

### 2.4 Context Token Budget

**Critical Constraint:** Active token usage must stay under **16,000 tokens** per session.

- **Why?** Beyond 16k, the agent experiences "Attention Dilution" and ignores `CLAUDE.md`.
- **Solution:** Run `/compact` immediately after Phase completion.
- **Safe Zone:** Always keep `CLAUDE.md` + active file under 4k tokens.

---

## PART III: THE WORKFLOW MAP (10 Phases)

### Phase A: Definition (The External Claude)

#### **Phase A1: Analyst**
- **Input:** User Intent + Domain Knowledge
- **Output:** `specs/prd.json` + Intent Node in Neo4j
- **Trigger:** Chat with Claude (in separate window/conversation) with `prompts/phase1_analyst.md`
- **Process:**
  1. Open a new Claude chat window
  2. Paste the user's project brief
  3. Claude generates `specs/prd.json` with goals, constraints, success metrics
  4. Copy the JSON output into your project
  5. Return to local Claude and proceed to Phase A2
- **Success Criteria:**
  - [ ] PRD has "Goals", "Constraints", "Success Metrics"
  - [ ] PRD saved as `specs/prd.json`
  - [ ] Neo4j node created: `Intent { title, goals, scope, projectId }`

#### **Phase A2: CTO** (Tech Stack Definition)
- **Input:** PRD from A1 + Technology landscape knowledge
- **Output:** `specs/stack.json` + Stack Node in Neo4j
- **Trigger:** Chat with Claude (same external session or new) with `prompts/phase2_cto.md` (Paste the PRD)
- **Process:**
  1. In the same Claude chat or a new one, paste the generated `specs/prd.json`
  2. Ask Claude to generate `specs/stack.json` with tech recommendations
  3. Claude outputs stack with: Language, Framework, DB, DevOps, Libraries, Versions
  4. Copy the JSON output into your project
  5. Return to local Claude and proceed to Phase B3
- **Success Criteria:**
  - [ ] Stack includes: Language, Framework, DB, DevOps, key libraries, versions
  - [ ] Stack saved as `specs/stack.json`
  - [ ] Neo4j node created: `TechStack { name, versions, constraints, projectId }`
  - [ ] `TechStack` linked to `Intent` with `ENABLES` edge

---

### Phase B: Planning (The Brain)

#### **Phase B3: Architect**
- **Input:** `specs/prd.json` + `specs/stack.json`
- **Output:** `specs/architecture.json` + Topology in Neo4j
- **Trigger:** Local Agent + `prompts/phase3_architect.md`
- **Rules:**
  - MUST use Vertical Slice Architecture (VSA)
  - MUST validate stack against constraints
  - MUST create Neo4j `Architecture` node with feature list
- **Success Criteria:**
  - [ ] Architecture defines: Features, Layers, Data Flow
  - [ ] Feature nodes created in Neo4j: `Feature { name, slice_path, projectId }`
  - [ ] Topology edges: `Architecture --CONTAINS--> Feature`

#### **Phase B4: Planner**
- **Input:** `specs/architecture.json`
- **Output:** `specs/tickets/TKT-*.json` + Ticket nodes in Neo4j
- **Trigger:** Local Agent + `prompts/phase4_planner.md`
- **Rules:**
  - Each ticket = 1 vertical slice
  - Tests are **HIDDEN** from Phase C6 (Blind Build)
  - MUST create Neo4j `Ticket` node with acceptance criteria
- **Success Criteria:**
  - [ ] Tickets include: Description, Acceptance Criteria, Dependencies
  - [ ] Test expectations stored in Neo4j (not in `TKT-*.json`)
  - [ ] Ticket nodes linked: `Feature --REQUIRES--> Ticket`

#### **Phase B5: Gatekeeper**
- **Input:** Architecture + Tickets
- **Output:** `specs/governance.rego` + `specs/api_contract.yaml` + Policy nodes in Neo4j
- **Trigger:** Local Agent + `prompts/phase5_gatekeeper.md`
- **Rules:**
  - Enforce import restrictions (only libs in `stack.json`)
  - Enforce API contracts (OpenAPI/gRPC)
  - Define compliance rules
- **Success Criteria:**
  - [ ] `governance.rego` blocks non-spec imports
  - [ ] `api_contract.yaml` defines all endpoints/schemas
  - [ ] Neo4j `Policy` nodes created with enforceable rules

---

### Phase C: Execution (The Factory Floor)

#### **Phase C6: Coder**
- **Input:** `TKT-*.json` (NOT the tests)
- **Output:** Feature code in `src/features/[name]/`
- **Trigger:** Local Agent + `prompts/phase6_coder.md`
- **Constraint:** **BLIND BUILD** (Cannot see test expectations)
- **Rules:**
  - MUST follow VSA structure (4 files per feature)
  - MUST commit each file to Neo4j as: `CodeNode { file_path, hash, projectId }`
  - MUST respect `governance.rego`
- **Success Criteria:**
  - [ ] Code follows VSA template
  - [ ] No imports outside `stack.json`
  - [ ] Code nodes linked: `Ticket --PRODUCES--> CodeNode`

#### **Phase C7: Verifier**
- **Input:** `src/features/[name]/` + Test expectations (from Neo4j)
- **Output:** `reports/SARIF.json` + Test Results in Neo4j
- **Trigger:** Local Agent + `prompts/phase7_verifier.md`
- **Rules:**
  - Run tests in isolation (feature-level)
  - Failures feed back to Coder as SARIF report
  - Self-healing loop: Coder fixes → Verifier re-runs
- **Success Criteria:**
  - [ ] All tests pass
  - [ ] SARIF.json has 0 errors
  - [ ] Neo4j `TestResult` node created: `{ status, pass_count, fail_count, projectId }`

#### **Phase C8: Simulator**
- **Input:** Complete feature set + Chaos scenarios
- **Output:** `reports/chaos_report.json` + UX insights
- **Trigger:** Local Agent + `prompts/phase8_simulator.md`
- **Rules:**
  - Run edge cases, load tests, security scans
  - Identify UX friction
  - Document in Neo4j
- **Success Criteria:**
  - [ ] Chaos report includes: Edge Cases, Performance, Security
  - [ ] Neo4j `SimulationResult` node created

---

### Phase D: Handoff (The Closer)

#### **Phase D9: Librarian**
- **Input:** Code + Tests + Reports
- **Output:** `docs/` (Diataxis format) + Knowledge in Neo4j
- **Trigger:** Local Agent + `prompts/phase9_librarian.md`
- **Rules:**
  - Organize docs: Tutorials, How-Tos, References, Explanations
  - Link to Neo4j graph
  - Create runbooks for operations
- **Success Criteria:**
  - [ ] Docs follow Diataxis structure
  - [ ] Every feature has at least 1 tutorial
  - [ ] Neo4j `Documentation` nodes linked to features

#### **Phase D10: Closer**
- **Input:** All artifacts + ADR requirements
- **Output:** Pull Request + ADR Log + Final Neo4j state
- **Trigger:** Local Agent + `prompts/phase10_closer.md`
- **Rules:**
  - Create PR with all phases as commits
  - Document every major decision as ADR (Architecture Decision Record)
  - Final integrity check against Neo4j
- **Success Criteria:**
  - [ ] PR has clean commit history
  - [ ] `.adr/` directory has decision records
  - [ ] All Neo4j nodes validated and linked

---

## PART IV: NEO4J RULES (The Graph)

### 4.1 Read-First Protocol (Before Every Phase)

Before starting any phase, you **MUST** search Neo4j:

```javascript
mcp__neo4j__search_memories({
  query: "ProjectIntent OR TechStack OR Architecture OR Ticket",
  projectId: "SuperAgent_Init"
})
```

**What to Check:**
- Is the Intent node complete? (Has goals, scope, constraints)
- Is the TechStack validated? (All dependencies available)
- Are there existing Architecture nodes? (Prevent duplication)
- Are there related Tickets? (Check dependencies)

### 4.2 Write-Back Protocol (After Every Phase)

After completing a phase, **YOU MUST** commit to Neo4j:

```javascript
mcp__neo4j__create_memory({
  label: "PhaseCompletion",
  properties: {
    phase: "B3",  // e.g., B3 (Architect)
    status: "COMPLETE",
    timestamp: Date.now(),
    artifacts: ["specs/architecture.json"],
    projectId: "SuperAgent_Init"
  }
})

// Link to predecessor
mcp__neo4j__create_connection({
  fromLabel: "PhaseCompletion",
  fromId: "B3",
  toLabel: "PhaseCompletion",
  toId: "B4",
  relationship: "ENABLES"
})
```

### 4.3 No Hallucination Rule (GraphRAG)

- **RULE:** If Neo4j returns 0 results for a query, that thing does **NOT EXIST**.
  - Do not guess or assume.
  - Report: "I searched for `Feature: Payment` and found 0 results."
  - Ask: "Should I create this feature?"

- **RULE:** All relationships must be explicit edges in the graph.
  - Do not infer that `Feature A` depends on `Feature B` unless there's a `DEPENDS_ON` edge.
  - Query the graph: `MATCH (a:Feature {name: 'A'}) -[:DEPENDS_ON]-> (b:Feature) RETURN b`

---

## PART V: CURRENT STATUS (The Notepad)

Update this section after **every phase completion** and before `/compact`:

```
## Current Session
- **Phase:** [A1 | A2 | B3 | B4 | B5 | C6 | C7 | C8 | D9 | D10]
- **Active Ticket:** [TKT-XXX or "None"]
- **Active Slice:** [e.g., src/features/auth or "N/A"]
- **Last Action:** [Brief description of what was completed]
- **Next Step:** [Next phase or subtask]
- **Neo4j Status:** [e.g., "Intent node created", "Architecture validated"]
- **Blockers:** [Any issues or dependencies]
```

**Template:**
```
## Current Session
- **Phase:** B3 (Architect)
- **Active Ticket:** None
- **Active Slice:** N/A
- **Last Action:** Analyzed PRD + Stack, created Architecture node in Neo4j
- **Next Step:** B4 (Planner) - Generate tickets from architecture
- **Neo4j Status:** 3 nodes created (Intent, TechStack, Architecture), 2 edges linked
- **Blockers:** None
```

---

## PART VI: FAULT TOLERANCE (Safety Nets)

### 6.1 The Verification Tests

If you suspect the agent is hallucinating:

| Test | Query | Passing Answer |
|------|-------|-----------------|
| **Fake Feature** | "What is the status of the 'PaymentV2' feature?" | "I searched Neo4j and found 0 results." |
| **Fake File** | "Summarize `src/features/billing/invoice.ts`." | "That file does not exist in my graph or file system." |
| **Existing Feature** | "List all features in the architecture." | Returns list from `specs/architecture.json` + Neo4j matches |
| **Graph Integrity** | "Show me all edges from the Intent node." | Reads from Neo4j, confirms with actual relationships |

### 6.2 The Compact Protocol

After every phase, run:

```bash
/compact
```

**What it does:**
- Clears ephemeral context (trial and error, debug logs)
- **Keeps:** `CLAUDE.md`, `specs/`, code, and Neo4j state
- **Frees:** ~10k tokens for the next phase

**When to run:** After phases A2, B5, C8, D10 (phase boundaries)

### 6.3 Rollback Protocol

If a phase fails catastrophically:

```javascript
// Query the Neo4j log
mcp__neo4j__search_memories({
  query: "PhaseCompletion { status: 'COMPLETE', phase: 'B3' }",
  projectId: "SuperAgent_Init"
})

// Find the last successful phase
// Roll back to that phase's outputs
// Re-run from that point
```

---

## PART VII: INITIALIZATION (Wake Up)

Every time you start a session, run this sequence:

### Step 1: Load the Constitution
```bash
cat CLAUDE.md | head -50
```

### Step 2: Query Neo4j for Context
```javascript
mcp__neo4j__search_memories({
  query: "PhaseCompletion { status: 'COMPLETE' }",
  projectId: "SuperAgent_Init",
  limit: 5
})
```

### Step 3: Check Current Status
```bash
cat CLAUDE.md | grep -A 10 "## Current Session"
```

### Step 4: Report Back
*"I've initialized. Last completed phase was [X]. Proceeding to [Y]."*

---

## PART VIII: THE ANTI-PATTERNS (Things You MUST NOT Do)

| Anti-Pattern | Why It's Bad | What To Do Instead |
|--------------|-------------|-------------------|
| Skip a phase | Dependencies not established, hallucination risk | Complete all phases in order A1→A2→B3→B4→B5→C6→C7→C8→D9→D10 |
| Import library not in `stack.json` | Supply chain attack, governance violation | Query `specs/stack.json` first; request approval to add new library |
| Create files outside `src/features/` | Violates VSA, makes context bloat | Use vertical slices only; put everything in `src/features/[name]/` |
| Hallucinate Neo4j relationships | False confidence, propagates errors | Always query the graph; if 0 results, it doesn't exist |
| Forget to update `CLAUDE.md` | Next session has no context | Update "Current Session" section after every phase |
| Exceed 16k tokens | Attention dilution, agent becomes unreliable | Run `/compact` at phase boundaries |
| Write to Neo4j without decision log | No audit trail, can't justify changes | Always log: Why? What changed? Link to spec. |
| Do blind build without test expectations | Coder guesses, creates wrong implementation | Phase B4 must store test expectations in Neo4j (hidden from Coder) |

---

## Summary: The Golden Rule

> **Everything is traceable. Nothing is hallucinated. Every decision is in the graph.**

1. **Read specs first** → Prevents deviation
2. **Query Neo4j before acting** → Prevents hallucination
3. **Write back after completing** → Prevents loss of context
4. **Respect phase boundaries** → Prevents cascading failures
5. **Stay under 16k tokens** → Prevents attention dilution

---

**End of Constitution**  
*Last Updated: [24 January 2026]*  
*Authored By: [Daramola]*  
*Version: 2.0*