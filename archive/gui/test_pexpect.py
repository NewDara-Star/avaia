#!/usr/bin/env python3
"""Quick test of pexpect with Claude"""

import pexpect
import sys
import time

claude_path = '/opt/homebrew/bin/claude'

print(f"Spawning Claude from {claude_path}...")

child = pexpect.spawn(claude_path, encoding='utf-8', dimensions=(40, 120))

print("Waiting for initial output...")

# Read initial output
time.sleep(2)

try:
    output = child.read_nonblocking(size=10000, timeout=2)
    print(f"Initial output ({len(output)} chars):")
    print(repr(output[:500]))
except pexpect.TIMEOUT:
    print("No initial output (timeout)")
except Exception as e:
    print(f"Error: {e}")

print("\nSending 'hi'...")
child.sendline("hi")

print("Waiting for response...")
time.sleep(3)

try:
    output = child.read_nonblocking(size=10000, timeout=5)
    print(f"Response ({len(output)} chars):")
    print(repr(output[:1000]))
except pexpect.TIMEOUT:
    print("No response (timeout)")
except Exception as e:
    print(f"Error: {e}")

print("\nTerminating...")
child.terminate()
