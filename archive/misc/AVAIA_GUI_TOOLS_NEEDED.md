# Avaia GUI Tools Analysis
## Missing Frontend Views for Existing Backend Endpoints

**Generated:** 2026-01-18
**Engineer Feedback Document**

---

## Executive Summary

After thorough analysis of `/Users/Star/avaia` (backend MCP tools) and `/Users/Star/avaia-LANDING` (landing page), I've identified **53 MCP backend tools** that have NO corresponding GUI views, yet contain rich data perfect for visualization and learner interaction.

The landing page currently has:
- Home page (marketing)
- Science page (pedagogy explanations)
- Docs page (integration guide)
- Curriculum page (track overview)
- ProductDemo component (simulated UI, not real data)

**What's missing:** An actual **Learner Dashboard** that consumes real data from the MCP backend.

---

## 🔴 CRITICAL MISSING TOOL: `get_learner_analytics()`

### Problem
User explicitly requested visibility into:
- Total time spent learning
- Concepts learned vs concepts to learn
- Projects built
- Tracks taken
- Progress metrics

### Current State
**NO TOOL EXISTS** to aggregate this historical data. Individual data exists across:
- `session` table (time tracking)
- `learner_concept` table (concepts)
- `project` table (projects)
- `learning_track` + learner's `current_track_id`

But there's **no unified analytics endpoint**.

### Required Tool Spec

```typescript
get_learner_analytics(learner_id: string, time_range?: string)

Returns:
{
  time_metrics: {
    total_sessions: number,
    total_time_minutes: number,
    avg_session_length: number,
    streak_days: number,
    last_session_date: string
  },

  concept_metrics: {
    concepts_introduced: number,
    concepts_mastered: number,  // verified=true
    concepts_learning: number,  // verified=false
    concepts_due_review: number,
    weak_concepts: Array<{id, name, reason}>,
    known_terms_count: number
  },

  project_metrics: {
    projects_completed: Array<{id, name, completed_at}>,
    projects_in_progress: Array<{id, name, progress_pct}>,
    total_milestones_completed: number
  },

  track_metrics: {
    current_track: {id, name, progress_pct},
    projects_in_track: number,
    projects_completed_in_track: number,
    estimated_hours_remaining: number
  },

  learning_health: {
    independence_score: number,  // weighted average across concepts
    question_asking_rate: number,  // avg questions per session
    verification_pass_rate: number,  // correct_attempts / total_attempts
    stubborn_bugs_count: number,
    review_completion_rate: number  // SRS discipline
  }
}
```

### Why This Matters
Without this tool, learners have:
- ❌ No visibility into their progress
- ❌ No motivation from seeing growth
- ❌ No way to identify weak areas
- ❌ No data to share in portfolios/resumes

---

## 📊 Tools with Data That NEED GUI Views

### Category 1: **Session & Progress Tracking**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `start_session()` | Returns check-in data (reviews, bugs, state) | **Session Dashboard** - Welcome screen showing what's due, what to focus on |
| `get_project_state()` | Returns current project + milestone | **Project Progress Card** - Visual milestone tracker with progress bar |
| `get_next_step()` | Determines priority (bugs/reviews/milestone) | **Smart To-Do Widget** - Prioritized action items |
| `end_session()` | Logs session with notes | **Session Summary Modal** - What you accomplished, what's next |
| `get_exit_ticket()` | End-of-session quiz | **Exit Ticket UI** - Quick diagnostic before leaving |
| `get_session_summary()` | Complete session recap | **Session History View** - Timeline of all past sessions |

### Category 2: **Spaced Repetition (SRS)**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `get_due_reviews()` | Concepts needing review | **Review Queue** - Flashcard-style interface with code snippets |
| `log_review()` | Updates FSRS after review | *(Backend only, triggers next review calculation)* |
| `get_refactoring_challenge()` | Cross-project exercise for decay | **Challenge Card** - Prompt to apply old concept in current project |

**GUI Concept:** "Daily Review" tab that shows due concepts with their code snippets, lets learner answer, and marks complete.

### Category 3: **Concepts & Learning**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `introduce_concept()` | Logs new concept taught | **Concept Timeline** - Visual history of what was learned when |
| `get_known_terms()` | Returns vocabulary learned | **Vocabulary List** - Searchable glossary with definitions |
| `get_hint()` | Adaptive hint based on independence | **Hint Panel** - Shows hint level and guidance |
| `log_help_request()` | Updates independence score | *(Triggers score update, reflected in dashboard)* |
| `get_prerequisites()` | Shows required concepts | **Concept Graph** - Visual dependency tree |
| `get_weak_prerequisites()` | Checks readiness | **Readiness Indicator** - Traffic light for concept readiness |
| `get_visualization()` | Returns learning resources | **Resource Panel** - Embedded diagrams/videos for concepts |
| `log_confidence()` | Records self-assessment | **Confidence Tracker** - Chart showing confidence over time |

