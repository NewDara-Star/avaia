```markdown
# Avaia GUI Tool Trigger Map

## Tool Categories & Triggers

### 1. SESSION MANAGEMENT (Always Available)

**start_session**
- **Trigger**: GUI app launch
- **Who calls**: GUI automatically on page load
- **Returns**: Session ID, learner state, items due for review
- **Next action**: Display welcome + "X concepts due for review"

**end_session**
- **Trigger**: User says "goodnight" / "done" / "bye" OR closes GUI
- **Who calls**: AI detects phrase OR GUI window.beforeunload
- **Returns**: Session summary, streak status
- **Next action**: Show summary card, schedule next session reminder

**get_project_state**
- **Trigger**: Session start OR user asks "where am I?" OR AI needs context
- **Who calls**: AI when generating next step
- **Returns**: 
  ```json
  {
    "project_id": 1,
    "project_name": "Memory Game",
    "current_milestone": "Card Flip Logic",
    "concepts_active": ["setTimeout", "classList"],
    "concepts_due": ["variables", "functions"],
    "time_on_milestone": "45min",
    "stuck_count": 2,
    "last_sandbox_at": "2026-01-18T10:30:00Z"
  }
  ```
- **Next action**: AI uses this to contextualize all responses

**advance_milestone**
- **Trigger**: AI confirms learner completed milestone requirements
- **Who calls**: AI after successful deployment + concept verification
- **Returns**: New milestone unlocked, new concepts introduced
- **Next action**: Celebration message + schedule reviews for new concepts

---

### 2. SPACED REPETITION (AI-Initiated, Time-Based)

**get_due_reviews**
- **Trigger**: Session start OR every 30 minutes during active session
- **Who calls**: AI checks if reviews are due
- **Returns**: List of concepts due for review with stability scores
- **Next action**: AI weaves review into conversation ("Before we continue, quick check: explain event loop")

**log_review**
- **Trigger**: After learner answers a review question
- **Who calls**: AI after parsing learner's explanation
- **Parameters**: concept_id, quality (1-5 scale), response_time
- **Returns**: Updated FSRS stability, next review date
- **Next action**: Continue building OR trigger another review if multiple due

**Example Flow**:
```
[30 minutes into coding session]
AI: get_due_reviews() 
    → Returns: ["event loop", "hoisting"]
AI: "Before we add that feature, quick review: What happens when setTimeout 
     delay is 0? Why doesn't it execute immediately?"
User: [explains]
AI: log_review(concept_id=12, quality=4, response_time=23s)
    → Next review: 3 days from now
AI: "Correct. Now back to your feature..."
```

---

### 3. PRODUCTIVE FAILURE (AI-Initiated, Before Complex Concepts)

**trigger_sandbox**
- **Trigger**: AI detects learner about to learn complex concept (event loop, closures, async)
- **Who calls**: AI preemptively before teaching
- **Returns**: Sandbox exercise instructions (code prediction task)
- **Next action**: Learner attempts, fails, THEN AI teaches concept

**Example Flow**:
```
User: "How do I make these cards flip back after 1 second?"
AI: get_project_state() 
    → Detects: about to teach setTimeout + event loop (flagged as complex)
AI: trigger_sandbox(concept="event loop", learner_code=<user's code>)
    → Returns: "Predict output: console.log('A'); setTimeout(() => 
       console.log('B'), 0); console.log('C');"
