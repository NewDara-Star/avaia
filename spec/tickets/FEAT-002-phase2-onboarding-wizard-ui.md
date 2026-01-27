# FEAT-002-P2: Onboarding Wizard UI

**Priority:** P0 (Critical Blocker)
**Status:** NOT STARTED
**Created:** 2026-01-27
**Feature ID:** FEAT-002
**Phase:** 2 of 3
**Depends On:** Phase 1 (API Key Storage)

---

## Context

The backend can securely store and test API keys (Phase 1), but users have no way to enter one. This phase builds the step-by-step wizard that guides a non-technical parent through getting an Anthropic API key — from creating an account to pasting the key and seeing "Connected!"

**What the user experiences:** After creating their first profile, a friendly wizard walks them through 4 steps. By the end, the app is connected to Claude and ready for learning.

---

## Technical Tasks

### Task 2.1: Create Wizard Container Component
**File:** `src/features/api-key/components/OnboardingWizard.tsx` (NEW)

**Actions:**
1. Multi-step wizard with progress indicator (Step 1/4, 2/4, etc.)
2. State machine: INTRO → SIGNUP → PASTE_KEY → TEST → DONE
3. Back/Next navigation
4. Cannot skip (enforced by PRD)
5. Renders inside the main app area when no valid API key exists

**AC:**
- [ ] Wizard shows when `apiKey.has()` returns false
- [ ] Progress bar shows current step
- [ ] Back button works (except on Step 1)
- [ ] Cannot be dismissed/skipped

---

### Task 2.2: Step 1 — Introduction
**Component:** Part of OnboardingWizard

**What the user sees:**
- Heading: "Connect to Claude AI"
- Explanation: "You'll need an Anthropic account. This costs about $2-8/month for heavy use."
- Reassuring tone for non-technical parents
- "Next" button

**AC:**
- [ ] Clear, non-scary language
- [ ] Cost transparency ($2-8/month)
- [ ] Next button advances to Step 2

---

### Task 2.3: Step 2 — Account Signup
**Component:** Part of OnboardingWizard

**What the user sees:**
- Instructions to create an Anthropic account
- Button: "Open Anthropic Console" (opens browser via `shell.openExternal`)
- Visual guide/screenshot showing where to click "Create Key"
- "I've created my key" button to advance

**AC:**
- [ ] Opens `https://console.anthropic.com/settings/keys` in default browser
- [ ] User can return to app and proceed
- [ ] Visual guidance included (screenshot or illustration)

---

### Task 2.4: Step 3 — Paste Key
**Component:** Part of OnboardingWizard

**What the user sees:**
- Text input with placeholder `sk-ant-...`
- "Test Connection" button
- Loading state while testing
- Success or error feedback

**Actions:**
1. Input validates format client-side (`sk-ant-` prefix)
2. "Test Connection" calls `window.__mainApi.apiKey.test(key)`
3. On success: auto-advance to Step 4
4. On failure: show error with retry option

**AC:**
- [ ] Input masks/hides key after a few characters (security UX)
- [ ] Format validation before testing (saves API call)
- [ ] Loading spinner during test
- [ ] Clear error messages (invalid key, no internet, etc.)
- [ ] Success auto-advances

---

### Task 2.5: Step 4 — Success & Save
**Component:** Part of OnboardingWizard

**What the user sees:**
- Success confirmation: "Connected! You're all set."
- Key is encrypted and saved automatically
- "Start Learning" button closes wizard

**Actions:**
1. Call `window.__mainApi.apiKey.save(key)` to persist
2. Show success state
3. "Start Learning" transitions to main app / dashboard

**AC:**
- [ ] Key saved and encrypted before showing success
- [ ] Clear success feedback
- [ ] Button transitions to dashboard
- [ ] Wizard never shows again (until key is deleted)

---

### Task 2.6: Wire Wizard into App Flow
**Files to Modify:**
- `src/App.tsx` — Show wizard when no API key exists

**Logic:**
```
App starts → check apiKey.has()
  ├─ No key → Show OnboardingWizard (blocks other UI)
  └─ Has key → Show Dashboard (normal flow)
```

**AC:**
- [ ] App checks for API key on mount
- [ ] No key → wizard shown
- [ ] Key exists → dashboard shown
- [ ] After wizard completes → dashboard shown

---

## Acceptance Criteria

- [ ] 4-step wizard guides user through API key setup
- [ ] Wizard blocks app until key is configured
- [ ] Non-technical language throughout
- [ ] Key tested before saving
- [ ] Key encrypted via safeStorage
- [ ] Wizard never shows again once key is saved
- [ ] `npm run build` passes
- [ ] Tailwind CSS styled consistently with existing UI

---

## Files Summary

**Files to Create (1):**
1. `src/features/api-key/components/OnboardingWizard.tsx` (~250 lines)

**Files to Modify (1):**
1. `src/App.tsx` — Add API key check and wizard rendering

---

## Definition of Done

1. [ ] Wizard renders and walks through 4 steps
2. [ ] API key tested and encrypted
3. [ ] App flow gates on valid key
4. [ ] Build passes
5. [ ] SCRATCHPAD updated
