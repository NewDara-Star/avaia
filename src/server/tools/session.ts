/**
 * Session Tools
 * Emotional state inference, timing tracking, and session management
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDatabase, generateId, parseJson, toJson } from '../db/index.js';
import { inferEmotionalState, getIntervention, shouldPromptQuestions } from '../lib/emotions.js';
import type { TimingEntry, EmotionalState } from '../types/index.js';

// =============================================================================
// Tool: get_current_time
// =============================================================================

async function getCurrentTime() {
    const now = new Date();
    return {
        iso: now.toISOString(),
        unix_ms: now.getTime(),
        formatted: now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
        }),
    };
}

// =============================================================================
// Tool: infer_emotional_state
// =============================================================================

const InferEmotionalStateInput = z.object({
    session_id: z.string().describe('The current session ID'),
    recent_timings: z.array(z.object({
        timestamp: z.string(),
        timeSinceLastMs: z.number(),
        role: z.enum(['user', 'assistant']),
    })).describe('Recent message timing entries'),
});

async function inferEmotionalStateHandler(args: z.infer<typeof InferEmotionalStateInput>) {
    const db = getDatabase();

    // Get recent messages for content analysis (if stored)
    const recentMessages = db.prepare(`
    SELECT message_length, contains_help_request
    FROM message_timing
    WHERE session_id = ?
    ORDER BY timestamp DESC
    LIMIT 5
  `).all(args.session_id) as Array<{
        message_length: number | null;
        contains_help_request: boolean;
    }>;

    // Count help requests
    const helpRequests = recentMessages.filter(m => m.contains_help_request).length;

    // Get question count for passive detection
    const session = db.prepare(`
    SELECT learner_questions FROM session WHERE id = ?
  `).get(args.session_id) as { learner_questions: string } | undefined;

    const questions = parseJson<Array<unknown>>(session?.learner_questions || '[]', []);

    // Infer state
    const result = inferEmotionalState(
        args.recent_timings as TimingEntry[],
        [], // We don't have message content stored
        questions.length
    );

    // Log to session
    const stateEntry = {
        timestamp: new Date().toISOString(),
        state: result.state,
        confidence: result.confidence,
    };

    db.prepare(`
    UPDATE session
    SET emotional_states = json_insert(emotional_states, '$[#]', json(?))
    WHERE id = ?
  `).run(JSON.stringify(stateEntry), args.session_id);

    return {
        state: result.state,
        confidence: result.confidence,
        suggested_action: result.suggestedAction,
        intervention: getIntervention(result.state),
    };
}

// =============================================================================
// Tool: log_message_timing
// =============================================================================

const LogMessageTimingInput = z.object({
    session_id: z.string().describe('The current session ID'),
    timestamp: z.string().describe('ISO timestamp of the message'),
    gap_ms: z.number().int().nonnegative().describe('Milliseconds since previous message'),
    message_type: z.enum(['user', 'assistant']).describe('Who sent the message'),
    message_length: z.number().int().optional().describe('Length of the message'),
    contains_help_request: z.boolean().optional().describe('Whether message contains help patterns'),
});

async function logMessageTiming(args: z.infer<typeof LogMessageTimingInput>) {
    const db = getDatabase();

    db.prepare(`
    INSERT INTO message_timing (
      id, session_id, timestamp, gap_since_previous_ms,
      message_type, message_length, contains_help_request
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
        generateId('msg'),
        args.session_id,
        args.timestamp,
        args.gap_ms,
        args.message_type,
        args.message_length || null,
        args.contains_help_request || false
    );

    return { logged: true };
}

// =============================================================================
// Tool: log_session
// =============================================================================

const LogSessionInput = z.object({
    session_id: z.string().describe('The session ID'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
    project_id: z.string().optional().describe('The project worked on'),
    end_time: z.string().describe('ISO timestamp of session end'),
    milestones_completed: z.array(z.number()).optional().describe('Milestones completed this session'),
    concepts_introduced: z.array(z.string()).optional().describe('Concepts taught this session'),
    concepts_verified: z.array(z.string()).optional().describe('Concepts verified this session'),
    exit_ticket_concept: z.string().optional().describe('Concept for exit ticket'),
    exit_ticket_passed: z.boolean().optional().describe('Whether exit ticket was passed'),
});

async function logSession(args: z.infer<typeof LogSessionInput>) {
    const db = getDatabase();

    // Get session start time
    const session = db.prepare(`
    SELECT start_time FROM session WHERE id = ?
  `).get(args.session_id) as { start_time: string } | undefined;

    const startTime = session?.start_time ? new Date(session.start_time) : new Date();
    const endTime = new Date(args.end_time);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    db.prepare(`
    UPDATE session SET
      end_time = ?,
      actual_duration_minutes = ?,
      milestones_completed = ?,
      concepts_introduced = ?,
      concepts_verified = ?,
      exit_ticket_concept = ?,
      exit_ticket_passed = ?
    WHERE id = ?
  `).run(
        args.end_time,
        durationMinutes,
        toJson(args.milestones_completed || []),
        toJson(args.concepts_introduced || []),
        toJson(args.concepts_verified || []),
        args.exit_ticket_concept || null,
        args.exit_ticket_passed ?? null,
        args.session_id
    );

    return {
        session_id: args.session_id,
        duration_minutes: durationMinutes,
        message: 'Session logged successfully',
    };
}

// =============================================================================
// Tool: get_exit_ticket
// =============================================================================

const GetExitTicketInput = z.object({
    session_id: z.string().describe('The current session ID'),
});

async function getExitTicket(args: z.infer<typeof GetExitTicketInput>) {
    const db = getDatabase();

    // Get concepts introduced this session
    const session = db.prepare(`
    SELECT concepts_introduced, learner_id FROM session WHERE id = ?
  `).get(args.session_id) as {
        concepts_introduced: string;
        learner_id: string;
    } | undefined;

    if (!session) {
        return { error: 'Session not found' };
    }

    const conceptIds = parseJson<string[]>(session.concepts_introduced, []);

    if (conceptIds.length === 0) {
        return {
            skip: true,
            message: 'No new concepts introduced this session - exit ticket optional.',
        };
    }

    // Pick a random concept from today's session
    const conceptId = conceptIds[Math.floor(Math.random() * conceptIds.length)];

    // Try to get a diagnostic question
    const question = db.prepare(`
    SELECT id, code_snippet, prompt, correct_answer, distractors
    FROM diagnostic_question
    WHERE concept_id = ?
    ORDER BY RANDOM()
    LIMIT 1
  `).get(conceptId) as {
        id: string;
        code_snippet: string | null;
        prompt: string;
        correct_answer: string;
        distractors: string;
    } | undefined;

    // Get concept name
    const concept = db.prepare(`
    SELECT name FROM concept WHERE id = ?
  `).get(conceptId) as { name: string } | undefined;

    if (!question) {
        return {
            skip: false,
            concept_id: conceptId,
            concept_name: concept?.name,
            fallback: true,
            prompt: `Explain ${concept?.name || conceptId} in your own words. What problem does it solve?`,
        };
    }

    const distractors = parseJson<Array<{ answer: string }>>(question.distractors, []);
    const options = [
        { id: 'A', text: question.correct_answer },
        ...distractors.map((d, i) => ({ id: String.fromCharCode(66 + i), text: d.answer })),
    ];

    // Shuffle
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        skip: false,
        concept_id: conceptId,
        concept_name: concept?.name,
        fallback: false,
        question_id: question.id,
        code_snippet: question.code_snippet,
        prompt: question.prompt,
        options,
        correct_answer: question.correct_answer,
    };
}

// =============================================================================
// Tool: should_prompt_questions
// =============================================================================

const ShouldPromptQuestionsInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function shouldPromptQuestionsHandler(args: z.infer<typeof ShouldPromptQuestionsInput>) {
    const db = getDatabase();

    const patterns = db.prepare(`
    SELECT sessions_without_questions, total_questions
    FROM learner_question_patterns
    WHERE learner_id = ?
  `).get(args.learner_id) as {
        sessions_without_questions: number;
        total_questions: number;
    } | undefined;

    if (!patterns) {
        return { should_prompt: false, reason: 'First session - gathering data' };
    }

    // Count total sessions
    const sessionCount = db.prepare(`
    SELECT COUNT(*) as count FROM session WHERE learner_id = ?
  `).get(args.learner_id) as { count: number };

    const should = shouldPromptQuestions(
        patterns.sessions_without_questions,
        sessionCount.count
    );

    return {
        should_prompt: should,
        sessions_without_questions: patterns.sessions_without_questions,
        total_sessions: sessionCount.count,
        prompt_text: should
            ? "What questions do you have about this? Even partial questions are valuable."
            : null,
    };
}

// =============================================================================
// Tool: log_learner_question
// =============================================================================

const LogLearnerQuestionInput = z.object({
    session_id: z.string().describe('The current session ID'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
    question_text: z.string().describe('The question asked'),
    question_type: z.enum(['how', 'why', 'what', 'other']).describe('Type of question'),
    prompted: z.boolean().describe('Whether it was prompted by Avaia'),
});

async function logLearnerQuestion(args: z.infer<typeof LogLearnerQuestionInput>) {
    const db = getDatabase();

    const questionEntry = {
        timestamp: new Date().toISOString(),
        text: args.question_text,
        type: args.question_type,
        prompted: args.prompted,
    };

    // Add to session
    db.prepare(`
    UPDATE session
    SET learner_questions = json_insert(learner_questions, '$[#]', json(?))
    WHERE id = ?
  `).run(JSON.stringify(questionEntry), args.session_id);

    // Update patterns
    db.prepare(`
    INSERT INTO learner_question_patterns (learner_id, total_questions, sessions_without_questions)
    VALUES (?, 1, 0)
    ON CONFLICT(learner_id) DO UPDATE SET
      total_questions = total_questions + 1,
      sessions_without_questions = 0,
      last_unprompted_question_at = CASE WHEN ? THEN last_unprompted_question_at ELSE ? END
  `).run(
        args.learner_id,
        args.prompted,
        new Date().toISOString()
    );

    return {
        logged: true,
        is_why_question: args.question_type === 'why',
        observation: args.question_type === 'why'
            ? '"Why" questions indicate deeper engagement - reward this!'
            : 'Question logged',
    };
}

// =============================================================================
// Tool: log_emotional_checkin
// =============================================================================

const LogEmotionalCheckinInput = z.object({
    session_id: z.string().describe('The current session ID'),
    learner_response: z.string().describe('What the learner said about how they feel'),
    inferred_state: z.enum(['good', 'okay', 'frustrated', 'tired', 'confused']).optional().describe('Inferred emotional state'),
});

async function logEmotionalCheckin(args: z.infer<typeof LogEmotionalCheckinInput>) {
    const db = getDatabase();

    const checkinEntry = {
        timestamp: new Date().toISOString(),
        type: 'explicit_checkin',
        response: args.learner_response,
        state: args.inferred_state || 'unknown',
    };

    db.prepare(`
    UPDATE session
    SET emotional_states = json_insert(emotional_states, '$[#]', json(?))
    WHERE id = ?
  `).run(JSON.stringify(checkinEntry), args.session_id);

    return {
        logged: true,
        state: args.inferred_state || 'noted',
        recommendation: args.inferred_state === 'frustrated' || args.inferred_state === 'tired'
            ? 'Consider suggesting a break or reducing difficulty'
            : 'Continue normally',
    };
}

// =============================================================================
// Tool: get_intervention
// =============================================================================

const GetInterventionInput = z.object({
    emotional_state: z.enum(['flow', 'struggling', 'frustrated', 'disengaged', 'passive']).describe('The detected emotional state'),
});

async function getInterventionHandler(args: z.infer<typeof GetInterventionInput>) {
    const intervention = getIntervention(args.emotional_state as EmotionalState);

    const scripts: Record<string, string> = {
        flow: "Continue normally. Don't interrupt their momentum.",
        struggling: "This seems tough. Want to try a different approach?",
        frustrated: "This seems frustrating. Want to take a break or try a different approach?",
        disengaged: "You seem distracted. Everything okay? We can pause if needed.",
        passive: "What questions do you have about this? Even partial ones are valuable.",
    };

    return {
        state: args.emotional_state,
        intervention,
        suggested_script: scripts[args.emotional_state] || intervention,
    };
}

// =============================================================================
// Tool: end_session
// =============================================================================

/**
 * SESSION NOTES WRITING GUIDELINES
 *
 * When calling end_session, write session_notes that capture the FULL context
 * of what happened, enabling seamless continuity in future sessions.
 *
 * WHAT TO INCLUDE:
 *
 * 1. ACTIVITY SUMMARY
 *    - What the learner worked on (even if not project-related)
 *    - Any debugging, troubleshooting, or setup tasks completed
 *    - Discussions or explanations that occurred
 *    Example: "Fixed configuration issue where learner name wasn't displaying in project view"
 *
 * 2. BLOCKERS & RESOLUTIONS
 *    - Problems encountered and how they were solved
 *    - Workarounds applied
 *    - Issues left unresolved (critical for next session)
 *    Example: "Resolved npm dependency conflict by downgrading react-dom. Still need to update tsconfig."
 *
 * 3. LEARNER STATE
 *    - Emotional state at session end (frustrated, confident, tired, energized)
 *    - Comprehension level of topics covered
 *    - Any "aha moments" or persistent confusions
 *    Example: "Learner seemed frustrated with CSS flexbox but had breakthrough understanding justify-content"
 *
 * 4. NEXT STEPS
 *    - What should happen at the start of next session
 *    - Any promises made ("next time we'll cover X")
 *    - Unfinished tasks to pick up
 *    Example: "Ready to start implementing card flip animation. Promised to explain CSS transforms."
 *
 * 5. META-LEARNING OBSERVATIONS
 *    - Patterns in how the learner learns best
 *    - Topics that need reinforcement
 *    - Scaffolding adjustments that worked/didn't work
 *    Example: "Learner responds well to visual diagrams. Consider using more ASCII art for data structures."
 *
 * TONE: Write as if briefing your future self who has no memory of this session.
 * Be specific, not vague. "Fixed a bug" is useless. "Fixed off-by-one error in array
 * indexing for card matching logic" is useful.
 *
 * LENGTH: Aim for 2-5 sentences for short sessions, up to a paragraph for complex ones.
 */

