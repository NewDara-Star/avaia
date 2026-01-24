"""
Avaia Tools - Direct Python Implementation
All MCP tools implemented in Python for direct API use without Claude CLI.

This module provides:
1. Tool definitions compatible with Anthropic's tool_use API
2. Tool execution functions that operate directly on SQLite
3. Helper utilities for database operations
"""

import json
import os
import random
import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

# Database path
DB_PATH = os.path.expanduser('~/.avaia/avaia.db')


# =============================================================================
# Database Utilities
# =============================================================================

def get_db():
    """Get database connection with optimizations."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA cache_size=-64000")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def generate_id(prefix: str = '') -> str:
    """Generate a unique ID with optional prefix."""
    uid = uuid.uuid4().hex[:16]
    return f"{prefix}_{uid}" if prefix else uid


def parse_json(value: Optional[str], default: Any = None) -> Any:
    """Safely parse JSON string."""
    if not value:
        return default
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default


def to_json(value: Any) -> str:
    """Convert value to JSON string."""
    return json.dumps(value)


def now_iso() -> str:
    """Get current time as ISO string."""
    return datetime.utcnow().isoformat() + 'Z'


# =============================================================================
# Tool Definitions for Anthropic API
# =============================================================================

TOOL_DEFINITIONS = [
    # -------------------------------------------------------------------------
    # Session Tools
    # -------------------------------------------------------------------------
    {
        "name": "start_session",
        "description": "Initializes a new learning session with all check-in data. Returns session info, project state, due reviews, stubborn bugs, and known terms in one call.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "project_id": {"type": "string", "description": "The project to work on"},
                "planned_duration_minutes": {"type": "integer", "description": "Planned session length"}
            },
            "required": ["learner_id"]
        }
    },
    {
        "name": "end_session",
        "description": "Ends a session and saves natural language notes for continuity. Call when learner is leaving. Write notes that capture: (1) what was worked on (even non-project tasks like debugging setup issues), (2) blockers encountered and resolutions, (3) learner emotional state and comprehension level, (4) next steps for future sessions, (5) meta-learning observations. Write as if briefing your future self who has no memory of this session.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID to end"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "session_notes": {"type": "string", "description": "Natural language summary of the session"},
                "exit_ticket_passed": {"type": "boolean", "description": "Whether exit ticket was passed (if administered)"}
            },
            "required": ["session_id", "learner_id", "session_notes"]
        }
    },
    {
        "name": "get_current_time",
        "description": "Returns the current time. AI never guesses time - always call this.",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_session_summary",
        "description": "Gets complete summary of a session including milestones, concepts, and emotional journey.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID to summarize"}
            },
            "required": ["session_id"]
        }
    },
    {
        "name": "get_exit_ticket",
        "description": "Gets an end-of-session diagnostic question about code written today.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The current session ID"}
            },
            "required": ["session_id"]
        }
    },
    {
        "name": "log_exit_ticket_result",
        "description": "Records whether the learner passed the end-of-session exit ticket.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID"},
                "concept_id": {"type": "string", "description": "The concept tested in exit ticket"},
                "is_correct": {"type": "boolean", "description": "Whether they passed"}
            },
            "required": ["session_id", "concept_id", "is_correct"]
        }
    },
    # -------------------------------------------------------------------------
    # Learner Tools
    # -------------------------------------------------------------------------
    {
        "name": "create_learner",
        "description": "Creates a new learner profile. Call when a new user starts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "The learner's name"},
                "preferred_teaching_method": {
                    "type": "string",
                    "enum": ["example_first", "concept_first", "try_first"],
                    "description": "Learning preference"
                }
            }
        }
    },
    {
        "name": "get_learner_profile",
        "description": "Gets a learner profile including name, preferences, and onboarding status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    {
        "name": "complete_onboarding",
        "description": "Marks onboarding as complete and starts the first project.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "preferred_teaching_method": {
                    "type": "string",
                    "enum": ["example_first", "concept_first", "try_first"]
                },
                "best_session_times": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Preferred times to study"
                }
            },
            "required": ["learner_id"]
        }
    },
    # -------------------------------------------------------------------------
    # Project Tools
    # -------------------------------------------------------------------------
    {
        "name": "get_project_state",
        "description": "Gets the current project, milestone, and blockers. Call during Check-In phase.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    {
        "name": "start_project",
        "description": "Starts a new project for a learner.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "project_name": {"type": "string", "description": "Name of the project to start"}
            },
            "required": ["learner_id", "project_name"]
        }
    },
    {
        "name": "advance_milestone",
        "description": "Marks a milestone as complete and advances to the next.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "project_id": {"type": "string", "description": "The project ID"},
                "milestone_id": {"type": "integer", "description": "The milestone that was completed"}
            },
            "required": ["learner_id", "project_id", "milestone_id"]
        }
    },
    {
        "name": "get_next_step",
        "description": "Determines the next action based on stubborn bugs, due reviews, and project state.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    # -------------------------------------------------------------------------
    # Content/Teaching Tools
    # -------------------------------------------------------------------------
    {
        "name": "introduce_concept",
        "description": "Logs a teaching moment and stores the code snippet for future SRS. Call when teaching a new concept.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The concept being introduced"},
                "project_id": {"type": "string", "description": "The current project"},
                "milestone_id": {"type": "integer", "description": "The current milestone"},
                "code_snippet": {"type": "string", "description": "The relevant code (max 1000 chars)"},
                "snippet_context": {"type": "string", "description": "Context for the snippet"},
                "terms_introduced": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "term": {"type": "string"},
                            "definition": {"type": "string"}
                        }
                    },
                    "description": "Technical terms introduced with this concept"
                }
            },
            "required": ["learner_id", "concept_id", "project_id", "milestone_id", "code_snippet", "snippet_context"]
        }
    },
    {
        "name": "get_hint",
        "description": "Returns an appropriately-leveled hint based on independence score. Respects scaffolding levels.",
        "input_schema": {
            "type": "object",
            "properties": {
                "concept_id": {"type": "string", "description": "The concept the learner needs help with"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "specific_question": {"type": "string", "description": "What specifically they're stuck on"}
            },
            "required": ["concept_id", "learner_id"]
        }
    },
    {
        "name": "log_help_request",
        "description": "Updates independence score after providing help. Call after learner receives a hint.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The concept they needed help with"},
                "hint_level_given": {"type": "integer", "description": "The hint level that was provided (0-4)"},
                "solved_after": {"type": "boolean", "description": "Whether they solved it after the hint"}
            },
            "required": ["learner_id", "concept_id", "hint_level_given", "solved_after"]
        }
    },
    {
        "name": "get_prerequisites",
        "description": "Returns the prerequisite concepts for a given concept.",
        "input_schema": {
            "type": "object",
            "properties": {
                "concept_id": {"type": "string", "description": "The concept to check prerequisites for"}
            },
            "required": ["concept_id"]
        }
    },
    {
        "name": "get_weak_prerequisites",
        "description": "Checks which prerequisites are weak for a learner. Call before adding difficulty.",
        "input_schema": {
            "type": "object",
            "properties": {
                "concept_id": {"type": "string", "description": "The concept to check prerequisites for"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["concept_id", "learner_id"]
        }
    },
    {
        "name": "get_visualization",
        "description": "Gets visual explanation URLs for a concept. Use for complex abstract concepts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "concept_id": {"type": "string", "description": "The concept to get visualization for"}
            },
            "required": ["concept_id"]
        }
    },
    {
        "name": "log_confidence",
        "description": "Records learner confidence rating with outcome. Detects stubborn bug patterns.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The concept being rated"},
                "confidence_level": {"type": "integer", "description": "Self-reported confidence (1-5)"},
                "outcome": {"type": "string", "enum": ["correct", "incorrect"], "description": "Whether answer was correct"}
            },
            "required": ["learner_id", "concept_id", "confidence_level", "outcome"]
        }
    },
    {
        "name": "get_known_terms",
        "description": "Returns all technical terms that have been introduced to a learner. Use to check vocabulary before explaining concepts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    # -------------------------------------------------------------------------
    # SRS (Spaced Repetition) Tools
    # -------------------------------------------------------------------------
    {
        "name": "get_due_reviews",
        "description": "Fetches concepts due for review using token-efficient code snippets. Call during Check-In phase.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "limit": {"type": "integer", "description": "Maximum number of reviews to return (1-5)", "default": 1}
            },
            "required": ["learner_id"]
        }
    },
    {
        "name": "log_review",
        "description": "Updates the FSRS algorithm state after a review question. Call after learner answers.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The concept that was reviewed"},
                "outcome": {"type": "string", "enum": ["correct", "incorrect"], "description": "Whether the answer was correct"},
                "confidence": {"type": "integer", "description": "Self-reported confidence (1-5)"},
                "response_time_ms": {"type": "integer", "description": "Time taken to respond in milliseconds"}
            },
            "required": ["learner_id", "concept_id", "outcome", "confidence", "response_time_ms"]
        }
    },
    {
        "name": "get_refactoring_challenge",
        "description": "Gets a cross-project exercise for a decayed concept. Use during Build phase if concept has significantly decayed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The decayed concept to reinforce"},
                "current_project_id": {"type": "string", "description": "The current project for context"}
            },
            "required": ["learner_id", "concept_id", "current_project_id"]
        }
    },
    # -------------------------------------------------------------------------
    # Verification Tools
    # -------------------------------------------------------------------------
    {
        "name": "get_diagnostic_question",
        "description": "Gets a code prediction task with misconception-mapped distractors. Call during Verification phase.",
        "input_schema": {
            "type": "object",
            "properties": {
                "concept_id": {"type": "string", "description": "The concept to generate a diagnostic question for"}
            },
            "required": ["concept_id"]
        }
    },
    {
        "name": "verify_concept",
        "description": "Logs verification attempt and triggers remediation if needed. Call after learner answers diagnostic.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The concept being verified"},
                "method": {"type": "string", "enum": ["socratic", "code_prediction"], "description": "Verification method used"},
                "is_correct": {"type": "boolean", "description": "Whether the answer was correct"},
                "confidence": {"type": "integer", "description": "Learner's self-reported confidence"},
                "misconception_id": {"type": "string", "description": "If incorrect, the specific misconception detected"}
            },
            "required": ["learner_id", "concept_id", "method", "is_correct", "confidence"]
        }
    },
    {
        "name": "get_contrasting_case",
        "description": "Gets two code snippets for stubborn bug remediation. Use when high-confidence error detected.",
        "input_schema": {
            "type": "object",
            "properties": {
                "misconception_id": {"type": "string", "description": "The misconception to get remediation for"}
            },
            "required": ["misconception_id"]
        }
    },
    {
        "name": "get_discrimination_question",
        "description": "Gets a question comparing similar concepts in a cluster. Use for interleaving.",
        "input_schema": {
            "type": "object",
            "properties": {
                "concept_id": {"type": "string", "description": "The concept to find similar concepts for"}
            },
            "required": ["concept_id"]
        }
    },
    {
        "name": "flag_stubborn_bug",
        "description": "Marks a misconception as stubborn and schedules accelerated review.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The concept with the stubborn bug"},
                "misconception_id": {"type": "string", "description": "The specific misconception"}
            },
            "required": ["learner_id", "concept_id", "misconception_id"]
        }
    },
    {
        "name": "log_diagnostic_result",
        "description": "Records the outcome of a diagnostic question with misconception mapping.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "concept_id": {"type": "string", "description": "The concept tested"},
                "question_id": {"type": "string", "description": "The diagnostic question ID"},
                "answer_given": {"type": "string", "description": "The answer the learner provided"},
                "is_correct": {"type": "boolean", "description": "Whether the answer was correct"},
                "confidence": {"type": "integer", "description": "Learner confidence"},
                "response_time_ms": {"type": "integer", "description": "Time to answer"},
                "misconception_id": {"type": "string", "description": "If wrong, the misconception revealed"}
            },
            "required": ["learner_id", "concept_id", "question_id", "answer_given", "is_correct", "confidence", "response_time_ms"]
        }
    },
    {
        "name": "get_remediation",
        "description": "Gets the targeted fix strategy for a specific misconception.",
        "input_schema": {
            "type": "object",
            "properties": {
                "misconception_id": {"type": "string", "description": "The misconception to remediate"}
            },
            "required": ["misconception_id"]
        }
    },
    {
        "name": "get_stubborn_bugs",
        "description": "Gets all unresolved high-confidence errors for a learner. Check before starting new material.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    # -------------------------------------------------------------------------
    # Sandbox Tools
    # -------------------------------------------------------------------------
    {
        "name": "trigger_sandbox",
        "description": "Checks if an upcoming concept requires a 'Designed Failure' sandbox first. Call before introducing complex concepts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "target_concept_id": {"type": "string", "description": "The concept about to be taught"}
            },
            "required": ["learner_id", "target_concept_id"]
        }
    },
    {
        "name": "evaluate_sandbox_attempt",
        "description": "Validates if the learner 'failed correctly' in a sandbox exercise. Call after learner reports their attempt.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sandbox_id": {"type": "string", "description": "The sandbox exercise ID"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "learner_code": {"type": "string", "description": "The code the learner wrote"},
                "learner_observation": {"type": "string", "description": "What the learner observed happening"}
            },
            "required": ["sandbox_id", "learner_id", "learner_code", "learner_observation"]
        }
    },
    {
        "name": "log_sandbox_reflection",
        "description": "Records the learner's reflection on why their sandbox approaches failed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sandbox_id": {"type": "string", "description": "The sandbox exercise ID"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "learner_articulation": {"type": "string", "description": "The learner's reflection on why their approaches failed"},
                "quality": {"type": "string", "enum": ["none", "partial", "complete"], "description": "Quality of the articulation"}
            },
            "required": ["sandbox_id", "learner_id", "learner_articulation", "quality"]
        }
    },
    {
        "name": "log_sandbox_attempt",
        "description": "Records an individual sandbox attempt. Call after each approach the learner tries.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sandbox_id": {"type": "string", "description": "The sandbox exercise ID"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "attempt_number": {"type": "integer", "description": "Which attempt this is"},
                "approach_description": {"type": "string", "description": "What approach the learner tried"},
                "outcome": {"type": "string", "description": "What happened (result observed)"}
            },
            "required": ["sandbox_id", "learner_id", "attempt_number", "approach_description", "outcome"]
        }
    },
    {
        "name": "get_sandbox_summary",
        "description": "Gets all attempts for a sandbox for comparison discussion. Call before teaching transition.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sandbox_id": {"type": "string", "description": "The sandbox exercise ID"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["sandbox_id", "learner_id"]
        }
    },
    # -------------------------------------------------------------------------
    # Emotional/Engagement Tools
    # -------------------------------------------------------------------------
    {
        "name": "infer_emotional_state",
        "description": "Analyzes timing patterns to detect frustration or disengagement. Call every ~20 minutes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The current session ID"},
                "recent_timings": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "timestamp": {"type": "string"},
                            "timeSinceLastMs": {"type": "number"},
                            "role": {"type": "string", "enum": ["user", "assistant"]}
                        }
                    },
                    "description": "Recent message timing entries"
                }
            },
            "required": ["session_id", "recent_timings"]
        }
    },
    {
        "name": "log_message_timing",
        "description": "Records timing metadata for emotional state inference.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The current session ID"},
                "timestamp": {"type": "string", "description": "ISO timestamp of the message"},
                "gap_ms": {"type": "integer", "description": "Milliseconds since previous message"},
                "message_type": {"type": "string", "enum": ["user", "assistant"], "description": "Who sent the message"},
                "message_length": {"type": "integer", "description": "Length of the message"},
                "contains_help_request": {"type": "boolean", "description": "Whether message contains help patterns"}
            },
            "required": ["session_id", "timestamp", "gap_ms", "message_type"]
        }
    },
    {
        "name": "should_prompt_questions",
        "description": "Checks if learner has been too passive (no questions). Call if session seems quiet.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    {
        "name": "log_learner_question",
        "description": "Records when a learner asks a question. Track engagement and question types.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The current session ID"},
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "question_text": {"type": "string", "description": "The question asked"},
                "question_type": {"type": "string", "enum": ["how", "why", "what", "other"], "description": "Type of question"},
                "prompted": {"type": "boolean", "description": "Whether it was prompted by Avaia"}
            },
            "required": ["session_id", "learner_id", "question_text", "question_type", "prompted"]
        }
    },
    {
        "name": "log_emotional_checkin",
        "description": "Records explicit emotional check-in response from learner.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The current session ID"},
                "learner_response": {"type": "string", "description": "What the learner said about how they feel"},
                "inferred_state": {"type": "string", "enum": ["good", "okay", "frustrated", "tired", "confused"], "description": "Inferred emotional state"}
            },
            "required": ["session_id", "learner_response"]
        }
    },
    {
        "name": "get_intervention",
        "description": "Gets suggested intervention script for a detected emotional state.",
        "input_schema": {
            "type": "object",
            "properties": {
                "emotional_state": {"type": "string", "enum": ["flow", "struggling", "frustrated", "disengaged", "passive"], "description": "The detected emotional state"}
            },
            "required": ["emotional_state"]
        }
    },
    {
        "name": "get_question_patterns",
        "description": "Analyzes learner questioning behavior over time. Identifies passive learners.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    # -------------------------------------------------------------------------
    # Track Tools
    # -------------------------------------------------------------------------
    {
        "name": "get_learning_tracks",
        "description": "Gets all available learning tracks.",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "select_learning_track",
        "description": "Selects a learning track for a learner.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"},
                "track_id": {"type": "string", "description": "The track to select"}
            },
            "required": ["learner_id", "track_id"]
        }
    },
    {
        "name": "get_track_progress",
        "description": "Gets a learner's progress through their current track.",
        "input_schema": {
            "type": "object",
            "properties": {
                "learner_id": {"type": "string", "description": "The learner's unique identifier"}
            },
            "required": ["learner_id"]
        }
    },
    # -------------------------------------------------------------------------
    # Chat History Tools
    # -------------------------------------------------------------------------
    {
        "name": "log_chat_message",
        "description": "Logs a chat message for complete conversation history.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The current session ID"},
                "role": {"type": "string", "enum": ["user", "assistant", "system"], "description": "Who sent the message"},
                "content": {"type": "string", "description": "The actual message text"},
                "tool_calls": {"type": "array", "description": "MCP tool calls made (if assistant)"},
                "tool_results": {"type": "array", "description": "Tool results received (if assistant)"},
                "tokens_used": {"type": "integer", "description": "Tokens used for this message"}
            },
            "required": ["session_id", "role", "content"]
        }
    },
    {
        "name": "get_chat_history",
        "description": "Retrieves conversation history for a session.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The session ID to retrieve history for"},
                "limit": {"type": "integer", "description": "Maximum messages to return"},
                "role_filter": {"type": "string", "enum": ["user", "assistant", "system"], "description": "Filter by role"},
                "since_timestamp": {"type": "string", "description": "Only messages after this ISO timestamp"}
            },
            "required": ["session_id"]
        }
    },
]


# =============================================================================
# Tool Implementations
# =============================================================================

def execute_tool(tool_name: str, args: dict) -> dict:
    """Execute a tool and return the result."""
    handlers = {
        # Session
        'start_session': tool_start_session,
        'end_session': tool_end_session,
        'get_current_time': tool_get_current_time,
        'get_session_summary': tool_get_session_summary,
        'get_exit_ticket': tool_get_exit_ticket,
        'log_exit_ticket_result': tool_log_exit_ticket_result,
        # Learner
        'create_learner': tool_create_learner,
        'get_learner_profile': tool_get_learner_profile,
        'complete_onboarding': tool_complete_onboarding,
        # Project
        'get_project_state': tool_get_project_state,
        'start_project': tool_start_project,
        'advance_milestone': tool_advance_milestone,
        'get_next_step': tool_get_next_step,
        # Content
        'introduce_concept': tool_introduce_concept,
        'get_hint': tool_get_hint,
        'log_help_request': tool_log_help_request,
        'get_prerequisites': tool_get_prerequisites,
        'get_weak_prerequisites': tool_get_weak_prerequisites,
        'get_visualization': tool_get_visualization,
        'log_confidence': tool_log_confidence,
        'get_known_terms': tool_get_known_terms,
        # SRS
        'get_due_reviews': tool_get_due_reviews,
        'log_review': tool_log_review,
        'get_refactoring_challenge': tool_get_refactoring_challenge,
        # Verification
        'get_diagnostic_question': tool_get_diagnostic_question,
        'verify_concept': tool_verify_concept,
        'get_contrasting_case': tool_get_contrasting_case,
        'get_discrimination_question': tool_get_discrimination_question,
        'flag_stubborn_bug': tool_flag_stubborn_bug,
        'log_diagnostic_result': tool_log_diagnostic_result,
        'get_remediation': tool_get_remediation,
        'get_stubborn_bugs': tool_get_stubborn_bugs,
        # Sandbox
        'trigger_sandbox': tool_trigger_sandbox,
        'evaluate_sandbox_attempt': tool_evaluate_sandbox_attempt,
        'log_sandbox_reflection': tool_log_sandbox_reflection,
        'log_sandbox_attempt': tool_log_sandbox_attempt,
        'get_sandbox_summary': tool_get_sandbox_summary,
        # Emotional
        'infer_emotional_state': tool_infer_emotional_state,
        'log_message_timing': tool_log_message_timing,
        'should_prompt_questions': tool_should_prompt_questions,
        'log_learner_question': tool_log_learner_question,
        'log_emotional_checkin': tool_log_emotional_checkin,
        'get_intervention': tool_get_intervention,
        'get_question_patterns': tool_get_question_patterns,
        # Track
        'get_learning_tracks': tool_get_learning_tracks,
        'select_learning_track': tool_select_learning_track,
        'get_track_progress': tool_get_track_progress,
        # Chat
        'log_chat_message': tool_log_chat_message,
        'get_chat_history': tool_get_chat_history,
    }

    handler = handlers.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}

    try:
        return handler(args)
    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# Session Tool Implementations
# =============================================================================

def tool_start_session(args: dict) -> dict:
    """Start a new learning session."""
    db = get_db()
    learner_id = args['learner_id']
    project_id = args.get('project_id')
    planned_duration = args.get('planned_duration_minutes', 30)

    session_id = generate_id('session')

    # Create session
    db.execute("""
        INSERT INTO session (id, learner_id, project_id, start_time, planned_duration_minutes,
                            emotional_states, learner_questions, milestones_completed,
                            concepts_introduced, concepts_verified)
        VALUES (?, ?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]')
    """, (session_id, learner_id, project_id, now_iso(), planned_duration))
    db.commit()

    # Get learner info
    learner = db.execute("SELECT * FROM learner WHERE id = ?", (learner_id,)).fetchone()

    # Get project state
    project = None
    if project_id:
        project = db.execute("SELECT * FROM project WHERE id = ?", (project_id,)).fetchone()
    elif learner:
        project = db.execute("""
            SELECT * FROM project WHERE learner_id = ? AND status = 'in_progress'
            ORDER BY started_at DESC LIMIT 1
        """, (learner_id,)).fetchone()

    # Get due reviews (limit 3) - note: schema uses next_review_date, not next_review
    due_reviews = db.execute("""
        SELECT lc.concept_id, c.name
        FROM learner_concept lc
        LEFT JOIN concept c ON lc.concept_id = c.id
        WHERE lc.learner_id = ? AND lc.next_review_date <= datetime('now')
        ORDER BY lc.next_review_date LIMIT 3
    """, (learner_id,)).fetchall()

    # Get stubborn bugs from JSON arrays in learner_concept
    stubborn_results = db.execute("""
        SELECT concept_id, stubborn_misconceptions FROM learner_concept
        WHERE learner_id = ? AND stubborn_misconceptions != '[]'
    """, (learner_id,)).fetchall()

    stubborn_bugs = []
    for row in stubborn_results:
        misconceptions = parse_json(row['stubborn_misconceptions'], [])
        for misc_id in misconceptions:
            stubborn_bugs.append({
                'concept_id': row['concept_id'],
                'misconception_id': misc_id
            })

    # Get known terms count
    terms_count = db.execute(
        "SELECT COUNT(*) FROM learner_term WHERE learner_id = ?", (learner_id,)
    ).fetchone()[0]

    # Get previous session notes
    prev_session = db.execute("""
        SELECT session_notes FROM session
        WHERE learner_id = ? AND id != ? AND session_notes IS NOT NULL
        ORDER BY end_time DESC LIMIT 1
    """, (learner_id, session_id)).fetchone()

    db.close()

    return {
        "session_id": session_id,
        "learner": {
            "id": learner_id,
            "name": learner['name'] if learner else None,
            "onboarding_complete": bool(learner['onboarding_complete']) if learner else False,
            "preferred_method": learner['preferred_teaching_method'] if learner else 'example_first'
        } if learner else None,
        "project": {
            "id": project['id'],
            "name": project['name'],
            "current_milestone": project['current_milestone'],
            "status": project['status']
        } if project else None,
        "due_reviews": [
            {"concept_id": r['concept_id'], "name": r['name']}
            for r in due_reviews
        ],
        "stubborn_bugs": [
            {"concept_id": b['concept_id'], "misconception_id": b['misconception_id']}
            for b in stubborn_bugs
        ],
        "known_terms_count": terms_count,
        "previous_session_notes": prev_session['session_notes'] if prev_session else None,
        "message": "Session started. Review due items and previous notes before proceeding."
    }


def tool_end_session(args: dict) -> dict:
    """End a session and save notes."""
    db = get_db()
    session_id = args['session_id']
    learner_id = args['learner_id']
    session_notes = args['session_notes']
    exit_ticket_passed = args.get('exit_ticket_passed')

    # Get session for duration calculation
    session = db.execute("SELECT start_time FROM session WHERE id = ?", (session_id,)).fetchone()
    if not session:
        db.close()
        return {"error": "Session not found"}

    # Parse start time - handle various formats
    start_time_str = session['start_time']
    try:
        if 'Z' in start_time_str:
            start_time = datetime.fromisoformat(start_time_str.replace('Z', ''))
        elif '+' in start_time_str:
            start_time = datetime.fromisoformat(start_time_str.split('+')[0])
        else:
            start_time = datetime.fromisoformat(start_time_str)
    except:
        start_time = datetime.utcnow()  # Fallback

    end_time = datetime.utcnow()
    duration_minutes = int((end_time - start_time).total_seconds() / 60)

    db.execute("""
        UPDATE session SET
            end_time = ?,
            actual_duration_minutes = ?,
            session_notes = ?,
            exit_ticket_passed = COALESCE(?, exit_ticket_passed)
        WHERE id = ?
    """, (now_iso(), duration_minutes, session_notes, exit_ticket_passed, session_id))
    db.commit()
    db.close()

    return {
        "session_id": session_id,
        "duration_minutes": duration_minutes,
        "notes_saved": True,
        "message": "Session ended successfully. Notes saved for future reference."
    }


def tool_get_current_time(args: dict) -> dict:
    """Get current time."""
    now = datetime.utcnow()
    return {
        "iso": now.isoformat() + 'Z',
        "unix_ms": int(now.timestamp() * 1000),
        "formatted": now.strftime("%A, %B %d, %Y at %I:%M %p UTC")
    }


def tool_get_session_summary(args: dict) -> dict:
    """Get session summary."""
    db = get_db()
    session = db.execute("""
        SELECT s.*, l.name as learner_name, p.name as project_name
        FROM session s
        LEFT JOIN learner l ON l.id = s.learner_id
        LEFT JOIN project p ON p.id = s.project_id
        WHERE s.id = ?
    """, (args['session_id'],)).fetchone()
    db.close()

    if not session:
        return {"error": "Session not found"}

    return {
        "session_id": session['id'],
        "learner": session['learner_name'] or session['learner_id'],
        "project": session['project_name'] or 'No project',
        "duration_minutes": session['actual_duration_minutes'] or 0,
        "concepts_introduced": parse_json(session['concepts_introduced'], []),
        "concepts_verified": parse_json(session['concepts_verified'], []),
        "milestones_completed": parse_json(session['milestones_completed'], []),
        "session_notes": session['session_notes']
    }


def tool_get_exit_ticket(args: dict) -> dict:
    """Get exit ticket question."""
    db = get_db()
    session = db.execute("""
        SELECT concepts_introduced, learner_id FROM session WHERE id = ?
    """, (args['session_id'],)).fetchone()

    if not session:
        db.close()
        return {"error": "Session not found"}

    concepts = parse_json(session['concepts_introduced'], [])
    if not concepts:
        db.close()
        return {"skip": True, "message": "No new concepts introduced - exit ticket optional."}

    concept_id = random.choice(concepts)

    # Try to get diagnostic question
    question = db.execute("""
        SELECT id, code_snippet, prompt, correct_answer, distractors
        FROM diagnostic_question WHERE concept_id = ?
        ORDER BY RANDOM() LIMIT 1
    """, (concept_id,)).fetchone()

    concept = db.execute("SELECT name FROM concept WHERE id = ?", (concept_id,)).fetchone()
    db.close()

    if not question:
        return {
            "skip": False,
            "concept_id": concept_id,
            "concept_name": concept['name'] if concept else concept_id,
            "fallback": True,
            "prompt": f"Explain {concept['name'] if concept else concept_id} in your own words."
        }

    distractors = parse_json(question['distractors'], [])
    options = [question['correct_answer']] + [d.get('answer', '') for d in distractors if d.get('answer')]
    random.shuffle(options)

    return {
        "skip": False,
        "concept_id": concept_id,
        "concept_name": concept['name'] if concept else None,
        "question_id": question['id'],
        "code_snippet": question['code_snippet'],
        "prompt": question['prompt'],
        "options": options,
        "correct_answer": question['correct_answer']
    }


def tool_log_exit_ticket_result(args: dict) -> dict:
    """Log exit ticket result."""
    db = get_db()
    db.execute("""
        UPDATE session SET exit_ticket_passed = ?, exit_ticket_concept = ?
        WHERE id = ?
    """, (args['is_correct'], args['concept_id'], args['session_id']))
    db.commit()
    db.close()
    return {"logged": True, "passed": args['is_correct']}


# =============================================================================
# Learner Tool Implementations
# =============================================================================

def tool_create_learner(args: dict) -> dict:
    """Create a new learner."""
    db = get_db()
    learner_id = generate_id('learner')
    name = args.get('name', 'Learner')
    method = args.get('preferred_teaching_method', 'example_first')

    db.execute("""
        INSERT INTO learner (id, name, preferred_teaching_method, onboarding_complete, current_track_id)
        VALUES (?, ?, ?, 0, 'js-web')
    """, (learner_id, name, method))
    db.commit()
    db.close()

    return {
        "learner_id": learner_id,
        "name": name,
        "message": f"Welcome, {name}! Your learner profile has been created."
    }


def tool_get_learner_profile(args: dict) -> dict:
    """Get learner profile."""
    db = get_db()
    learner = db.execute("SELECT * FROM learner WHERE id = ?", (args['learner_id'],)).fetchone()
    db.close()

    if not learner:
        return {"error": "Learner not found"}

    return {
        "id": learner['id'],
        "name": learner['name'],
        "started_at": learner['started_at'],
        "preferred_teaching_method": learner['preferred_teaching_method'],
        "onboarding_complete": bool(learner['onboarding_complete']),
        "current_track_id": learner['current_track_id']
    }


def tool_complete_onboarding(args: dict) -> dict:
    """Complete onboarding."""
    db = get_db()
    learner_id = args['learner_id']
    method = args.get('preferred_teaching_method')

    if method:
        db.execute("""
            UPDATE learner SET onboarding_complete = 1, preferred_teaching_method = ?
            WHERE id = ?
        """, (method, learner_id))
    else:
        db.execute("UPDATE learner SET onboarding_complete = 1 WHERE id = ?", (learner_id,))

    db.commit()
    db.close()

    return {"success": True, "message": "Onboarding complete! Ready to start learning."}


# =============================================================================
# Project Tool Implementations
# =============================================================================

def tool_get_project_state(args: dict) -> dict:
    """Get current project state."""
    db = get_db()
    learner_id = args['learner_id']

    # Get current project
    project = db.execute("""
        SELECT p.*, pt.milestones, pt.name as template_name
        FROM project p
        LEFT JOIN project_template pt ON p.template_id = pt.id
        WHERE p.learner_id = ? AND p.status = 'in_progress'
        ORDER BY p.started_at DESC LIMIT 1
    """, (learner_id,)).fetchone()

    if not project:
        db.close()
        return {"has_project": False, "message": "No active project. Start one to begin learning."}

    milestones = parse_json(project['milestones'], [])
    current_milestone = project['current_milestone'] or 1
    current_ms = milestones[current_milestone - 1] if current_milestone <= len(milestones) else None

    # Get concepts for current milestone
    concepts = db.execute("""
        SELECT mc.concept_id, c.name, mc.relationship
        FROM milestone_concept mc
        LEFT JOIN concept c ON c.id = mc.concept_id
        WHERE mc.project_template_id = ? AND mc.milestone_number = ?
    """, (project['template_id'], current_milestone)).fetchall()

    db.close()

    return {
        "has_project": True,
        "project_id": project['id'],
        "project_name": project['name'] or project['template_name'],
        "current_milestone": current_milestone,
        "total_milestones": len(milestones),
        "milestone_name": current_ms.get('name') if current_ms else None,
        "milestone_description": current_ms.get('description') if current_ms else None,
        "concepts_to_cover": [
            {"id": c['concept_id'], "name": c['name'], "relationship": c['relationship']}
            for c in concepts
        ],
        "status": project['status']
    }


def tool_start_project(args: dict) -> dict:
    """Start a new project."""
    db = get_db()
    learner_id = args['learner_id']
    project_name = args['project_name']

    # Find template by name
    template = db.execute("""
        SELECT id, name, milestones FROM project_template
        WHERE name LIKE ? OR id LIKE ?
        LIMIT 1
    """, (f"%{project_name}%", f"%{project_name}%")).fetchone()

    if not template:
        db.close()
        return {"error": f"Project template '{project_name}' not found"}

    project_id = generate_id('project')
    db.execute("""
        INSERT INTO project (id, learner_id, template_id, name, current_milestone, status, started_at)
        VALUES (?, ?, ?, ?, 1, 'in_progress', ?)
    """, (project_id, learner_id, template['id'], template['name'], now_iso()))
    db.commit()
    db.close()

    milestones = parse_json(template['milestones'], [])

    return {
        "project_id": project_id,
        "project_name": template['name'],
        "total_milestones": len(milestones),
        "first_milestone": milestones[0] if milestones else None,
        "message": f"Project '{template['name']}' started! Let's begin with milestone 1."
    }


def tool_advance_milestone(args: dict) -> dict:
    """Advance to next milestone."""
    db = get_db()
    project_id = args['project_id']
    milestone_id = args['milestone_id']

    project = db.execute("""
        SELECT p.*, pt.milestones FROM project p
        LEFT JOIN project_template pt ON p.template_id = pt.id
        WHERE p.id = ?
    """, (project_id,)).fetchone()

    if not project:
        db.close()
        return {"error": "Project not found"}

    milestones = parse_json(project['milestones'], [])
    next_milestone = milestone_id + 1

    if next_milestone > len(milestones):
        # Project complete
        db.execute("""
            UPDATE project SET status = 'completed', completed_at = ?, current_milestone = ?
            WHERE id = ?
        """, (now_iso(), milestone_id, project_id))
        db.commit()
        db.close()
        return {
            "project_complete": True,
            "message": "Congratulations! Project completed!"
        }

    db.execute("UPDATE project SET current_milestone = ? WHERE id = ?", (next_milestone, project_id))
    db.commit()
    db.close()

    next_ms = milestones[next_milestone - 1] if next_milestone <= len(milestones) else None

    return {
        "project_complete": False,
        "new_milestone": next_milestone,
        "milestone_name": next_ms.get('name') if next_ms else None,
        "milestone_description": next_ms.get('description') if next_ms else None,
        "message": f"Milestone {milestone_id} complete! Moving to milestone {next_milestone}."
    }


def tool_get_next_step(args: dict) -> dict:
    """Determine next action for learner."""
    db = get_db()
    learner_id = args['learner_id']

    # Check stubborn bugs first (from JSON array in learner_concept)
    stubborn_concept = db.execute("""
        SELECT concept_id, stubborn_misconceptions FROM learner_concept
        WHERE learner_id = ? AND stubborn_misconceptions != '[]'
        LIMIT 1
    """, (learner_id,)).fetchone()

    if stubborn_concept:
        misconceptions = parse_json(stubborn_concept['stubborn_misconceptions'], [])
        if misconceptions:
            db.close()
            return {
                "action": "remediate_stubborn_bug",
                "concept_id": stubborn_concept['concept_id'],
                "misconception_id": misconceptions[0],
                "message": "Address this stubborn bug before continuing."
            }

    # Check due reviews (use correct column name)
    review = db.execute("""
        SELECT concept_id FROM learner_concept
        WHERE learner_id = ? AND next_review_date <= datetime('now')
        LIMIT 1
    """, (learner_id,)).fetchone()

    if review:
        db.close()
        return {
            "action": "review",
            "concept_id": review['concept_id'],
            "message": "Quick review to reinforce learning."
        }

    # Continue with project
    project = db.execute("""
        SELECT id, current_milestone FROM project
        WHERE learner_id = ? AND status = 'in_progress' LIMIT 1
    """, (learner_id,)).fetchone()

    db.close()

    if project:
        return {
            "action": "continue_project",
            "project_id": project['id'],
            "milestone": project['current_milestone'],
            "message": "Continue with current milestone."
        }

    return {
        "action": "start_project",
        "message": "No active project. Start one to begin learning."
    }


# =============================================================================
# Content Tool Implementations
# =============================================================================

def tool_introduce_concept(args: dict) -> dict:
    """Introduce a new concept."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']
    code_snippet = args.get('code_snippet', '')[:1000]  # Max 1000 chars
    snippet_context = args.get('snippet_context', '')
    terms = args.get('terms_introduced', [])

    # Create or update learner_concept (schema uses next_review_date, not next_review)
    # Store code_snippet in contexts_applied as JSON since column doesn't exist
    context_json = json.dumps([{"code": code_snippet, "context": snippet_context}])
    db.execute("""
        INSERT INTO learner_concept (learner_id, concept_id, introduced_at, next_review_date,
                                     stability, difficulty, independence_score, contexts_applied)
        VALUES (?, ?, ?, datetime('now', '+1 day'), 1.0, 0.3, 100, ?)
        ON CONFLICT(learner_id, concept_id) DO UPDATE SET
            contexts_applied = excluded.contexts_applied
    """, (learner_id, concept_id, now_iso(), context_json))

    # Add terms (schema requires introduced_with_concept)
    for term in terms:
        if term.get('term') and term.get('definition'):
            db.execute("""
                INSERT OR REPLACE INTO learner_term (learner_id, term, definition, introduced_with_concept)
                VALUES (?, ?, ?, ?)
            """, (learner_id, term['term'], term['definition'], concept_id))

    # Update session concepts_introduced - use subquery for SQLite compatibility
    db.execute("""
        UPDATE session SET concepts_introduced = json_insert(concepts_introduced, '$[#]', ?)
        WHERE id = (SELECT id FROM session WHERE learner_id = ? AND end_time IS NULL
                    ORDER BY start_time DESC LIMIT 1)
    """, (concept_id, learner_id))

    db.commit()
    db.close()

    return {
        "concept_id": concept_id,
        "terms_added": len(terms),
        "next_review": "tomorrow",
        "message": f"Concept '{concept_id}' introduced. Will appear in reviews tomorrow."
    }


