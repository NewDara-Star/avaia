Based on the **Spec-Driven Development (SDD)** framework and the research on **Legacy Modernization**, you are effectively performing a "Reverse Engineering" operation to generate the initial **Product Intent Manifest**.

Research indicates that simply dumping code into an LLM often fails due to **Context Overflow** and the **Stochastic Barrier**, where the model hallucinates features or gets distracted by "spaghetti code". To do this correctly, you must treat your existing codebase not as "truth," but as "evidence of intent."

Here is the strategy and the specific **System Prompt** to extract a clean feature list for Phase 1.

### The Strategy: "Intent Extraction" (Not Refactoring)
You are not asking the AI to *read* the code to understand how it works; you are asking it to **audit** the code to understand what it was *trying* to do.

**Critical Warnings from Sources:**
1.  **The Comment Trap:** You must explicitly instruct the agent to ignore commented-out code. Research shows that defective commented-out code causes agents to hallucinate bugs and bad logic in 58% of cases.
2.  **Logic Decoupling:** You need to extract *Business Logic* (e.g., "Tax is calculated at 5%"), not *Implementation Details* (e.g., "Uses a `for` loop").

---

### The Master Prompt: "The System Archaeologist"

**Paste this into a high-context model (like Claude 3.5 Sonnet, Gemini 1.5 Pro, or GPT-4o) along with your codebase.**

> **System Context: Legacy System Archaeologist**
>
> **Role:** You are an Expert Product Manager and Technical Archaeologist. Your goal is to analyze a legacy codebase and extract the **Functional Intent** to populate a new Product Requirements Document (PRD).
>
> **Input:** A codebase (potentially messy, buggy, or incomplete).
> **Output:** A structured **Feature Inventory** in JSON format.
>
> **Prime Directives:**
> 1.  **Ignore Implementation Quality:** Do not judge *how* the code is written. Focus solely on *what* functionality it attempts to deliver.
> 2.  **Ignore Commented-Out Code:** Strictly ignore any code blocks inside comments. These are "Comment Traps" and must not influence your feature extraction.
> 3.  **Infer "Negative Constraints":** If the code has specific error handling (e.g., "If age < 18, throw error"), record this as a business rule, not just a bug fix.
> 4.  **Detect Hidden Features:** Look for "admin flags," "debug modes," or "hardcoded allowlists" that represent undocumented features.
>
> **Analysis Workflow:**
> 1.  **Scan** the file structure to understand the domain domains (e.g., `/auth`, `/payments`).
> 2.  **Parse** endpoints (API routes) and UI components to identify user-facing actions.
> 3.  **Trace** data models (SQL schemas/Types definitions) to understand the entities (e.g., "User," "Order").
> 4.  **Synthesize** this into a list of atomic User Stories.
>
> **Output Format:**
> Generate a JSON object strictly adhering to this structure:
>
> ```json
> {
>   "product_summary": "High-level description of what this application does.",
>   "detected_personas": ["Admin", "Customer", "Guest"],
>   "features": [
>     {
>       "name": "Feature Name (e.g., User Login)",
>       "user_story": "As a [Persona], I want to [Action], so that [Benefit].",
>       "implied_business_rules": [
>         "Password must be 8 chars",
>         "Users cannot delete their own account"
>       ],
>       "data_dependencies": ["Users Table", "Auth Provider"],
>       "external_integrations": ["Stripe", "SendGrid"]
>     }
>   ],
>   "technical_debt_flags": [
>     "Hardcoded API keys detected in auth.js",
>     "Circular dependency in payment logic"
>   ]
> }
> ```
>
> **Instruction:** Analyze the provided codebase now and generate the Feature Inventory.

---

### How to Execute This (The Context Strategy)

If your codebase is large, you cannot paste it all at once. You must use a strategy to feed it to the LLM without hitting the context limit or confusing the model.

**Option A: The "Repo-to-Text" Method (Best for < 500 files)**
Use a tool like `repomix` or `gingko` to concatenate your codebase into a single text file.
*   **Filter:** Exclude `node_modules`, `.git`, `lockfiles`, and assets.
*   **Run:** Paste the prompt above + the concatenated file.

**Option B: The "MCP" Method (Best for Large Repos)**
If you are using an IDE like Cursor or Windsurf that supports the **Model Context Protocol (MCP)**:
1.  Open the chat.
2.  Paste the prompt above.
3.  Tag the critical directories (e.g., `@src`, `@api`, `@database`).
4.  The agent will proactively "read" the files via MCP tools to build the inventory.

### The Bridge to Phase 1

Once the "System Archaeologist" outputs the `Feature Inventory JSON`, you do **not** use this as your final PRD. It is likely biased by the old code's limitations.

**Your Next Move:**
1.  Take the `Feature Inventory JSON`.
2.  Start a **new chat** with the **Clarification Agent** (from your previous Phase 1 prompt).
3.  **Input:** "Here is a list of features extracted from my legacy codebase. I want to build a *new, rewritten* version of this product. Use this list as the 'Rough Idea' and interrogate me to refine the requirements for the rewrite."

This converts your "Legacy Truth" into "Future Intent," effectively utilizing the **Reverse Engineering** workflow described in the modernizing legacy codebases research.