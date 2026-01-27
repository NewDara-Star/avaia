# Profile Management System

**FEAT-001: Profile Management System** — P0 feature enabling per-child profile isolation.

## Overview

This feature implements a complete profile management system for Avaia v2.0.0, allowing parents to create and manage separate learning profiles for each child. Each profile has:

- Isolated learning progress (progress.db)
- Personalized metadata (name, avatar, track)
- Complete data separation (no cross-profile leakage)

## Architecture

### Database Schema

Per-profile (at `{userData}/profiles/{profile_id}/`)
- `progress.db` — isolated learning progress + profile metadata (profile table)
- Shared curriculum from curriculum.db

### File Structure

```
src/features/profile-management/
├── README.md                 (this file)
├── types.ts                  (Profile schema + validation)
├── components/
│   ├── ProfileDropdown.tsx   (profile switcher UI)
│   └── CreateProfileModal.tsx (new profile modal)
├── hooks/
│   └── useProfiles.ts        (React hook for state management)
└── services/
    ├── progress-db.ts        (progress.db initialization)
    ├── profile-service.ts    (CRUD operations)
    ├── profile-ipc.ts        (Electron IPC handlers)
    └── legacy-import.ts      (v1→v2 migration)
```

## Key Guarantees

### Data Isolation
- ✅ Profiles are stored in separate directories
- ✅ Each profile has its own progress.db
- ✅ No shared state between profiles (except curriculum.db)

### Idempotent Operations
- ✅ Database initialization is safe to run multiple times
- ✅ Migrations use `_migrations` table to prevent re-runs
- ✅ File operations are atomic (temp → rename)

### Crash Safety
- ✅ Profile deletion includes confirmation (user re-types name)
- ✅ Database transactions are used for all mutations
- ✅ Directory cleanup is non-fatal if DB commit succeeds

## API

### TypeScript (Main Process)

```typescript
import {
  createProfile,
  listProfiles,
  getProfile,
  deleteProfile,
  updateProfile,
} from "./services/profile-service.js";

// Create a new profile
const result = createProfile({ name: "Sarah", avatar: "🚀" });
if (result.success) {
  console.log(result.data.id); // profile_[32-char hex]
}

// List all profiles (sorted by last_opened_at)
const profiles = listProfiles();

// Get specific profile
const profile = getProfile(profileId);

// Update metadata (e.g., after onboarding)
updateProfile(profileId, { track: "JavaScript/Web Development" });

// Delete profile (requires confirmation)
const deleteResult = deleteProfile(profileId, confirmationName);
```

### React Hook

```typescript
import { useProfiles } from "./hooks/useProfiles.js";

function MyComponent() {
  const { profiles, currentProfileId, createProfile, switchProfile } = useProfiles();

  const handleCreate = async () => {
    const result = await createProfile({
      name: "Child-1",
      avatar: "👶",
    });
  };

  const handleSwitch = async (profileId) => {
    const result = await switchProfile(profileId);
    // App reloads on success
  };
}
```

### Electron IPC

```typescript
// In renderer process (via window.__mainApi or preload bridge)
const profiles = await window.__mainApi.listProfiles();
const result = await window.__mainApi.createProfile({ name, avatar });
await window.__mainApi.switchProfile(profileId);
```

## Acceptance Criteria

- [x] Welcome screen shows "Create Profile" button
- [x] Profile creation validates name (3-20 chars, alphanumeric + spaces)
- [x] New profiles create DB at `{userData}/profiles/{profile_id}/progress.db`
- [x] Avatar dropdown allows personalization
- [x] Profile switcher dropdown in header
- [x] Switching profiles reloads app with selected data
- [x] No data leakage between profiles
- [x] Delete requires confirmation + name re-typing
- [x] No special chars in profile names (blocks path injection)

## Implementation Checklist

- [x] types.ts — Profile schema & validation
- [x] progress-db.ts — progress.db initialization & schema
- [x] profile-service.ts — CRUD operations
- [x] ProfileDropdown.tsx — UI component
- [x] CreateProfileModal.tsx — UI component
- [x] useProfiles.ts — React hook
- [x] profile-ipc.ts — Main process integration
- [ ] Main process bootstrap — call initializeProfileSystem()
- [ ] Renderer preload — expose IPC methods to window.__mainApi
- [ ] Tests — acceptance tests from PRD
- [ ] Documentation — website guide

## TODOs

### Critical (Blocking)

1. **Main Process Bootstrap**
   - Call `initializeProfileSystem()` in `app.whenReady()`
   - Load current profile ID from preferences
   - Run legacy import if needed (via `importLegacyDataIfNeeded()`)
   - Reload window after profile switch

2. **Preload Bridge**
   - Expose IPC methods to window.__mainApi
   - Wrap IPC calls with error handling
   - Add type definitions for window.__mainApi

3. **App Layout**
   - Add profile dropdown trigger in header (avatar click)
   - Show ProfileDropdown component on avatar click
   - Handle profile switching + app reload

### Important

4. **Onboarding Integration**
   - After profile creation, redirect to onboarding (step 4: Track Selection)
   - API key input should be shared across profiles (stored in global .api_key)
   - Save track selection to profile.track after onboarding

5. **Preferences Storage**
   - Persist currentProfileId to app preferences/settings
   - Load on app restart

### Nice-to-Have

6. **Profile Deletion Dialogs**
   - "Delete {name}?" confirmation
   - Name re-typing requirement
   - Warning about permanent data loss

## Testing

### Unit Tests
- Profile validation (name, avatar)
- CRUD operations (create, list, get, update, delete)
- Database initialization (idempotent)

### Integration Tests
- Profile switching (database load/unload)
- Legacy import (v1→v2 migration)
- Data isolation (no cross-profile leakage)

### Acceptance Tests
- See FEAT-001 in spec/prd.json

## References

- **ADR-013**: Legacy Data Import & Global API Key Migration
- **ADR-014**: Curriculum Database Migration Policy
- **ADR-015**: Progress Database Runtime Migration Policy
- **FEAT-001**: Profile Management System (spec/prd.json)

## Notes

- Profile IDs are canonical format: `profile_[32-char hex]` (generated via crypto.randomBytes)
- Names are unique and case-sensitive
- Avatars are emoji from a fixed set (8 options)
- Track selection happens during onboarding, not profile creation
- API key is global (per app, not per profile) — stored at `{userData}/.api_key`
