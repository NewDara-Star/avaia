#!/usr/bin/env node

/**
 * Avaia CLI Wrapper
 * Wraps Claude Code and injects timing metadata for emotional state inference
 */

import { spawn } from 'child_process';
import * as readline from 'readline';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

// =============================================================================
// Configuration
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_DIR = join(homedir(), '.avaia');
const SYSTEM_PROMPT_PATH = join(CONFIG_DIR, 'system-prompt.md');
const DB_PATH = join(CONFIG_DIR, 'avaia.db');

// =============================================================================
// Session State
// =============================================================================

interface SessionState {
    sessionId: string;
    startTime: number;
    lastMessageTime: number;
    messageCount: number;
}

function generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `sess_${timestamp}${random}`;
}

function initSession(): SessionState {
    return {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        lastMessageTime: Date.now(),
        messageCount: 0,
    };
}

// =============================================================================
// Timing Metadata
// =============================================================================

interface MessageMetadata {
    timestamp: string;
    session_id: string;
    time_since_last_message_ms: number;
    session_duration_ms: number;
    message_number: number;
}

function getTimingMetadata(state: SessionState): MessageMetadata {
    const now = Date.now();
    const metadata: MessageMetadata = {
        timestamp: new Date(now).toISOString(),
        session_id: state.sessionId,
        time_since_last_message_ms: now - state.lastMessageTime,
        session_duration_ms: now - state.startTime,
        message_number: state.messageCount + 1,
    };
    state.lastMessageTime = now;
    state.messageCount++;
    return metadata;
}

function injectMetadata(message: string, metadata: MessageMetadata): string {
    return `<message_context>
${JSON.stringify(metadata, null, 2)}
</message_context>

${message}`;
}

// =============================================================================
// CLI Commands
// =============================================================================

async function init(): Promise<void> {
    console.log('Initializing Avaia...\n');

    // Create config directory
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
        console.log(`Created: ${CONFIG_DIR}`);
    }

    // Copy system prompt template
    const systemPromptSource = join(__dirname, '..', 'prompts', 'system.md');
    if (existsSync(systemPromptSource)) {
        copyFileSync(systemPromptSource, SYSTEM_PROMPT_PATH);
        console.log(`Created: ${SYSTEM_PROMPT_PATH}`);
    } else {
        // Create a minimal system prompt
        const minimalPrompt = `# Avaia System Prompt v4.0

You are Avaia, a proactive AI programming teacher. You guide learners through building real applications, introducing concepts exactly when their project requires them.

## Core Philosophy

1. **Project-First**: Concepts are taught THROUGH building, not before.
2. **Just-In-Time**: Teach concepts at the moment of need.
3. **Productive Failure**: Before complex concepts, trigger Sandbox problems designed to fail.
4. **Anti-Sycophancy**: Never validate without verification.

## Session Structure

Each session follows these phases:
1. CHECK-IN: Call get_current_time(), get_project_state(), get_due_reviews()
2. GOAL: Call get_next_step() to determine priority
3. SANDBOX: Check trigger_sandbox() before complex concepts
4. BUILD: Learner works on project, use get_hint() for scaffolding
5. VERIFICATION: Use get_diagnostic_question() and verify_concept()
6. REFLECTION: Call get_exit_ticket() and log_session()

## Anti-Sycophancy Rules

NEVER:
- Start with "Great question!" or "You're right!"
- Provide code before they demonstrate understanding
- Skip verification to save time

ALWAYS:
- Ask clarifying questions before answering
- Challenge assumptions that seem off
- Require explanation before implementation

## Tool Usage

Always use tools — never guess about:
- Time: get_current_time()
- Learner state: get_project_state()
- Reviews due: get_due_reviews()
- Hints: get_hint() (respects independence level)

Remember: The struggle IS the learning.
`;
        writeFileSync(SYSTEM_PROMPT_PATH, minimalPrompt);
        console.log(`Created: ${SYSTEM_PROMPT_PATH}`);
    }

    console.log(`\n✅ Avaia initialized!`);
    console.log(`\nTo start: avaia`);
    console.log(`\nFor Claude Code integration, add to settings.json:`);
    console.log(`{
  "mcpServers": {
    "avaia": {
      "command": "node",
      "args": ["${join(__dirname, '..', 'server', 'index.js')}"]
    }
  }
}`);
}

async function main(): Promise<void> {
    // Ensure config exists
    if (!existsSync(SYSTEM_PROMPT_PATH)) {
        console.error('Avaia not initialized. Run: avaia init');
        process.exit(1);
    }

    const session = initSession();
    console.log(`\n🧠 Starting Avaia session: ${session.sessionId}`);
    console.log('---\n');

    // Spawn Claude Code with system prompt
    const claudeArgs = [
        '--append-system-prompt', SYSTEM_PROMPT_PATH,
    ];

    const claude = spawn('claude', claudeArgs, {
        stdio: ['pipe', 'inherit', 'inherit'],
    });

    claude.on('error', (err) => {
        console.error('\nError starting Claude:', err.message);
        console.error('Make sure Claude Code CLI is installed: npm install -g @anthropic-ai/claude-code');
        process.exit(1);
    });

    // Handle user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'You: ',
    });

    rl.prompt();

    rl.on('line', (line) => {
        const trimmed = line.trim();

        if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
            console.log('\nEnding session...');
            claude.stdin?.write('/exit\n');
            rl.close();
            return;
        }

        // Inject timing metadata
        const metadata = getTimingMetadata(session);
        const enrichedMessage = injectMetadata(trimmed, metadata);

        // Send to Claude
        claude.stdin?.write(enrichedMessage + '\n');

        rl.prompt();
    });

    rl.on('close', () => {
        const durationMin = Math.round((Date.now() - session.startTime) / 60000);
        console.log(`\n📊 Session ${session.sessionId} ended.`);
        console.log(`   Duration: ${durationMin} minutes`);
        console.log(`   Messages: ${session.messageCount}`);
        process.exit(0);
    });

    // Handle Claude exit
    claude.on('exit', () => {
        rl.close();
    });
}

// =============================================================================
// Entry Point
// =============================================================================

const command = process.argv[2];

if (command === 'init') {
    init().catch(console.error);
} else {
    main().catch(console.error);
}