def tool_get_hint(args: dict) -> dict:
    """Get a hint for a concept."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']

    # Get learner's independence score for this concept
    lc = db.execute("""
        SELECT independence_score FROM learner_concept
        WHERE learner_id = ? AND concept_id = ?
    """, (learner_id, concept_id)).fetchone()

    independence = lc['independence_score'] if lc and lc['independence_score'] else 100
    db.close()

    # Determine hint level based on independence
    if independence >= 80:
        hint_level = 0
        hint = "Think about what you already know. What's the first step?"
    elif independence >= 60:
        hint_level = 1
        hint = "Consider the key concept involved. What pattern applies here?"
    elif independence >= 40:
        hint_level = 2
        hint = "Look at the specific syntax or structure needed."
    elif independence >= 20:
        hint_level = 3
        hint = "Here's a partial solution to guide you..."
    else:
        hint_level = 4
        hint = "Let me walk you through this step by step."

    return {
        "hint_level": hint_level,
        "hint": hint,
        "independence_score": independence,
        "message": "Hint provided. Log help_request after learner attempts."
    }


def tool_log_help_request(args: dict) -> dict:
    """Log a help request."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']
    hint_level = args['hint_level_given']
    solved = args['solved_after']

    # Adjust independence score
    if solved:
        adjustment = 5 - hint_level  # Less penalty for lower hints
    else:
        adjustment = -10

    db.execute("""
        UPDATE learner_concept SET
            independence_score = MAX(0, MIN(100, COALESCE(independence_score, 100) + ?))
        WHERE learner_id = ? AND concept_id = ?
    """, (adjustment, learner_id, concept_id))
    db.commit()
    db.close()

    return {
        "logged": True,
        "independence_adjusted": adjustment,
        "solved": solved
    }


