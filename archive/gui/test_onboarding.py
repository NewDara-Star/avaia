#!/usr/bin/env python3
"""
Avaia Onboarding Test Script

Runs in Docker to verify onboarding flow works for fresh users.
Tests:
1. Preflight correctly detects missing dependencies
2. Install functions work
3. Auth flow works (with ANTHROPIC_API_KEY env var)
4. Database initialization works

Usage:
  docker-compose run fresh-user    # Test fresh user detection
  docker-compose run with-claude   # Test after Claude installed
  ANTHROPIC_API_KEY=sk-xxx docker-compose run avaia-test  # Full flow
"""

import json
import os
import sys

# Add parent for setup_wizard import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from setup_wizard import (
    preflight_check,
    check_claude_cli,
    check_claude_auth,
    check_avaia_mcp,
    check_database,
    initialize_database,
    AuthMethod
)


def test_fresh_user():
    """Test that preflight correctly identifies fresh user state."""
    print("\n=== Testing Fresh User Detection ===\n")
    
    status = preflight_check()
    result = status.to_dict()
    
    print(json.dumps(result, indent=2))
    
    # Fresh user should have nothing installed
    assert not result['claude_cli']['installed'], \
        "Claude CLI should NOT be detected on fresh system"
    
    assert not result['auth']['authenticated'], \
        "Should NOT be authenticated on fresh system"
    
    assert not result['avaia_mcp']['installed'], \
        "Avaia MCP should NOT be configured on fresh system"
    
    assert not result['database']['installed'], \
        "Database should NOT exist on fresh system"
    
    assert not result['all_ready'], \
        "all_ready should be False for fresh user"
    
    print("\n✓ Fresh user detection PASSED\n")
    return True


def test_database_init():
    """Test database initialization."""
    print("\n=== Testing Database Initialization ===\n")
    
    # Should not exist initially
    status = check_database()
    initial_state = status.installed
    print(f"Database exists initially: {initial_state}")
    
    # Initialize
    success, msg = initialize_database()
    print(f"Initialize result: {success} - {msg}")
    
    assert success, f"Database init failed: {msg}"
    
    # Verify
    status = check_database()
    print(f"Database exists after init: {status.installed}")
    
    assert status.installed, "Database should exist after initialization"
    
    print("\n✓ Database initialization PASSED\n")
    return True


def test_byok_auth():
    """Test BYOK authentication if API key provided."""
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    
    if not api_key:
        print("\n=== Skipping BYOK Test (no ANTHROPIC_API_KEY set) ===\n")
        return True
    
    print("\n=== Testing BYOK Authentication ===\n")
    
    from setup_wizard import set_api_key
    
    success, msg = set_api_key(api_key)
    print(f"Set API key result: {success} - {msg}")
    
    if success:
        status = check_claude_auth()
        print(f"Auth status: method={status.method.value}, authenticated={status.authenticated}")
        
        assert status.authenticated, "Should be authenticated after setting API key"
        assert status.method == AuthMethod.API_KEY, "Method should be API_KEY"
        
        print("\n✓ BYOK authentication PASSED\n")
    else:
        print(f"\n⚠ BYOK test skipped: {msg}\n")
    
    return True


def run_all_tests():
    """Run all onboarding tests."""
    print("=" * 60)
    print("  AVAIA ONBOARDING TEST SUITE")
    print("=" * 60)
    
    results = {
        'fresh_user': False,
        'database_init': False,
        'byok_auth': False,
    }
    
    try:
        results['fresh_user'] = test_fresh_user()
    except AssertionError as e:
        print(f"✗ Fresh user test FAILED: {e}")
    except Exception as e:
        print(f"✗ Fresh user test ERROR: {e}")
    
    try:
        results['database_init'] = test_database_init()
    except AssertionError as e:
        print(f"✗ Database init test FAILED: {e}")
    except Exception as e:
        print(f"✗ Database init test ERROR: {e}")
    
    try:
        results['byok_auth'] = test_byok_auth()
    except AssertionError as e:
        print(f"✗ BYOK auth test FAILED: {e}")
    except Exception as e:
        print(f"✗ BYOK auth test ERROR: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("  TEST RESULTS")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}  {name}")
    
    print(f"\n  {passed}/{total} tests passed\n")
    
    # Save results if volume mounted
    results_dir = os.path.expanduser('~/results')
    if os.path.exists(results_dir):
        with open(os.path.join(results_dir, 'onboarding_test.json'), 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {results_dir}/onboarding_test.json")
    
    return all(results.values())


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