**GUI Concept:** "My Learning" page with:
- Concept cards (learned, learning, to-learn)
- Vocabulary list
- Dependency graph visualization
- Confidence/independence scores

### Category 4: **Verification & Diagnostics**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `get_diagnostic_question()` | Generates quiz from learner's code | **Inline Quiz** - Multiple choice embedded in conversation |
| `verify_concept()` | Logs verification attempt | **Verification Badge** - Visual checkmark when concept verified |
| `get_contrasting_case()` | Shows buggy vs fixed code | **Split-Screen Comparison** - Side-by-side code diff |
| `get_discrimination_question()` | Compares similar concepts | **Concept Comparison Card** - "When to use X vs Y" |
| `get_remediation()` | Targeted fix for misconception | **Remediation Modal** - Focused explanation with examples |
| `get_stubborn_bugs()` | Lists persistent errors | **Bug Tracker** - Red flags for high-confidence mistakes |
| `flag_stubborn_bug()` | Schedules accelerated review | *(Backend scheduling, reflected in review queue)* |
| `log_diagnostic_result()` | Records quiz outcome | *(Data logging for analytics)* |

**GUI Concept:** "Verification Center" showing:
- Concepts awaiting verification
- Recent diagnostic results
- Stubborn bugs needing attention
- Contrasting cases for review

### Category 5: **Sandbox (Productive Failure)**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `trigger_sandbox()` | Checks if sandbox required | **Sandbox Alert** - "Before we continue, try this challenge..." |
| `evaluate_sandbox_attempt()` | Validates failure pattern | **Attempt Feedback** - "Good failure! Try 2 more approaches." |
| `log_sandbox_attempt()` | Records individual attempt | **Attempt History** - List of approaches tried |
| `log_sandbox_reflection()` | Records learner's insight | **Reflection Form** - Text area for "Why did this fail?" |
| `get_sandbox_summary()` | Shows all attempts | **Sandbox Summary View** - Compare all attempts before teaching |

**GUI Concept:** "Sandbox Mode" - Special UI state where learner:
1. Sees problem statement
2. Submits attempts (code + observation)
3. Gets feedback ("try again" or "good, try different approach")
4. Reflects on failures
5. Transitions to teaching

### Category 6: **Emotional State & Engagement**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `get_current_time()` | Returns timestamp | *(Utility, no GUI needed)* |
| `infer_emotional_state()` | Detects frustration/disengagement | **Mood Indicator** - Emoji showing detected state |
| `log_message_timing()` | Tracks response delays | *(Data collection for emotion inference)* |
| `log_emotional_checkin()` | Records explicit check-in | **Check-In Widget** - "How are you feeling?" |
| `should_prompt_questions()` | Detects passive learning | **Engagement Nudge** - "You haven't asked questions. Curious about anything?" |
| `log_learner_question()` | Tracks question patterns | **Question History** - Shows engagement over time |
| `get_intervention()` | Suggests script for state | **Coach Message** - Contextual encouragement |
| `get_question_patterns()` | Analyzes questioning behavior | **Engagement Analytics** - Chart of question frequency |

**GUI Concept:** Subtle emotional awareness:
- Mood indicator in corner
- Occasional check-ins
- Adaptive messaging based on state
- Engagement metrics in analytics

### Category 7: **Track & Curriculum**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `get_learning_tracks()` | Lists available curricula | **Track Selector** - Cards showing tracks (already exists in landing) |
| `select_learning_track()` | Assigns track to learner | **Track Onboarding** - "Welcome to JavaScript Fundamentals!" |
| `get_track_progress()` | Shows completion status | **Track Progress Bar** - X/Y projects complete |
| `start_project()` | Begins new project | **Project Kickoff** - Description, milestones, estimated hours |
| `advance_milestone()` | Marks milestone complete | **Milestone Celebration** - Animation + "You completed X!" |
| `generate_learning_track()` | Creates custom curriculum from prompt | **Track Generator UI** - Form to request custom learning path |
| `seed_dynamic_track()` | Saves generated track to database | *(Backend seeding, no GUI needed)* |

**GUI Concept:** "My Track" page showing:
- Current track name and progress
- Project cards (completed, current, upcoming)
- Milestone checklist for current project
- Estimated time remaining

### Category 8: **Profile & Preferences**

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `create_learner()` | Initializes profile | **Signup/Onboarding Flow** |
| `get_learner_profile()` | Returns preferences | **Profile Page** - Name, preferences, stats |
| `complete_onboarding()` | Finishes setup | **Onboarding Complete Screen** |
| `update_learning_preferences()` | Updates teaching style flags | **Preferences Panel** - Toggle switches for learning style |