def tool_get_prerequisites(args: dict) -> dict:
    """Get prerequisites for a concept."""
    db = get_db()
    concept = db.execute("""
        SELECT prerequisites FROM concept WHERE id = ?
    """, (args['concept_id'],)).fetchone()
    db.close()

    if not concept:
        return {"error": "Concept not found"}

    prereqs = parse_json(concept['prerequisites'], [])
    return {"concept_id": args['concept_id'], "prerequisites": prereqs}


def tool_get_weak_prerequisites(args: dict) -> dict:
    """Get weak prerequisites for a learner."""
    db = get_db()
    concept = db.execute("SELECT prerequisites FROM concept WHERE id = ?", (args['concept_id'],)).fetchone()

    if not concept:
        db.close()
        return {"error": "Concept not found"}

    prereqs = parse_json(concept['prerequisites'], [])
    weak = []

    for prereq_id in prereqs:
        lc = db.execute("""
            SELECT verified, independence_score FROM learner_concept
            WHERE learner_id = ? AND concept_id = ?
        """, (args['learner_id'], prereq_id)).fetchone()

        if not lc or not lc['verified'] or (lc['independence_score'] or 0) < 50:
            weak.append(prereq_id)

    db.close()
    return {"concept_id": args['concept_id'], "weak_prerequisites": weak}


