/**
 * Sandbox Tools (Productive Failure)
 * Implements designed failure exercises before complex concepts
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDatabase, generateId, parseJson, toJson } from '../db/index.js';

// =============================================================================
// Tool: trigger_sandbox
// =============================================================================

const TriggerSandboxInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    target_concept_id: z.string().describe('The concept about to be taught'),
});

async function triggerSandbox(args: z.infer<typeof TriggerSandboxInput>) {
    const db = getDatabase();

    // Check if concept has a sandbox and if learner has completed it
    const sandbox = db.prepare(`
    SELECT s.id, s.problem_statement, s.expected_failures, s.min_attempts, s.setup_code
    FROM sandbox s
    WHERE s.concept_id = ?
  `).get(args.target_concept_id) as {
        id: string;
        problem_statement: string;
        expected_failures: string;
        min_attempts: number;
        setup_code: string | null;
    } | undefined;

    if (!sandbox) {
        return { required: false };
    }

    // Check if learner has already completed this sandbox
    const attempts = db.prepare(`
    SELECT COUNT(*) as count, MAX(matched_failure_pattern) as last_pattern
    FROM sandbox_attempt
    WHERE sandbox_id = ? AND learner_id = ?
  `).get(sandbox.id, args.learner_id) as { count: number; last_pattern: string | null };

    const expectedFailures = parseJson<Array<{
        id: string;
        description: string;
        is_correct_failure: boolean;
    }>>(sandbox.expected_failures, []);

    // Check if they've hit a "correct" failure
    const hasCorrectFailure = attempts.last_pattern !== null &&
        expectedFailures.some(f => f.id === attempts.last_pattern && f.is_correct_failure);

    if (hasCorrectFailure && attempts.count >= sandbox.min_attempts) {
        return { required: false };
    }

    return {
        required: true,
        sandbox_id: sandbox.id,
        problem_statement: sandbox.problem_statement,
        setup_code: sandbox.setup_code,
        expected_failures: expectedFailures.map(f => ({
            id: f.id,
            description: f.description,
        })),
        attempts_so_far: attempts.count,
        min_attempts: sandbox.min_attempts,
    };
}

// =============================================================================
// Tool: evaluate_sandbox_attempt
// =============================================================================

const EvaluateSandboxAttemptInput = z.object({
    sandbox_id: z.string().describe('The sandbox exercise ID'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
    learner_code: z.string().describe('The code the learner wrote'),
    learner_observation: z.string().describe('What the learner observed happening'),
});

async function evaluateSandboxAttempt(args: z.infer<typeof EvaluateSandboxAttemptInput>) {
    const db = getDatabase();

    // Get sandbox definition
    const sandbox = db.prepare(`
    SELECT expected_failures, reflection_questions, teaching_transition, min_attempts
    FROM sandbox
    WHERE id = ?
  `).get(args.sandbox_id) as {
        expected_failures: string;
        reflection_questions: string;
        teaching_transition: string | null;
        min_attempts: number;
    } | undefined;

    if (!sandbox) {
        throw new Error(`Sandbox not found: ${args.sandbox_id}`);
    }

    const expectedFailures = parseJson<Array<{
        id: string;
        description: string;
        code_pattern: string | null;
        learner_symptoms: string[];
        is_correct_failure: boolean;
        remediation?: string;
    }>>(sandbox.expected_failures, []);

    // Try to match failure pattern
    let matched: typeof expectedFailures[0] | null = null;
    const observationLower = args.learner_observation.toLowerCase();
    const codeLower = args.learner_code.toLowerCase();

    for (const failure of expectedFailures) {
        // Check if any symptom matches the observation
        const symptomMatch = failure.learner_symptoms.some(symptom =>
            observationLower.includes(symptom.toLowerCase())
        );

        // Check if code pattern matches (if defined)
        let codeMatch = true;
        if (failure.code_pattern) {
            try {
                const regex = new RegExp(failure.code_pattern, 'i');
                codeMatch = regex.test(args.learner_code);
            } catch {
                codeMatch = false;
            }
        }

        if (symptomMatch || (failure.code_pattern && codeMatch)) {
            matched = failure;
            break;
        }
    }

    // Count previous attempts
    const attemptCount = db.prepare(`
    SELECT COUNT(*) as count FROM sandbox_attempt
    WHERE sandbox_id = ? AND learner_id = ?
  `).get(args.sandbox_id, args.learner_id) as { count: number };

    const attemptNumber = attemptCount.count + 1;

    // Log this attempt
    db.prepare(`
    INSERT INTO sandbox_attempt (
      id, sandbox_id, learner_id, attempt_number,
      code_submitted, approach_description, outcome, matched_failure_pattern
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        generateId('attempt'),
        args.sandbox_id,
        args.learner_id,
        attemptNumber,
        args.learner_code,
        args.learner_observation,
        matched ? 'matched' : 'no_match',
        matched?.id || null
    );

    // Determine next phase
    let nextPhase: 'retry' | 'reflect' | 'teach';
    let feedbackGuidance: string;

    if (!matched) {
        nextPhase = 'retry';
        feedbackGuidance = 'The learner\'s approach didn\'t hit the expected failure pattern. Encourage them to try a different approach without giving away the answer.';
    } else if (!matched.is_correct_failure) {
        nextPhase = 'retry';
        feedbackGuidance = matched.remediation || 'This wasn\'t the pedagogically useful failure. Guide them to try again.';
    } else if (attemptNumber < sandbox.min_attempts) {
        nextPhase = 'retry';
        feedbackGuidance = `Good failure! But encourage ${sandbox.min_attempts - attemptNumber} more attempt(s) with different approaches.`;
    } else {
        nextPhase = 'teach';
        feedbackGuidance = 'They\'ve hit the correct failure. Now ask the reflection questions before teaching.';
    }

    const reflectionQuestions = parseJson<string[]>(sandbox.reflection_questions, []);

    return {
        matched_failure_id: matched?.id || null,
        is_correct_failure: matched?.is_correct_failure || false,
        feedback_guidance: feedbackGuidance,
        next_phase: nextPhase,
        attempt_number: attemptNumber,
        reflection_questions: nextPhase === 'teach' ? reflectionQuestions : undefined,
        teaching_transition: nextPhase === 'teach' ? sandbox.teaching_transition : undefined,
    };
}

// =============================================================================
// Tool: log_sandbox_reflection
// =============================================================================

const LogSandboxReflectionInput = z.object({
    sandbox_id: z.string().describe('The sandbox exercise ID'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
    learner_articulation: z.string().describe('The learner\'s reflection on why their approaches failed'),
    quality: z.enum(['none', 'partial', 'complete']).describe('Quality of the articulation'),
});

async function logSandboxReflection(args: z.infer<typeof LogSandboxReflectionInput>) {
    const db = getDatabase();

    // Update most recent attempt with articulation quality
    db.prepare(`
    UPDATE sandbox_attempt
    SET articulation_quality = ?
    WHERE sandbox_id = ? AND learner_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `).run(args.quality, args.sandbox_id, args.learner_id);

    // Get teaching transition
    const sandbox = db.prepare(`
    SELECT teaching_transition FROM sandbox WHERE id = ?
  `).get(args.sandbox_id) as { teaching_transition: string | null } | undefined;

    return {
        message: 'Reflection logged',
        ready_to_teach: args.quality !== 'none',
        teaching_transition: sandbox?.teaching_transition || 'Now let\'s understand why this happened...',
    };
}

// =============================================================================
// Tool: log_sandbox_attempt
// =============================================================================

const LogSandboxAttemptInput = z.object({
    sandbox_id: z.string().describe('The sandbox exercise ID'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
    attempt_number: z.number().int().min(1).describe('Which attempt this is'),
    approach_description: z.string().describe('What approach the learner tried'),
    outcome: z.string().describe('What happened (result observed)'),
});

async function logSandboxAttempt(args: z.infer<typeof LogSandboxAttemptInput>) {
    const db = getDatabase();

    db.prepare(`
    INSERT INTO sandbox_attempt (
      id, sandbox_id, learner_id, attempt_number,
      approach_description, outcome
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
        generateId('attempt'),
        args.sandbox_id,
        args.learner_id,
        args.attempt_number,
        args.approach_description,
        args.outcome
    );

    return {
        message: `Attempt ${args.attempt_number} logged.`,
        attempt_number: args.attempt_number,
    };
}

// =============================================================================
// Tool: get_sandbox_summary
// =============================================================================

const GetSandboxSummaryInput = z.object({
    sandbox_id: z.string().describe('The sandbox exercise ID'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function getSandboxSummary(args: z.infer<typeof GetSandboxSummaryInput>) {
    const db = getDatabase();

    const attempts = db.prepare(`
    SELECT attempt_number, approach_description, outcome, matched_failure_pattern, timestamp
    FROM sandbox_attempt
    WHERE sandbox_id = ? AND learner_id = ?
    ORDER BY attempt_number ASC
  `).all(args.sandbox_id, args.learner_id) as Array<{
        attempt_number: number;
        approach_description: string | null;
        outcome: string | null;
        matched_failure_pattern: string | null;
        timestamp: string;
    }>;

    const sandbox = db.prepare(`
    SELECT problem_statement, teaching_transition FROM sandbox WHERE id = ?
  `).get(args.sandbox_id) as { problem_statement: string; teaching_transition: string | null } | undefined;

    return {
        sandbox_id: args.sandbox_id,
        total_attempts: attempts.length,
        attempts: attempts.map(a => ({
            number: a.attempt_number,
            approach: a.approach_description,
            outcome: a.outcome,
            failure_pattern: a.matched_failure_pattern,
        })),
        problem: sandbox?.problem_statement,
        ready_for_teaching: attempts.some(a => a.matched_failure_pattern !== null),
        teaching_transition: sandbox?.teaching_transition,
    };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerSandboxTools(server: McpServer): void {
    server.tool(
        'trigger_sandbox',
        'Checks if an upcoming concept requires a "Designed Failure" sandbox first. Call before introducing complex concepts.',
        TriggerSandboxInput.shape,
        async (args) => {
            const result = await triggerSandbox(TriggerSandboxInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'evaluate_sandbox_attempt',
        'Validates if the learner "failed correctly" in a sandbox exercise. Call after learner reports their attempt.',
        EvaluateSandboxAttemptInput.shape,
        async (args) => {
            const result = await evaluateSandboxAttempt(EvaluateSandboxAttemptInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_sandbox_reflection',
        'Records the learner\'s reflection on why their sandbox approaches failed.',
        LogSandboxReflectionInput.shape,
        async (args) => {
            const result = await logSandboxReflection(LogSandboxReflectionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_sandbox_attempt',
        'Records an individual sandbox attempt. Call after each approach the learner tries.',
        LogSandboxAttemptInput.shape,
        async (args) => {
            const result = await logSandboxAttempt(LogSandboxAttemptInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_sandbox_summary',
        'Gets all attempts for a sandbox for comparison discussion. Call before teaching transition.',
        GetSandboxSummaryInput.shape,
        async (args) => {
            const result = await getSandboxSummary(GetSandboxSummaryInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );
}

