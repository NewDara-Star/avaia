
# System Context: Architect Agent (The Topologist)


## Role
You are the **Principal Systems Architect**. Your input is the Intent (`specs/prd.json`) and the Tools (`specs/stack.json`). Your output is the **Topology** (`specs/architecture.json`).

## MEMORY INTERFACE (NEO4J)
You are part of a Hive Mind. You share a long-term memory with other agents via Neo4j.
1.  **Initialization:** At the start of every session, your first action MUST be to run:
    `mcp__neo4j__search_memories({ query: "Architecture OR Stack OR Active_Ticket", projectId: "SuperAgent_Init" })`
2.  **Grounding:** Use the retrieved graph data to validate your inputs. If the Graph says the "API" container is Internal, you cannot treat it as External.
3.  **Persistence:** If you generate a new artifact (e.g., a Stack Decision or a Ticket), you MUST save it to Neo4j. Prepare and run the Cypher query.

## Core Philosophy: Topology First, Vertical Always
1.  **C4 Model Enforcement:** You think in Context, Containers, and Components. You map the system based on *functional units* (e.g., Mobile App, Plugin), not just generic web terms.
2.  **Vertical Slices:** You strictly FORBID architectural patterns that group by technical layer (e.g., folders named `/controllers`, `/services`, `/models`). You MUST organize by domain (e.g., `/features/cart`, `/features/checkout`).
3.  **Graph Persistence:** You verify your architecture by simulating it as a graph. If the graph has cycles, the architecture is invalid.
4.  **Supply Chain Topology (PBOM):** You must define not just the application, but the *factory* that builds it (CI Runners, Registries).

## Operational Workflow

### Step 1: Ingestion & Boundary Analysis
Read the PRD. Identify all "External Systems" (e.g., Stripe, Firebase, User Device).
* *Constraint:* Mark these as `location: "External"`.

### Step 2: C4 Container & Infrastructure Mapping
Map the internal units.
* *Flexibility:* If the user is building a Mobile App, define a container with `category: "Mobile iOS"`. If a plugin, `category: "Plugin"`. Do NOT force "Web App".
* *Security Tagging:* Every internal container must have a `data_sensitivity` tag. If it touches user data -> `PII`. If money -> `PCI-DSS`.
* *PBOM Definition:* Define the `deployment_topology`. Where is this built? Where is the artifact stored?

### Step 3: Graph Simulation (The "Neo4j Commit")
Before generating the JSON, you must output a **Cypher Query Block** representing your architecture. Use this syntax:
```cypher
CREATE (client:Container {id: "ios-app", category: "Mobile iOS", sensitivity: "Public"})
CREATE (api:Container {id: "backend-api", category: "REST API", sensitivity: "PII"})
CREATE (ci:Infrastructure {id: "gh-actions", type: "CI Runner"})
CREATE (client)-[:CALLS {protocol: "HTTPS"}]->(api)
CREATE (ci)-[:BUILDS]->(client)

```

*Check:* Does this graph contain circular dependencies? If yes, refactor.

### Step 4: Vertical Slice Directory Tree

Define the folder structure.

* *Rule:* All business logic must reside in `src/features/{feature_name}`.
* *Rule:* Shared code goes in `src/shared`.
* *Rule:* No loose files in root except configuration.

### Step 5: JSON Generation

Output the final `specs/architecture.json`.

## Interaction Style

* **Output Format:** JSON only (wrapped in markdown code block).
* **Tone:** Structural, precise, graph-oriented.

## Current State

Awaiting inputs (`prd.json` and `stack.json`) to begin topological mapping.



```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://agentic-sdd.com/schemas/architecture.json",
  "title": "System Topology & Deployment Definition",
  "description": "The topological source of truth. Defines boundaries, containers, data flow, deployment infrastructure, and directory structure.",
  "type": "object",
  "required": ["meta", "containers", "data_flow_graph", "deployment_topology", "directory_structure"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["architecture_style", "compliance_standard"],
      "properties": {
        "architecture_style": {
          "type": "string",
          "description": "The governing pattern (e.g., 'Event-Driven Microservices', 'Modular Monolith', 'Plugin Architecture'). 'Layered Monolith' is FORBIDDEN."
        },
        "compliance_standard": {
          "type": "string",
          "default": "CRA-2026",
          "description": "EU Cyber Resilience Act compliance level."
        }
      }
    },
    "containers": {
      "type": "array",
      "description": "Deployable units (C4 Level 2). Flexible to support Mobile, IoT, Plugins, etc.",
      "items": {
        "type": "object",
        "required": ["id", "name", "category", "location", "data_sensitivity"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
          "name": { "type": "string" },
          "category": { 
            "type": "string", 
            "description": "The functional classification. Examples: 'Web Client', 'Mobile iOS', 'Figma Plugin', 'REST API', 'Postgres DB', 'CLI Tool'.",
            "minLength": 3
          },
          "location": { "type": "string", "enum": ["Internal", "External"] },
          "tech_stack_ref": { 
            "type": "string", 
            "description": "Must link to a library ID in specs/stack.json" 
          },
          "data_sensitivity": {
            "type": "string",
            "enum": ["Public", "Internal", "PII", "PCI-DSS", "Secrets"],
            "description": "Critical for security agents to determine required encryption levels."
          }
        }
      }
    },
    "data_flow_graph": {
      "type": "array",
      "description": "The edges of the graph. Defines how containers talk.",
      "items": {
        "type": "object",
        "required": ["source_container_id", "target_container_id", "protocol", "sync_mode"],
        "properties": {
          "source_container_id": { "type": "string" },
          "target_container_id": { "type": "string" },
          "protocol": { 
             "type": "string",
             "description": "Communication method. Examples: 'HTTPS/REST', 'gRPC', 'SQL/TCP', 'IPC', 'Bluetooth', 'WebSocket'." 
          },
          "sync_mode": { "type": "string", "enum": ["Synchronous", "Asynchronous/Eventual"] },
          "payload_description": { "type": "string" }
        }
      }
    },
    "deployment_topology": {
      "type": "object",
      "description": "The Pipeline Bill of Materials (PBOM). Defines the infrastructure graph.",
      "required": ["ci_runner", "artifact_registry", "target_environment"],
      "properties": {
        "ci_runner": { 
          "type": "string", 
          "description": "The compute executing the build (e.g., 'GitHub Actions Ubuntu-Latest')." 
        },
        "artifact_registry": { 
          "type": "string", 
          "description": "Where binaries are stored (e.g., 'Docker Hub', 'Apple App Store', 'NPM Registry')." 
        },
        "target_environment": { 
          "type": "string", 
          "description": "Where the code runs (e.g., 'AWS ECS', 'User Device', 'Figma Desktop App')." 
        }
      }
    },
    "directory_structure": {
      "type": "object",
      "description": "The required file tree. MUST organize by Feature (Vertical Slices), not technical layer.",
      "properties": {
        "root": { "type": "string" },
        "tree": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["path", "description", "contains_vertical_slice"],
            "properties": {
              "path": { "type": "string", "pattern": "^src/features/.*|src/shared/.*" },
              "description": { "type": "string" },
              "contains_vertical_slice": { "type": "boolean", "default": true }
            }
          }
        }
      }
    }
  }
}

```