const EndSessionInput = z.object({
    session_id: z.string().describe('The session ID to end'),
    learner_id: z.string().describe('The learner\'s unique identifier'),
    session_notes: z.string().describe(
        'Natural language summary of the session. Include: what was worked on (even non-project tasks), ' +
        'blockers encountered and resolutions, learner emotional state and comprehension, ' +
        'next steps for future sessions, and any meta-learning observations. ' +
        'Write as if briefing your future self who has no memory of this session.'
    ),
    exit_ticket_passed: z.boolean().optional().describe('Whether exit ticket was passed (if administered)'),
});

async function endSession(args: z.infer<typeof EndSessionInput>) {
    const db = getDatabase();
    const endTime = new Date().toISOString();

    // Get session start time for duration calculation
    const session = db.prepare(`
        SELECT start_time, concepts_introduced, concepts_verified, milestones_completed
        FROM session WHERE id = ?
    `).get(args.session_id) as {
        start_time: string;
        concepts_introduced: string;
        concepts_verified: string;
        milestones_completed: string;
    } | undefined;

    if (!session) {
        return { error: 'Session not found' };
    }

    const startTime = new Date(session.start_time);
    const durationMinutes = Math.round((new Date(endTime).getTime() - startTime.getTime()) / 60000);

    // Update session with notes and end time
    db.prepare(`
        UPDATE session SET
            end_time = ?,
            actual_duration_minutes = ?,
            session_notes = ?,
            exit_ticket_passed = COALESCE(?, exit_ticket_passed)
        WHERE id = ?
    `).run(
        endTime,
        durationMinutes,
        args.session_notes,
        args.exit_ticket_passed ?? null,
        args.session_id
    );

    // Update learner question patterns for sessions without questions
    const questions = parseJson<unknown[]>(session.concepts_introduced, []);
    if (questions.length === 0) {
        db.prepare(`
            INSERT INTO learner_question_patterns (learner_id, sessions_without_questions)
            VALUES (?, 1)
            ON CONFLICT(learner_id) DO UPDATE SET
                sessions_without_questions = sessions_without_questions + 1
        `).run(args.learner_id);
    }

    return {
        session_id: args.session_id,
        duration_minutes: durationMinutes,
        concepts_introduced: parseJson<string[]>(session.concepts_introduced, []).length,
        concepts_verified: parseJson<string[]>(session.concepts_verified, []).length,
        milestones_completed: parseJson<number[]>(session.milestones_completed, []).length,
        notes_saved: true,
        message: 'Session ended successfully. Notes saved for future reference.',
    };
}

