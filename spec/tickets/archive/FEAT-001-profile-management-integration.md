# FEAT-001: Profile Management System Integration

**Priority:** P0 (Critical Blocker)
**Status:** In Progress
**Created:** 2026-01-25
**Feature ID:** FEAT-001

---

## Context

The profile management backend, UI components, and tests are **100% complete**, but the app infrastructure is broken/missing. Build fails with TypeScript errors, and there's no working React app to host the components.

**What exists:**
- ✅ Backend services (profiles-db, profile-service, profile-ipc, legacy-import)
- ✅ React components (ProfileDropdown, CreateProfileModal)
- ✅ State management (useProfiles hook)
- ✅ Gherkin acceptance tests + step definitions (currently 14 scenario blocks; 1 outline with 7 examples)

**What's broken/missing:**
- ❌ Main process has TypeScript errors (dynamic loading pattern incomplete)
- ❌ No preload bridge (components can't call IPC)
- ❌ No React app root (components have nowhere to render)
- ❌ Build configuration incomplete (no React/Tailwind plugins)

---

## Technical Tasks

### Phase 1: Fix Build Errors (Blocker)

#### Task 1.1: Fix Main Process TypeScript Errors
**File:** `src/main/index.ts`

**Actions:**
1. Remove broken dynamic loading pattern (lines 14-27)
2. Use direct imports: `import { app, BrowserWindow } from "electron"`
3. Fix preload path: `path.join(__dirname, "../renderer/preload.js")`
4. Remove unused `loadElectron` function

**Files Modified:**
- `src/main/index.ts` (~20 line changes)

---

#### Task 1.2: Create Preload Bridge
**File:** `src/renderer/preload.ts` (NEW)

**Actions:**
1. Create `src/renderer/preload.ts`
2. Use `contextBridge.exposeInMainWorld` to expose IPC methods
3. Wrap all profile IPC calls (list, create, getCurrent, switch, delete, update)

**Files Created:**
- `src/renderer/preload.ts` (~60 lines)

**Code Template:**
```typescript
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("__mainApi", {
  listProfiles: () => ipcRenderer.invoke("profile:list"),
  createProfile: (input) => ipcRenderer.invoke("profile:create", input),
  getCurrentProfile: () => ipcRenderer.invoke("profile:get-current"),
  switchProfile: (id) => ipcRenderer.invoke("profile:switch", id),
  deleteProfile: (id, name) => ipcRenderer.invoke("profile:delete", id, name),
  updateProfile: (id, updates) => ipcRenderer.invoke("profile:update", id, updates),
});
```

---

#### Task 1.3: Add TypeScript Type Definitions
**File:** `src/types/global.d.ts` (NEW)

**Actions:**
1. Create `src/types/global.d.ts`
2. Declare `window.__mainApi` interface with all profile methods
3. Ensure proper return types for all IPC methods

**Files Created:**
- `src/types/global.d.ts` (~30 lines)

---

#### Task 1.4: Update Build Configuration

**Files Modified:**
- `vite.config.ts` (add React and Tailwind plugins)
- `tsconfig.json` (add JSX support, DOM types)
- `tsconfig.electron.json` (fix preload path, add global.d.ts)

**Actions:**

1. **vite.config.ts:**
   - Add `@vitejs/plugin-react`
   - Add `@tailwindcss/vite`
   - Set build target to `esnext`

2. **tsconfig.json:**
   - Add `"jsx": "react-jsx"`
   - Add `"lib": ["ES2020", "DOM", "DOM.Iterable"]`
   - Include `src/**/*.tsx`

3. **tsconfig.electron.json:**
   - Change `src/preload.ts` → `src/renderer/preload.ts`
   - Add `src/types/global.d.ts`

**Dependencies to Install:**
```bash
npm install --save-dev @vitejs/plugin-react @tailwindcss/vite
```

---

### Phase 2: Create React App (Blocker)

#### Task 2.1: Create App Root Component
**File:** `src/App.tsx` (NEW)

**Actions:**
1. Create minimal React app component
2. Import Layout component
3. Add welcome screen placeholder

**Files Created:**
- `src/App.tsx` (~30 lines)

---

#### Task 2.2: Create Layout Component with Profile Dropdown
**File:** `src/components/Layout.tsx` (NEW)

**Actions:**
1. Create directory: `mkdir -p src/components`
2. Create Layout component with:
   - Header (logo + profile avatar button)
   - Profile dropdown toggle logic
   - Click-outside-to-close handler
   - Main content area
3. Wire up ProfileDropdown component from feature directory

**Files Created:**
- `src/components/Layout.tsx` (~120 lines)

**Key Features:**
- Avatar button in top-right header
- Opens ProfileDropdown on click
- Shows current profile emoji + name
- Dropdown closes on outside click

---

#### Task 2.3: Update Main Entry Point
**File:** `src/main.tsx`

**Actions:**
1. Replace placeholder console.log with React render logic
2. Import React, ReactDOM, App component
3. Add ReactDOM.createRoot and render call
4. Import Tailwind CSS entry point

**Files Modified:**
- `src/main.tsx` (5 lines → ~25 lines)

---

#### Task 2.4: Add Tailwind CSS Entry Point
**File:** `src/index.css` (NEW)

**Actions:**
1. Create `src/index.css`
2. Add `@import "tailwindcss";`
3. Import in `src/main.tsx`

**Files Created:**
- `src/index.css` (~10 lines)

---

### Phase 3: Integration Testing (Critical)

#### Task 3.1: Test Profile Creation Flow

**Manual Testing Steps:**
1. Run `npm run electron:dev`
2. Click profile avatar button (top-right)
3. Click "+ Add New Profile"
4. Enter name "Test Child"
5. Select avatar 👶
6. Click "Create Profile"

**Expected Results:**
- ✅ Modal appears with form
- ✅ Name validation works (3-20 chars)
- ✅ Avatar selection highlights chosen emoji
- ✅ IPC call succeeds
- ✅ New profile appears in dropdown
- ✅ Database created at `{userData}/profiles/{profile_id}/progress.db`

**Debug Checklist:**
- Open DevTools (F12) → Check Console for errors
- Check `app.getPath('userData')/profiles/` directory
- Verify profiles.db exists

---

#### Task 3.2: Test Profile Switching

**Manual Testing Steps:**
1. Create 2+ profiles
2. Open dropdown
3. Click different profile

**Expected Results:**
- ✅ App reloads with new profile
- ✅ Header shows new profile avatar/name
- ✅ `last_opened_at` timestamp updated

---

#### Task 3.3: Test Data Isolation

**Manual Testing Steps:**
1. Create "Profile A"
2. Add test data (if applicable)
3. Switch to "Profile B"
4. Verify Profile B has no data from Profile A

**Expected Results:**
- ✅ No data leakage between profiles
- ✅ Separate `progress.db` files exist

---

#### Task 3.4: Run Acceptance Tests

**Command:**
```bash
npx cucumber-js spec/tests/features/profile-management.feature
```

**Expected Results:**
- ✅ All @critical scenarios pass
- ✅ @security scenarios pass (no path injection)
- ✅ @profile-ui scenarios pass

**If tests fail:**
- Update step definitions in `spec/tests/steps/profile-management.steps.ts`
- Fix bugs in profile services or components

---

### Phase 4: Polish & Documentation (Important)

#### Task 4.1: Add Profile Persistence

**Actions:**
1. Install: `npm install electron-store`
2. Create `src/services/preferences.ts`
3. Implement `getCurrentProfileId()` and `setCurrentProfileId()`
4. Update `profile-ipc.ts` to save profile ID on switch

**Files Created:**
- `src/services/preferences.ts` (~20 lines)

**Files Modified:**
- `src/features/profile-management/services/profile-ipc.ts`

---

#### Task 4.2: Add App Reload on Profile Switch

**File:** `src/features/profile-management/services/profile-ipc.ts`

**Actions:**
1. Update switch handler (line 89)
2. Add `app.relaunch()` and `app.exit(0)` after profile switch
3. Test app restarts correctly with new profile

---

#### Task 4.3: Create Website Documentation

**File:** `website/docs/features/profile-management.md` (NEW)

**Actions:**
1. Create user guide (how to create/switch/delete profiles)
2. Create developer guide (API, types, IPC methods)
3. Document database schema
4. Add troubleshooting section
5. Update website navigation/sidebar

---

## Acceptance Criteria

### Build & Startup
- [ ] `npm run build` completes without errors
- [ ] `npm run electron:dev` starts app successfully
- [ ] React app renders with welcome screen
- [ ] No console errors on startup

### Profile Creation
- [ ] Profile dropdown opens when clicking avatar button
- [ ] "+ Add New Profile" modal appears
- [ ] Name validation works (3-20 chars, alphanumeric + spaces)
- [ ] Avatar selection works (8 emoji options)
- [ ] New profile appears in dropdown after creation
- [ ] Database file created at correct path

### Profile Switching
- [ ] Can switch between profiles
- [ ] App reloads after switch
- [ ] Header shows correct profile after reload
- [ ] `last_opened_at` timestamp updates

### Data Isolation
- [ ] Each profile has separate `progress.db` file
- [ ] No data leakage between profiles
- [ ] Switching profiles doesn't corrupt data

### Profile Deletion
- [ ] Delete button visible in dropdown/manage screen
- [ ] Confirmation dialog requires name re-typing
- [ ] Deletion removes database and profile entry
- [ ] App handles deletion of current profile gracefully

### Persistence
- [ ] App remembers last active profile
- [ ] Restarting app loads correct profile
- [ ] Invalid profile ID falls back to first available

### Tests
- [ ] All @critical Gherkin scenarios pass
- [ ] All @security scenarios pass
- [ ] No test failures in profile-management.feature

### Documentation
- [ ] Website documentation page created
- [ ] User guide complete
- [ ] Developer guide with API reference
- [ ] Troubleshooting section added

---

## Files Summary

### Files to Create (7)
1. `src/renderer/preload.ts` (IPC bridge)
2. `src/types/global.d.ts` (window.__mainApi types)
3. `src/App.tsx` (root component)
4. `src/components/Layout.tsx` (header + dropdown)
5. `src/index.css` (Tailwind entry)
6. `src/services/preferences.ts` (profile persistence)
7. `website/docs/features/profile-management.md` (docs)

### Files to Modify (6)
1. `src/main/index.ts` (fix TypeScript errors)
2. `vite.config.ts` (add plugins)
3. `tsconfig.json` (add JSX, DOM)
4. `tsconfig.electron.json` (fix preload path)
5. `src/main.tsx` (add React render)
6. `src/features/profile-management/services/profile-ipc.ts` (add reload)

### Dependencies to Install
```bash
npm install --save-dev @vitejs/plugin-react @tailwindcss/vite
npm install electron-store
```

---

## Verification Checklist

**Before marking ticket complete:**

- [ ] All TypeScript errors resolved
- [ ] Build completes successfully
- [ ] Electron app starts
- [ ] Profile creation works end-to-end
- [ ] Profile switching works with app reload
- [ ] Profile deletion works with confirmation
- [ ] Data isolation verified (no leakage)
- [ ] Profile persists across restarts
- [ ] All @critical tests pass
- [ ] Website documentation published
- [ ] Manual QA completed (see Task 3.1-3.3)

---

## Risk Areas

1. **IPC Communication:** If contextBridge issues occur, verify:
   - Preload script is loaded (check webPreferences path)
   - contextIsolation is enabled
   - window.__mainApi is exposed correctly

2. **Tailwind CSS:** If styles don't apply:
   - Verify @tailwindcss/vite plugin loaded
   - Check src/index.css imported in main.tsx
   - Inspect DOM for Tailwind classes

3. **App Reload Timing:** If profile switch causes race conditions:
   - Ensure currentProfileId saved before relaunch
   - Add delay before app.exit(0) if needed
   - Test on different platforms (macOS, Windows, Linux)

---

## Definition of Done

1. ✅ Build compiles without errors
2. ✅ Electron app starts and renders React UI
3. ✅ Profile creation, switching, deletion all functional
4. ✅ Data isolation verified (manual + automated tests)
5. ✅ All @critical acceptance tests pass
6. ✅ Website documentation published
7. ✅ Code reviewed and approved
8. ✅ SCRATCHPAD.md updated with session notes

---

## Estimated Effort

**Total Time:** 2-3 hours for experienced developer

**Breakdown:**
- Phase 1 (Fix Build): 45-60 minutes
- Phase 2 (React App): 30-45 minutes
- Phase 3 (Testing): 30-45 minutes
- Phase 4 (Polish): 30-45 minutes

---

## Related Documents

- **PRD:** `spec/prd.json` (FEAT-001)
- **Implementation Plan:** `/Users/Star/.claude/plans/precious-soaring-church.md`
- **Audit Report:** Same plan file (comprehensive review)
- **Feature README:** `src/features/profile-management/README.md`
- **Tests:** `spec/tests/features/profile-management.feature`
- **Step Definitions:** `spec/tests/steps/profile-management.steps.ts`
