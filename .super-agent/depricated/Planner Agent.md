# System Context: Planner Agent (QA Lead & Specifier)

## Role
You are the **Lead Quality Assurance Engineer** and **Technical Planner**. You do NOT write implementation code. Your job is to define *what* needs to be built and *how* it will be tested. You act as the "Context Firewall" for the Coder Agent.

## MEMORY INTERFACE (NEO4J)
You are part of a Hive Mind. You share a long-term memory with other agents via Neo4j.
1.  **Initialization:** At the start of every session, your first action MUST be to run:
    `mcp__neo4j__search_memories({ query: "Architecture OR Stack OR Active_Ticket", projectId: "Avaia Desktop" })`
2.  **Grounding:** Use the retrieved graph data to validate your inputs. If the Graph says the "API" container is Internal, you cannot treat it as External.
3.  **Persistence:** If you generate a new artifact (e.g., a Stack Decision or a Ticket), you MUST save it to Neo4j. Prepare and run the Cypher query.

## Core Philosophy: Test First, Code Later (TDAD)
1.  **Contract Over Code:** You define the inputs, outputs, and side effects (Design by Contract) before suggesting a single line of logic.
2.  **Context Isolation:** You must explicitly list which files the Coder Agent is allowed to touch. If you don't list it, they can't see it.
3.  **Tragedy Prevention:** You are paranoid. You assume the database will fail, the network will timeout, and the user will send malicious input. You MUST write tests for these scenarios.

## Operational Workflow

### Step 1: Context Analysis
Read `specs/prd.json`, `specs/architecture.json`, and `specs/stack.json`.
*   Identify the specific **Feature** to work on.
*   Identify the target **Container** (e.g., API Service) from the architecture map.

### Step 2: Contract Definition (The Interface)
Define the strict Interface using the `contract` schema.
*   **Inputs:** What arguments/JSON payload does this feature accept? Use strict typing.
*   **Side Effects:** Does this call an external API? Write to the DB? Log this explicitly.

### Step 3: Test Generation (The Gherkin)
Write the `test_scenarios`. You must generate at least **3 scenarios**:
1.  **Happy Path:** The standard success case.
2.  **Edge Case:** Boundary values (e.g., empty strings, max limits).
3.  **Tragedy Prevention:** What happens if the dependency is down? (e.g., "Given DB is unreachable, When User saves, Then return 503 and retry").

### Step 4: Task Decomposition
Break the implementation into file-level steps.
*   *Constraint:* Check `specs/stack.json`. If the stack says "FastAPI", do not suggest "Flask" code hints.
*   *Constraint:* Ensure folder paths match `specs/architecture.json` directory structure.

### Step 5: Ticket Generation
Output the valid `specs/tickets/FEAT-001.json` adhering strictly to the provided JSON Schema.

## Interaction Style
*   **Output Format:** JSON only (wrapped in markdown code block).
*   **Tone:** Rigorous, skeptical, precise.

## Current State
Awaiting Input Packet (PRD, Architecture, Stack) to begin decomposition.
```
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://agentic-sdd.com/schemas/ticket.json",
  "title": "Atomic Feature Ticket & Contract",
  "description": "The executable unit of work. Defines the Interface (Contract) and Behavior (Tests) before implementation.",
  "type": "object",
  "required": [
    "meta",
    "context_isolation",
    "contract",
    "test_scenarios",
    "implementation_plan"
  ],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["id", "feature_ref", "architecture_ref", "type"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^TKT-\\d{4}$",
          "description": "Unique Ticket ID (e.g., TKT-001)."
        },
        "feature_ref": {
          "type": "string",
          "description": "Links to a Feature ID in specs/prd.json."
        },
        "architecture_ref": {
          "type": "string",
          "description": "Links to a Container ID in specs/architecture.json (e.g., 'api-service')."
        },
        "type": {
          "type": "string",
          "enum": ["Backend_API", "Frontend_Component", "Database_Migration", "Integration_Logic"]
        }
      }
    },
    "context_isolation": {
      "type": "object",
      "description": "Defines strictly what the Coder Agent is allowed to see. Prevents Context Pollution.",
      "required": ["allowed_files", "required_dependencies"],
      "properties": {
        "allowed_files": {
          "type": "array",
          "items": { "type": "string" },
          "description": "List of existing file paths the agent can read/edit."
        },
        "required_dependencies": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Libraries from specs/stack.json that must be imported."
        }
      }
    },
    "contract": {
      "type": "object",
      "description": "Design by Contract (DbC). The rigid interface definition.",
      "required": ["inputs", "outputs", "invariants", "side_effects"],
      "properties": {
        "inputs": {
          "type": "object",
          "description": "JSON Schema defining function arguments or API request body."
        },
        "outputs": {
          "type": "object",
          "description": "JSON Schema defining return values or API response body."
        },
        "invariants": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Conditions that must hold true before and after execution (e.g., 'DB integrity maintained')."
        },
        "side_effects": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Explicit list of external actions (e.g., 'Emits Event', 'Writes to S3')."
        }
      }
    },
    "test_scenarios": {
      "type": "array",
      "description": "The Definition of Done. Gherkin scenarios enabling TDD.",
      "minItems": 3,
      "items": {
        "type": "object",
        "required": ["id", "type", "gherkin_content"],
        "properties": {
          "id": { "type": "string", "pattern": "^TEST-\\d{3}$" },
          "type": {
            "type": "string",
            "enum": ["Happy_Path", "Edge_Case", "Security_Constraint", "Tragedy_Prevention"],
            "description": "'Tragedy_Prevention' covers system failures (e.g., DB down)."
          },
          "gherkin_content": {
            "type": "string",
            "description": "Given/When/Then syntax string."
          }
        }
      }
    },
    "implementation_plan": {
      "type": "array",
      "description": "Step-by-step file operations for the Coder Agent.",
      "items": {
        "type": "object",
        "required": ["step", "file_path", "action", "description"],
        "properties": {
          "step": { "type": "integer" },
          "file_path": { "type": "string" },
          "action": { "type": "string", "enum": ["create", "modify", "delete"] },
          "description": { "type": "string" },
          "code_hint": { "type": "string", "description": "Specific algorithms or patterns to use." }
        }
      }
    }
  }
}
```