def tool_get_visualization(args: dict) -> dict:
    """Get visualization for a concept."""
    # This would normally return URLs to visualizations
    return {
        "concept_id": args['concept_id'],
        "visualizations": [],
        "message": "No visualizations available for this concept."
    }


def tool_log_confidence(args: dict) -> dict:
    """Log confidence rating."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']
    confidence = args['confidence_level']
    outcome = args['outcome']

    # Check for stubborn bug pattern (high confidence + incorrect)
    is_stubborn = confidence >= 4 and outcome == 'incorrect'

    db.execute("""
        UPDATE learner_concept SET
            total_attempts = COALESCE(total_attempts, 0) + 1,
            correct_attempts = COALESCE(correct_attempts, 0) + CASE WHEN ? = 'correct' THEN 1 ELSE 0 END
        WHERE learner_id = ? AND concept_id = ?
    """, (outcome, learner_id, concept_id))
    db.commit()
    db.close()

    return {
        "logged": True,
        "stubborn_bug_detected": is_stubborn,
        "message": "High confidence error detected - may indicate stubborn bug" if is_stubborn else "Confidence logged"
    }


def tool_get_known_terms(args: dict) -> dict:
    """Get all known terms for a learner."""
    db = get_db()
    terms = db.execute("""
        SELECT term, definition FROM learner_term WHERE learner_id = ?
    """, (args['learner_id'],)).fetchall()
    db.close()

    return {
        "learner_id": args['learner_id'],
        "term_count": len(terms),
        "terms": [{"term": t['term'], "definition": t['definition']} for t in terms]
    }


# =============================================================================
# SRS Tool Implementations
# =============================================================================

def tool_get_due_reviews(args: dict) -> dict:
    """Get due reviews."""
    db = get_db()
    limit = min(args.get('limit', 1), 5)

    reviews = db.execute("""
        SELECT lc.concept_id, c.name, lc.contexts_applied
        FROM learner_concept lc
        LEFT JOIN concept c ON lc.concept_id = c.id
        WHERE lc.learner_id = ? AND lc.next_review_date <= datetime('now')
        ORDER BY lc.next_review_date
        LIMIT ?
    """, (args['learner_id'], limit)).fetchall()
    db.close()

    result_reviews = []
    for r in reviews:
        # Parse contexts_applied to get code snippet
        contexts = parse_json(r['contexts_applied'], [])
        code_snippet = contexts[0].get('code', '') if contexts else ''
        context = contexts[0].get('context', '') if contexts else ''
        result_reviews.append({
            "concept_id": r['concept_id'],
            "concept_name": r['name'],
            "code_snippet": code_snippet,
            "context": context
        })

    return {
        "due_count": len(result_reviews),
        "reviews": result_reviews
    }


def tool_log_review(args: dict) -> dict:
    """Log a review result and update FSRS state."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']
    outcome = args['outcome']
    confidence = args['confidence']

    # Simple FSRS-like scheduling (schema uses reps, not review_count)
    if outcome == 'correct':
        # Increase interval based on current reps count
        db.execute("""
            UPDATE learner_concept SET
                reps = COALESCE(reps, 0) + 1,
                next_review_date = datetime('now', '+' || (COALESCE(reps, 0) + 1) * 2 || ' days'),
                stability = MIN(COALESCE(stability, 1.0) * 1.5, 10.0),
                last_review_date = datetime('now')
            WHERE learner_id = ? AND concept_id = ?
        """, (learner_id, concept_id))
    else:
        # Reset to tomorrow, increment lapses
        db.execute("""
            UPDATE learner_concept SET
                next_review_date = datetime('now', '+1 day'),
                stability = MAX(COALESCE(stability, 1.0) * 0.5, 0.5),
                lapses = COALESCE(lapses, 0) + 1,
                last_review_date = datetime('now')
            WHERE learner_id = ? AND concept_id = ?
        """, (learner_id, concept_id))

    # Update stats in learner_concept (no separate review_log table needed)
    if outcome == 'correct':
        db.execute("""
            UPDATE learner_concept SET
                correct_attempts = COALESCE(correct_attempts, 0) + 1,
                total_attempts = COALESCE(total_attempts, 0) + 1,
                avg_response_time_ms = CASE
                    WHEN avg_response_time_ms IS NULL THEN ?
                    ELSE (avg_response_time_ms + ?) / 2
                END
            WHERE learner_id = ? AND concept_id = ?
        """, (args['response_time_ms'], args['response_time_ms'], learner_id, concept_id))
    else:
        db.execute("""
            UPDATE learner_concept SET
                total_attempts = COALESCE(total_attempts, 0) + 1,
                avg_response_time_ms = CASE
                    WHEN avg_response_time_ms IS NULL THEN ?
                    ELSE (avg_response_time_ms + ?) / 2
                END
            WHERE learner_id = ? AND concept_id = ?
        """, (args['response_time_ms'], args['response_time_ms'], learner_id, concept_id))

    # Update confidence history
    confidence_history = db.execute("""
        SELECT confidence_history FROM learner_concept
        WHERE learner_id = ? AND concept_id = ?
    """, (learner_id, concept_id)).fetchone()

    history = parse_json(confidence_history['confidence_history'] if confidence_history else None, [])
    history.append({'confidence': confidence, 'outcome': outcome, 'timestamp': now_iso()})
    # Keep last 20 entries
    if len(history) > 20:
        history = history[-20:]

    db.execute("""
        UPDATE learner_concept SET confidence_history = ?
        WHERE learner_id = ? AND concept_id = ?
    """, (json.dumps(history), learner_id, concept_id))

    db.commit()
    db.close()

    return {
        "logged": True,
        "outcome": outcome,
        "message": "Great!" if outcome == 'correct' else "We'll review this again soon."
    }