### Category 9: **Chat History** (New)

| Tool | Current Use | GUI View Needed |
|------|-------------|----------------|
| `log_chat_message()` | Records conversation messages | *(Backend logging for context)* |
| `get_chat_history()` | Retrieves past conversations | **Chat History View** - Scrollable conversation archive with search |

---

## 🎨 Proposed GUI Structure

### Main Dashboard (New - DOES NOT EXIST)

```
┌─────────────────────────────────────────────────────────┐
│  Avaia Dashboard                         [Profile] [⚙️]  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  📊 YOUR STATS (get_learner_analytics)                   │
│  ────────────────────────────────────────────────────   │
│  🔥 3 day streak  |  ⏱️  12h 45m total  |  🎯 24 concepts │
│                                                           │
│  📚 CURRENT PROJECT (get_project_state)                  │
│  ────────────────────────────────────────────────────   │
│  Task Tracker App                   ████████░░ 80%       │
│  Milestone 4/5: Add delete functionality                 │
│  [Continue Building →]                                    │
│                                                           │
│  🔄 DUE TODAY (get_due_reviews)                          │
│  ────────────────────────────────────────────────────   │
│  • forEach loops (from Calculator project)               │
│  • Event listeners (from Todo List)                      │
│  [Start Reviews →]                                        │
│                                                           │
│  ⚠️  STUBBORN BUGS (get_stubborn_bugs)                   │
│  ────────────────────────────────────────────────────   │
│  • Async timing misconception (high confidence error)    │
│  [Review Now]                                             │
│                                                           │
└─────────────────────────────────────────────────────────┘

Navigation:
[Dashboard] [My Learning] [Projects] [Reviews] [Profile]
```

### My Learning Page (New)

```
┌─────────────────────────────────────────────────────────┐
│  My Learning                                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  📈 Concept Mastery: 24 / 45                             │
│                                                           │
│  MASTERED (24)           LEARNING (3)         TO LEARN   │
│  ✅ Variables            📚 Callbacks          □ Promises│
│  ✅ Functions            📚 Array methods      □ Async   │
│  ✅ Loops                📚 Event delegation   □ Fetch   │
│  [See all →]             [Practice]            [Preview] │
│                                                           │
│  📚 VOCABULARY: 45 terms learned                         │
│  [View Glossary]                                          │
│                                                           │
│  🎯 INDEPENDENCE SCORE: 67/100 (Growing!)                │
│  💡 Question Rate: High engagement ✓                     │
│  ✔️  Verification Pass: 82%                              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Review Session (New)

```
┌─────────────────────────────────────────────────────────┐
│  Daily Review - 2 concepts due                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Concept: forEach loops                                  │
│  From: Calculator project, handleNumbers function        │
│                                                           │
│  ┌───────────────────────────────────────────┐          │
│  │ const numbers = [1, 2, 3, 4];             │          │
│  │ numbers.forEach(num => {                  │          │
│  │   console.log(num * 2);                   │          │
│  │ });                                       │          │
│  └───────────────────────────────────────────┘          │
│                                                           │
│  What does this code output?                             │
│                                                           │
│  [ ] A) [2, 4, 6, 8]                                    │
│  [ ] B) undefined                                        │
│  [ ] C) 2 4 6 8 (printed line by line)                  │
│  [ ] D) [1, 2, 3, 4]                                    │
│                                                           │
│  Confidence: [1] [2] [3] [4] [5]                        │
│  [Submit Answer]                                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Project Progress (New)

