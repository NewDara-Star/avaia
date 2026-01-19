# Avaia Setup System Feature Checklist

Testing each feature in Docker fresh-user environment.

## Preflight Checks

| # | Feature | Works | Implementation | Error Handling | Notes |
|---|---------|-------|----------------|----------------|-------|
| 1 | Claude CLI Detection | ✓ | ✓ | ✓ | Shows ✗ icon, error="Claude CLI not found in PATH", path=null, version=null |
| 2 | Auth Detection (BYOK) | ✓ | ✓ | ✓ | Shows ✗ with "none" when not authed |
| 3 | Auth Detection (Login) | ✓ | ✓ | ✓ | Correctly reports "none" method |
| 4 | Avaia MCP Detection | ✓ | ✓ | ✓ | Shows ✗ when CLI not installed |
| 5 | Database Detection | ✓ | ✓ | ✓ | Shows ✗, path shows expected location |

## Installers

| # | Feature | Works | Implementation | Error Handling | Notes |
|---|---------|-------|----------------|----------------|-------|
| 6 | Install Claude CLI | ✓ | ✓ | ✓ | **FIXED:** Added `find_claude_cli()` helper. Now detects CLI at ~/.local/bin/claude |
| 7 | BYOK Auth (set API key) | ✓ | ✓ | ✓ | Validates format (rejects non-sk- keys), validates with API (rejects fake keys), env var detection works |
| 8 | Claude Login Flow | ⏳ | ⏳ | ⏳ | |
| 9 | Configure Avaia MCP | ✓ | ✓ | ✓ | **FIXED:** Changed bin to point to MCP server. `avaia-teach` for CLI wrapper. Requires npm publish |
| 10 | Initialize Database | ✓ | ✓ | ✓ | Creates ~/.avaia/avaia.db with 17 tables from migrations. Seeding skipped gracefully in Docker |

## UI Flow

| # | Feature | Works | Implementation | Error Handling | Notes |
|---|---------|-------|----------------|----------------|-------|
| 11 | Setup wizard renders | ⏳ | ⏳ | ⏳ | |
| 12 | Status updates UI | ⏳ | ⏳ | ⏳ | |
| 13 | Step navigation | ⏳ | ⏳ | ⏳ | |
| 14 | Redirect to chat when ready | ⏳ | ⏳ | ⏳ | |

## Legend
- ⏳ Not tested yet
- ✓ Works correctly
- ✗ Broken / needs fix
- ⚠️ Works with issues

---

## Bug Fixed: PATH Issue

### PATH Issue in `setup_wizard.py` - RESOLVED

**Problem:** 5 functions used `shutil.which("claude")` which only checks PATH, but the Claude installer places the binary at `~/.local/bin/claude` which isn't in the default PATH.

**Solution:** Added `find_claude_cli()` helper function that checks:
1. PATH (via `shutil.which`)
2. `~/.local/bin/claude`
3. `~/.claude/local/claude`
4. `/usr/local/bin/claude`

**Functions Updated:**
- `check_claude_cli()`
- `check_claude_auth()`
- `check_avaia_mcp()`
- `configure_avaia_mcp()`
- `login_claude()`

**Test Result:** CLI now correctly detected at `/home/testuser/.local/bin/claude` after install.

---

## Bug Fixed: MCP bin Entry

### MCP Server Not Running - RESOLVED

**Problem:** `package.json` bin pointed to CLI wrapper instead of MCP server:
```json
"bin": { "avaia": "dist/client/index.js" }  // Wrong!
```

**Solution:** Changed bin to point to MCP server, renamed CLI wrapper:
```json
"bin": {
  "avaia": "dist/server/index.js",        // MCP server (for claude mcp add)
  "avaia-teach": "dist/client/index.js"   // CLI wrapper (optional)
}
```

**Also added:** Shebang `#!/usr/bin/env node` to `src/server/index.ts`

**Test Result:** MCP server now starts correctly:
```
Applying migration: 001_initial.sql → 004_chat_history.sql
Database initialized successfully
All tools registered
Avaia MCP Server running on stdio
```

**Action Required:** Run `npm publish` to push fix to npm registry.