def tool_get_refactoring_challenge(args: dict) -> dict:
    """Get a refactoring challenge for a decayed concept."""
    return {
        "concept_id": args['concept_id'],
        "challenge": f"Refactor some code using {args['concept_id']} in your current project.",
        "message": "Apply this concept in a new context to reinforce learning."
    }


# =============================================================================
# Verification Tool Implementations
# =============================================================================

def tool_get_diagnostic_question(args: dict) -> dict:
    """Get a diagnostic question for a concept."""
    db = get_db()
    question = db.execute("""
        SELECT id, code_snippet, prompt, correct_answer, distractors
        FROM diagnostic_question WHERE concept_id = ?
        ORDER BY RANDOM() LIMIT 1
    """, (args['concept_id'],)).fetchone()
    db.close()

    if not question:
        return {
            "concept_id": args['concept_id'],
            "fallback": True,
            "prompt": f"Explain {args['concept_id']} in your own words."
        }

    distractors = parse_json(question['distractors'], [])
    options = [{"text": question['correct_answer'], "is_correct": True}]
    for d in distractors:
        options.append({
            "text": d.get('answer', ''),
            "misconception_id": d.get('misconception_id')
        })
    random.shuffle(options)

    return {
        "question_id": question['id'],
        "concept_id": args['concept_id'],
        "code_snippet": question['code_snippet'],
        "prompt": question['prompt'],
        "options": [o['text'] for o in options],
        "correct_answer": question['correct_answer']
    }


