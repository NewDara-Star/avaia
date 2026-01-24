# Avaia Alignment Patch Bundle (v3.2)

Generated: 2026-01-24 22:42 UTC

## Included
- avaia-adr-v3.patched.md
- avaia-adr-v3-migrations.patched.sql
- stack.patched.json
- prd-complete-adr-v4.patched.v3.2.json

## Fixes in v3.2
- Added a dedicated `project_file` spec under FEAT-021 (purpose, canonical fields, constraints, path rules, and access patterns) to remove underspecification.

## Previously fixed (v3.1)
- FEAT-003: clarified Zod applies to manifest JSON; curriculum.db verified via hash/signature before atomic swap.
- FEAT-033: clarified legacy key selection uses the most recently modified `.api_key` file (deterministic).
- get_diagnostic_question `zod_schema` includes optional `question_type` enum.
- `clarification_log` normalised: raw string notes wrapped into objects.

## Apply
Replace your originals with these patched files (or apply as diffs), then run your validation/lint checks.
