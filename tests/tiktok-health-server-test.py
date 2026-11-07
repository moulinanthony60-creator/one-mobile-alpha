import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('health', Path(__file__).resolve().parents[1] / 'scripts/tiktok-health-server.py')
health = importlib.util.module_from_spec(spec)
spec.loader.exec_module(health)


class HealthTests(unittest.TestCase):
    def test_all_pages_and_duplicates(self):
        urls = []
        def fetch(url):
            urls.append(url)
            return {'ok': True, 'entries': [{'id': '11111111'}, {'id': '22222222'}], 'cursor': 'a/b?x=1'} if len(urls) == 1 else {'ok': True, 'entries': [{'id': '22222222'}, {'id': '33333333'}]}
        rows = health.load_catalogue(fetch)
        self.assertEqual(len(rows), 3)
        self.assertEqual(urls[1], health.CATALOGUE + '?cursor=a%2Fb%3Fx%3D1')

    def test_denied_or_malformed_catalogue_is_not_empty_success(self):
        for value in [{}, {'ok': False, 'entries': []}, {'ok': True, 'entries': {}}, {'ok': True, 'entries': [{'id': 7703998251745266976}]}, {'ok': True, 'entries': [{'id': 'https://evil.test'}]}]:
            with self.assertRaises(health.CatalogueError):
                health.load_catalogue(lambda url: value)

    def test_cursor_loop_and_invalid_cursor(self):
        for cursor in ['repeat', 5, 'x' * 4097]:
            with self.assertRaises(health.CatalogueError):
                health.load_catalogue(lambda url: {'ok': True, 'entries': [], 'cursor': cursor})

    def test_real_empty_catalogue(self):
        self.assertEqual(health.load_catalogue(lambda url: {'ok': True, 'entries': []}), [])

    def test_all_entries_are_tested_serially_and_paced(self):
        rows = [{'id': str(11111111 + i), 'status': 'pending'} for i in range(3)]
        sleeps, probes, checkpoints = [], [], []
        def probe(row):
            probes.append(row['id'])
            return {'status': 'played', 'reason': 'time_advanced'}
        self.assertEqual(health.scan(rows, probe, sleep=sleeps.append, checkpoint=lambda: checkpoints.append(1)), 'complete')
        self.assertEqual(sleeps, [3, 3])
        self.assertEqual(len(probes), len(checkpoints))
        self.assertEqual(health.totals(rows)['checked'], 3)

    def test_probe_does_not_claim_whole_catalogue_checked(self):
        rows = [{'id': str(11111111 + i), 'status': 'pending'} for i in range(3)]
        reason = health.scan(rows, lambda row: {'status': 'played'}, limit=1, sleep=lambda n: self.fail('no delay after probe'))
        self.assertEqual(reason, 'probe')
        self.assertEqual(health.totals(rows)['pending'], 2)

    def test_access_denial_stops_without_retries(self):
        rows = [{'id': str(11111111 + i), 'status': 'pending'} for i in range(3)]
        reason = health.scan(rows, lambda row: {'status': 'unknown', 'reason': 'provider_access'})
        self.assertEqual(reason, 'provider_access')
        self.assertEqual(health.totals(rows)['pending'], 2)
        self.assertEqual(health.totals(rows)['unavailable'], 0)

    def test_repeated_uncertainty_stops_instead_of_hammering_provider(self):
        rows = [{'id': str(11111111 + i), 'status': 'pending'} for i in range(10)]
        self.assertEqual(health.scan(rows, lambda row: {'status': 'unknown'}, sleep=lambda n: None), 'repeated_unknown')
        self.assertEqual(health.totals(rows)['pending'], 2)

    def test_time_budget_and_unexpected_results_remain_explicit(self):
        rows = [{'id': '11111111', 'status': 'pending'}]
        times = iter([0, 20])
        self.assertEqual(health.scan(rows, lambda row: self.fail('out of budget'), budget=10, clock=lambda: next(times)), 'time_budget')
        self.assertEqual(health.totals(rows)['checked'], 0)
        health.scan(rows, lambda row: None)
        self.assertEqual(rows[0]['status'], 'unknown')

    def test_reports_keep_unchecked_rows_and_unknown_catalogue_count(self):
        report = {'startedAt': '2026-11-07', 'state': 'catalogue_blocked', 'catalogueLoaded': False, 'entries': []}
        with tempfile.TemporaryDirectory() as tmp:
            health.write_report(report, Path(tmp))
            self.assertIsNone(report['counts'])
            self.assertIn('nombre de vidéos est inconnu', (Path(tmp) / 'report.md').read_text())
            report.update(catalogueLoaded=True, entries=[{'id': '11111111', 'status': 'pending'}])
            health.write_report(report, Path(tmp))
            self.assertEqual(report['counts']['pending'], 1)
            self.assertIn('0 / 1 testées', (Path(tmp) / 'report.md').read_text())


if __name__ == '__main__':
    unittest.main()
