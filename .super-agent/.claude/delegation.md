Based on the "10-Step AI Factory" framework detailed in the provided sources, the optimal model selection relies on matching specific cognitive strengths—such as context window, reasoning depth, or structured output capability—to the distinct requirements of each role.

Here is the recommended model architecture for each step of the factory:

### 1. Analyst (Idea $\rightarrow$ Spec)

## OPERATOR CONNECTION PROTOCOL (HUMAN-IN-THE-LOOP)
- You cannot contact, call, or hand off to other agents.
- You only communicate with the Human Operator.
- If you are blocked or a decision is required, you MUST:
  1) Stop immediately (do not proceed on assumptions).
  2) Output an **Operator Handoff Packet** (format below).
  3) Wait for the operator to relay it to the appropriate agent and return with an answer.

### Operator Handoff Packet (required)
- **Status:** IN_PROGRESS | BLOCKED | DECISION_NEEDED
- **What I completed:** …
- **Current artefacts touched:** (file paths)
- **What I need next:** (specific missing info or file)
- **Which agent should handle it:** Clarification | TechStack | Architect | Planner | Gatekeeper | Implementer | Auditor | Librarian | RealUser | Archeologist | Closer
- **Why:** …
- **My recommendation (optional):** clearly labelled; no action taken without approval

## HUMAN APPROVAL GATE (NON-NEGOTIABLE)
You may not make or finalise decisions on:
- scope changes, tech stack choices, architecture changes, database schema/migrations,
- API contract shape, security/RLS/policy changes, file/module boundaries, release behaviour.

If any of the above is required, output an **Operator Handoff Packet** with **Status: DECISION_NEEDED** and stop.

## MEMORY INTERFACE (NEO4J)
- You have **read-only** access to Neo4j memory.
- Your first action MUST be to query Neo4j for relevant memories and the Active Ticket.
- Treat Neo4j + repo artefacts as the only truth. If it is not there, you do not assume it.
- You may NOT write to Neo4j. If you generate new knowledge that should be stored, output a **Memory Write Packet** for the Librarian.

### Neo4j read (required at start)
`mcp__neo4j__search_memories({ query: "Active_Ticket OR Delegation OR Handoff OR Process", projectId: "SuperAgent_Init" })`

### Memory Write Packet (for Librarian)
- **Node type:** DecisionProposal | Artifact | Insight | Risk | TestResult | Doc
- **Suggested ID:** …
- **Properties:** …
- **Relationships:** …
- **Source/Evidence:** (artefact path, test output, diff, etc.)

*   **Recommended Model:** **Claude Opus 4.5**
*   **Why:** This role requires high emotional intelligence (EQ) and deep contextual reasoning to interview non-technical users and identify hidden requirements. Claude Opus 4.5 is cited as the "zenith of intelligence" for this purpose, capable of navigating open-ended prompts with human-like fluency and utilizing "extended thinking" to conduct research reviews before finalizing a specification. Its 200k context window allows it to ingest massive background datasets (market research, legal contracts) to ensure the spec is comprehensive.

### 2. CTO (Spec $\rightarrow$ Stack)
*   **Recommended Model:** **GPT-5.2 Pro**
*   **Why:** The CTO role demands high-stakes problem-solving to select a technology stack that balances scalability, security, and cost. GPT-5.2 Pro is designed for strategic tasks where precision outweighs cost. When configured with "High" reasoning effort, it can simulate the long-term impact of architectural choices (e.g., technical debt, regional compliance).

### 3. Architect (Stack $\rightarrow$ Map)
*   **Recommended Model:** **Claude Sonnet 4.5**
*   **Why:** This model strikes the ideal balance between intelligence and speed for system design. Uniquely, Sonnet 4.5 possesses superior visual reasoning capabilities, allowing it to interpret whiteboard screenshots and architectural diagrams to ensure the digital system map matches the visual intent. It is capable of generating high-fidelity representations, such as Lossless Semantic Trees (LST), to maintain structural consistency.

### 4. Planner (Map $\rightarrow$ Ticket)
*   **Recommended Model:** **GPT-5.2** (Configured to Medium/High Reasoning Effort)
*   **Why:** While coding models excel at execution, general-purpose reasoning models like GPT-5.2 are superior for decomposition because they handle ambiguity better and provide narrative depth. Setting the `reasoning_effort` parameter to "Medium" or "High" allows the model to explore multiple branches, verifying the task sequence to avoid circular dependencies before finalizing actionable tickets.

### 5. Gatekeeper (Ticket $\rightarrow$ Contract)
*   **Recommended Model:** **GPT-5 Mini** (with Structured Outputs)
*   **Why:** The Gatekeeper requires deterministic reliability to enforce security policies and prevent prompt injection. GPT-5 Mini, when used with the OpenAI Responses API and strict JSON schemas, acts as a cost-effective "digital bouncer." It uses Pydantic-based validation to ensure that every ticket passed to the coder adheres to strict architectural and security contracts.

### 6. Coder (Contract $\rightarrow$ Code)
*   **Recommended Model:** **GPT-5.1-Codex-Max** (Backend) & **Claude Sonnet 4.5** (Frontend)
*   **Why:**
    *   **Backend/Logic:** GPT-5.1-Codex-Max is the "decisive winner" for backend logic, complex refactoring, and legacy migration. It utilizes "Context Compaction" to work autonomously for long durations (24+ hours) on project-scale tasks without losing context.
    *   **Frontend/UI:** Developers prefer Claude Sonnet 4.5 for the presentation layer, as it produces more "elegant" and aesthetically pleasing interfaces with fewer prompts compared to Codex models.

### 7. Verifier (Code $\rightarrow$ Pass/Fail)
*   **Recommended Model:** **OpenAI o3** or **o4-mini**
*   **Why:** The Verifier role demands precision and logic to identify subtle regressions or race conditions. The OpenAI o-series models are optimized for STEM and deterministic logic. They should be configured with a low temperature (e.g., 0.0) or a fixed seed to ensure reproducible "Pass/Fail" signals. If a test fails, these models provide detailed chain-of-thought summaries to guide remediation.

### 8. Simulator (UX $\rightarrow$ Chaos)
*   **Recommended Model:** **GPT-5.2**
*   **Why:** To perform chaos engineering and test system robustness, the Simulator needs to generate "chaos prompts" that mimic rare user states and adversarial interactions. GPT-5.2 is well-suited for this due to its high verbosity settings and multi-modal capabilities (text, audio, video), allowing it to simulate frustrated users or edge-case scenarios across different interfaces.

### 9. Librarian (Code $\rightarrow$ Docs)
*   **Recommended Model:** **Gemini 2.5 Pro** (or **Gemini 3 Pro**)
*   **Why:** The Librarian requires massive context retention to act as the "single source of truth" for the project. Gemini 2.5 Pro (and the newer 3 Pro) dominates this niche with a context window of 1 million to 2 million tokens. This allows it to ingest the entire codebase, decision logs, and documentation history to answer queries like "What does our order processing architecture look like?" without information loss.

### 10. Closer (Project $\rightarrow$ PR)
*   **Recommended Model:** **Claude Sonnet 4.5**
*   **Why:** The transition from completed code to a merged Pull Request requires narrative fluency to summarize work for human review. Claude Sonnet 4.5 is preferred here because it generates the most polished, production-ready release notes and documentation, ensuring the human orchestrator can review and merge with confidence.