```
┌─────────────────────────────────────────────────────────┐
│  JavaScript Fundamentals Track                           │
│  Progress: ██████░░░░ 60% (3/5 projects)                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ✅ Calculator                2h 30m     [View Code]     │
│  ✅ Todo List                 3h 15m     [View Code]     │
│  ✅ Weather App               4h 00m     [View Code]     │
│                                                           │
│  🔄 Task Tracker (Current)    2h 45m / ~5h               │
│     ✅ Milestone 1: Setup project                        │
│     ✅ Milestone 2: Add task form                        │
│     ✅ Milestone 3: Display tasks                        │
│     ✅ Milestone 4: Mark complete                        │
│     ⬜ Milestone 5: Delete tasks  ← You are here         │
│     [Continue →]                                          │
│                                                           │
│  ⬜ Chat App (Next)            Est. 6h                   │
│     Build real-time messaging with WebSockets            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Priority

### Phase 1: Core Analytics (HIGHEST PRIORITY)
1. **NEW TOOL:** `get_learner_analytics()` backend endpoint
2. Dashboard page consuming this data
3. Basic stats cards (time, concepts, projects)

### Phase 2: Session Flow
4. Enhanced start_session UI (check-in screen)
5. Exit ticket modal
6. Session summary view

### Phase 3: Learning Views
7. My Learning page (concepts + vocabulary)
8. Review queue interface
9. Concept graph visualization

### Phase 4: Engagement Features
10. Emotional state indicators
11. Engagement analytics
12. Sandbox mode UI

---

## 📁 Suggested File Structure

```
avaia-dashboard/ (new web app)
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx          (main landing after login)
│   │   ├── MyLearning.tsx         (concept mastery view)
│   │   ├── Projects.tsx           (track + project progress)
│   │   ├── Reviews.tsx            (SRS flashcard interface)
│   │   └── Profile.tsx            (learner settings)
│   │
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ConceptChart.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   ├── session/
│   │   │   ├── CheckInPanel.tsx
│   │   │   ├── ExitTicket.tsx
│   │   │   └── SessionSummary.tsx
│   │   │
│   │   ├── learning/
│   │   │   ├── ConceptCard.tsx
│   │   │   ├── VocabularyList.tsx
│   │   │   └── PrerequisiteGraph.tsx
│   │   │
│   │   ├── review/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── DiagnosticQuestion.tsx
│   │   │   └── ContrastingCase.tsx
│   │   │
│   │   └── sandbox/
│   │       ├── SandboxChallenge.tsx
│   │       ├── AttemptList.tsx
│   │       └── ReflectionForm.tsx
│   │
│   └── lib/
│       └── avaia-api.ts          (MCP client wrapper)
```

---

## 🔧 Integration Notes

### Current Landing Page
- Keep as marketing site
- Add "Get Started" → Dashboard link after auth
- Landing stays at `/` (marketing)
- Dashboard at `/dashboard` (post-auth)

### Authentication
- Landing page has no auth (public)
- Dashboard requires learner_id
- Suggest: Add simple auth (OAuth or email/password)

### Data Flow
```
Frontend (React)
  → MCP Client (WebSocket/HTTP)
    → Avaia MCP Server (existing tools)
      → SQLite Database (existing schema)
```

No backend changes needed if you implement MCP client in frontend!

---

## 💡 Key Insights

1. **The data is already there** - You have 53 tools collecting rich data
2. **No unified analytics** - Missing `get_learner_analytics()` aggregation
3. **No visual interface** - ProductDemo is fake UI, not real data
4. **Strong foundation** - Backend architecture is solid, just needs frontend

---

## Next Steps for Engineers

1. ✅ Decide: New dashboard app or add to landing?
2. ✅ Implement `get_learner_analytics()` tool first
3. ✅ Build basic Dashboard consuming that tool
4. ✅ Iterate on other views based on user feedback

---

**Questions?** Ask the user (daramola) which views are most valuable first.

---

## 📋 Complete Tool Inventory

### Actual Tool Count: **53 Tools**

**Breakdown by file:**

#### content.ts (8 tools)
1. introduce_concept
2. get_hint
3. log_help_request
4. get_prerequisites
5. get_weak_prerequisites
6. get_visualization
7. log_confidence
8. get_known_terms

#### project.ts (9 tools)
9. get_project_state
10. start_session
11. advance_milestone
12. get_next_step
13. create_learner
14. get_learner_profile
15. complete_onboarding
16. start_project
17. update_learning_preferences

#### sandbox.ts (5 tools)
18. trigger_sandbox
19. evaluate_sandbox_attempt
20. log_sandbox_reflection
21. log_sandbox_attempt
22. get_sandbox_summary

#### session.ts (14 tools)
23. get_current_time
24. infer_emotional_state
25. log_message_timing
26. log_session
27. end_session
28. get_exit_ticket
29. should_prompt_questions
30. log_learner_question
31. log_emotional_checkin
32. get_intervention
33. get_session_summary
34. get_question_patterns
35. log_chat_message
36. get_chat_history

#### srs.ts (3 tools)
37. get_due_reviews
38. log_review
39. get_refactoring_challenge

#### track.ts (5 tools)
40. get_learning_tracks
41. select_learning_track
42. get_track_progress
43. generate_learning_track
44. seed_dynamic_track

#### verify.ts (9 tools)
45. get_diagnostic_question
46. verify_concept
47. get_contrasting_case
48. get_discrimination_question
49. flag_stubborn_bug
50. log_diagnostic_result
51. log_exit_ticket_result
52. get_remediation
53. get_stubborn_bugs

**Tools requiring GUI views:** 40+ (excluding pure backend logging tools)
**Tools that are pure backend logging:** ~10-13 (log_review, log_help_request, log_confidence, etc.)

**Critical missing tool:** `get_learner_analytics()` - needs to be created