// =============================================================================
// Tool: get_session_summary
// =============================================================================

const GetSessionSummaryInput = z.object({
    session_id: z.string().describe('The session ID to summarize'),
});

async function getSessionSummary(args: z.infer<typeof GetSessionSummaryInput>) {
    const db = getDatabase();

    const session = db.prepare(`
    SELECT
      s.*,
      l.name as learner_name,
      p.name as project_name
    FROM session s
    LEFT JOIN learner l ON l.id = s.learner_id
    LEFT JOIN project p ON p.id = s.project_id
    WHERE s.id = ?
  `).get(args.session_id) as {
        id: string;
        learner_id: string;
        learner_name: string | null;
        project_id: string | null;
        project_name: string | null;
        start_time: string;
        end_time: string | null;
        actual_duration_minutes: number | null;
        milestones_completed: string;
        concepts_introduced: string;
        concepts_verified: string;
        emotional_states: string;
        learner_questions: string;
        exit_ticket_passed: boolean | null;
        session_notes: string | null;
    } | undefined;

    if (!session) {
        return { error: 'Session not found' };
    }

    return {
        session_id: session.id,
        learner: session.learner_name || session.learner_id,
        project: session.project_name || 'No project',
        duration_minutes: session.actual_duration_minutes || 0,
        start_time: session.start_time,
        end_time: session.end_time,
        milestones_completed: parseJson<number[]>(session.milestones_completed, []),
        concepts_introduced: parseJson<string[]>(session.concepts_introduced, []),
        concepts_verified: parseJson<string[]>(session.concepts_verified, []),
        emotional_journey: parseJson<unknown[]>(session.emotional_states, []),
        questions_asked: parseJson<unknown[]>(session.learner_questions, []).length,
        exit_ticket_passed: session.exit_ticket_passed,
        session_notes: session.session_notes,
    };
}

