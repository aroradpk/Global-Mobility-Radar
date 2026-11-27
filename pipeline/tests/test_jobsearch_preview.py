import datetime as dt
import json
import unittest
import urllib.error
import tempfile
from pathlib import Path
from jobtracker import jobsearch_preview as preview

NOW = dt.datetime(2026, 11, 25, tzinfo=dt.timezone.utc)
HIT = {'id': '123', 'headline': 'Software Engineer', 'employer': {'name': 'Example'},
       'workplace_address': {'city': 'Stockholm', 'country': 'Sverige'},
       'webpage_url': 'https://arbetsformedlingen.se/platsbanken/annonser/123',
       'publication_date': '2026-11-24', 'application_deadline': '2026-12-01T12:00:00+01:00'}


class JobSearchTests(unittest.TestCase):
    def test_snapshot_contract(self):
        result = preview.snapshot({'hits': [HIT, HIT]}, NOW)
        self.assertEqual(len(result['rows']), 1)
        row = dict(zip(result['fields'], result['rows'][0]))
        self.assertEqual(row['visa'], 'unknown')
        self.assertEqual(row['countries'], ['SE'])
        self.assertEqual(result['evidence'][row['id']]['descriptionCheckedAt'], '')

    def test_rejects_invalid_leads(self):
        for patch in ({'removed': True}, {'application_deadline': '2020-01-01'}, {'application_deadline': None},
                      {'webpage_url': 'https://example.com/job'}, {'workplace_address': {}},
                      {'headline': 'Chef'}, {'employer': None}, {'id': 'a/b'}):
            with self.subTest(patch=patch):
                self.assertEqual(preview.snapshot({'hits': [{**HIT, **patch}]}, NOW)['rows'], [])

    def test_bad_payload(self):
        for data in ({}, {'hits': None}, {'hits': [HIT] * 21}):
            with self.assertRaises(ValueError):
                preview.snapshot(data, NOW)

    def test_allowed_search_only_two_requests(self):
        calls = []
        def get(url, limit):
            calls.append((url, limit))
            return b'User-agent: *\nDisallow:' if len(calls) == 1 else json.dumps({'hits': [HIT]}).encode()
        self.assertEqual(preview.fetch_search('javascript', get)['hits'], [HIT])
        self.assertEqual(len(calls), 2)
        self.assertIn('limit=20', calls[1][0])

    def test_robots_denial(self):
        calls = []
        def get(url, limit):
            calls.append(url)
            return b'User-agent: *\nDisallow: /search'
        with self.assertRaises(ValueError):
            preview.fetch_search('javascript', get)
        self.assertEqual(len(calls), 1)

    def test_robots_failure_and_invalid_query(self):
        def fail(url, limit):
            raise urllib.error.HTTPError(url, 503, 'unavailable', {}, None)
        with self.assertRaises(urllib.error.HTTPError):
            preview.fetch_search('javascript', fail)
        with self.assertRaises(ValueError):
            preview.fetch_search('private profile', fail)

    def test_non_policy_response(self):
        with self.assertRaises(ValueError):
            preview.fetch_search('javascript', lambda *_: b'<html>login</html>')

    def test_redirect_refused(self):
        self.assertIsNone(preview.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://example.com'))

    def test_refresh_merges_fixed_queries_without_duplicates(self):
        calls = []
        def get(url, limit):
            calls.append(url)
            return b'User-agent: *\nDisallow:' if url.endswith('/robots.txt') else json.dumps({'hits': [HIT]}).encode()
        result = preview.refresh(get, NOW)
        self.assertEqual(len(calls), 6)
        self.assertEqual(len(result['rows']), 1)

    def test_refresh_failure_preserves_previous_snapshot_and_reports_unknown(self):
        with tempfile.TemporaryDirectory() as d:
            out, health = Path(d) / 'jobs.json', Path(d) / 'health.json'
            out.write_text('previous')
            def fail(url, limit):
                raise urllib.error.URLError('synthetic failure')
            self.assertFalse(preview.run_refresh(out, health, fail, NOW))
            self.assertEqual(out.read_text(), 'previous')
            self.assertEqual(json.loads(health.read_text())['coverage'], 'unknown')

    def test_refresh_successful_empty_is_not_exhaustive(self):
        with tempfile.TemporaryDirectory() as d:
            out, health = Path(d) / 'jobs.json', Path(d) / 'health.json'
            def get(url, limit):
                return b'User-agent: *\nDisallow:' if url.endswith('/robots.txt') else b'{"hits":[]}'
            self.assertTrue(preview.run_refresh(out, health, get, NOW))
            self.assertEqual(json.loads(health.read_text())['coverage'], 'bounded_search_not_exhaustive')
            self.assertEqual(json.loads(out.read_text())['rows'], [])
