# FEAT-002-P3: Settings — API Key Management

**Priority:** P1 (Important)
**Status:** NOT STARTED
**Created:** 2026-01-27
**Feature ID:** FEAT-002
**Phase:** 3 of 3
**Depends On:** Phase 2 (Onboarding Wizard)

---

## Context

After onboarding, users need a way to update or re-test their API key without going through the full wizard again. The PRD specifies a Settings screen with an "Account" tab that includes API key management. This phase adds that capability.

**What the user experiences:** In Settings > Account, they can see their connection status, update their key, or test it again — all without disrupting their learning.

---

## Technical Tasks

### Task 3.1: API Key Section in Settings
**File:** `src/features/api-key/components/ApiKeySettings.tsx` (NEW)

**What the user sees:**
- Connection status indicator (green = connected, red = invalid/missing)
- Masked key display (`sk-ant-****...****`)
- "Test Connection" button
- "Update Key" button (opens modal)
- Last tested timestamp

**AC:**
- [ ] Status shows current key state
- [ ] Key is masked (never shown in full)
- [ ] Test button re-validates existing key
- [ ] Update button opens edit modal

---

### Task 3.2: Edit API Key Modal
**File:** `src/features/api-key/components/EditApiKeyModal.tsx` (NEW)

**What the user sees:**
- Warning: "This will update the API key for ALL profiles"
- New key input
- "Test & Save" button
- Cancel button

**AC:**
- [ ] Warning about all-profiles impact shown
- [ ] New key tested before saving
- [ ] Old key preserved if test fails
- [ ] Success feedback after save

---

### Task 3.3: Integrate with App Settings
**Files to Modify:**
- Settings page (create if doesn't exist) — Add Account tab with API key section

**AC:**
- [ ] Settings accessible from app navigation
- [ ] Account tab shows API key management
- [ ] Changes reflected immediately

---

## Acceptance Criteria

- [ ] Users can view connection status in Settings
- [ ] Users can update API key with test-before-save
- [ ] Warning shown about all-profiles impact
- [ ] Key never displayed in full
- [ ] `npm run build` passes

---

## Files Summary

**Files to Create (2):**
1. `src/features/api-key/components/ApiKeySettings.tsx` (~100 lines)
2. `src/features/api-key/components/EditApiKeyModal.tsx` (~80 lines)

**Files to Modify (1-2):**
1. Settings page/component — integrate API key section

---

## Definition of Done

1. [ ] Key management accessible in Settings
2. [ ] Update flow works with test-before-save
3. [ ] Build passes
4. [ ] SCRATCHPAD updated