def tool_verify_concept(args: dict) -> dict:
    """Verify concept understanding."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']
    is_correct = args['is_correct']

    if is_correct:
        db.execute("""
            UPDATE learner_concept SET verified = 1, verified_at = datetime('now')
            WHERE learner_id = ? AND concept_id = ?
        """, (learner_id, concept_id))

    # Update session using subquery for SQLite compatibility
    db.execute("""
        UPDATE session SET concepts_verified = json_insert(concepts_verified, '$[#]', ?)
        WHERE id = (SELECT id FROM session WHERE learner_id = ? AND end_time IS NULL
                    ORDER BY start_time DESC LIMIT 1)
    """, (concept_id, learner_id))

    db.commit()
    db.close()

    return {
        "verified": is_correct,
        "needs_remediation": not is_correct,
        "misconception_id": args.get('misconception_id')
    }


def tool_get_contrasting_case(args: dict) -> dict:
    """Get contrasting case for misconception."""
    db = get_db()
    misc = db.execute("""
        SELECT contrasting_case FROM misconception WHERE id = ?
    """, (args['misconception_id'],)).fetchone()
    db.close()

    if not misc or not misc['contrasting_case']:
        return {"error": "No contrasting case available"}

    return {
        "misconception_id": args['misconception_id'],
        "contrasting_case": parse_json(misc['contrasting_case'], {})
    }


def tool_get_discrimination_question(args: dict) -> dict:
    """Get discrimination question for similar concepts."""
    db = get_db()
    concept = db.execute("SELECT cluster FROM concept WHERE id = ?", (args['concept_id'],)).fetchone()

    if not concept or not concept['cluster']:
        db.close()
        return {"error": "Concept not in a cluster"}

    similar = db.execute("""
        SELECT id, name FROM concept WHERE cluster = ? AND id != ? LIMIT 3
    """, (concept['cluster'], args['concept_id'])).fetchall()
    db.close()

    return {
        "concept_id": args['concept_id'],
        "similar_concepts": [{"id": s['id'], "name": s['name']} for s in similar],
        "prompt": f"What distinguishes {args['concept_id']} from these related concepts?"
    }


def tool_flag_stubborn_bug(args: dict) -> dict:
    """Flag a stubborn bug by adding to learner_concept.stubborn_misconceptions JSON array."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']
    misconception_id = args['misconception_id']

    # Get current stubborn misconceptions
    current = db.execute("""
        SELECT stubborn_misconceptions FROM learner_concept
        WHERE learner_id = ? AND concept_id = ?
    """, (learner_id, concept_id)).fetchone()

    misconceptions = parse_json(current['stubborn_misconceptions'] if current else None, [])

    # Add if not already present
    if misconception_id not in misconceptions:
        misconceptions.append(misconception_id)

        db.execute("""
            UPDATE learner_concept SET stubborn_misconceptions = ?
            WHERE learner_id = ? AND concept_id = ?
        """, (json.dumps(misconceptions), learner_id, concept_id))

    db.commit()
    db.close()

    return {
        "flagged": True,
        "count": len(misconceptions),
        "message": f"Stubborn bug flagged. {len(misconceptions)} total for this concept."
    }