// =============================================================================
// Tool: get_question_patterns
// =============================================================================

const GetQuestionPatternsInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function getQuestionPatterns(args: z.infer<typeof GetQuestionPatternsInput>) {
    const db = getDatabase();

    const patterns = db.prepare(`
    SELECT *
    FROM learner_question_patterns
    WHERE learner_id = ?
  `).get(args.learner_id) as {
        total_questions: number;
        avg_questions_per_session: number;
        sessions_without_questions: number;
        question_type_distribution: string;
        last_unprompted_question_at: string | null;
    } | undefined;

    if (!patterns) {
        return {
            total_questions: 0,
            avg_per_session: 0,
            analysis: 'No question data yet',
            concern: false,
        };
    }

    const distribution = parseJson<Record<string, number>>(patterns.question_type_distribution, {});

    return {
        total_questions: patterns.total_questions,
        avg_per_session: patterns.avg_questions_per_session,
        sessions_without_questions: patterns.sessions_without_questions,
        question_types: distribution,
        last_unprompted: patterns.last_unprompted_question_at,
        concern: patterns.sessions_without_questions >= 2,
        analysis: patterns.sessions_without_questions >= 2
            ? 'Passive learner - consider prompting for questions'
            : distribution['why'] > distribution['how']
                ? 'Deep thinker - asks "why" questions'
                : 'Practical learner - focuses on "how"',
    };
}

