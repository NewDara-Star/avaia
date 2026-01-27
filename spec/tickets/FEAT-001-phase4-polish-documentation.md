# FEAT-001-P4: Polish & Documentation

**Priority:** P2 (Important but not blocking)
**Status:** NOT STARTED
**Created:** 2026-01-27
**Feature ID:** FEAT-001
**Phase:** 4 of 4
**Depends On:** Phase 3 (Integration Testing passes)

---

## Context

Once the app is running and tests pass (Phases 1-3), this phase adds persistence, polish, and documentation. Without these, the app "works" but forgets which profile was active on restart, has no docs for users or devs, and the Arela knowledge graph is stale.

**What's missing:**
- ❌ Profile persistence — app doesn't remember active profile across restarts
- ❌ App reload on switch — switching profiles doesn't reload renderer state
- ❌ Website documentation — AGENTS.md Rule #8 requires it
- ❌ Graph.db stale — new files not indexed (Phase 1 known issue)

---

## Technical Tasks

### Task 4.1: Profile Persistence Across Restarts
**Priority:** P1

**Context:** Currently, when the app restarts, it doesn't remember which profile was last active. The user has to re-select every time.

**Actions:**
1. Choose storage mechanism (Type 2 decision — recommend `electron-store` or simple JSON file at `{userData}/preferences.json`)
2. Create `src/services/preferences.ts`
3. Implement `getCurrentProfileId()` and `setCurrentProfileId(id: string)`
4. Update `profile-ipc.ts` switch handler to persist selection
5. Update `src/main/index.ts` to load persisted profile on startup

**Files to Create:**
- `src/services/preferences.ts` (~30 lines)

**Files to Modify:**
- `src/features/profile-management/services/profile-ipc.ts` (save on switch)
- `src/main/index.ts` (load on startup)

**AC:**
- [ ] App remembers last active profile after restart
- [ ] Invalid/deleted profile ID falls back to first available
- [ ] No profile selected → shows welcome/create screen
- [ ] Preference file created at `{userData}/preferences.json`

**Dependencies:**
```bash
npm install electron-store  # OR use plain fs-extra (already in deps)
```

**Decision (Type 2 — reversible):** `electron-store` vs plain JSON file. Recommend plain JSON via `fs-extra` since it's already a dependency. No new dep needed.

---

### Task 4.2: App Reload on Profile Switch
**Priority:** P1

**Context:** When switching profiles, the renderer needs to reset state to reflect the new profile's data. Options: full window reload, or React state reset.

**Actions:**
1. After successful profile switch IPC, trigger renderer reload
2. Option A: `mainWindow.reload()` from main process (simple, safe)
3. Option B: Send IPC event to renderer, let React re-mount (more control)
4. Recommend Option A for simplicity

**Files to Modify:**
- `src/features/profile-management/services/profile-ipc.ts` (add reload after switch)

**AC:**
- [ ] Switching profile reloads the renderer
- [ ] New profile data loads after reload
- [ ] No stale data from previous profile visible
- [ ] Header shows correct avatar/name after reload

---

### Task 4.3: Re-index Graph.db
**Priority:** P1

**Context:** Graph.db is stale — doesn't know about files created in Sessions 4-7. This breaks `arela_graph_impact` (dependency tracking) for all new files.

**Actions:**
1. Run `arela_graph_refresh` to re-index the codebase
2. Verify new files appear in graph.db:
   - `src/main/index.ts`
   - `src/renderer/preload.ts`
   - `src/types/global.d.ts`
   - `src/App.tsx` (after Phase 2)
   - `src/components/Layout.tsx` (after Phase 2)
   - `src/features/profile-management/` (all files)
3. Verify import relationships are tracked

**AC:**
- [ ] `arela_graph_impact` returns correct dependencies for profile files
- [ ] All src/ files indexed in graph.db
- [ ] Import edges connect main → profile-ipc → profile-service

---

### Task 4.4: Website Documentation
**Priority:** P1 (AGENTS.md Rule #8: Mandatory)

**Context:** AGENTS.md Rule #8: "Every new feature or tool MUST have a corresponding page in `website/`. No feature is complete without documentation."

**Actions:**
1. Check existing website structure
2. Create `website/docs/features/profile-management.md` (or equivalent path)
3. Write:
   - **User Guide:** How to create, switch, delete profiles
   - **Developer Guide:** Architecture, IPC API, database schema
   - **Troubleshooting:** Common issues and fixes
4. Update website navigation/sidebar if applicable

**Files to Create:**
- `website/docs/features/profile-management.md` (~200 lines)

**AC:**
- [ ] Documentation page exists in website/
- [ ] User guide covers all profile operations
- [ ] Developer guide documents IPC methods and DB schema
- [ ] Troubleshooting section included
- [ ] Website nav updated (if applicable)

---

### Task 4.5: Update Feature README
**Priority:** P2

**Context:** `src/features/profile-management/README.md` was written during Session 4 and lists TODOs that are now done (main process, preload bridge). Needs update to reflect actual state.

**Actions:**
1. Read current README.md
2. Update TODO section — mark completed items
3. Add integration notes (how main.ts wires everything)
4. Update architecture diagram if needed

**Files to Modify:**
- `src/features/profile-management/README.md`

**AC:**
- [ ] README reflects actual implementation state
- [ ] TODOs updated (done items checked off)
- [ ] Integration instructions accurate

---

## Acceptance Criteria

- [ ] Profile persists across app restarts
- [ ] Profile switch triggers renderer reload
- [ ] Graph.db re-indexed with all current files
- [ ] Website documentation published (Rule #8)
- [ ] Feature README updated
- [ ] `npm run build` still passes
- [ ] `npm run test:guards` still passes

---

## Files Summary

**Files to Create (2):**
1. `src/services/preferences.ts` — Profile persistence (~30 lines)
2. `website/docs/features/profile-management.md` — Docs (~200 lines)

**Files to Modify (3):**
1. `src/features/profile-management/services/profile-ipc.ts` — Save pref on switch + reload
2. `src/main/index.ts` — Load persisted profile on startup
3. `src/features/profile-management/README.md` — Update TODOs

---

## Definition of Done

1. [ ] Profile persistence works across restarts
2. [ ] Profile switch reloads renderer
3. [ ] Graph.db current (all files indexed)
4. [ ] Website docs published
5. [ ] README updated
6. [ ] Build passes
7. [ ] SCRATCHPAD.md updated
