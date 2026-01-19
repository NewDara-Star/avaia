#!/usr/bin/env python3
"""
Quick test of Avaia core tools with Haiku model.
Tests the Python tool implementations directly.
"""

import os
import sys

# Add gui directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from avaia_tools import execute_tool, TOOL_DEFINITIONS

def test_tools():
    """Test core Avaia tools."""
    print(f"\n{'='*60}")
    print(f"AVAIA TOOLS TEST")
    print(f"{'='*60}")
    print(f"\nTotal tools available: {len(TOOL_DEFINITIONS)}")

    # List all tool names
    tool_names = [t['name'] for t in TOOL_DEFINITIONS]
    print(f"\nTools: {', '.join(tool_names[:10])}... and {len(tool_names)-10} more")

    results = []

    # Test 1: get_current_time
    print(f"\n{'-'*40}")
    print("Test 1: get_current_time")
    result = execute_tool('get_current_time', {})
    print(f"Result: {result}")
    results.append(('get_current_time', 'error' not in result))

    # Test 2: get_learning_tracks
    print(f"\n{'-'*40}")
    print("Test 2: get_learning_tracks")
    result = execute_tool('get_learning_tracks', {})
    print(f"Result: {result}")
    results.append(('get_learning_tracks', 'error' not in result))

    # Test 3: create_learner
    print(f"\n{'-'*40}")
    print("Test 3: create_learner")
    result = execute_tool('create_learner', {'name': 'Test User'})
    print(f"Result: {result}")
    learner_id = result.get('learner_id')
    results.append(('create_learner', learner_id is not None))

    if learner_id:
        # Test 4: get_learner_profile
        print(f"\n{'-'*40}")
        print("Test 4: get_learner_profile")
        result = execute_tool('get_learner_profile', {'learner_id': learner_id})
        print(f"Result: {result}")
        results.append(('get_learner_profile', result.get('name') == 'Test User'))

        # Test 5: start_session
        print(f"\n{'-'*40}")
        print("Test 5: start_session")
        result = execute_tool('start_session', {'learner_id': learner_id})
        print(f"Result keys: {list(result.keys())}")
        session_id = result.get('session_id')
        results.append(('start_session', session_id is not None))

        if session_id:
            # Test 6: get_project_state
            print(f"\n{'-'*40}")
            print("Test 6: get_project_state")
            result = execute_tool('get_project_state', {'learner_id': learner_id})
            print(f"Result: {result}")
            results.append(('get_project_state', 'has_project' in result))

            # Test 7: get_due_reviews
            print(f"\n{'-'*40}")
            print("Test 7: get_due_reviews")
            result = execute_tool('get_due_reviews', {'learner_id': learner_id})
            print(f"Result: {result}")
            results.append(('get_due_reviews', 'due_count' in result))

            # Test 8: get_stubborn_bugs
            print(f"\n{'-'*40}")
            print("Test 8: get_stubborn_bugs")
            result = execute_tool('get_stubborn_bugs', {'learner_id': learner_id})
            print(f"Result: {result}")
            results.append(('get_stubborn_bugs', 'count' in result))

            # Test 9: get_known_terms
            print(f"\n{'-'*40}")
            print("Test 9: get_known_terms")
            result = execute_tool('get_known_terms', {'learner_id': learner_id})
            print(f"Result: {result}")
            results.append(('get_known_terms', 'term_count' in result))

            # Test 10: get_next_step
            print(f"\n{'-'*40}")
            print("Test 10: get_next_step")
            result = execute_tool('get_next_step', {'learner_id': learner_id})
            print(f"Result: {result}")
            results.append(('get_next_step', 'action' in result))

            # Test 11: end_session
            print(f"\n{'-'*40}")
            print("Test 11: end_session")
            result = execute_tool('end_session', {
                'session_id': session_id,
                'learner_id': learner_id,
                'session_notes': 'Test session completed successfully.'
            })
            print(f"Result: {result}")
            results.append(('end_session', result.get('notes_saved') == True))

    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")

    passed = sum(1 for _, success in results if success)
    total = len(results)

    for name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"  {status}: {name}")

    print(f"\n{passed}/{total} tests passed")

    return passed == total


if __name__ == '__main__':
    success = test_tools()
    sys.exit(0 if success else 1)
