# FEAT-002-P1: API Key Storage & Encryption

**Priority:** P0 (Critical Blocker)
**Status:** NOT STARTED
**Created:** 2026-01-27
**Feature ID:** FEAT-002
**Phase:** 1 of 3
**Depends On:** FEAT-001 (✅ Complete through P2)

---

## Context

The app can create and manage profiles, but has no way to connect to Anthropic's AI. Without a stored API key, every AI-powered feature is blocked. This phase builds the secure backend: storing, encrypting, decrypting, and validating the API key using Electron's safeStorage API.

This is the foundation — Phase 2 builds the user-facing wizard on top of it.

**What the user gets:** Nothing visible yet, but this ensures their API key is never stored in plaintext and is securely available to all profiles.

---

## Technical Tasks

### Task 1.1: Create API Key Service
**File:** `src/features/api-key/services/api-key-service.ts` (NEW)

**Actions:**
1. Create `src/features/api-key/` directory (VSA slice)
2. Create `src/features/api-key/README.md`
3. Create `src/features/api-key/types.ts` — Zod schemas for API key validation
4. Create service with functions:
   - `getApiKeyPath(): string` — Returns `app.getPath('userData')/.api_key`
   - `hasApiKey(): boolean` — Checks if encrypted key file exists
   - `saveApiKey(key: string): Result` — Encrypts via `safeStorage.encryptString()`, writes to file
   - `loadApiKey(): Result<string>` — Reads file, decrypts via `safeStorage.decryptString()`
   - `deleteApiKey(): Result` — Removes key file
   - `validateKeyFormat(key: string): boolean` — Checks `sk-ant-` prefix and length

**AC:**
- [ ] Key encrypted via Electron safeStorage before writing to disk
- [ ] Key decrypted successfully on read
- [ ] File stored at `{userData}/.api_key`
- [ ] Invalid key formats rejected (must start with `sk-ant-`)
- [ ] Missing key file returns clear error, not crash
- [ ] Zod schema validates key shape

---

### Task 1.2: Create API Key Test Service
**File:** `src/features/api-key/services/api-key-test.ts` (NEW)

**Actions:**
1. Create function `testApiKey(key: string): Promise<Result<boolean>>`
2. Make minimal API call to `https://api.anthropic.com/v1/messages` with `max_tokens: 1`
3. Return success/failure with clear error message
4. Handle: invalid key, network error, rate limit, timeout

**AC:**
- [ ] Valid key returns `{ success: true }`
- [ ] Invalid key returns `{ success: false, error: "Invalid API key" }`
- [ ] Network error returns `{ success: false, error: "No internet connection" }`
- [ ] Request uses minimal tokens (max_tokens: 1)
- [ ] Timeout set to 10 seconds

---

### Task 1.3: Register IPC Handlers
**File:** `src/features/api-key/services/api-key-ipc.ts` (NEW)

**Actions:**
1. Create IPC handlers:
   - `api-key:has` — Returns boolean (key exists)
   - `api-key:save` — Encrypts and saves key
   - `api-key:test` — Tests key against Anthropic API
   - `api-key:delete` — Removes key
2. Register handlers in main process

**Files to Modify:**
- `src/main/index.ts` — Import and register API key IPC handlers

**AC:**
- [ ] All 4 IPC channels registered
- [ ] Renderer can check/save/test/delete key via preload bridge
- [ ] Error responses include user-friendly messages

---

### Task 1.4: Update Preload Bridge
**Files to Modify:**
- `src/renderer/preload.ts` — Add `window.__mainApi.apiKey.*` namespace
- `src/types/global.d.ts` — Add TypeScript declarations

**AC:**
- [ ] `window.__mainApi.apiKey.has()` available in renderer
- [ ] `window.__mainApi.apiKey.save(key)` available
- [ ] `window.__mainApi.apiKey.test(key)` available
- [ ] `window.__mainApi.apiKey.delete()` available
- [ ] TypeScript types match preload 1:1

---

## Acceptance Criteria

- [ ] API key encrypted at rest (never plaintext on disk)
- [ ] Key stored globally at `{userData}/.api_key` (shared across all profiles)
- [ ] Save → Load round-trip works (encrypt then decrypt)
- [ ] Test connection uses minimal tokens
- [ ] IPC bridge exposes all 4 operations to renderer
- [ ] `npm run build` passes
- [ ] Feature README exists

---

## Files Summary

**Files to Create (5):**
1. `src/features/api-key/README.md` — Feature documentation
2. `src/features/api-key/types.ts` — Zod schemas
3. `src/features/api-key/services/api-key-service.ts` — Encrypt/decrypt/store (~80 lines)
4. `src/features/api-key/services/api-key-test.ts` — Test connection (~40 lines)
5. `src/features/api-key/services/api-key-ipc.ts` — IPC handlers (~60 lines)

**Files to Modify (3):**
1. `src/main/index.ts` — Register API key IPC handlers
2. `src/renderer/preload.ts` — Add apiKey namespace
3. `src/types/global.d.ts` — Add apiKey types

---

## Negative Constraints

- Do NOT store the API key in plaintext
- Do NOT store the key in localStorage or renderer process
- Do NOT make full AI requests to validate (use max_tokens: 1)
- Do NOT skip encryption even in dev mode

---

## Definition of Done

1. [ ] API key encrypts/decrypts via safeStorage
2. [ ] IPC bridge works end-to-end
3. [ ] Test connection validates key with minimal cost
4. [ ] Build passes
5. [ ] README + SCRATCHPAD updated
