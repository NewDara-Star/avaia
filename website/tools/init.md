# arela init

Bootstrap a repo so it is ready for Arela.

## Usage

```bash
arela init
```

Start the dashboard dev server after init:

```bash
arela init --dashboard
```

## What it does
- Creates/updates `.mcp.json` for the current repo
- Writes the constitution into `AGENTS.md` (from template)
- Writes a Claude-friendly copy into `.claude/CLAUDE.md` (overwrites)
- Copies `prompts/` into the repo
- Scaffolds `website/` (dashboard site) into the repo
- Creates `spec/prd.json` and `spec/stack.json` placeholders
- Creates `SCRATCHPAD.md` if missing
- Creates `task.md` if missing
- Adds `.arela/` and `.mcp.json` to `.gitignore` (if missing)
- Creates `.arelaignore` with privacy defaults
- Writes `.windsurfrules` and `.cursorrules`, and updates `~/.gemini/GEMINI.md` if it exists
- Runs graph indexing first, then vector indexing (Graph → RAG)
- Exports dashboard data to `.arela/dashboard.json` and `website/public/dashboard.json`
- Generates `REPO_SNAPSHOT.md`
- Starts the MCP server in the background
- Optionally starts the dashboard dev server if `--dashboard` is used

## Notes
- Indexing requires Ollama; init will attempt to start it.
- After init, paste your PRD and stack into `spec/prd.json` and `spec/stack.json`.

## Troubleshooting (Native Module)
If graph indexing fails with a `better-sqlite3` architecture error, rebuild the native module in the Arela repo:

```bash
cd /Users/Star/arela
npm rebuild better-sqlite3 --build-from-source
```

Then re-run `arela init` in your target repo.

This only affects Arela’s internal graph DB (`.arela/graph.db`), not your app’s database.
