# FEAT-001-P2: React App Shell

**Priority:** P0 (Critical Blocker)
**Status:** ✅ COMPLETE
**Created:** 2026-01-27
**Completed:** 2026-01-27 (Session 47)
**Feature ID:** FEAT-001
**Phase:** 2 of 4
**Depends On:** Phase 1 (✅ Complete)

---

## Context

Build infrastructure is working (Phase 1 done), but the React app doesn't exist. `src/main.tsx` is a stub with only `console.log`. There's no App.tsx, no Layout.tsx, no CSS entry point. The profile components (ProfileDropdown, CreateProfileModal) exist in `src/features/profile-management/components/` but have nowhere to render.

**What exists:**
- ✅ Build passes (`npm run build`)
- ✅ Electron main process (creates BrowserWindow, loads preload, initializes profiles)
- ✅ Preload bridge (`window.__mainApi.profiles.*`)
- ✅ Profile components (ProfileDropdown.tsx, CreateProfileModal.tsx)
- ✅ State hook (useProfiles.ts)

**What's missing:**
- ❌ `src/main.tsx` — stub, no React render
- ❌ `src/App.tsx` — doesn't exist
- ❌ `src/components/Layout.tsx` — doesn't exist
- ❌ `src/index.css` — no Tailwind entry point
- ❌ No visible UI whatsoever

---

## Technical Tasks

### Task 2.1: Create Tailwind CSS Entry Point
**File:** `src/index.css` (NEW)

**Actions:**
1. Create `src/index.css`
2. Add `@import "tailwindcss";`
3. Add any base resets or custom properties needed

**AC:**
- [x] File exists at `src/index.css`
- [x] Tailwind utility classes render correctly in browser

---

### Task 2.2: Rewrite Main Entry Point
**File:** `src/main.tsx` (REWRITE)

**Actions:**
1. Replace stub `console.log` with React bootstrap
2. Import React, ReactDOM
3. Import App component
4. Import `src/index.css`
5. Call `ReactDOM.createRoot(document.getElementById("root")!).render(<App />)`

**AC:**
- [ ] React app renders in Electron window
- [ ] No console errors on startup
- [ ] Tailwind CSS loaded

---

### Task 2.3: Create App Root Component
**File:** `src/App.tsx` (NEW)

**Actions:**
1. Create root component that renders Layout
2. Wrap with any needed providers (none for now — keep minimal)
3. Show welcome screen when no profile selected
4. Show main content area when profile active

**AC:**
- [ ] App.tsx renders without errors
- [ ] Welcome screen visible on first launch
- [ ] Component tree: App → Layout → content

---

### Task 2.4: Create Layout Component with Profile Integration
**File:** `src/components/Layout.tsx` (NEW)

**Actions:**
1. Create `src/components/` directory
2. Build Layout with:
   - Header bar (app name left, profile avatar button right)
   - Profile avatar button showing current profile emoji
   - Click handler to toggle ProfileDropdown
   - Click-outside-to-close for dropdown
   - Main content area (children)
3. Import ProfileDropdown from `src/features/profile-management/components/`
4. Import useProfiles hook for current profile state

**AC:**
- [ ] Header renders with app name and avatar button
- [ ] Clicking avatar opens ProfileDropdown
- [ ] Current profile emoji shown in avatar button
- [ ] Dropdown closes on outside click
- [ ] Main content area renders children

**Key Implementation Detail:**
```
┌──────────────────────────────────┐
│  Avaia              [👶 ▼]      │  ← Header
├──────────────────────────────────┤
│                    ┌────────────┐│
│                    │ Profiles   ││  ← ProfileDropdown (existing)
│                    │ ● Child 1  ││
│   Main Content     │ ○ Child 2  ││
│   (children)       │ + Add New  ││
│                    └────────────┘│
│                                  │
└──────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] `npm run build` still passes after changes
- [ ] Electron window shows React UI (not blank/console.log)
- [ ] Header bar with app name visible
- [ ] Profile avatar button in header
- [ ] Clicking avatar opens ProfileDropdown
- [ ] Dropdown closes on click outside
- [ ] "Create Profile" flow works from dropdown
- [ ] Tailwind CSS classes applied correctly

---

## Files Summary

**Files to Create (3):**
1. `src/App.tsx` — Root component (~40 lines)
2. `src/components/Layout.tsx` — Header + profile dropdown (~120 lines)
3. `src/index.css` — Tailwind entry (~5 lines)

**Files to Modify (1):**
1. `src/main.tsx` — Replace stub with React render (~15 lines)

---

## Risk Areas

1. **Tailwind not rendering:** Verify `@tailwindcss/vite` plugin is loaded in vite.config.ts (it is)
2. **ProfileDropdown import path:** Components are in `src/features/profile-management/components/` — use `@/` alias or relative path
3. **window.__mainApi undefined:** In dev mode without Electron, the preload won't run. Add optional chaining (useProfiles already does this: `window.__mainApi?.profiles?.list?.()`)

---

## Definition of Done

1. [ ] React app renders in Electron window
2. [ ] Profile dropdown accessible from header
3. [ ] Create profile flow works end-to-end
4. [ ] Build passes
5. [ ] SCRATCHPAD.md updated
