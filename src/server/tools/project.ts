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

    return {
        session_id: sessionId,
        start_time: now.toISOString(),
        message: 'Session started. Remember to call get_due_reviews for SRS check-in.',
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
        'Initializes a new learning session. Call at the start of each session.',
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
