# REPO_SNAPSHOT

**Last Updated:** 2026-01-25T16:36:45.312Z

## What this repo is
**Avaia v2.0.0** — AI-powered programming education through evidence-based pedagogy. Desktop app (Electron-based) that combines interactive coding environments, spaced repetition (FSRS), and content delivery.

## Core flows
- Database migrations: `src/features/database-migrations/services/progress-migrations.ts`
- User profile management: `src/features/profile-management/services/legacy-import.ts`
- **PRD Status:** Empty (0 features defined in spec/prd.json)

## Tech stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor
- **Desktop:** Electron 40, electron-builder
- **Database:** better-sqlite3 (local SQLite)
- **Sandbox:** WebContainer API (@webcontainer/api 1.6.1)
- **Terminal:** xterm 6.0.0
- **Utilities:** Zod (validation), FSRS (spaced repetition), marked (markdown), jszip
- **Monitoring:** Sentry (error tracking), PostHog (analytics)

## Current state
- **Active source files:** 2 (database migrations, profile legacy import)
- **Archived files:** 38 (old server/client code, migrations, seed scripts)
- **Code graph:** 40 total nodes, 1 internal link (self-reference in progress-migrations)
- **No drift:** Implementation and intent are aligned (empty intent = empty implementation)

## System health
- Graph DB: 2026-01-25T16:34:53.022Z ✅
- RAG Index: 2026-01-25T16:36:45.312Z ✅
- Ollama: reachable ✅
- **Tickets:** 0
- **Tests:** 0

## Recent activity
- docs: add troubleshooting instructions for better-sqlite3 native module errors (e0f75df)
- feat: initialize website structure with essential tools and documentation (b4f0f5a)
- feat: Initialize project with v2 hybrid database schema, relocate core services (92784c9)

## Truth model
- **Implementation truth:** Codebase (40 files, 2 active TS modules)
- **Intent truth:** spec/prd.json (0 features) + spec/stack.json (0 libraries defined)
- **Drift status:** No drift detected (empty intent + empty implementation)
