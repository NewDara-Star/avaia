/**
 * Emotional State Inference Engine
 * Detects frustration, disengagement, and learning states from behavioral signals
 */

import type { EmotionalState, TimingEntry } from '../types/index.js';

// =============================================================================
// Constants
// =============================================================================

/** Sliding window size for timing analysis */
const WINDOW_SIZE = 5;

/** Thresholds for state detection (in milliseconds) */
const THRESHOLDS = {
    /** Average response time indicating struggling */
    STRUGGLING_AVG_MS: 60_000,  // 60 seconds
    /** Average response time indicating frustration */
    FRUSTRATED_AVG_MS: 120_000, // 2 minutes
    /** Gap indicating disengagement */
    DISENGAGED_GAP_MS: 300_000, // 5 minutes
    /** Flow state response time ceiling */
    FLOW_AVG_MS: 30_000,        // 30 seconds
    /** Minimum message length for non-passive */
    PASSIVE_MSG_LENGTH: 10,
};

/** Help request patterns in user messages */
const HELP_PATTERNS = [
    /help/i,
    /stuck/i,
    /confused/i,
    /don'?t understand/i,
    /what do you mean/i,
    /how do i/i,
    /why (is|does|doesn'?t)/i,
    /error/i,
    /broken/i,
    /not working/i,
];

// =============================================================================
// Types
// =============================================================================

export interface EmotionalStateResult {
    state: EmotionalState;
    confidence: number;
    suggestedAction: string;
}

export interface SessionMetrics {
    avgResponseTimeMs: number;
    helpRequestCount: number;
    questionsAsked: number;
    longestGapMs: number;
    avgMessageLength: number;
    timings: TimingEntry[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Count help requests in recent messages
 */
export function countHelpRequests(messages: string[]): number {
    return messages.filter(msg =>
        HELP_PATTERNS.some(pattern => pattern.test(msg))
    ).length;
}

/**
 * Calculate average response time from timing entries
 */
function calculateAvgResponseTime(timings: TimingEntry[]): number {
    const userTimings = timings.filter(t => t.role === 'user');
    if (userTimings.length === 0) return 0;

    const total = userTimings.reduce((sum, t) => sum + t.timeSinceLastMs, 0);
    return total / userTimings.length;
}

/**
 * Find the longest gap between messages
 */
function findLongestGap(timings: TimingEntry[]): number {
    if (timings.length === 0) return 0;
    return Math.max(...timings.map(t => t.timeSinceLastMs));
}

// =============================================================================
// Main Inference Function
// =============================================================================

/**
 * Infer emotional state from timing patterns and message content
 */
export function inferEmotionalState(
    timings: TimingEntry[],
    recentMessages: string[] = [],
    questionsAsked: number = 0
): EmotionalStateResult {
    // Use only the most recent entries for analysis
    const recentTimings = timings.slice(-WINDOW_SIZE);

    if (recentTimings.length === 0) {
        return {
            state: 'flow',
            confidence: 0.5,
            suggestedAction: 'Continue normally — not enough data for inference.',
        };
    }

    const avgResponseTime = calculateAvgResponseTime(recentTimings);
    const longestGap = findLongestGap(recentTimings);
    const helpRequests = countHelpRequests(recentMessages);
    const avgMsgLength = recentMessages.length > 0
        ? recentMessages.reduce((sum, m) => sum + m.length, 0) / recentMessages.length
        : 50; // Default to reasonable length

    // State detection matrix (in priority order)

    // 1. DISENGAGED: Very long gaps between messages
    if (longestGap > THRESHOLDS.DISENGAGED_GAP_MS) {
        return {
            state: 'disengaged',
            confidence: Math.min(0.95, longestGap / THRESHOLDS.DISENGAGED_GAP_MS * 0.5),
            suggestedAction: 'Check in with the learner. They may be distracted or need a break.',
        };
    }

    // 2. FRUSTRATED: High response time AND multiple help requests
    if (avgResponseTime > THRESHOLDS.FRUSTRATED_AVG_MS && helpRequests >= 3) {
        return {
            state: 'frustrated',
            confidence: 0.85,
            suggestedAction: 'Acknowledge the difficulty. Suggest a break or alternative approach.',
        };
    }

    // 3. STRUGGLING: High response time OR multiple help requests
    if (avgResponseTime > THRESHOLDS.STRUGGLING_AVG_MS || helpRequests >= 2) {
        return {
            state: 'struggling',
            confidence: 0.75,
            suggestedAction: 'Reduce difficulty. Provide more scaffolding. Check prerequisites.',
        };
    }

    // 4. PASSIVE: Very short messages AND no questions
    if (avgMsgLength < THRESHOLDS.PASSIVE_MSG_LENGTH && questionsAsked === 0) {
        return {
            state: 'passive',
            confidence: 0.70,
            suggestedAction: 'Probe understanding. Ask "What questions do you have about this?"',
        };
    }

    // 5. FLOW: Low response time, no help requests
    if (avgResponseTime < THRESHOLDS.FLOW_AVG_MS && helpRequests === 0) {
        return {
            state: 'flow',
            confidence: 0.80,
            suggestedAction: 'Continue normally. The learner is engaged and progressing.',
        };
    }

    // Default: moderate engagement
    return {
        state: 'flow',
        confidence: 0.60,
        suggestedAction: 'Continue normally with moderate monitoring.',
    };
}

/**
 * Get intervention text for a given emotional state
 */
export function getIntervention(state: EmotionalState): string {
    const interventions: Record<EmotionalState, string> = {
        flow: 'Continue with the current approach.',
        struggling: 'Let\'s slow down a bit. What part is confusing you?',
        frustrated: 'This seems frustrating. Want to take a 5-minute break, or try a completely different approach?',
        disengaged: 'You seem distracted. Everything okay? We can pause if you need to.',
        passive: 'You haven\'t asked any questions lately. What\'s one thing about this concept you\'re not 100% sure about?',
    };

    return interventions[state];
}

/**
 * Determine if we should prompt for questions based on session history
 */
export function shouldPromptQuestions(
    sessionsWithoutQuestions: number,
    totalSessions: number
): boolean {
    // Always prompt if 0 questions in last 2+ sessions
    if (sessionsWithoutQuestions >= 2) return true;

    // Prompt if >50% of sessions have no questions
    if (totalSessions >= 4 && sessionsWithoutQuestions / totalSessions > 0.5) return true;

    return false;
}
