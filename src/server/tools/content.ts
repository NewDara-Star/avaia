/**
 * Content Tools
 * Concept introduction, hints, and scaffolding management
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDatabase, generateId, parseJson, toJson } from '../db/index.js';

// =============================================================================
// Hint Levels Based on Independence Score
// =============================================================================

const HINT_LEVELS = {
    0: { name: 'Socratic', description: 'Question only', threshold: 91 },
    1: { name: 'Nudge', description: 'Minimal hint', threshold: 76 },
    2: { name: 'Conceptual', description: 'Direction only', threshold: 51 },
    3: { name: 'Detailed', description: 'Method + pattern', threshold: 26 },
    4: { name: 'Full', description: 'Syntax + explanation', threshold: 0 },
};

function getHintLevel(independenceScore: number): number {
    if (independenceScore >= 91) return 0;
    if (independenceScore >= 76) return 1;
    if (independenceScore >= 51) return 2;
    if (independenceScore >= 26) return 3;
    return 4;
}

// =============================================================================
// Tool: introduce_concept
// =============================================================================

const IntroduceConceptInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The concept being introduced'),
    project_id: z.string().describe('The current project'),
    milestone_id: z.number().int().describe('The current milestone'),
    code_snippet: z.string().max(1000).describe('The relevant code (max 1000 chars)'),
    snippet_context: z.string().describe('Context for the snippet (e.g., "Task Tracker, handleSubmit")'),
});

async function introduceConcept(args: z.infer<typeof IntroduceConceptInput>) {
    const db = getDatabase();
    const now = new Date();

    // Create or update learner_concept record
    db.prepare(`
    INSERT INTO learner_concept (learner_id, concept_id, introduced_at, state)
    VALUES (?, ?, ?, 'learning')
    ON CONFLICT(learner_id, concept_id) DO UPDATE SET
      introduced_at = COALESCE(learner_concept.introduced_at, excluded.introduced_at)
  `).run(args.learner_id, args.concept_id, now.toISOString());

    // Store code snippet for future SRS
    db.prepare(`
    INSERT INTO concept_instance (
      id, learner_id, concept_id, project_id, milestone_id,
      code_snippet, snippet_context
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
        generateId('inst'),
        args.learner_id,
        args.concept_id,
        args.project_id,
        args.milestone_id,
        args.code_snippet,
        args.snippet_context
    );

    // Get concept details
    const concept = db.prepare(`
    SELECT name, prerequisites, visualizations FROM concept WHERE id = ?
  `).get(args.concept_id) as {
        name: string;
        prerequisites: string;
        visualizations: string;
    } | undefined;

    const prerequisites = parseJson<string[]>(concept?.prerequisites || '[]', []);
    const visualizations = parseJson<string[]>(concept?.visualizations || '[]', []);

    return {
        message: `Concept "${concept?.name || args.concept_id}" introduced`,
        snippet_stored: true,
        prerequisites,
        visualizations,
        teaching_tips: [
            'Use the learner\'s actual code as the example',
            'Connect to any sandbox failures if applicable',
            'Address the Five Questions: WHY, HOW, WHEN, WHERE, WHAT (limitations)',
        ],
    };
}

// =============================================================================
// Tool: get_hint
// =============================================================================

const GetHintInput = z.object({
    concept_id: z.string().describe('The concept the learner needs help with'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
    specific_question: z.string().optional().describe('What specifically they\'re stuck on'),
});

async function getHint(args: z.infer<typeof GetHintInput>) {
    const db = getDatabase();

    // Get learner's independence score for this concept
    const learnerConcept = db.prepare(`
    SELECT independence_score FROM learner_concept
    WHERE learner_id = ? AND concept_id = ?
  `).get(args.learner_id, args.concept_id) as { independence_score: number } | undefined;

    const independenceScore = learnerConcept?.independence_score || 0;
    const hintLevel = getHintLevel(independenceScore);
    const levelInfo = HINT_LEVELS[hintLevel as keyof typeof HINT_LEVELS];

    // Get concept name
    const concept = db.prepare(`
    SELECT name FROM concept WHERE id = ?
  `).get(args.concept_id) as { name: string } | undefined;

    // Generate hint guidance based on level
    let hintGuidance: string;
    switch (hintLevel) {
        case 0: // Socratic
            hintGuidance = `Ask: "What's your instinct here?" Do NOT give any technical direction.`;
            break;
        case 1: // Nudge
            hintGuidance = `Give minimal direction: "Think about ${concept?.name || 'this concept'}." Do NOT name specific methods.`;
            break;
        case 2: // Conceptual
            hintGuidance = `Give direction: "You need to [action]. Which method does that?" Do NOT show syntax.`;
            break;
        case 3: // Detailed
            hintGuidance = `Name the method and pattern: "You need [method](). It takes a callback that..." Do NOT write the full code.`;
            break;
        case 4: // Full
            hintGuidance = `Show syntax with explanation: "[method]([params]). This [explanation]..."`;
            break;
        default:
            hintGuidance = 'Provide guidance appropriate to the learner\'s level.';
    }

    return {
        hint_level: hintLevel,
        hint_level_name: levelInfo.name,
        independence_score: independenceScore,
        guidance: hintGuidance,
        anti_pattern: 'Do NOT provide more detail than the hint level allows. The struggle IS the learning.',
    };
}

// =============================================================================
// Tool: log_help_request
// =============================================================================

const LogHelpRequestInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The concept they needed help with'),
    hint_level_given: z.number().int().min(0).max(4).describe('The hint level that was provided'),
    solved_after: z.boolean().describe('Whether they solved it after the hint'),
});

async function logHelpRequest(args: z.infer<typeof LogHelpRequestInput>) {
    const db = getDatabase();

    // Calculate independence score change
    let scoreChange: number;
    if (args.solved_after) {
        switch (args.hint_level_given) {
            case 0: scoreChange = 25; break;  // Solved with Socratic only
            case 1: scoreChange = 15; break;  // Solved with nudge
            case 2: scoreChange = 5; break;   // Solved with conceptual
            case 3: scoreChange = 0; break;   // Solved with detailed
            case 4: scoreChange = -10; break; // Needed full solution
            default: scoreChange = 0;
        }
    } else {
        scoreChange = -10; // Couldn't solve even with hint
    }

    // Update independence score
    db.prepare(`
    UPDATE learner_concept
    SET independence_score = MAX(0, MIN(100, independence_score + ?)),
        attempts_without_hints = CASE WHEN ? THEN 0 ELSE attempts_without_hints END
    WHERE learner_id = ? AND concept_id = ?
  `).run(scoreChange, args.hint_level_given < 4, args.learner_id, args.concept_id);

    // Get new score
    const updated = db.prepare(`
    SELECT independence_score FROM learner_concept
    WHERE learner_id = ? AND concept_id = ?
  `).get(args.learner_id, args.concept_id) as { independence_score: number } | undefined;

    return {
        score_change: scoreChange,
        new_independence_score: updated?.independence_score || 0,
        message: scoreChange >= 0
            ? 'Independence score maintained or improved'
            : 'Independence score decreased - consider reviewing prerequisites',
    };
}

// =============================================================================
// Tool: get_prerequisites
// =============================================================================

const GetPrerequisitesInput = z.object({
    concept_id: z.string().describe('The concept to check prerequisites for'),
});

async function getPrerequisites(args: z.infer<typeof GetPrerequisitesInput>) {
    const db = getDatabase();

    const concept = db.prepare(`
    SELECT prerequisites FROM concept WHERE id = ?
  `).get(args.concept_id) as { prerequisites: string } | undefined;

    const prereqIds = parseJson<string[]>(concept?.prerequisites || '[]', []);

    if (prereqIds.length === 0) {
        return { prerequisites: [], message: 'No prerequisites for this concept.' };
    }

    // Get prerequisite details
    const placeholders = prereqIds.map(() => '?').join(',');
    const prereqs = db.prepare(`
    SELECT id, name, category FROM concept WHERE id IN (${placeholders})
  `).all(...prereqIds) as Array<{ id: string; name: string; category: string | null }>;

    return {
        prerequisites: prereqs,
        message: `${prereqs.length} prerequisite(s) must be solid before teaching this concept.`,
    };
}

// =============================================================================
// Tool: get_weak_prerequisites
// =============================================================================

const GetWeakPrerequisitesInput = z.object({
    concept_id: z.string().describe('The concept to check prerequisites for'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function getWeakPrerequisites(args: z.infer<typeof GetWeakPrerequisitesInput>) {
    const db = getDatabase();

    const concept = db.prepare(`
    SELECT prerequisites FROM concept WHERE id = ?
  `).get(args.concept_id) as { prerequisites: string } | undefined;

    const prereqIds = parseJson<string[]>(concept?.prerequisites || '[]', []);

    if (prereqIds.length === 0) {
        return { weak_prerequisites: [], can_proceed: true };
    }

    // Check learner's state for each prerequisite
    const weak: Array<{ id: string; name: string; reason: string }> = [];

    for (const prereqId of prereqIds) {
        const state = db.prepare(`
      SELECT c.name, lc.verified, lc.stability, lc.independence_score
      FROM concept c
      LEFT JOIN learner_concept lc ON lc.concept_id = c.id AND lc.learner_id = ?
      WHERE c.id = ?
    `).get(args.learner_id, prereqId) as {
            name: string;
            verified: boolean | null;
            stability: number | null;
            independence_score: number | null;
        } | undefined;

        if (!state) continue;

        if (!state.verified) {
            weak.push({ id: prereqId, name: state.name, reason: 'Not yet verified' });
        } else if ((state.stability || 0) < 2) {
            weak.push({ id: prereqId, name: state.name, reason: 'Low stability (needs review)' });
        } else if ((state.independence_score || 0) < 25) {
            weak.push({ id: prereqId, name: state.name, reason: 'Low independence (needs practice)' });
        }
    }

    return {
        weak_prerequisites: weak,
        can_proceed: weak.length === 0,
        recommendation: weak.length > 0
            ? 'Review weak prerequisites before introducing new challenge'
            : 'All prerequisites are solid - ready for new content',
    };
}

// =============================================================================
// Tool: get_visualization
// =============================================================================

const GetVisualizationInput = z.object({
    concept_id: z.string().describe('The concept to get visualization for'),
});

async function getVisualization(args: z.infer<typeof GetVisualizationInput>) {
    const db = getDatabase();

    const concept = db.prepare(`
    SELECT name, visualizations FROM concept WHERE id = ?
  `).get(args.concept_id) as { name: string; visualizations: string } | undefined;

    if (!concept) {
        return { error: 'Concept not found' };
    }

    const visualizations = parseJson<string[]>(concept.visualizations, []);

    if (visualizations.length === 0) {
        return {
            has_visualization: false,
            concept_name: concept.name,
            fallback: 'Draw a diagram or use a whiteboard explanation',
        };
    }

    return {
        has_visualization: true,
        concept_name: concept.name,
        visualizations,
    };
}

// =============================================================================
// Tool: log_confidence
// =============================================================================

const LogConfidenceInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The concept being rated'),
    confidence_level: z.number().int().min(1).max(5).describe('Self-reported confidence (1-5)'),
    outcome: z.enum(['correct', 'incorrect']).describe('Whether answer was correct'),
});

async function logConfidence(args: z.infer<typeof LogConfidenceInput>) {
    const db = getDatabase();
    const now = new Date();

    const confidenceEntry = JSON.stringify({
        timestamp: now.toISOString(),
        confidence: args.confidence_level,
        correct: args.outcome === 'correct',
    });

    db.prepare(`
    UPDATE learner_concept
    SET confidence_history = json_insert(confidence_history, '$[#]', json(?))
    WHERE learner_id = ? AND concept_id = ?
  `).run(confidenceEntry, args.learner_id, args.concept_id);

    // Check for stubborn bug pattern (high confidence + wrong)
    const isStubbornBug = args.confidence_level >= 4 && args.outcome === 'incorrect';

    return {
        logged: true,
        is_stubborn_bug: isStubbornBug,
        warning: isStubbornBug
            ? 'HIGH CONFIDENCE + WRONG = Stubborn bug. Use contrasting case immediately.'
            : null,
    };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerContentTools(server: McpServer): void {
    server.tool(
        'introduce_concept',
        'Logs a teaching moment and stores the code snippet for future SRS. Call when teaching a new concept.',
        IntroduceConceptInput.shape,
        async (args) => {
            const result = await introduceConcept(IntroduceConceptInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_hint',
        'Returns an appropriately-leveled hint based on independence score. Respects scaffolding levels.',
        GetHintInput.shape,
        async (args) => {
            const result = await getHint(GetHintInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_help_request',
        'Updates independence score after providing help. Call after learner receives a hint.',
        LogHelpRequestInput.shape,
        async (args) => {
            const result = await logHelpRequest(LogHelpRequestInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_prerequisites',
        'Returns the prerequisite concepts for a given concept.',
        GetPrerequisitesInput.shape,
        async (args) => {
            const result = await getPrerequisites(GetPrerequisitesInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_weak_prerequisites',
        'Checks which prerequisites are weak for a learner. Call before adding difficulty.',
        GetWeakPrerequisitesInput.shape,
        async (args) => {
            const result = await getWeakPrerequisites(GetWeakPrerequisitesInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_visualization',
        'Gets visual explanation URLs for a concept. Use for complex abstract concepts.',
        GetVisualizationInput.shape,
        async (args) => {
            const result = await getVisualization(GetVisualizationInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_confidence',
        'Records learner confidence rating with outcome. Detects stubborn bug patterns.',
        LogConfidenceInput.shape,
        async (args) => {
            const result = await logConfidence(LogConfidenceInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );
}

