# AVAIA ARCHITECTURAL DECISIONS (ADR) — v3

This doc extends the ADR set with upgrade-proof decisions and first-run migration behaviour.

## ADR-013: Legacy Data Import & API Key Migration (v1 → v2+)

**Decision:** On first launch of v2+, the app MUST import legacy data from previous on-disk locations into the new `app.getPath('userData')` layout.

### Legacy roots to scan
- `~/.avaia/` (legacy documented layout)
- Prior `userData` variants (case differences or older app name folder)

### Import rule
- If `{userData}/profiles/` already contains profiles, skip profile import.
- Otherwise:
  - For each legacy profile dir in `{legacyRoot}/profiles/*`:
    - Determine canonical `profile_id`:
      - Prefer reading `profile.id` from `progress.db`
      - Else accept folder name if it matches `^profile_[a-f0-9]{32}$`
    - Copy legacy folder to `{userData}/profiles/{profile_id}` using temp + atomic rename (crash-safe).
  - Do NOT rewrite IDs unless absolutely necessary.

### API key migration
**Decision:** API key is global (stored once at `{userData}/.api_key`, not per-profile). On v2+ first launch:
- If `{userData}/.api_key` does not exist:
  - Search legacy `profiles/*/.api_key`
  - Choose the most recently modified key file
  - Copy it to `{userData}/.api_key`
  - Rename the legacy key file to `.api_key.migrated` (backup, avoids double-use)

### Idempotency and safety
- Import step is safe to re-run:
  - Uses existence checks for destinations
  - Uses `.importing` temp folders + atomic rename
  - API key migration does nothing if global key already exists

---

## ADR-014: Curriculum Database Migration Policy

**Decision:** `curriculum.db` is **replace-only** (signed bundle + atomic swap). No schema migrations are executed against `curriculum.db` at runtime.

---

## ADR-015: Progress DB Migration Policy

**Decision:** `progress.db` is migrated at runtime using:
- `_migrations` gate (run-once semantics)
- Transactional application (BEGIN IMMEDIATE + COMMIT/ROLLBACK)
- Guarded `ALTER TABLE` operations using `PRAGMA table_info` checks in TypeScript

### Concurrency safety
- Migration runner MUST re-check applied state inside the migration transaction, or use `INSERT OR IGNORE` into `_migrations` to avoid multi-process race conditions.
