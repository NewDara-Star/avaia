# REPO_SNAPSHOT.md

Arela generates a **repo snapshot** that summarizes the current state of your project.

## What It Is

`REPO_SNAPSHOT.md` is an auto-generated overview:
- What the repo is about
- Core flows (top PRD features)
- Tech stack (from `spec/stack.json`)
- Current risks / mismatches (drift)
- Last updated timestamp

It is **overwritten** on each export.

## When It Updates

- During `arela init`
- Whenever the dashboard watcher re-exports
- Any time you run `arela dashboard export`

## How It’s Built

Snapshot data comes from the same sources as the dashboard:
- Graph DB (`.arela/graph.db`)
- PRD (`spec/prd.json`)
- Tickets (`spec/tickets`)
- Tests (`spec/tests`)
- Test results (`.arela/test-results.json`)
- Git changes

If a source fails, the snapshot will still render and list the error.
