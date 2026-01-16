import { z } from 'zod';

// =============================================================================
// FSRS Types
// =============================================================================

export const RatingSchema = z.enum(['again', 'hard', 'good', 'easy']);
export type Rating = z.infer<typeof RatingSchema>;

export const CardStateSchema = z.enum(['new', 'learning', 'review', 'relearning']);
export type CardState = z.infer<typeof CardStateSchema>;

export const FSRSCardSchema = z.object({
    stability: z.number(),
    difficulty: z.number(),
    elapsedDays: z.number(),
    scheduledDays: z.number(),
    reps: z.number(),
    lapses: z.number(),
    state: CardStateSchema,
    lastReview: z.string().datetime().nullable(),
});
export type FSRSCard = z.infer<typeof FSRSCardSchema>;

// =============================================================================
// Emotional State Types
// =============================================================================

export const EmotionalStateSchema = z.enum([
    'flow',
    'struggling',
    'frustrated',
    'disengaged',
    'passive'
]);
export type EmotionalState = z.infer<typeof EmotionalStateSchema>;

export const TimingEntrySchema = z.object({
    timestamp: z.string().datetime(),
    timeSinceLastMs: z.number().int().nonnegative(),
    role: z.enum(['user', 'assistant']),
});
export type TimingEntry = z.infer<typeof TimingEntrySchema>;

// =============================================================================
// Message Metadata (from Client)
// =============================================================================

export const MessageMetadataSchema = z.object({
    timestamp: z.string().datetime(),
    session_id: z.string(),
    time_since_last_message_ms: z.number().int().nonnegative(),
    session_duration_ms: z.number().int().nonnegative(),
    message_number: z.number().int().positive(),
});
export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;

// =============================================================================
// Database Entity Types
// =============================================================================

export const LearnerSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    started_at: z.string(),
    preferred_teaching_method: z.enum(['example_first', 'concept_first', 'try_first']).default('example_first'),
    best_session_times: z.array(z.string()).default([]),
    onboarding_complete: z.boolean().default(false),
});
export type Learner = z.infer<typeof LearnerSchema>;

