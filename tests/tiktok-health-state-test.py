import base64
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import tiktok_health_state as policy

spec = importlib.util.spec_from_file_location('store', Path(__file__).resolve().parents[1] / 'scripts/tiktok-health-store.py')
store = importlib.util.module_from_spec(spec)
spec.loader.exec_module(store)

BASE = 1794211200
BAD, GOOD = '11111111', '22222222'


def cycle(state, hour, run=None, status='unavailable', code=1001, reason='invalid_video', healthy=True):
    run = run or str(hour)
    at = BASE + hour * 3600
    rows = [{'id': BAD, 'status': status, 'code': code, 'reason': reason, 'checkedAt': policy.iso(at), 'attemptRun': run}]
    if healthy:
        rows.append({'id': GOOD, 'status': 'played', 'reason': 'time_advanced', 'seconds': 2, 'checkedAt': policy.iso(at), 'attemptRun': run})
    return policy.finalize(state, rows, run, policy.iso(at), 'complete', at)


class EvidenceTests(unittest.TestCase):
    def test_three_spaced_confirmations_hide_and_success_restores(self):
        state = policy.empty()
        for hour in [0, 6]:
            state = cycle(state, hour)
            self.assertEqual(policy.manifest(state)['entries'], [])
        state = cycle(state, 12)
        self.assertEqual([x['id'] for x in policy.manifest(state)['entries']], [BAD])
        state = cycle(state, 18, status='played', code=None, reason='time_advanced')
        self.assertEqual(policy.manifest(state)['entries'], [])
        self.assertEqual(state['records'][BAD]['confirmations'], 0)

    def test_same_run_and_rapid_retries_cannot_multiply_confirmations(self):
        state = cycle(policy.empty(), 0, run='one')
        state = cycle(state, 1, run='two')
        state = cycle(state, 6, run='one')
        self.assertEqual(state['records'][BAD]['confirmations'], 1)
        state = cycle(state, 12, run='three')
        self.assertEqual(state['records'][BAD]['confirmations'], 2)

    def test_uncertain_results_never_hide_even_repeatedly(self):
        for reason, code in [('rate_limit', 2005), ('server_error', 2001), ('autoplay', 3002), ('timeout', None), ('provider_access', None)]:
            state = policy.empty()
            for hour in [0, 6, 12, 18]:
                state = cycle(state, hour, status='unknown', reason=reason, code=code)
            self.assertEqual(policy.manifest(state)['entries'], [])
            self.assertEqual(state['records'][BAD]['confirmations'], 0)

    def test_rerunning_an_older_job_after_another_confirmation_is_not_a_third_check(self):
        state = cycle(policy.empty(), 0, run='one')
        state = cycle(state, 6, run='two')
        state = cycle(state, 12, run='one')
        self.assertEqual(state['records'][BAD]['confirmations'], 2)
        self.assertEqual(policy.manifest(state)['entries'], [])

    def test_no_healthy_control_means_no_automatic_withdrawal(self):
        state = policy.empty()
        for hour in [0, 6, 12]:
            state = cycle(state, hour, healthy=False)
        self.assertEqual(state['records'][BAD]['confirmations'], 0)
        self.assertEqual(policy.manifest(state)['entries'], [])

    def test_wrong_error_code_does_not_count_as_confirmed(self):
        state = policy.empty()
        for hour in [0, 6, 12]:
            state = cycle(state, hour, code=2001)
        self.assertEqual(state['records'][BAD]['confirmations'], 0)

    def test_success_between_failures_resets_the_series(self):
        state = cycle(cycle(policy.empty(), 0), 6)
        state = cycle(state, 12, status='played', reason='time_advanced', code=None)
        state = cycle(state, 18)
        self.assertEqual(state['records'][BAD]['confirmations'], 1)
        self.assertEqual(policy.manifest(state)['entries'], [])

    def test_resume_prioritizes_untested_rows_then_old_results(self):
        state = cycle(policy.empty(), 0)
        rows = policy.entries([{'id': BAD}, {'id': GOOD}, {'id': '33333333'}], state)
        self.assertEqual([r['id'] for r in policy.due(rows, BASE + 7 * 3600)], ['33333333', BAD])
        self.assertEqual(len(policy.due(rows, BASE + 8 * 86400)), 3)
        self.assertEqual(rows[1]['status'], 'played')

    def test_no_new_attempt_preserves_existing_hidden_evidence(self):
        state = cycle(cycle(cycle(policy.empty(), 0), 6), 12)
        rows = policy.entries([{'id': BAD}, {'id': GOOD}], state)
        new = policy.finalize(state, rows, 'idle', policy.iso(BASE + 13 * 3600), 'up_to_date', BASE + 13 * 3600)
        self.assertEqual(new['records'], state['records'])
        self.assertEqual(len(policy.manifest(new)['entries']), 1)

    def test_provider_denial_enforces_persistent_cooldown(self):
        state = policy.finalize(policy.empty(), [], 'run', policy.iso(BASE), 'rate_limit', BASE)
        self.assertEqual(policy.epoch(state['notBefore']), BASE + 86400)

    def test_longer_provider_retry_after_is_respected(self):
        rows = [{'id': BAD, 'attemptRun': 'run', 'status': 'unknown', 'reason': 'rate_limit', 'checkedAt': policy.iso(BASE), 'retryAfterSeconds': 3 * 86400}]
        state = policy.finalize(policy.empty(), rows, 'run', policy.iso(BASE), 'rate_limit', BASE)
        self.assertEqual(policy.epoch(state['notBefore']), BASE + 3 * 86400)

    def test_history_round_trip_and_corruption_stop(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            state = cycle(policy.empty(), 0)
            policy.save(state, root)
            self.assertEqual(policy.load(root / 'state.json'), state)
            (root / 'state.json').write_text('{"version":2,"records":{"evil":{}}}')
            with self.assertRaises(ValueError):
                policy.load(root / 'state.json')


class StoreTests(unittest.TestCase):
    def test_publication_only_touches_data_branch_and_two_fixed_files(self):
        calls = []
        def api(method, path, data=None):
            calls.append((method, path, data))
            if method == 'GET': return {'object': {'sha': 'base'}}
            return {'sha': 'new'}
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {'GITHUB_REF': 'refs/heads/main'}):
            root = Path(directory)
            policy.save(cycle(policy.empty(), 0), root)
            (root / 'base.json').write_text('{"sha":"base"}')
            store.publish(root, root, api)
        tree = next(data for method, path, data in calls if path == '/git/trees')
        self.assertEqual([r['path'] for r in tree['tree']], ['state.json', 'hidden.json'])
        self.assertEqual(calls[-1], ('PATCH', '/git/refs/heads/' + store.BRANCH, {'sha': 'new', 'force': False}))

    def test_competing_update_and_untrusted_branch_cannot_publish(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            policy.save(cycle(policy.empty(), 0), root)
            (root / 'base.json').write_text('{"sha":"old"}')
            with patch.dict(os.environ, {'GITHUB_REF': 'refs/heads/main'}):
                with self.assertRaises(ValueError):
                    store.publish(root, root, lambda *args: {'object': {'sha': 'new'}})
            with patch.dict(os.environ, {'GITHUB_REF': 'refs/heads/feature'}):
                with self.assertRaises(ValueError):
                    store.publish(root, root, lambda *args: self.fail('No API call allowed'))

    def test_restore_pins_data_to_observed_commit_and_rejects_corruption(self):
        calls = []
        def api(method, path, data=None):
            calls.append(path)
            if '/git/ref/' in path: return {'object': {'sha': 'snapshot'}}
            return {'encoding': 'base64', 'content': base64.b64encode(json.dumps(policy.empty()).encode()).decode()}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            store.restore(root, api)
            self.assertEqual(policy.load(root / 'state.json'), policy.empty())
            self.assertIn('/contents/state.json?ref=snapshot', calls)


if __name__ == '__main__':
    unittest.main()