def tool_log_diagnostic_result(args: dict) -> dict:
    """Log diagnostic result by updating learner_concept statistics."""
    db = get_db()
    learner_id = args['learner_id']
    concept_id = args['concept_id']

    # Update statistics in learner_concept
    if args['is_correct']:
        db.execute("""
            UPDATE learner_concept SET
                correct_attempts = COALESCE(correct_attempts, 0) + 1,
                total_attempts = COALESCE(total_attempts, 0) + 1,
                avg_response_time_ms = CASE
                    WHEN avg_response_time_ms IS NULL THEN ?
                    ELSE (avg_response_time_ms + ?) / 2
                END
            WHERE learner_id = ? AND concept_id = ?
        """, (args['response_time_ms'], args['response_time_ms'], learner_id, concept_id))
    else:
        db.execute("""
            UPDATE learner_concept SET
                total_attempts = COALESCE(total_attempts, 0) + 1,
                avg_response_time_ms = CASE
                    WHEN avg_response_time_ms IS NULL THEN ?
                    ELSE (avg_response_time_ms + ?) / 2
                END
            WHERE learner_id = ? AND concept_id = ?
        """, (args['response_time_ms'], args['response_time_ms'], learner_id, concept_id))

        # If incorrect and misconception detected, add to stubborn_misconceptions if high confidence
        if args.get('misconception_id') and args['confidence'] >= 4:
            current = db.execute("""
                SELECT stubborn_misconceptions FROM learner_concept
                WHERE learner_id = ? AND concept_id = ?
            """, (learner_id, concept_id)).fetchone()

            misconceptions = parse_json(current['stubborn_misconceptions'] if current else None, [])
            if args['misconception_id'] not in misconceptions:
                misconceptions.append(args['misconception_id'])
                db.execute("""
                    UPDATE learner_concept SET stubborn_misconceptions = ?
                    WHERE learner_id = ? AND concept_id = ?
                """, (json.dumps(misconceptions), learner_id, concept_id))

    db.commit()
    db.close()

    return {"logged": True, "is_correct": args['is_correct']}


def tool_get_remediation(args: dict) -> dict:
    """Get remediation strategy for misconception."""
    db = get_db()
    misc = db.execute("""
        SELECT name, description, remediation_strategy FROM misconception WHERE id = ?
    """, (args['misconception_id'],)).fetchone()
    db.close()

    if not misc:
        return {"error": "Misconception not found"}

    return {
        "misconception_id": args['misconception_id'],
        "name": misc['name'],
        "description": misc['description'],
        "strategy": misc['remediation_strategy']
    }


def tool_get_stubborn_bugs(args: dict) -> dict:
    """Get all stubborn bugs for a learner from learner_concept.stubborn_misconceptions."""
    db = get_db()

    # Get all concepts with stubborn misconceptions for this learner
    results = db.execute("""
        SELECT lc.concept_id, c.name as concept_name, lc.stubborn_misconceptions
        FROM learner_concept lc
        LEFT JOIN concept c ON c.id = lc.concept_id
        WHERE lc.learner_id = ? AND lc.stubborn_misconceptions != '[]'
    """, (args['learner_id'],)).fetchall()

    bugs = []
    for row in results:
        misconception_ids = parse_json(row['stubborn_misconceptions'], [])
        for misc_id in misconception_ids:
            # Get misconception details
            misc = db.execute("""
                SELECT name, remediation_strategy FROM misconception WHERE id = ?
            """, (misc_id,)).fetchone()

            bugs.append({
                "concept_id": row['concept_id'],
                "concept_name": row['concept_name'],
                "misconception_id": misc_id,
                "name": misc['name'] if misc else misc_id,
                "strategy": misc['remediation_strategy'] if misc else None
            })

    db.close()

    return {
        "count": len(bugs),
        "bugs": bugs
    }


# =============================================================================
# Sandbox Tool Implementations
# =============================================================================

def tool_trigger_sandbox(args: dict) -> dict:
    """Check if sandbox is needed for concept."""
    db = get_db()
    sandbox = db.execute("""
        SELECT id, problem_statement, setup_code, expected_failures, min_attempts, reflection_questions, teaching_transition
        FROM sandbox WHERE concept_id = ?
    """, (args['target_concept_id'],)).fetchone()
    db.close()

    if not sandbox:
        return {"needs_sandbox": False}

    return {
        "needs_sandbox": True,
        "sandbox_id": sandbox['id'],
        "problem_statement": sandbox['problem_statement'],
        "setup_code": sandbox['setup_code'],
        "expected_failures": parse_json(sandbox['expected_failures'], []),
        "min_attempts": sandbox['min_attempts'],
        "reflection_questions": parse_json(sandbox['reflection_questions'], []),
        "teaching_transition": sandbox['teaching_transition']
    }


def tool_evaluate_sandbox_attempt(args: dict) -> dict:
    """Evaluate a sandbox attempt."""
    # In a real implementation, this would analyze the code
    return {
        "sandbox_id": args['sandbox_id'],
        "evaluated": True,
        "failed_correctly": True,  # Would be determined by analysis
        "observation_quality": "good",
        "message": "Good observation! You've identified the core issue."
    }


def tool_log_sandbox_reflection(args: dict) -> dict:
    """Log sandbox reflection by updating the latest sandbox_attempt."""
    db = get_db()
    sandbox_id = args['sandbox_id']
    learner_id = args['learner_id']

    # Update the most recent sandbox_attempt with the articulation quality
    # Note: SQLite doesn't support ORDER BY in UPDATE, so we need to find the ID first
    latest = db.execute("""
        SELECT id FROM sandbox_attempt
        WHERE sandbox_id = ? AND learner_id = ?
        ORDER BY timestamp DESC LIMIT 1
    """, (sandbox_id, learner_id)).fetchone()

    if latest:
        db.execute("""
            UPDATE sandbox_attempt SET articulation_quality = ?
            WHERE id = ?
        """, (args['quality'], latest['id']))

    db.commit()
    db.close()

    return {"logged": True, "quality": args['quality']}


def tool_log_sandbox_attempt(args: dict) -> dict:
    """Log a sandbox attempt."""
    db = get_db()
    db.execute("""
        INSERT INTO sandbox_attempt (sandbox_id, learner_id, attempt_number, approach_description, outcome)
        VALUES (?, ?, ?, ?, ?)
    """, (args['sandbox_id'], args['learner_id'], args['attempt_number'],
          args['approach_description'], args['outcome']))
    db.commit()
    db.close()

    return {"logged": True, "attempt": args['attempt_number']}


def tool_get_sandbox_summary(args: dict) -> dict:
    """Get summary of sandbox attempts with reflection from latest attempt."""
    db = get_db()
    attempts = db.execute("""
        SELECT attempt_number, approach_description, outcome, articulation_quality
        FROM sandbox_attempt
        WHERE sandbox_id = ? AND learner_id = ?
        ORDER BY attempt_number
    """, (args['sandbox_id'], args['learner_id'])).fetchall()

    db.close()

    # Get reflection quality from the latest attempt
    reflection_quality = None
    if attempts and attempts[-1]['articulation_quality']:
        reflection_quality = attempts[-1]['articulation_quality']

    return {
        "sandbox_id": args['sandbox_id'],
        "attempt_count": len(attempts),
        "attempts": [
            {
                "number": a['attempt_number'],
                "approach": a['approach_description'],
                "outcome": a['outcome'],
                "has_reflection": bool(a['articulation_quality'])
            }
            for a in attempts
        ],
        "reflection_quality": reflection_quality,
        "message": f"Completed {len(attempts)} attempts" + (f" with {reflection_quality} reflection" if reflection_quality else "")
    }


