# Runtime Curriculum Generation Prompt

This prompt is embedded in Avaia's system. When a learner requests to learn something NOT in pre-seeded tracks, Avaia uses this prompt to generate a custom curriculum.

---

## When to Generate a Dynamic Curriculum

The learner says something like:
- "I want to learn Rust"
- "Can you teach me game development with Unity?"
- "I need to learn Kubernetes for my job"
- "Help me understand quantum computing"

Check: Is there a pre-seeded track for this? If NO → Generate dynamic curriculum.

---

## The Generation Prompt (for Avaia to use internally)

When generating a custom curriculum, use this structure:

```
I need to create a project-based learning curriculum for: [LEARNER'S GOAL]

## Constraints
- Learner's current knowledge: [from learner profile / onboarding]
- Time available: [if mentioned]
- Specific outcome needed: [job, project, curiosity]

## Generate

Create a learning track with 4-8 projects that progress from the learner's current level to their goal.

For each project:
1. **Name**: What they'll build
2. **Description**: Why it matters, what they'll learn
3. **Estimated hours**: Realistic time to complete
4. **Milestones** (4-6 per project):
   - What they'll accomplish
   - Concepts introduced at each milestone
   - Prerequisites (what must be learned before this)

For each concept:
1. **ID**: snake_case identifier
2. **Name**: Human readable
3. **Common misconceptions**: What learners typically get wrong
4. **Verification question**: A question to check understanding

## Output Format

Return valid JSON:
{
  "track": {
    "id": "custom-[topic]-[timestamp]",
    "name": "[Topic] Learning Path",
    "description": "[What this track teaches]",
    "language": "[primary language if applicable]",
    "domain": "[domain category]",
    "is_preseeded": false,
    "created_by": "[learner_id]"
  },
  "projects": [
    {
      "id": "[project_id]",
      "sequence_order": 1,
      "name": "[Project Name]",
      "description": "[What you'll build]",
      "estimated_hours": 10,
      "milestones": [
        {
          "id": 1,
          "name": "[Milestone Name]",
          "concepts_introduced": [
            {
              "id": "concept_id",
              "name": "Concept Name",
              "misconceptions": ["common wrong beliefs"],
              "verification": "Question to check understanding"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Tool: `generate_learning_track`

This tool wraps the above prompt and:

1. Takes learner's goal as input
2. Uses Opus-tier model for generation (via model selection)
3. Parses the JSON response
4. Inserts into database:
   - `learning_track` table
   - `project_template` table
   - `milestone_concept` mappings
   - New concepts into `concept` table
5. Assigns learner to the new track
6. Returns first project to start

---

## System Prompt Integration

Add to Avaia's system prompt:

```markdown
## Dynamic Curriculum Generation

When learner wants to learn something NOT in pre-seeded tracks:

1. Acknowledge their goal
2. Ask clarifying questions if needed:
   - "What's your current experience with [related topics]?"
   - "Is this for a specific project, job, or general learning?"
   - "How much time do you have?"
3. Call `generate_learning_track(learner_id, goal, context)`
4. This uses the smartest model available to create a full curriculum
5. Present the generated track to the learner for confirmation
6. Once confirmed, start the first project

Example interaction:
- Learner: "I want to learn Rust"
- Avaia: "Great choice! What's your background? Have you used other systems languages like C or C++?"
- Learner: "I know Python but nothing low-level"
- Avaia: "Got it. Are you learning Rust for a specific project, or general skill building?"
- Learner: "I want to contribute to open source Rust projects"
- Avaia: [calls generate_learning_track with this context]
- Avaia: "I've designed a learning path for you: [shows track overview]. It starts with 'Command Line Tool' project to learn ownership basics. Sound good?"
```

---

## Model Selection for Generation

For curriculum generation, always use the BEST available model:
- If Claude: Use Opus
- If available: Gemini 3 Pro

This is a one-time cost per track (~$0.10-0.50) that produces a complete curriculum. Worth it for quality.

Nudge in GUI: When user starts dynamic track generation, suggest:
"This works best with our most capable model. Switch to Opus for curriculum planning?"
