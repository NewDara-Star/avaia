# Avaia

**Proactive AI Programming Teacher**

Avaia is a native desktop app that transforms Claude into a pedagogically-informed programming tutor. It uses spaced repetition (FSRS-5), designed productive failure, and adaptive scaffolding to create lasting learning.

## Features

- **49 Pedagogical Tools** — Complete tool suite for session, content, verification, SRS, sandbox, and track management
- **7 Learning Tracks** — JavaScript Web, Python Data, C Systems, DSA, CS Theory, ML Engineering, and more
- **Invisible Spaced Repetition** — FSRS-5 algorithm fights the forgetting curve without flashcard fatigue
- **Designed Productive Failure** — Sandbox problems force failure before instruction
- **Dynamic Content Generation** — AI-generated questions, hints, and exercises based on learner's actual code
- **Diagnostic Assessment** — Code prediction tasks that reveal specific misconceptions
- **Confidence Tracking** — Leverage the hypercorrection effect for stubborn bugs
- **Adaptive Scaffolding** — Progressive hint reduction as competence grows
- **Emotional State Inference** — Detect frustration and disengagement from timing patterns
- **Complete Chat History** — Auto-logged conversations for debugging and session continuity
- **Semantic Trigger Phrases** — Natural language cues automatically invoke appropriate tools

## What's New in v1.4.0

### New Software Engineering Track
- **12 new projects** — From Naval Combat Simulator to Distributed Systems
- **4-tier progression** — Logic & Linear Breakdown → Modular Decomposition → Architectural Abstraction → System Design & Trade-offs
- **Productive Failure pedagogy** — Learn design patterns by encountering the problems they solve
- **Real-world architecture** — Build games, parsers, web servers, microservices, and distributed systems

### Direct API Architecture (No CLI Required)
- **Faster response times** — Direct Anthropic API calls (~1 second with Haiku vs multi-second CLI overhead)
- **Simpler setup** — Just need an API key, no Claude CLI installation required
- **Built-in tools** — All 49 tools implemented in Python, no MCP server needed
- **Model switching** — Easily switch between Haiku (fast), Sonnet (balanced), and Opus (powerful)

### Native Desktop App
- **One-click installer** — Native app bundle with embedded WebKit (PyWebView)
- **Streamlined Setup Wizard** — Just enter your API key to get started
- **Dashboard pages** — Track progress, reviews, projects, and learning stats
- **Auto-migrations** — Database schema updates automatically on app start

## Installation

### Option 1: Desktop App (Recommended)

Download `Avaia.app` from the releases page and drag to Applications. The setup wizard will:
1. Ask for your Anthropic API key
2. Initialize the learning database

Or build from source:

```bash
cd gui
pip install -r requirements.txt
python server_webview.py        # Run in dev mode
# OR
./build_webview.sh              # Build native app → dist/Avaia.app
```

### Option 2: Web Browser

Run the server and access via browser:

```bash
cd gui
pip install -r requirements.txt
python server_webview.py
# Opens http://127.0.0.1:PORT automatically
```

### Getting an API Key

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Enter it in the Avaia setup wizard

Your API key is stored locally at `~/.avaia/api_key` and never sent anywhere except to Anthropic's API.

## Usage

Once configured, you can chat with Avaia to learn programming. The AI has access to 49 pedagogical tools including:

- `start_session` / `end_session` — Session lifecycle management
- `get_next_step` — Weakness-aware next action
- `trigger_sandbox` — Designed failure exercises
- `get_diagnostic_question` — Code prediction tasks
- `infer_emotional_state` — Timing-based emotional detection
- `get_hint` — Independence-based scaffolding
- `log_review` — FSRS spaced repetition
- `select_track` — Change learning track

## GUI Features

The desktop app includes:

- **Setup Wizard** — Streamlined onboarding (just need API key)
- **Dashboard** — Stats overview with time, concepts, streak tracking
- **My Learning** — Mastered vs learning concepts, vocabulary
- **Projects** — Track progress through milestones
- **Reviews** — Interactive SRS cards with code snippets
- **Chat Interface** — Real-time streaming with syntax highlighting
- **Model Selector** — Switch between Haiku/Sonnet/Opus

## Learning Tracks

Avaia includes 8 pre-seeded learning tracks:

| Track | Language | Focus |
|-------|----------|-------|
| JavaScript Web Development | JavaScript | DOM, events, async, full-stack |
| Python Data Science | Python | pandas, numpy, visualization |
| C Systems Programming | C | Memory, pointers, systems |
| Software Engineering Fundamentals | JavaScript | Design patterns, architecture, distributed systems |
| Data Structures & Algorithms | Language-agnostic | Core CS fundamentals |
| CS Theory | Theory | Complexity, automata, proofs |
| ML Engineering | Python | PyTorch, training, deployment |
| Avaia Core | JavaScript | The default beginner track |

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

## Architecture

Avaia uses a direct Anthropic API architecture:

```
┌─────────────────────────────────────────────────────┐
│                  Avaia Desktop App                  │
├─────────────────────────────────────────────────────┤
│  PyWebView (Native WebKit)                          │
│  ├── Flask Server (backend)                         │
│  │   ├── Socket.IO (real-time chat)                 │
│  │   ├── REST API (dashboard, reviews)              │
│  │   └── SQLite (learner data, curriculum)          │
│  └── avaia_tools.py (49 learning tools)             │
├─────────────────────────────────────────────────────┤
│  Anthropic API (Claude Haiku/Sonnet/Opus)           │
│  ├── Direct API calls (no CLI overhead)             │
│  ├── Tool calling (function execution)              │
│  └── Streaming responses                            │
└─────────────────────────────────────────────────────┘
```

## Development

```bash
git clone https://github.com/NewDara-Star/avaia
cd avaia

# Run the desktop app in dev mode
cd gui
pip install -r requirements.txt
python server_webview.py

# Run tests
python test_tools.py
```

## License

MIT