User: "A, B, C"
AI: "Try running it in your console."
User: "Wait, it's A, C, B?"
AI: "Exactly. Now let me explain WHY..." [teaches event loop]
```

**When NOT to trigger**:
- Concept already reviewed successfully in last 7 days
- Learner explicitly says "I know this, skip the exercise"
- Simple concepts (variables, if/else)

---

### 4. DIAGNOSTIC ASSESSMENT (AI-Initiated, After Teaching)

**get_diagnostic_question**
- **Trigger**: Immediately after AI teaches a complex concept
- **Who calls**: AI (mandatory, not optional)
- **Returns**: Code prediction task based on learner's actual code
- **Next action**: Learner answers, AI evaluates, logs review

**Example Flow**:
```
AI: [Finishes explaining event loop using user's card game code]
AI: get_diagnostic_question(concept="event loop", learner_code=<snippet>)
    → Returns: "In your card game, if user clicks 3 cards rapidly during the 
       setTimeout delay, what happens to firstCard and secondCard variables?"
User: [answers]
AI: [Evaluates] → Correct? log_review(quality=5) : get_remediation()
```

**Key difference from `trigger_sandbox`**:
- Sandbox = BEFORE teaching (failure is the point)
- Diagnostic = AFTER teaching (verification)

**get_remediation**
- **Trigger**: Learner fails diagnostic question
- **Who calls**: AI after wrong answer to diagnostic
- **Returns**: Targeted fix instruction (re-explain with different analogy)
- **Next action**: Retry diagnostic OR simplify and move on

---

### 5. ADAPTIVE SCAFFOLDING (User-Initiated, Contextual)

**get_hint**
- **Trigger**: User says "I'm stuck" / "help" / "hint" OR 10+ min idle on same code
- **Who calls**: User explicitly OR AI after detecting prolonged struggle
- **Returns**: Hint at appropriate independence level (1=tell answer, 5=Socratic nudge)
- **Next action**: Learner tries again, AI watches for progress

**Hint Level Calculation**:
```javascript
// AI decides hint level based on:
- Time on task (>20min → more direct)
- Stuck count (3rd time stuck → more direct)
- Concept difficulty (event loop → more support)
- Recent frustration signals (ugh, aargh → more support)

Level 1: "Add isChecking = false after the setTimeout callback"
Level 3: "What happens to your isChecking variable inside the setTimeout?"
Level 5: "Walk me through what happens when the user clicks during the delay"
```

**infer_emotional_state**
- **Trigger**: AI detects patterns suggesting frustration/disengagement
- **Who calls**: AI monitoring during session
- **Signals**:
  - Rapid "undo" actions (10+ in 2 minutes)
  - Long idle periods (8+ minutes)
  - Frustrated language ("ugh", "wtf", "this is stupid")
  - Declining response times (used to answer in 30s, now taking 5min)
- **Returns**: Emotional state label + suggested intervention
- **Next action**: AI offers break, simpler task, or encouragement

**Example Flow**:
```
[User makes 12 rapid edits, all failing]
AI: infer_emotional_state()
    → Returns: "frustration - stuck on async timing"
AI: "I notice you've been wrestling with this for a while. Want to take a 
     step back and tackle a simpler version first, or would a hint help?"
```

---

### 6. CHAT HISTORY (Passive Logging, Debugging)

**get_chat_history**
- **Trigger**: AI needs context from earlier in session OR user asks "what did we discuss?"
- **Who calls**: AI when confused or user requests recap
- **Returns**: Last N messages with timestamps
- **Next action**: AI refreshes context and continues

**Note**: GUI auto-logs all messages, so AI doesn't need to call `log_chat_message` manually.

---

## Tool Call Frequency (Expected)

| Tool | Calls/Session | When |
|------|---------------|------|
| start_session | 1 | Session start |
| get_project_state | 3-5 | Contextual checks |
| get_due_reviews | 2-3 | Every 30min |
| trigger_sandbox | 0-1 | Before complex concepts |
| get_diagnostic_question | 2-4 | After teaching |
| get_hint | 1-3 | When stuck |
| infer_emotional_state | 0-2 | If struggle detected |
| log_review | 5-8 | After every review/diagnostic |
| advance_milestone | 0-1 | When milestone complete |
| end_session | 1 | Session end |

**Total calls per 1-hour session: ~20-30**

---

## Decision Tree for AI

```
SESSION START
├─ start_session() → Get learner state
├─ get_due_reviews() → Any reviews pending?
│  ├─ YES → Weave review into conversation
│  └─ NO → Continue
└─ get_project_state() → Load context

DURING CODING
├─ User asks question about new concept
│  ├─ Is concept complex? (event loop, closures, async)
│  │  ├─ YES → trigger_sandbox() → Let them fail → Teach
│  │  └─ NO → Teach directly
│  └─ After teaching → get_diagnostic_question() → Verify
│     ├─ Correct → log_review(quality=4-5)
│     └─ Wrong → get_remediation() → Retry
│
├─ User says "I'm stuck"
│  └─ get_hint(level=auto-calculated)
│
├─ Long idle (8+ min) OR frustrated language
│  └─ infer_emotional_state() → Offer intervention
│
└─ Every 30 minutes → get_due_reviews() → Check for reviews

MILESTONE COMPLETE
└─ advance_milestone() → Unlock next, schedule reviews

SESSION END
└─ end_session() → Summary + streak update
```

---

## Anti-Patterns to Avoid

❌ **Calling `get_diagnostic_question` before teaching**
   - Use `trigger_sandbox` for pre-teaching failure

❌ **Calling `get_hint` without checking if learner actually tried**
   - Ask "What have you tried?" first

❌ **Calling `log_review` without quality assessment**
   - AI must evaluate answer, not trust learner self-assessment

❌ **Calling `infer_emotional_state` every message**
   - Only when clear signals appear (idle, frustration language, rapid edits)

❌ **Calling `get_due_reviews` every 5 minutes**
   - Too disruptive, max every 30 minutes

---

## GUI Integration Points

### Auto-Triggered by GUI
- `start_session` on page load
- `end_session` on window close
- Chat message logging (no AI call needed)

### Triggered by User Input
- "I'm stuck" → AI calls `get_hint`
- "I get it" → AI calls `get_diagnostic_question`
- "Goodnight" → AI calls `end_session`

### Triggered by AI Logic
- Complex concept detected → `trigger_sandbox`
- Teaching complete → `get_diagnostic_question`
- 30min elapsed → `get_due_reviews`
- Frustration detected → `infer_emotional_state`

---

## Next Steps

1. **Implement semantic trigger phrase detection** in GUI
   - Parse user input for "stuck", "help", "I get it", etc.
   - Append hint to AI context: `[USER_SIGNAL: stuck]`

2. **Add idle detection** in GUI
   - Track time since last user message
   - After 8min idle → Append: `[IDLE_TIME: 8min]`

3. **Add rapid edit detection** (future)
   - Track file save frequency
   - If 10+ saves in 2min → Append: `[RAPID_EDITS: frustrated]`

4. **Test trigger accuracy**
   - Log every tool call for 1 week
   - Review: Are tools being called at right moments?
   - Adjust thresholds (idle time, review frequency, etc.)
```

**Key insight from this mapping**: Your tools fall into two groups:

1. **Reactive** (user/AI triggers during session) - These need trigger detection
2. **Proactive** (time-based, scheduled) - These need background timers

The GUI needs to detect signals (idle time, frustration language, "I'm stuck") and pass them to the AI as context, NOT by calling tools directly. The AI interprets signals and decides which tool to call.

Does this map clarify which tools you actually need and when they should fire?