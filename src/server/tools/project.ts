/**
 * Project Tools
 * Project state, milestone tracking, and next step recommendations
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDatabase, generateId, parseJson, toJson } from '../db/index.js';

// =============================================================================
// Tool: get_project_state
// =============================================================================

const GetProjectStateInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function getProjectState(args: z.infer<typeof GetProjectStateInput>) {
    const db = getDatabase();

    // Get current active project
    const project = db.prepare(`
    SELECT id, name, status, current_milestone, milestones_completed, time_spent_minutes, started_at
    FROM project
    WHERE learner_id = ? AND status = 'in_progress'
    ORDER BY started_at DESC
    LIMIT 1
  `).get(args.learner_id) as {
        id: string;
        name: string;
        status: string;
        current_milestone: number;
        milestones_completed: string;
        time_spent_minutes: number;
        started_at: string | null;
    } | undefined;

    if (!project) {
        // Check if learner exists and has completed onboarding
        const learner = db.prepare(`
      SELECT onboarding_complete FROM learner WHERE id = ?
    `).get(args.learner_id) as { onboarding_complete: boolean } | undefined;

        if (!learner) {
            return {
                status: 'new_learner',
                message: 'New learner detected. Start onboarding flow.',
                next_action: 'Begin onboarding questions',
            };
        }

        if (!learner.onboarding_complete) {
            return {
                status: 'onboarding_incomplete',
                message: 'Learner has not completed onboarding.',
                next_action: 'Complete onboarding flow',
            };
        }

        return {
            status: 'no_active_project',
            message: 'No active project. Start the next project.',
            next_action: 'Initialize next project from curriculum',
        };
    }

    const milestonesCompleted = parseJson<number[]>(project.milestones_completed, []);

    return {
        status: 'active',
        project_id: project.id,
        project_name: project.name,
        current_milestone: project.current_milestone,
        milestones_completed: milestonesCompleted,
        time_spent_minutes: project.time_spent_minutes,
        started_at: project.started_at,
    };
}

// =============================================================================
// Tool: start_session
// =============================================================================

const StartSessionInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    project_id: z.string().optional().describe('The project to work on'),
    planned_duration_minutes: z.number().int().optional().describe('Planned session length'),
});

async function startSession(args: z.infer<typeof StartSessionInput>) {
    const db = getDatabase();
    const now = new Date();
    const sessionId = generateId('sess');

    // Get the most recent completed session for context
    const previousSession = db.prepare(`
        SELECT id, end_time, session_notes, project_id, actual_duration_minutes
        FROM session
        WHERE learner_id = ? AND end_time IS NOT NULL
        ORDER BY end_time DESC
        LIMIT 1
    `).get(args.learner_id) as {
        id: string;
        end_time: string;
        session_notes: string | null;
        project_id: string | null;
        actual_duration_minutes: number | null;
    } | undefined;

    // Create session record
    db.prepare(`
        INSERT INTO session (id, learner_id, project_id, start_time, planned_duration_minutes)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        sessionId,
        args.learner_id,
        args.project_id || null,
        now.toISOString(),
        args.planned_duration_minutes || null
    );

    // --- Consolidated data: Project State ---
    const project = db.prepare(`
        SELECT id, name, status, current_milestone, milestones_completed, time_spent_minutes, started_at
        FROM project
        WHERE learner_id = ? AND status = 'in_progress'
        ORDER BY started_at DESC
        LIMIT 1
    `).get(args.learner_id) as {
        id: string;
        name: string;
        status: string;
        current_milestone: number;
        milestones_completed: string;
        time_spent_minutes: number;
        started_at: string | null;
    } | undefined;

    let projectState = null;
    if (project) {
        projectState = {
            status: 'active',
            project_id: project.id,
            project_name: project.name,
            current_milestone: project.current_milestone,
            milestones_completed: parseJson<number[]>(project.milestones_completed, []),
            time_spent_minutes: project.time_spent_minutes,
        };
    }

    // --- Consolidated data: Due Reviews ---
    const dueReviewsQuery = db.prepare(`
        SELECT
            lc.concept_id,
            c.name as concept_name,
            lc.stability,
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
        LIMIT 3
    `);

    const dueReviewRows = dueReviewsQuery.all(args.learner_id) as Array<{
        concept_id: string;
        concept_name: string;
        stability: number;
        code_snippet: string | null;
        snippet_context: string | null;
    }>;

    const dueReviews = dueReviewRows.map(row => ({
        concept_id: row.concept_id,
        concept_name: row.concept_name,
        snippet_context: row.snippet_context || 'General practice',
        stability: row.stability,
    }));

    // --- Consolidated data: Stubborn Bugs ---
    const stubbornBugRows = db.prepare(`
        SELECT lc.concept_id, c.name as concept_name, lc.stubborn_misconceptions
        FROM learner_concept lc
        JOIN concept c ON c.id = lc.concept_id
        WHERE lc.learner_id = ? AND lc.stubborn_misconceptions != '[]'
    `).all(args.learner_id) as Array<{
        concept_id: string;
        concept_name: string;
        stubborn_misconceptions: string;
    }>;

    const stubbornBugs = stubbornBugRows.flatMap(row => {
        const misconceptions = parseJson<string[]>(row.stubborn_misconceptions, []);
        return misconceptions.map(mid => ({
            concept_id: row.concept_id,
            concept_name: row.concept_name,
            misconception_id: mid,
        }));
    });

    // --- Consolidated data: Known Terms ---
    const knownTermRows = db.prepare(`
        SELECT term FROM learner_term WHERE learner_id = ? ORDER BY introduced_at ASC
    `).all(args.learner_id) as Array<{ term: string }>;

    const knownTerms = knownTermRows.map(t => t.term);

    return {
        session_id: sessionId,
        start_time: now.toISOString(),
        previous_session: previousSession ? {
            session_id: previousSession.id,
            ended_at: previousSession.end_time,
            duration_minutes: previousSession.actual_duration_minutes,
            notes: previousSession.session_notes,
        } : null,
        project_state: projectState,
        due_reviews: dueReviews,
        stubborn_bugs: stubbornBugs,
        known_terms: knownTerms,
    };
}

// =============================================================================
// Tool: advance_milestone
// =============================================================================

const AdvanceMilestoneInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    project_id: z.string().describe('The project ID'),
    milestone_id: z.number().int().describe('The milestone that was completed'),
});

async function advanceMilestone(args: z.infer<typeof AdvanceMilestoneInput>) {
    const db = getDatabase();

    // Get current project state
    const project = db.prepare(`
    SELECT milestones_completed, current_milestone FROM project WHERE id = ?
  `).get(args.project_id) as {
        milestones_completed: string;
        current_milestone: number;
    } | undefined;

    if (!project) {
        return { error: 'Project not found' };
    }

    const completed = parseJson<number[]>(project.milestones_completed, []);

    if (!completed.includes(args.milestone_id)) {
        completed.push(args.milestone_id);
    }

    const nextMilestone = args.milestone_id + 1;

    db.prepare(`
    UPDATE project
    SET milestones_completed = ?, current_milestone = ?
    WHERE id = ?
  `).run(toJson(completed), nextMilestone, args.project_id);

    return {
        milestone_completed: args.milestone_id,
        next_milestone: nextMilestone,
        total_completed: completed.length,
        message: `Milestone ${args.milestone_id} completed! Moving to milestone ${nextMilestone}.`,
    };
}

// =============================================================================
// Tool: get_next_step
// =============================================================================

const GetNextStepInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function getNextStep(args: z.infer<typeof GetNextStepInput>) {
    const db = getDatabase();

    // Priority 1: Check for stubborn bugs
    const stubbornBugs = db.prepare(`
    SELECT concept_id, stubborn_misconceptions
    FROM learner_concept
    WHERE learner_id = ? AND json_array_length(stubborn_misconceptions) > 0
    LIMIT 1
  `).get(args.learner_id) as {
        concept_id: string;
        stubborn_misconceptions: string;
    } | undefined;

    if (stubbornBugs) {
        const misconceptions = parseJson<string[]>(stubbornBugs.stubborn_misconceptions, []);
        return {
            priority: 'stubborn_bug',
            action: 'remediation',
            concept_id: stubbornBugs.concept_id,
            misconception_ids: misconceptions,
            message: 'Stubborn bug detected. Remediate before continuing.',
        };
    }

    // Priority 2: Check for due reviews
    const dueReviews = db.prepare(`
    SELECT COUNT(*) as count
    FROM learner_concept
    WHERE learner_id = ? 
      AND (state = 'new' OR next_review_date <= datetime('now'))
  `).get(args.learner_id) as { count: number };

    if (dueReviews.count > 0) {
        return {
            priority: 'srs_review',
            action: 'review',
            count: dueReviews.count,
            message: `${dueReviews.count} concept(s) due for review. Do quick recall first.`,
        };
    }

    // Priority 3: Get current project milestone
    const project = db.prepare(`
    SELECT id, name, current_milestone
    FROM project
    WHERE learner_id = ? AND status = 'in_progress'
    ORDER BY started_at DESC
    LIMIT 1
  `).get(args.learner_id) as {
        id: string;
        name: string;
        current_milestone: number;
    } | undefined;

    if (project) {
        return {
            priority: 'continue_project',
            action: 'build',
            project_id: project.id,
            project_name: project.name,
            milestone: project.current_milestone,
            message: `Continue ${project.name}, milestone ${project.current_milestone}.`,
        };
    }

    return {
        priority: 'start_project',
        action: 'start',
        message: 'No active project. Start the next one from the curriculum.',
    };
}

// =============================================================================
// Tool: create_learner
// =============================================================================

const CreateLearnerInput = z.object({
    name: z.string().optional().describe('The learner\'s name'),
    preferred_teaching_method: z.enum(['example_first', 'concept_first', 'try_first']).optional().describe('Learning preference'),
});

async function createLearner(args: z.infer<typeof CreateLearnerInput>) {
    const db = getDatabase();
    const learnerId = generateId('learner');

    db.prepare(`
    INSERT INTO learner (id, name, preferred_teaching_method)
    VALUES (?, ?, ?)
  `).run(
        learnerId,
        args.name || null,
        args.preferred_teaching_method || 'example_first'
    );

    return {
        learner_id: learnerId,
        message: 'Learner profile created. Begin onboarding.',
    };
}

// =============================================================================
// Tool: get_learner_profile
// =============================================================================

const GetLearnerProfileInput = z.object({
    learner_id: z.string().describe("The learner's unique identifier"),
});

async function getLearnerProfile(args: z.infer<typeof GetLearnerProfileInput>) {
    const db = getDatabase();

    const learner = db.prepare(`
        SELECT id, name, started_at, preferred_teaching_method,
               best_session_times, onboarding_complete
        FROM learner
        WHERE id = ?
    `).get(args.learner_id) as {
        id: string;
        name: string | null;
        started_at: string;
        preferred_teaching_method: string;
        best_session_times: string;
        onboarding_complete: number;
    } | undefined;

    if (!learner) {
        return {
            error: 'Learner not found',
            learner_id: args.learner_id,
        };
    }

    return {
        learner_id: learner.id,
        name: learner.name,
        started_at: learner.started_at,
        preferred_teaching_method: learner.preferred_teaching_method,
        best_session_times: parseJson<string[]>(learner.best_session_times, []),
        onboarding_complete: !!learner.onboarding_complete,
    };
}

// =============================================================================
// Tool: complete_onboarding
// =============================================================================

const CompleteOnboardingInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    preferred_teaching_method: z.enum(['example_first', 'concept_first', 'try_first']).optional(),
    best_session_times: z.array(z.string()).optional().describe('Preferred times to study'),
});

async function completeOnboarding(args: z.infer<typeof CompleteOnboardingInput>) {
    const db = getDatabase();

    db.prepare(`
    UPDATE learner
    SET onboarding_complete = TRUE,
        preferred_teaching_method = COALESCE(?, preferred_teaching_method),
        best_session_times = ?
    WHERE id = ?
  `).run(
        args.preferred_teaching_method || null,
        toJson(args.best_session_times || []),
        args.learner_id
    );

    // Create first project (Memory Game)
    const projectId = generateId('proj');
    db.prepare(`
    INSERT INTO project (id, learner_id, name, status, started_at)
    VALUES (?, ?, 'Memory Game', 'in_progress', datetime('now'))
  `).run(projectId, args.learner_id);

    return {
        onboarding_complete: true,
        first_project_id: projectId,
        first_project_name: 'Memory Game',
        message: 'Onboarding complete! Starting first project: Memory Game.',
    };
}

// =============================================================================
// Tool: start_project
// =============================================================================

const StartProjectInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    project_name: z.string().describe('Name of the project to start'),
});

async function startProject(args: z.infer<typeof StartProjectInput>) {
    const db = getDatabase();
    const projectId = generateId('proj');

    db.prepare(`
    INSERT INTO project (id, learner_id, name, status, started_at)
    VALUES (?, ?, ?, 'in_progress', datetime('now'))
  `).run(projectId, args.learner_id, args.project_name);

    return {
        project_id: projectId,
        project_name: args.project_name,
        message: `Started new project: ${args.project_name}`,
    };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerProjectTools(server: McpServer): void {
    server.tool(
        'get_project_state',
        'Gets the current project, milestone, and blockers. Call during Check-In phase.',
        GetProjectStateInput.shape,
        async (args) => {
            const result = await getProjectState(GetProjectStateInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'start_session',
        'Initializes a new learning session with all check-in data. Returns session info, project state, due reviews, stubborn bugs, and known terms in one call.',
        StartSessionInput.shape,
        async (args) => {
            const result = await startSession(StartSessionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'advance_milestone',
        'Marks a milestone as complete and advances to the next.',
        AdvanceMilestoneInput.shape,
        async (args) => {
            const result = await advanceMilestone(AdvanceMilestoneInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_next_step',
        'Determines the next action based on stubborn bugs, due reviews, and project state.',
        GetNextStepInput.shape,
        async (args) => {
            const result = await getNextStep(GetNextStepInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'create_learner',
        'Creates a new learner profile. Call when a new user starts.',
        CreateLearnerInput.shape,
        async (args) => {
            const result = await createLearner(CreateLearnerInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_learner_profile',
        'Gets a learner profile including name, preferences, and onboarding status.',
        GetLearnerProfileInput.shape,
        async (args) => {
            const result = await getLearnerProfile(GetLearnerProfileInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'complete_onboarding',
        'Marks onboarding as complete and starts the first project.',
        CompleteOnboardingInput.shape,
        async (args) => {
            const result = await completeOnboarding(CompleteOnboardingInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'start_project',
        'Starts a new project for a learner.',
        StartProjectInput.shape,
        async (args) => {
            const result = await startProject(StartProjectInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );
}
