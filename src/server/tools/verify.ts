/**
 * Verification Tools
 * Diagnostic assessment, misconception detection, and stubborn bug remediation
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDatabase, generateId, parseJson, toJson } from '../db/index.js';

// =============================================================================
// Tool: get_diagnostic_question
// =============================================================================

const GetDiagnosticQuestionInput = z.object({
    concept_id: z.string().describe('The concept to generate a diagnostic question for'),
});

async function getDiagnosticQuestion(args: z.infer<typeof GetDiagnosticQuestionInput>) {
    const db = getDatabase();

    const question = db.prepare(`
    SELECT id, code_snippet, prompt, correct_answer, distractors
    FROM diagnostic_question
    WHERE concept_id = ?
    ORDER BY RANDOM()
    LIMIT 1
  `).get(args.concept_id) as {
        id: string;
        code_snippet: string | null;
        prompt: string;
        correct_answer: string;
        distractors: string;
    } | undefined;

    if (!question) {
        return {
            error: 'No diagnostic question found for this concept',
            fallback: 'Use Socratic questioning instead: Ask the learner to explain the concept in their own words.',
        };
    }

    const distractors = parseJson<Array<{
        answer: string;
        misconception_id: string | null;
    }>>(question.distractors, []);

    // Build options array with correct answer mixed in
    const options = [
        { id: 'A', text: question.correct_answer, is_correct: true },
        ...distractors.map((d, i) => ({
            id: String.fromCharCode(66 + i), // B, C, D, ...
            text: d.answer,
            is_correct: false,
        })),
    ];

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        question_id: question.id,
        code_snippet: question.code_snippet,
        prompt: question.prompt,
        options,
    };
}

// =============================================================================
// Tool: verify_concept
// =============================================================================

const VerifyConceptInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The concept being verified'),
    method: z.enum(['socratic', 'code_prediction']).describe('Verification method used'),
    is_correct: z.boolean().describe('Whether the answer was correct'),
    confidence: z.number().int().min(1).max(5).describe('Learner\'s self-reported confidence'),
    misconception_id: z.string().optional().describe('If incorrect, the specific misconception detected'),
});

async function verifyConcept(args: z.infer<typeof VerifyConceptInput>) {
    const db = getDatabase();
    const now = new Date();

    // Update learner_concept record
    const update = db.prepare(`
    UPDATE learner_concept
    SET 
      verified = CASE WHEN ? THEN TRUE ELSE verified END,
      verified_at = CASE WHEN ? THEN ? ELSE verified_at END,
      total_attempts = total_attempts + 1,
      correct_attempts = correct_attempts + ?,
      confidence_history = json_insert(confidence_history, '$[#]', json(?))
    WHERE learner_id = ? AND concept_id = ?
  `);

    const confidenceEntry = JSON.stringify({
        timestamp: now.toISOString(),
        confidence: args.confidence,
        correct: args.is_correct,
    });

    update.run(
        args.is_correct,
        args.is_correct,
        now.toISOString(),
        args.is_correct ? 1 : 0,
        confidenceEntry,
        args.learner_id,
        args.concept_id
    );

    // Check for stubborn bug: high confidence + wrong
    if (!args.is_correct && args.confidence >= 4) {
        // Flag as stubborn bug
        if (args.misconception_id) {
            db.prepare(`
        UPDATE learner_concept
        SET stubborn_misconceptions = json_insert(stubborn_misconceptions, '$[#]', ?)
        WHERE learner_id = ? AND concept_id = ?
      `).run(args.misconception_id, args.learner_id, args.concept_id);
        }

        // Get contrasting case for remediation
        let intervention = null;
        if (args.misconception_id) {
            const misconception = db.prepare(`
        SELECT contrasting_case FROM misconception WHERE id = ?
      `).get(args.misconception_id) as { contrasting_case: string | null } | undefined;

            if (misconception?.contrasting_case) {
                try {
                    const cases = JSON.parse(misconception.contrasting_case);
                    if (cases && cases.case_a && cases.case_b) {
                        intervention = {
                            type: 'contrasting_case' as const,
                            data: {
                                case_a: { code: cases.case_a.code, output: cases.case_a.output },
                                case_b: { code: cases.case_b.code, output: cases.case_b.output },
                            },
                        };
                    }
                } catch {
                    // Invalid JSON, skip intervention
                }
            }
        }

        return {
            status: 'remediation_required' as const,
            is_stubborn_bug: true,
            message: 'High confidence + wrong answer = stubborn bug. Use contrasting case.',
            intervention,
        };
    }

    if (!args.is_correct) {
        return {
            status: 'remediation_required' as const,
            is_stubborn_bug: false,
            message: 'Incorrect answer. Provide remediation.',
        };
    }

    return {
        status: 'verified' as const,
        message: 'Concept verified successfully.',
    };
}

// =============================================================================
// Tool: get_contrasting_case
// =============================================================================

const GetContrastingCaseInput = z.object({
    misconception_id: z.string().describe('The misconception to get remediation for'),
});

async function getContrastingCase(args: z.infer<typeof GetContrastingCaseInput>) {
    const db = getDatabase();

    const misconception = db.prepare(`
    SELECT name, description, remediation_strategy, contrasting_case
    FROM misconception
    WHERE id = ?
  `).get(args.misconception_id) as {
        name: string;
        description: string | null;
        remediation_strategy: string | null;
        contrasting_case: string | null;
    } | undefined;

    if (!misconception) {
        return { error: 'Misconception not found' };
    }

    let cases = null;
    if (misconception.contrasting_case) {
        try {
            cases = JSON.parse(misconception.contrasting_case);
        } catch {
            // Invalid JSON
        }
    }

    return {
        name: misconception.name,
        description: misconception.description,
        remediation_strategy: misconception.remediation_strategy,
        contrasting_case: cases,
        prompt: 'What\'s the ONE difference that changes the outcome?',
    };
}

// =============================================================================
// Tool: get_discrimination_question
// =============================================================================

const GetDiscriminationQuestionInput = z.object({
    concept_id: z.string().describe('The concept to find similar concepts for'),
});

async function getDiscriminationQuestion(args: z.infer<typeof GetDiscriminationQuestionInput>) {
    const db = getDatabase();

    // Get the concept's cluster
    const concept = db.prepare(`
    SELECT cluster, name FROM concept WHERE id = ?
  `).get(args.concept_id) as { cluster: string | null; name: string } | undefined;

    if (!concept || !concept.cluster) {
        return {
            has_siblings: false,
            message: 'No similar concepts to compare - skip discrimination question.',
        };
    }

    // Get sibling concepts in the same cluster
    const siblings = db.prepare(`
    SELECT id, name FROM concept
    WHERE cluster = ? AND id != ?
  `).all(concept.cluster, args.concept_id) as Array<{ id: string; name: string }>;

    if (siblings.length === 0) {
        return {
            has_siblings: false,
            message: 'No similar concepts to compare.',
        };
    }

    // Pick a random sibling
    const sibling = siblings[Math.floor(Math.random() * siblings.length)];

    return {
        has_siblings: true,
        concept_name: concept.name,
        sibling_name: sibling.name,
        sibling_id: sibling.id,
        prompt: `When would you use ${concept.name} vs ${sibling.name}?`,
        example_scenario: `Think of a situation where one is clearly better than the other.`,
    };
}

// =============================================================================
// Tool: flag_stubborn_bug
// =============================================================================

const FlagStubbornBugInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The concept with the stubborn bug'),
    misconception_id: z.string().describe('The specific misconception'),
});

async function flagStubbornBug(args: z.infer<typeof FlagStubbornBugInput>) {
    const db = getDatabase();

    db.prepare(`
    UPDATE learner_concept
    SET stubborn_misconceptions = json_insert(stubborn_misconceptions, '$[#]', ?)
    WHERE learner_id = ? AND concept_id = ?
  `).run(args.misconception_id, args.learner_id, args.concept_id);

    // Set accelerated review (1 day instead of normal interval)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    db.prepare(`
    UPDATE learner_concept
    SET next_review_date = ?, stability = 1
    WHERE learner_id = ? AND concept_id = ?
  `).run(tomorrow.toISOString(), args.learner_id, args.concept_id);

    return {
        message: 'Stubborn bug flagged. Accelerated review scheduled for tomorrow.',
        next_review: tomorrow.toISOString(),
    };
}

// =============================================================================
// Tool: log_diagnostic_result
// =============================================================================

const LogDiagnosticResultInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The concept tested'),
    question_id: z.string().describe('The diagnostic question ID'),
    answer_given: z.string().describe('The answer the learner provided'),
    is_correct: z.boolean().describe('Whether the answer was correct'),
    confidence: z.number().int().min(1).max(5).describe('Learner confidence'),
    response_time_ms: z.number().int().positive().describe('Time to answer'),
    misconception_id: z.string().optional().describe('If wrong, the misconception revealed'),
});

async function logDiagnosticResult(args: z.infer<typeof LogDiagnosticResultInput>) {
    const db = getDatabase();
    const now = new Date();

    // Update learner_concept with this attempt
    db.prepare(`
    UPDATE learner_concept
    SET 
      total_attempts = total_attempts + 1,
      correct_attempts = correct_attempts + ?,
      avg_response_time_ms = COALESCE((avg_response_time_ms * total_attempts + ?) / (total_attempts + 1), ?)
    WHERE learner_id = ? AND concept_id = ?
  `).run(
        args.is_correct ? 1 : 0,
        args.response_time_ms,
        args.response_time_ms,
        args.learner_id,
        args.concept_id
    );

    return {
        message: 'Diagnostic result logged',
        is_correct: args.is_correct,
        misconception_detected: args.misconception_id || null,
    };
}

// =============================================================================
// Tool: log_exit_ticket_result
// =============================================================================

const LogExitTicketResultInput = z.object({
    session_id: z.string().describe('The session ID'),
    concept_id: z.string().describe('The concept tested in exit ticket'),
    is_correct: z.boolean().describe('Whether they passed'),
});

async function logExitTicketResult(args: z.infer<typeof LogExitTicketResultInput>) {
    const db = getDatabase();

    db.prepare(`
    UPDATE session
    SET exit_ticket_concept = ?, exit_ticket_passed = ?
    WHERE id = ?
  `).run(args.concept_id, args.is_correct ? 1 : 0, args.session_id);

    return {
        message: args.is_correct ? 'Exit ticket passed' : 'Exit ticket failed - remediation needed',
        passed: args.is_correct,
    };
}

// =============================================================================
// Tool: get_remediation
// =============================================================================

const GetRemediationInput = z.object({
    misconception_id: z.string().describe('The misconception to remediate'),
});

async function getRemediation(args: z.infer<typeof GetRemediationInput>) {
    const db = getDatabase();

    const misconception = db.prepare(`
    SELECT name, description, remediation_strategy, concept_id
    FROM misconception
    WHERE id = ?
  `).get(args.misconception_id) as {
        name: string;
        description: string | null;
        remediation_strategy: string | null;
        concept_id: string;
    } | undefined;

    if (!misconception) {
        return { error: 'Misconception not found' };
    }

    return {
        misconception_name: misconception.name,
        description: misconception.description,
        remediation_strategy: misconception.remediation_strategy,
        concept_id: misconception.concept_id,
    };
}

// =============================================================================
// Tool: get_stubborn_bugs
// =============================================================================

const GetStubbornBugsInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function getStubbornBugs(args: z.infer<typeof GetStubbornBugsInput>) {
    const db = getDatabase();

    const rows = db.prepare(`
    SELECT lc.concept_id, c.name as concept_name, lc.stubborn_misconceptions
    FROM learner_concept lc
    JOIN concept c ON c.id = lc.concept_id
    WHERE lc.learner_id = ? AND lc.stubborn_misconceptions != '[]'
  `).all(args.learner_id) as Array<{
        concept_id: string;
        concept_name: string;
        stubborn_misconceptions: string;
    }>;

    const bugs = rows.flatMap(row => {
        const misconceptions = parseJson<string[]>(row.stubborn_misconceptions, []);
        return misconceptions.map(mid => ({
            concept_id: row.concept_id,
            concept_name: row.concept_name,
            misconception_id: mid,
        }));
    });

    return {
        count: bugs.length,
        stubborn_bugs: bugs,
        message: bugs.length > 0 ? 'Address these before continuing with new material' : 'No stubborn bugs',
    };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerVerifyTools(server: McpServer): void {
    server.tool(
        'get_diagnostic_question',
        'Gets a code prediction task with misconception-mapped distractors. Call during Verification phase.',
        GetDiagnosticQuestionInput.shape,
        async (args) => {
            const result = await getDiagnosticQuestion(GetDiagnosticQuestionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'verify_concept',
        'Logs verification attempt and triggers remediation if needed. Call after learner answers diagnostic.',
        VerifyConceptInput.shape,
        async (args) => {
            const result = await verifyConcept(VerifyConceptInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_contrasting_case',
        'Gets two code snippets for stubborn bug remediation. Use when high-confidence error detected.',
        GetContrastingCaseInput.shape,
        async (args) => {
            const result = await getContrastingCase(GetContrastingCaseInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_discrimination_question',
        'Gets a question comparing similar concepts in a cluster. Use for interleaving.',
        GetDiscriminationQuestionInput.shape,
        async (args) => {
            const result = await getDiscriminationQuestion(GetDiscriminationQuestionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'flag_stubborn_bug',
        'Marks a misconception as stubborn and schedules accelerated review.',
        FlagStubbornBugInput.shape,
        async (args) => {
            const result = await flagStubbornBug(FlagStubbornBugInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_diagnostic_result',
        'Records the outcome of a diagnostic question with misconception mapping.',
        LogDiagnosticResultInput.shape,
        async (args) => {
            const result = await logDiagnosticResult(LogDiagnosticResultInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_exit_ticket_result',
        'Records whether the learner passed the end-of-session exit ticket.',
        LogExitTicketResultInput.shape,
        async (args) => {
            const result = await logExitTicketResult(LogExitTicketResultInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_remediation',
        'Gets the targeted fix strategy for a specific misconception.',
        GetRemediationInput.shape,
        async (args) => {
            const result = await getRemediation(GetRemediationInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_stubborn_bugs',
        'Gets all unresolved high-confidence errors for a learner. Check before starting new material.',
        GetStubbornBugsInput.shape,
        async (args) => {
            const result = await getStubbornBugs(GetStubbornBugsInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );
}

