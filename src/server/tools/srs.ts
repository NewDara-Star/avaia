/**
 * Spaced Repetition System (SRS) Tools
 * Implements invisible flashcard-style review using FSRS-5 algorithm
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDatabase, generateId, parseJson, toJson } from '../db/index.js';
import { outcomeToRating, scheduleCard, createCard, isDue } from '../lib/fsrs.js';
import type { FSRSCard, Rating } from '../types/index.js';

// =============================================================================
// Tool: get_due_reviews
// =============================================================================

const GetDueReviewsInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    limit: z.number().int().min(1).max(5).default(1).describe('Maximum number of reviews to return'),
});

async function getDueReviews(args: z.infer<typeof GetDueReviewsInput>) {
    const db = getDatabase();
    const now = new Date();

    // Get concepts due for review with their snippets
    const query = db.prepare(`
    SELECT 
      lc.concept_id,
      c.name as concept_name,
      lc.stability,
      lc.difficulty,
      lc.state,
      lc.next_review_date,
      lc.last_review_date,
      ci.code_snippet,
      ci.snippet_context
    FROM learner_concept lc
    JOIN concept c ON c.id = lc.concept_id
    LEFT JOIN concept_instance ci ON ci.concept_id = lc.concept_id AND ci.learner_id = lc.learner_id
    WHERE lc.learner_id = ?
      AND (lc.state = 'new' OR lc.next_review_date <= datetime('now'))
    ORDER BY 
      CASE lc.state 
        WHEN 'relearning' THEN 0
        WHEN 'learning' THEN 1
        WHEN 'review' THEN 2
        WHEN 'new' THEN 3
      END,
      lc.stability ASC
    LIMIT ?
  `);

    const rows = query.all(args.learner_id, args.limit) as Array<{
        concept_id: string;
        concept_name: string;
        stability: number;
        difficulty: number;
        state: string;
        next_review_date: string | null;
        last_review_date: string | null;
        code_snippet: string | null;
        snippet_context: string | null;
    }>;

    const reviews = rows.map(row => ({
        concept_id: row.concept_id,
        concept_name: row.concept_name,
        snippet_context: row.snippet_context || 'General practice',
        code_snippet: row.code_snippet || '// No code snippet stored',
        stability: row.stability,
    }));

    return { reviews };
}

// =============================================================================
// Tool: log_review
// =============================================================================

const LogReviewInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The concept that was reviewed'),
    outcome: z.enum(['correct', 'incorrect']).describe('Whether the answer was correct'),
    confidence: z.number().int().min(1).max(5).describe('Self-reported confidence (1-5)'),
    response_time_ms: z.number().int().positive().describe('Time taken to respond in milliseconds'),
});

async function logReview(args: z.infer<typeof LogReviewInput>) {
    const db = getDatabase();
    const now = new Date();

    // Get current state
    const current = db.prepare(`
    SELECT stability, difficulty, state, reps, lapses, last_review_date
    FROM learner_concept
    WHERE learner_id = ? AND concept_id = ?
  `).get(args.learner_id, args.concept_id) as {
        stability: number;
        difficulty: number;
        state: string;
        reps: number;
        lapses: number;
        last_review_date: string | null;
    } | undefined;

    // Create card state
    const card: FSRSCard = current ? {
        stability: current.stability,
        difficulty: current.difficulty,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: current.reps,
        lapses: current.lapses,
        state: current.state as FSRSCard['state'],
        lastReview: current.last_review_date,
    } : createCard();

    // Convert outcome to rating
    const rating = outcomeToRating(
        args.outcome === 'correct',
        args.confidence as 1 | 2 | 3 | 4 | 5,
        args.response_time_ms
    );

    // Schedule next review
    const updated = scheduleCard(card, rating, now);

    // Calculate next review date
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + updated.scheduledDays);

    // Update database
    db.prepare(`
    INSERT INTO learner_concept (
      learner_id, concept_id, stability, difficulty, state, 
      reps, lapses, last_review_date, next_review_date,
      total_attempts, correct_attempts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(learner_id, concept_id) DO UPDATE SET
      stability = excluded.stability,
      difficulty = excluded.difficulty,
      state = excluded.state,
      reps = excluded.reps,
      lapses = excluded.lapses,
      last_review_date = excluded.last_review_date,
      next_review_date = excluded.next_review_date,
      total_attempts = learner_concept.total_attempts + 1,
      correct_attempts = learner_concept.correct_attempts + ?
  `).run(
        args.learner_id,
        args.concept_id,
        updated.stability,
        updated.difficulty,
        updated.state,
        updated.reps,
        updated.lapses,
        now.toISOString(),
        nextReview.toISOString(),
        args.outcome === 'correct' ? 1 : 0,
        args.outcome === 'correct' ? 1 : 0
    );

    return {
        new_stability: updated.stability,
        next_review_date: nextReview.toISOString(),
        message: `FSRS updated successfully. Next review in ${updated.scheduledDays} days.`,
    };
}

// =============================================================================
// Tool: get_refactoring_challenge
// =============================================================================

const GetRefactoringChallengeInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    concept_id: z.string().describe('The decayed concept to reinforce'),
    current_project_id: z.string().describe('The current project for context'),
});

async function getRefactoringChallenge(args: z.infer<typeof GetRefactoringChallengeInput>) {
    const db = getDatabase();

    // Get the concept info
    const concept = db.prepare(`
    SELECT name, category FROM concept WHERE id = ?
  `).get(args.concept_id) as { name: string; category: string | null } | undefined;

    // Get ALL code snippets for this concept (including current project)
    const allSnippets = db.prepare(`
        SELECT code_snippet, snippet_context, project_id
        FROM concept_instance
        WHERE learner_id = ? AND concept_id = ?
        ORDER BY created_at DESC
    `).all(args.learner_id, args.concept_id) as Array<{
        code_snippet: string;
        snippet_context: string | null;
        project_id: string;
    }>;

    // Get snippet from a different project if available
    const crossProjectSnippet = allSnippets.find(s => s.project_id !== args.current_project_id);

    // Get current project snippet
    const currentSnippet = allSnippets.find(s => s.project_id === args.current_project_id);

    // Get related concepts in the same category
    const relatedConcepts = db.prepare(`
        SELECT id, name FROM concept
        WHERE category = ? AND id != ?
        LIMIT 3
    `).all(concept?.category || '', args.concept_id) as Array<{ id: string; name: string }>;

    return {
        concept_name: concept?.name || args.concept_id,
        concept_category: concept?.category || 'General',
        cross_project_code: crossProjectSnippet?.code_snippet || null,
        cross_project_context: crossProjectSnippet?.snippet_context || null,
        current_project_code: currentSnippet?.code_snippet || null,
        current_project_context: currentSnippet?.snippet_context || null,
        related_concepts: relatedConcepts,
        generation_instructions: {
            format: 'Generate a refactoring challenge that reinforces the decayed concept',
            rules: [
                'If cross_project_code exists, ask them to apply the pattern in their current project',
                'If only current_project_code exists, ask them to improve or extend it',
                'If no code exists, generate a small focused exercise',
                'Connect to related_concepts if applicable',
                'Keep the challenge small (5-10 minute task)',
            ],
            example_prompts: [
                `"You used ${concept?.name || 'this'} in [previous project]. How would you apply it here?"`,
                `"Can you refactor this code to use ${concept?.name || 'this concept'}?"`,
                `"What would happen if we combined ${concept?.name || 'this'} with [related concept]?"`,
            ],
        },
    };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerSrsTools(server: McpServer): void {
    server.tool(
        'get_due_reviews',
        'Fetches concepts due for review using token-efficient code snippets. Call during Check-In phase.',
        GetDueReviewsInput.shape,
        async (args) => {
            const result = await getDueReviews(GetDueReviewsInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_review',
        'Updates the FSRS algorithm state after a review question. Call after learner answers.',
        LogReviewInput.shape,
        async (args) => {
            const result = await logReview(LogReviewInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_refactoring_challenge',
        'Gets a cross-project exercise for a decayed concept. Use during Build phase if concept has significantly decayed.',
        GetRefactoringChallengeInput.shape,
        async (args) => {
            const result = await getRefactoringChallenge(GetRefactoringChallengeInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );
}

