# Avaia

**Proactive AI Programming Teacher**

Avaia is an MCP server that transforms Claude into a pedagogically-informed programming tutor. It uses spaced repetition (FSRS-5), designed productive failure, and adaptive scaffolding to create lasting learning.

## Features

- **Invisible Spaced Repetition**: Fight the forgetting curve without flashcard fatigue
- **Designed Productive Failure**: Sandbox problems that force failure before instruction
- **Diagnostic Assessment**: Code prediction tasks that reveal specific misconceptions
- **Confidence Tracking**: Leverage the hypercorrection effect for stubborn bugs
- **Adaptive Scaffolding**: Progressive hint reduction as competence grows
- **Emotional State Inference**: Detect frustration and disengagement from timing patterns

## Installation

```bash
npm install -g avaia
```

## Quick Start

```bash
# 1. Initialize Avaia (creates ~/.avaia directory)
avaia init

# 2. Seed the database with curriculum
cd ~/.avaia
npx avaia-seed  # or manually: node -e "..."

# 3. Configure Claude Code
# Add to your Claude Code MCP settings:
```

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "avaia": {
      "command": "npx",
      "args": ["avaia-server"]
    }
  }
}
```

## Usage

Once configured, Claude Code will have access to 42 pedagogical tools including:

- `get_next_step` - Weakness-aware next action
- `trigger_sandbox` - Designed failure exercises
- `get_diagnostic_question` - Code prediction tasks
- `infer_emotional_state` - Timing-based emotional detection
- `get_hint` - Independence-based scaffolding
- `log_review` - FSRS spaced repetition

## CLI Commands

```bash
avaia init    # Initialize ~/.avaia directory
avaia         # Start learning session (wraps Claude Code)
```

## How It Works

1. **You build real projects** (Memory Game → Task Tracker → Weather Dashboard → ...)
2. **Concepts are taught just-in-time** when your project needs them
3. **You fail productively** through sandbox exercises before complex topics
4. **Your understanding is verified** through code prediction, not self-assessment
5. **Knowledge is retained** through invisible spaced repetition

## Philosophy

Traditional tutorials teach concepts first, then apply them. Avaia inverts this:

> The project IS the curriculum. Concepts are discovered through necessity.

Based on research in:
- Situated Cognition (Lave & Wenger)
- Productive Failure (Manu Kapur)
- Desirable Difficulties (Bjork)
- Spaced Repetition (FSRS-5)

## Development

```bash
git clone https://github.com/yourusername/avaia
cd avaia
npm install
npm run build
npm run db:seed
```

## License

MIT