export const ProjectSchema = z.object({
    id: z.string(),
    learner_id: z.string(),
    name: z.string(),
    status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
    current_milestone: z.number().int().default(1),
    milestones_completed: z.array(z.number()).default([]),
    time_spent_minutes: z.number().int().default(0),
    started_at: z.string().nullable(),
    completed_at: z.string().nullable(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ConceptSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string().nullable(),
    cluster: z.string().nullable(),
    prerequisites: z.array(z.string()).default([]),
    sandbox_id: z.string().nullable(),
    visualizations: z.array(z.string()).default([]),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const LearnerConceptSchema = z.object({
    learner_id: z.string(),
    concept_id: z.string(),
    // FSRS state
    stability: z.number().default(0),
    difficulty: z.number().default(5),
    scheduled_days: z.number().int().default(0),
    elapsed_days: z.number().int().default(0),
    reps: z.number().int().default(0),
    lapses: z.number().int().default(0),
    state: CardStateSchema.default('new'),
    last_review_date: z.string().nullable(),
    next_review_date: z.string().nullable(),
    // Mastery
    introduced_at: z.string().nullable(),
    verified: z.boolean().default(false),
    verified_at: z.string().nullable(),
    contexts_applied: z.array(z.string()).default([]),
    // Performance
    total_attempts: z.number().int().default(0),
    correct_attempts: z.number().int().default(0),
    avg_response_time_ms: z.number().int().nullable(),
    attempts_without_hints: z.number().int().default(0),
    // Scaffolding
    independence_score: z.number().int().min(0).max(100).default(0),
    // Confidence
    confidence_history: z.array(z.object({
        timestamp: z.string(),
        confidence: z.number().int().min(1).max(5),
        correct: z.boolean(),
    })).default([]),
    // Stubborn bugs
    stubborn_misconceptions: z.array(z.string()).default([]),
});
export type LearnerConcept = z.infer<typeof LearnerConceptSchema>;

export const MisconceptionSchema = z.object({
    id: z.string(),
    concept_id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    trigger_answer: z.string().nullable(),
    remediation_strategy: z.string().nullable(),
    contrasting_case: z.object({
        case_a: z.object({
            code: z.string(),
            output: z.string(),
            label: z.string(),
        }),
        case_b: z.object({
            code: z.string(),
            output: z.string(),
            label: z.string(),
        }),
    }).nullable(),
});
export type Misconception = z.infer<typeof MisconceptionSchema>;

export const DiagnosticQuestionSchema = z.object({
    id: z.string(),
    concept_id: z.string(),
    code_snippet: z.string().nullable(),
    prompt: z.string(),
    correct_answer: z.string(),
    distractors: z.array(z.object({
        answer: z.string(),
        misconception_id: z.string().nullable(),
    })),
});
export type DiagnosticQuestion = z.infer<typeof DiagnosticQuestionSchema>;

export const FailurePatternSchema = z.object({
    id: z.string(),
    description: z.string(),
    code_pattern: z.string().nullable(),
    learner_symptoms: z.array(z.string()),
    is_correct_failure: z.boolean(),
    remediation: z.string().optional(),
});
export type FailurePattern = z.infer<typeof FailurePatternSchema>;

export const SandboxSchema = z.object({
    id: z.string(),
    concept_id: z.string(),
    problem_statement: z.string(),
    setup_code: z.string().nullable(),
    expected_failures: z.array(FailurePatternSchema),
    min_attempts: z.number().int().default(2),
    reflection_questions: z.array(z.string()),
    teaching_transition: z.string().nullable(),
});
export type Sandbox = z.infer<typeof SandboxSchema>;

export const SandboxAttemptSchema = z.object({
    id: z.string(),
    sandbox_id: z.string(),
    learner_id: z.string(),
    attempt_number: z.number().int(),
    code_submitted: z.string().nullable(),
    approach_description: z.string().nullable(),
    outcome: z.string().nullable(),
    matched_failure_pattern: z.string().nullable(),
    articulation_quality: z.enum(['none', 'partial', 'complete']).nullable(),
    timestamp: z.string(),
});
export type SandboxAttempt = z.infer<typeof SandboxAttemptSchema>;

export const ConceptInstanceSchema = z.object({
    id: z.string(),
    learner_id: z.string(),
    concept_id: z.string(),
    project_id: z.string(),
    milestone_id: z.number().int(),
    code_snippet: z.string().max(1000),
    snippet_context: z.string().nullable(),
    line_numbers: z.string().nullable(),
    created_at: z.string(),
});
export type ConceptInstance = z.infer<typeof ConceptInstanceSchema>;

export const SessionSchema = z.object({
    id: z.string(),
    learner_id: z.string(),
    project_id: z.string().nullable(),
    start_time: z.string(),
    end_time: z.string().nullable(),
    planned_duration_minutes: z.number().int().nullable(),
    actual_duration_minutes: z.number().int().nullable(),
    milestones_attempted: z.array(z.number()).default([]),
    milestones_completed: z.array(z.number()).default([]),
    concepts_introduced: z.array(z.string()).default([]),
    concepts_verified: z.array(z.string()).default([]),
    srs_reviews_given: z.number().int().default(0),
    srs_reviews_passed: z.number().int().default(0),
    emotional_states: z.array(z.object({
        timestamp: z.string(),
        state: EmotionalStateSchema,
        confidence: z.number(),
    })).default([]),
    learner_questions: z.array(z.object({
        timestamp: z.string(),
        text: z.string(),
        type: z.enum(['how', 'why', 'what', 'other']),
        prompted: z.boolean(),
    })).default([]),
    exit_ticket_concept: z.string().nullable(),
    exit_ticket_passed: z.boolean().nullable(),
});
export type Session = z.infer<typeof SessionSchema>;

// =============================================================================
// Tool Input/Output Schemas
// =============================================================================

// SRS Tools
export const GetDueReviewsInputSchema = z.object({
    learner_id: z.string(),
    limit: z.number().int().default(1),
});

export const GetDueReviewsOutputSchema = z.object({
    reviews: z.array(z.object({
        concept_id: z.string(),
        concept_name: z.string(),
        snippet_context: z.string(),
        code_snippet: z.string(),
        stability: z.number(),
    })),
});

export const LogReviewInputSchema = z.object({
    learner_id: z.string(),
    concept_id: z.string(),
    outcome: z.enum(['correct', 'incorrect']),
    confidence: z.number().int().min(1).max(5),
    response_time_ms: z.number().int().positive(),
});

export const LogReviewOutputSchema = z.object({
    new_stability: z.number(),
    next_review_date: z.string(),
    message: z.string(),
});

// Sandbox Tools
export const TriggerSandboxInputSchema = z.object({
    learner_id: z.string(),
    target_concept_id: z.string(),
});

export const TriggerSandboxOutputSchema = z.union([
    z.object({ required: z.literal(false) }),
    z.object({
        required: z.literal(true),
        sandbox_id: z.string(),
        problem_statement: z.string(),
        expected_failures: z.array(z.object({
            id: z.string(),
            description: z.string(),
            recognition_criteria: z.string().optional(),
        })),
    }),
]);

export const EvaluateSandboxAttemptInputSchema = z.object({
    sandbox_id: z.string(),
    learner_code: z.string(),
    learner_observation: z.string(),
});

export const EvaluateSandboxAttemptOutputSchema = z.object({
    matched_failure_id: z.string().nullable(),
    is_correct_failure: z.boolean(),
    feedback_guidance: z.string(),
    next_phase: z.enum(['retry', 'reflect', 'teach']),
});

// Verification Tools
export const GetDiagnosticQuestionInputSchema = z.object({
    concept_id: z.string(),
});

export const GetDiagnosticQuestionOutputSchema = z.object({
    question_id: z.string(),
    code_snippet: z.string().nullable(),
    prompt: z.string(),
    options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        is_correct: z.boolean(),
    })),
});

export const VerifyConceptInputSchema = z.object({
    learner_id: z.string(),
    concept_id: z.string(),
    method: z.enum(['socratic', 'code_prediction']),
    is_correct: z.boolean(),
    confidence: z.number().int().min(1).max(5),
    misconception_id: z.string().optional(),
});

export const VerifyConceptOutputSchema = z.object({
    status: z.enum(['verified', 'remediation_required']),
    intervention: z.object({
        type: z.literal('contrasting_case'),
        data: z.object({
            case_a: z.object({ code: z.string(), output: z.string() }),
            case_b: z.object({ code: z.string(), output: z.string() }),
        }),
    }).optional(),
});

// Content Tools
export const GetHintInputSchema = z.object({
    concept_id: z.string(),
    learner_id: z.string(),
});

export const GetHintOutputSchema = z.object({
    hint_level: z.number().int().min(0).max(4),
    hint_text: z.string(),
    independence_score: z.number().int(),
});

// Session Tools
export const InferEmotionalStateInputSchema = z.object({
    session_id: z.string(),
    recent_timings: z.array(TimingEntrySchema),
});

export const InferEmotionalStateOutputSchema = z.object({
    state: EmotionalStateSchema,
    confidence: z.number(),
    suggested_action: z.string(),
});

export const GetCurrentTimeOutputSchema = z.object({
    iso: z.string(),
    unix_ms: z.number(),
    formatted: z.string(),
});