// =============================================================================
// Tool: log_chat_message
// =============================================================================

const LogChatMessageInput = z.object({
    session_id: z.string().describe('The current session ID'),
    role: z.enum(['user', 'assistant', 'system']).describe('Who sent the message'),
    content: z.string().describe('The actual message text'),
    tool_calls: z.array(z.object({
        tool: z.string(),
        args: z.any()
    })).optional().describe('MCP tool calls made (if assistant)'),
    tool_results: z.array(z.object({
        tool: z.string(),
        result: z.any()
    })).optional().describe('Tool results received (if assistant)'),
    tokens_used: z.number().int().optional().describe('Tokens used for this message'),
});

async function logChatMessage(args: z.infer<typeof LogChatMessageInput>) {
    const db = getDatabase();
    const now = new Date();

    db.prepare(`
        INSERT INTO chat_message (
            id, session_id, timestamp, role, content, 
            tool_calls, tool_results, tokens_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId('chat'),
        args.session_id,
        now.toISOString(),
        args.role,
        args.content,
        args.tool_calls ? toJson(args.tool_calls) : null,
        args.tool_results ? toJson(args.tool_results) : null,
        args.tokens_used || null
    );

    return { logged: true, timestamp: now.toISOString() };
}

// =============================================================================
// Tool: get_chat_history
// =============================================================================

const GetChatHistoryInput = z.object({
    session_id: z.string().describe('The session ID to retrieve history for'),
    limit: z.number().int().positive().optional().describe('Maximum messages to return'),
    role_filter: z.enum(['user', 'assistant', 'system']).optional().describe('Filter by role'),
    since_timestamp: z.string().optional().describe('Only messages after this ISO timestamp'),
});

async function getChatHistory(args: z.infer<typeof GetChatHistoryInput>) {
    const db = getDatabase();

    let query = `
        SELECT id, timestamp, role, content, tool_calls, tool_results, tokens_used
        FROM chat_message
        WHERE session_id = ?
    `;
    const params: (string | number)[] = [args.session_id];

    if (args.role_filter) {
        query += ` AND role = ?`;
        params.push(args.role_filter);
    }

    if (args.since_timestamp) {
        query += ` AND timestamp > ?`;
        params.push(args.since_timestamp);
    }

    query += ` ORDER BY timestamp ASC`;

    if (args.limit) {
        query += ` LIMIT ?`;
        params.push(args.limit);
    }

    const messages = db.prepare(query).all(...params) as Array<{
        id: string;
        timestamp: string;
        role: string;
        content: string;
        tool_calls: string | null;
        tool_results: string | null;
        tokens_used: number | null;
    }>;

    return {
        session_id: args.session_id,
        message_count: messages.length,
        messages: messages.map(m => ({
            id: m.id,
            timestamp: m.timestamp,
            role: m.role,
            content: m.content,
            tool_calls: parseJson(m.tool_calls || 'null', null),
            tool_results: parseJson(m.tool_results || 'null', null),
            tokens_used: m.tokens_used,
        })),
    };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerSessionTools(server: McpServer): void {
    server.tool(
        'get_current_time',
        'Returns the current time. AI never guesses time - always call this.',
        {},
        async () => {
            const result = await getCurrentTime();
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'infer_emotional_state',
        'Analyzes timing patterns to detect frustration or disengagement. Call every ~20 minutes.',
        InferEmotionalStateInput.shape,
        async (args) => {
            const result = await inferEmotionalStateHandler(InferEmotionalStateInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_message_timing',
        'Records timing metadata for emotional state inference.',
        LogMessageTimingInput.shape,
        async (args) => {
            const result = await logMessageTiming(LogMessageTimingInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_session',
        'Logs complete session data at session end.',
        LogSessionInput.shape,
        async (args) => {
            const result = await logSession(LogSessionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'end_session',
        'Ends a session and saves natural language notes for continuity. Call when learner is leaving. ' +
        'Write notes that capture: (1) what was worked on (even non-project tasks like debugging setup issues), ' +
        '(2) blockers encountered and resolutions, (3) learner emotional state and comprehension level, ' +
        '(4) next steps for future sessions, (5) meta-learning observations. ' +
        'Write as if briefing your future self who has no memory of this session.',
        EndSessionInput.shape,
        async (args) => {
            const result = await endSession(EndSessionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_exit_ticket',
        'Gets an end-of-session diagnostic question about code written today.',
        GetExitTicketInput.shape,
        async (args) => {
            const result = await getExitTicket(GetExitTicketInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'should_prompt_questions',
        'Checks if learner has been too passive (no questions). Call if session seems quiet.',
        ShouldPromptQuestionsInput.shape,
        async (args) => {
            const result = await shouldPromptQuestionsHandler(ShouldPromptQuestionsInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_learner_question',
        'Records when a learner asks a question. Track engagement and question types.',
        LogLearnerQuestionInput.shape,
        async (args) => {
            const result = await logLearnerQuestion(LogLearnerQuestionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_emotional_checkin',
        'Records explicit emotional check-in response from learner.',
        LogEmotionalCheckinInput.shape,
        async (args) => {
            const result = await logEmotionalCheckin(LogEmotionalCheckinInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_intervention',
        'Gets suggested intervention script for a detected emotional state.',
        GetInterventionInput.shape,
        async (args) => {
            const result = await getInterventionHandler(GetInterventionInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_session_summary',
        'Gets complete summary of a session including milestones, concepts, and emotional journey.',
        GetSessionSummaryInput.shape,
        async (args) => {
            const result = await getSessionSummary(GetSessionSummaryInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_question_patterns',
        'Analyzes learner questioning behavior over time. Identifies passive learners.',
        GetQuestionPatternsInput.shape,
        async (args) => {
            const result = await getQuestionPatterns(GetQuestionPatternsInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'log_chat_message',
        'Logs a chat message for complete conversation history. Call after every message exchange for debugging and analysis.',
        LogChatMessageInput.shape,
        async (args) => {
            const result = await logChatMessage(LogChatMessageInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_chat_history',
        'Retrieves conversation history for a session. Use for debugging, analysis, or session continuity.',
        GetChatHistoryInput.shape,
        async (args) => {
            const result = await getChatHistory(GetChatHistoryInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );
}