# =============================================================================
# Emotional Tool Implementations
# =============================================================================

def tool_infer_emotional_state(args: dict) -> dict:
    """Infer emotional state from timing patterns."""
    timings = args['recent_timings']

    if not timings:
        return {"state": "unknown", "confidence": 0.0}

    # Simple heuristic based on response times
    avg_time = sum(t.get('timeSinceLastMs', 0) for t in timings) / len(timings)

    if avg_time < 5000:  # Quick responses
        state = "flow"
        confidence = 0.7
    elif avg_time < 30000:  # Normal
        state = "engaged"
        confidence = 0.6
    elif avg_time < 120000:  # Slow
        state = "struggling"
        confidence = 0.5
    else:  # Very slow
        state = "disengaged"
        confidence = 0.4

    return {
        "state": state,
        "confidence": confidence,
        "average_response_ms": avg_time,
        "suggested_action": "continue" if state == "flow" else "check in"
    }


def tool_log_message_timing(args: dict) -> dict:
    """Log message timing."""
    db = get_db()
    db.execute("""
        INSERT INTO message_timing (id, session_id, timestamp, gap_since_previous_ms,
                                   message_type, message_length, contains_help_request)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        generate_id('msg'), args['session_id'], args['timestamp'],
        args['gap_ms'], args['message_type'],
        args.get('message_length'), args.get('contains_help_request', False)
    ))
    db.commit()
    db.close()

    return {"logged": True}


def tool_should_prompt_questions(args: dict) -> dict:
    """Check if should prompt for questions."""
    db = get_db()
    patterns = db.execute("""
        SELECT sessions_without_questions, total_questions
        FROM learner_question_patterns WHERE learner_id = ?
    """, (args['learner_id'],)).fetchone()
    db.close()

    if not patterns:
        return {"should_prompt": False, "reason": "First session"}

    should = patterns['sessions_without_questions'] >= 2

    return {
        "should_prompt": should,
        "sessions_without_questions": patterns['sessions_without_questions'],
        "prompt_text": "What questions do you have? Even partial ones are valuable." if should else None
    }


def tool_log_learner_question(args: dict) -> dict:
    """Log a learner question."""
    db = get_db()

    # Update session
    question_entry = to_json({
        "timestamp": now_iso(),
        "text": args['question_text'],
        "type": args['question_type'],
        "prompted": args['prompted']
    })

    db.execute("""
        UPDATE session SET learner_questions = json_insert(learner_questions, '$[#]', json(?))
        WHERE id = ?
    """, (question_entry, args['session_id']))

    # Update patterns
    db.execute("""
        INSERT INTO learner_question_patterns (learner_id, total_questions, sessions_without_questions)
        VALUES (?, 1, 0)
        ON CONFLICT(learner_id) DO UPDATE SET
            total_questions = total_questions + 1,
            sessions_without_questions = 0
    """, (args['learner_id'],))

    db.commit()
    db.close()

    return {
        "logged": True,
        "is_why_question": args['question_type'] == 'why',
        "observation": "\"Why\" questions indicate deeper engagement!" if args['question_type'] == 'why' else "Question logged"
    }


def tool_log_emotional_checkin(args: dict) -> dict:
    """Log emotional check-in."""
    db = get_db()

    checkin_entry = to_json({
        "timestamp": now_iso(),
        "type": "explicit_checkin",
        "response": args['learner_response'],
        "state": args.get('inferred_state', 'unknown')
    })

    db.execute("""
        UPDATE session SET emotional_states = json_insert(emotional_states, '$[#]', json(?))
        WHERE id = ?
    """, (checkin_entry, args['session_id']))
    db.commit()
    db.close()

    state = args.get('inferred_state')
    return {
        "logged": True,
        "state": state or "noted",
        "recommendation": "Consider a break" if state in ('frustrated', 'tired') else "Continue normally"
    }


def tool_get_intervention(args: dict) -> dict:
    """Get intervention for emotional state."""
    scripts = {
        "flow": "Continue normally. Don't interrupt momentum.",
        "struggling": "This seems tough. Want to try a different approach?",
        "frustrated": "This seems frustrating. Want to take a break?",
        "disengaged": "You seem distracted. Everything okay?",
        "passive": "What questions do you have about this?"
    }

    return {
        "state": args['emotional_state'],
        "suggested_script": scripts.get(args['emotional_state'], "How are you doing?")
    }


def tool_get_question_patterns(args: dict) -> dict:
    """Get question patterns for a learner."""
    db = get_db()
    patterns = db.execute("""
        SELECT * FROM learner_question_patterns WHERE learner_id = ?
    """, (args['learner_id'],)).fetchone()
    db.close()

    if not patterns:
        return {"total_questions": 0, "analysis": "No data yet"}

    return {
        "total_questions": patterns['total_questions'],
        "sessions_without_questions": patterns['sessions_without_questions'],
        "concern": patterns['sessions_without_questions'] >= 2,
        "analysis": "Passive learner - prompt for questions" if patterns['sessions_without_questions'] >= 2 else "Active learner"
    }


# =============================================================================
# Track Tool Implementations
# =============================================================================

def tool_get_learning_tracks(args: dict) -> dict:
    """Get all learning tracks."""
    db = get_db()
    tracks = db.execute("""
        SELECT id, name, description, language, domain, difficulty
        FROM learning_track
    """).fetchall()
    db.close()

    return {
        "tracks": [
            {
                "id": t['id'],
                "name": t['name'],
                "description": t['description'],
                "language": t['language'],
                "domain": t['domain'],
                "difficulty": t['difficulty']
            }
            for t in tracks
        ]
    }


def tool_select_learning_track(args: dict) -> dict:
    """Select a learning track for a learner."""
    db = get_db()
    db.execute("""
        UPDATE learner SET current_track_id = ? WHERE id = ?
    """, (args['track_id'], args['learner_id']))
    db.commit()
    db.close()

    return {"success": True, "track_id": args['track_id']}


def tool_get_track_progress(args: dict) -> dict:
    """Get track progress for a learner."""
    db = get_db()

    learner = db.execute("""
        SELECT current_track_id FROM learner WHERE id = ?
    """, (args['learner_id'],)).fetchone()

    if not learner or not learner['current_track_id']:
        db.close()
        return {"error": "No track selected"}

    track_id = learner['current_track_id']

    # Get projects in track
    projects = db.execute("""
        SELECT pt.id, pt.name, p.status
        FROM project_template pt
        LEFT JOIN project p ON p.template_id = pt.id AND p.learner_id = ?
        WHERE pt.track_id = ?
        ORDER BY pt.sequence_order
    """, (args['learner_id'], track_id)).fetchall()

    completed = sum(1 for p in projects if p['status'] == 'completed')
    db.close()

    return {
        "track_id": track_id,
        "total_projects": len(projects),
        "completed_projects": completed,
        "progress_percent": int(completed / len(projects) * 100) if projects else 0,
        "projects": [
            {"id": p['id'], "name": p['name'], "status": p['status'] or 'not_started'}
            for p in projects
        ]
    }


# =============================================================================
# Chat History Tool Implementations
# =============================================================================

def tool_log_chat_message(args: dict) -> dict:
    """Log a chat message."""
    db = get_db()
    db.execute("""
        INSERT INTO chat_message (id, session_id, timestamp, role, content, tool_calls, tool_results, tokens_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        generate_id('chat'), args['session_id'], now_iso(),
        args['role'], args['content'],
        to_json(args.get('tool_calls')) if args.get('tool_calls') else None,
        to_json(args.get('tool_results')) if args.get('tool_results') else None,
        args.get('tokens_used')
    ))
    db.commit()
    db.close()

    return {"logged": True}


def tool_get_chat_history(args: dict) -> dict:
    """Get chat history for a session."""
    db = get_db()

    query = "SELECT * FROM chat_message WHERE session_id = ?"
    params = [args['session_id']]

    if args.get('role_filter'):
        query += " AND role = ?"
        params.append(args['role_filter'])

    if args.get('since_timestamp'):
        query += " AND timestamp > ?"
        params.append(args['since_timestamp'])

    query += " ORDER BY timestamp ASC"

    if args.get('limit'):
        query += " LIMIT ?"
        params.append(args['limit'])

    messages = db.execute(query, params).fetchall()
    db.close()

    return {
        "session_id": args['session_id'],
        "message_count": len(messages),
        "messages": [
            {
                "id": m['id'],
                "timestamp": m['timestamp'],
                "role": m['role'],
                "content": m['content'],
                "tool_calls": parse_json(m['tool_calls'], None),
                "tool_results": parse_json(m['tool_results'], None)
            }
            for m in messages
        ]
    }
