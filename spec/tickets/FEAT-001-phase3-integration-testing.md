# FEAT-001-P3: Integration Testing

**Priority:** P1 (Important)
**Status:** NOT STARTED
**Created:** 2026-01-27
**Feature ID:** FEAT-001
**Phase:** 3 of 4
**Depends On:** Phase 2 (React App Shell)

---

## Context

28 Gherkin scenarios and 426 lines of step definitions exist but have **never been executed**. The profile backend is complete, components exist, but end-to-end flows have never been tested in a running Electron app. Phase 2 creates the app shell — this phase verifies everything actually works together.

**What exists:**
- ✅ `spec/tests/features/profile-management.feature` — 28 scenarios
- ✅ `spec/tests/steps/profile-management.steps.ts` — 426 lines step defs
- ✅ Backend services (profiles-db, profile-service, profile-ipc)
- ✅ React components (ProfileDropdown, CreateProfileModal)
- ✅ Electron main process + preload bridge

**What's untested:**
- ❌ Profile creation end-to-end (IPC round-trip)
- ❌ Profile switching (reload behavior)
- ❌ Profile deletion (confirmation flow)
- ❌ Data isolation (separate progress.db per profile)
- ❌ First-run experience (no profiles exist)
- ❌ Error handling (invalid names, duplicate names)

---

## Technical Tasks

### Task 3.1: Manual Smoke Test — App Launch
**Type:** Manual

**Steps:**
1. Run `npm run electron:dev` (or equivalent start command)
2. Verify Electron window opens
3. Verify React UI renders (not blank)
4. Open DevTools (Cmd+Option+I) — check for console errors
5. Verify header shows profile avatar button

**AC:**
- [ ] App launches without crash
- [ ] React UI visible
- [ ] No red console errors
- [ ] Profile button in header

**If fails:** Debug Electron main process logs, check preload loading, check Vite dev server URL.

---

### Task 3.2: Manual Smoke Test — Profile Creation
**Type:** Manual

**Steps:**
1. Click profile avatar button in header
2. Click "+ Add New Profile" (or "Create Profile" on first run)
3. Enter name "Test Child" (valid: 3-20 chars, alphanumeric + spaces)
4. Select avatar emoji (e.g. 👶)
5. Click "Create Profile"
6. Verify profile appears in dropdown

**AC:**
- [ ] Modal opens from dropdown
- [ ] Name validation rejects: `<3 chars`, `>20 chars`, special chars (`/\:*?`)
- [ ] Avatar picker shows 8 emoji options
- [ ] IPC call succeeds (no error toast)
- [ ] New profile appears in dropdown list
- [ ] Database file created at `{userData}/profiles/{profile_id}/progress.db`

**Debug Checklist:**
- Check DevTools Console for IPC errors
- Check `app.getPath('userData')/profiles/` for database files
- Verify `profiles.db` has new row

---

### Task 3.3: Manual Smoke Test — Profile Switching
**Type:** Manual

**Steps:**
1. Create 2+ profiles
2. Open dropdown
3. Click a different profile
4. Verify app state changes

**AC:**
- [ ] Clicking different profile triggers switch
- [ ] Header avatar updates to new profile emoji
- [ ] `last_opened_at` timestamp updates in DB
- [ ] No data from previous profile visible

---

### Task 3.4: Manual Smoke Test — Data Isolation
**Type:** Manual

**Steps:**
1. Create "Profile A"
2. Note database path: `{userData}/profiles/{id_a}/progress.db`
3. Create "Profile B"
4. Note database path: `{userData}/profiles/{id_b}/progress.db`
5. Verify paths are different
6. Verify no shared state between profiles

**AC:**
- [ ] Each profile has its own `progress.db` file
- [ ] Database paths use different profile IDs
- [ ] No data leakage between profiles
- [ ] Shared `curriculum.db` is read-only (not per-profile)

---

### Task 3.5: Manual Smoke Test — Profile Deletion
**Type:** Manual

**Steps:**
1. Open profile dropdown
2. Click delete on a non-active profile
3. Verify confirmation dialog appears
4. Type wrong name → verify button stays disabled
5. Type correct name → verify delete succeeds
6. Verify profile removed from list
7. Verify database files cleaned up

**AC:**
- [ ] Confirmation requires exact name re-typing
- [ ] Wrong name keeps delete button disabled
- [ ] Correct name enables delete
- [ ] Profile removed from dropdown
- [ ] Cannot delete currently active profile (or graceful fallback)

---

### Task 3.6: Run Automated Acceptance Tests
**Type:** Automated

**Command:**
```bash
npx cucumber-js spec/tests/features/profile-management.feature
```

**AC:**
- [ ] All @critical scenarios pass (9 scenarios)
- [ ] All @security scenarios pass (8 scenarios)
- [ ] @first-run scenarios pass (3 scenarios)
- [ ] @profile-deletion scenarios pass (2 scenarios)

**If tests fail:**
- Update step definitions in `spec/tests/steps/profile-management.steps.ts`
- Fix bugs found in services or components
- Document failures and fixes in SCRATCHPAD.md

**Note:** Step definitions may need updates since they were written before the app shell existed. Expect some adapter work to connect Gherkin steps to the actual running app.

---

### Task 3.7: Fix Test Failures
**Type:** Code changes (if needed)

**Actions:**
1. Analyze each failing scenario
2. Determine if failure is in step definition or implementation
3. Fix step definitions to match actual component behavior
4. Fix implementation bugs if found
5. Re-run until all @critical scenarios pass

**Files potentially modified:**
- `spec/tests/steps/profile-management.steps.ts`
- `src/features/profile-management/services/*.ts`
- `src/features/profile-management/components/*.tsx`

---

## Acceptance Criteria

- [ ] App launches and renders React UI
- [ ] Profile creation works end-to-end (UI → IPC → DB → UI update)
- [ ] Profile switching works (state change + DB update)
- [ ] Data isolation verified (separate progress.db files)
- [ ] Profile deletion works with name confirmation
- [ ] All @critical Gherkin scenarios pass
- [ ] All @security Gherkin scenarios pass
- [ ] No console errors during normal usage
- [ ] All failures documented in SCRATCHPAD.md

---

## Files Summary

**No files created** — this is a testing phase.

**Files potentially modified:**
- `spec/tests/steps/profile-management.steps.ts` (fix step defs)
- Any service/component file where bugs are found

---

## Definition of Done

1. [ ] All 6 manual smoke tests pass
2. [ ] Automated @critical + @security tests pass
3. [ ] Bugs found are fixed or documented as known issues
4. [ ] SCRATCHPAD.md updated with test results
