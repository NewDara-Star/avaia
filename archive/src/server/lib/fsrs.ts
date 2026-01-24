/**
 * FSRS-5 Algorithm Implementation for Avaia
 * Based on: https://github.com/open-spaced-repetition/fsrs4anki/wiki/Algorithm
 */

import type { FSRSCard, CardState, Rating } from '../types/index.js';

// =============================================================================
// Constants
// =============================================================================

/** Default FSRS-5 weights (can be personalized per learner over time) */
const DEFAULT_WEIGHTS = [
    0.4072,   // w0: initial stability for "again"
    1.1829,   // w1: initial stability for "hard"
    3.1262,   // w2: initial stability for "good"
    15.4722,  // w3: initial stability for "easy"
    7.2102,   // w4: stability growth
    0.5316,   // w5: stability decay
    1.0651,   // w6: difficulty weight
    0.0046,   // w7: difficulty growth
    1.5418,   // w8: retrievability impact
    0.1618,   // w9: again penalty
    1.0,      // w10: hard penalty
    2.0,      // w11: easy bonus
    0.0,      // w12-w18: additional parameters
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0
];

const DEFAULT_REQUEST_RETENTION = 0.9;  // 90% retention target
const DEFAULT_MAXIMUM_INTERVAL = 365;   // Max 1 year between reviews

export interface FSRSParams {
    weights: number[];
    requestRetention: number;
    maximumInterval: number;
}

const DEFAULT_PARAMS: FSRSParams = {
    weights: DEFAULT_WEIGHTS,
    requestRetention: DEFAULT_REQUEST_RETENTION,
    maximumInterval: DEFAULT_MAXIMUM_INTERVAL,
};

// =============================================================================
// Rating Conversion
// =============================================================================

const RATING_VALUES: Record<Rating, number> = {
    again: 1,
    hard: 2,
    good: 3,
    easy: 4,
};

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Create a new FSRS card with initial state
 */
export function createCard(): FSRSCard {
    return {
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        state: 'new',
        lastReview: null,
    };
}

/**
 * Calculate the initial difficulty based on first rating
 */
function initDifficulty(rating: Rating, w: number[]): number {
    const ratingValue = RATING_VALUES[rating];
    // Rating 1 (Again) → high difficulty, Rating 4 (Easy) → low difficulty
    return Math.max(1, Math.min(10, w[15] !== 0 ? w[15] - w[16] * (ratingValue - 3) : 5));
}

/**
 * Calculate retrievability (probability of recall) given elapsed time and stability
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0;
    return Math.exp(-elapsedDays / stability);
}

/**
 * Schedule the next review for a card based on the rating
 */
export function scheduleCard(
    card: FSRSCard,
    rating: Rating,
    now: Date,
    params: FSRSParams = DEFAULT_PARAMS
): FSRSCard {
    const { weights: w, requestRetention, maximumInterval } = params;
    const ratingValue = RATING_VALUES[rating];

    // Calculate elapsed days since last review
    const elapsedDays = card.lastReview
        ? (now.getTime() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

    let newStability: number;
    let newDifficulty: number;
    let newState: CardState;

    if (card.state === 'new') {
        // First review: use initial stability based on rating
        newStability = w[ratingValue - 1];  // w0-w3
        newDifficulty = initDifficulty(rating, w);
        newState = rating === 'again' ? 'learning' : 'review';
    } else {
        // Subsequent review
        const retrievability = calculateRetrievability(elapsedDays, card.stability);

        if (rating === 'again') {
            // Forgot: reduce stability, increase difficulty
            newStability = w[9] * Math.pow(card.difficulty, -w[10]) *
                (Math.pow(card.stability + 1, w[11]) - 1) *
                Math.exp((1 - retrievability) * (w[12] || 0.5));
            newStability = Math.max(0.1, newStability);  // Floor at 0.1 days
            newDifficulty = Math.min(10, card.difficulty + 0.5);
            newState = 'relearning';
        } else {
            // Remembered: increase stability based on rating
            const hardPenalty = rating === 'hard' ? (w[13] || 0.8) : 1;
            const easyBonus = rating === 'easy' ? (w[14] || 1.3) : 1;

            newStability = card.stability * (1 +
                Math.exp(w[4]) *
                (11 - card.difficulty) *
                Math.pow(card.stability, -w[5]) *
                (Math.exp((1 - retrievability) * w[6]) - 1) *
                hardPenalty *
                easyBonus
            );

            // Adjust difficulty
            newDifficulty = card.difficulty - w[7] * (ratingValue - 3);
            newDifficulty = Math.max(1, Math.min(10, newDifficulty));
            newState = 'review';
        }
    }

    // Calculate next interval from stability
    // S = -t / ln(R) where R is requestRetention
    const interval = Math.min(
        maximumInterval,
        Math.max(1, Math.round(
            newStability * Math.log(requestRetention) / Math.log(0.9)
        ))
    );

    return {
        stability: newStability,
        difficulty: newDifficulty,
        elapsedDays: 0,
        scheduledDays: interval,
        reps: card.reps + 1,
        lapses: rating === 'again' ? card.lapses + 1 : card.lapses,
        state: newState,
        lastReview: now.toISOString(),
    };
}

/**
 * Convert Avaia verification outcome to FSRS rating
 */
export function outcomeToRating(
    correct: boolean,
    confidence: 1 | 2 | 3 | 4 | 5,
    responseTimeMs: number,
    expectedTimeMs: number = 30000
): Rating {
    if (!correct) {
        return 'again';
    }

    // Correct answer: determine difficulty based on confidence and time
    const timeRatio = responseTimeMs / expectedTimeMs;

    if (confidence >= 4 && timeRatio < 0.5) {
        return 'easy';  // High confidence, fast response
    } else if (confidence <= 2 || timeRatio > 2) {
        return 'hard';  // Low confidence or slow response
    } else {
        return 'good';  // Normal correct
    }
}

/**
 * Calculate next review date from card state
 */
export function getNextReviewDate(card: FSRSCard): Date | null {
    if (!card.lastReview) return null;

    const lastReview = new Date(card.lastReview);
    const nextReview = new Date(lastReview);
    nextReview.setDate(nextReview.getDate() + card.scheduledDays);
    return nextReview;
}

/**
 * Check if a card is due for review
 */
export function isDue(card: FSRSCard, now: Date): boolean {
    if (card.state === 'new') return true;
    if (!card.lastReview) return true;

    const nextReview = getNextReviewDate(card);
    if (!nextReview) return true;

    return now >= nextReview;
}

/**
 * Get cards that are due for review, sorted by priority
 */
export function getDueCards<T extends FSRSCard>(cards: T[], now: Date): T[] {
    return cards
        .filter(card => isDue(card, now))
        .sort((a, b) => {
            // Prioritize: relearning > learning > review > new
            const stateOrder: Record<CardState, number> = {
                relearning: 0,
                learning: 1,
                review: 2,
                new: 3,
            };

            const stateCompare = stateOrder[a.state] - stateOrder[b.state];
            if (stateCompare !== 0) return stateCompare;

            // Within same state, prioritize lower stability (more likely to forget)
            return a.stability - b.stability;
        });
}
