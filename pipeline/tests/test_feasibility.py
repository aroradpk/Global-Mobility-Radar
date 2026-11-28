import unittest
from jobtracker import feasibility
from tests.test_jobsearch_preview import HIT, NOW

class FeasibilityTests(unittest.TestCase):
    def test_three_searches_dedup_and_no_confirmed_claim(self):
        h = {**HIT, "headline":"Senior Software Engineer", "description":{"text":"JavaScript and React. Visa sponsorship is available."}}
        report, sample = feasibility.observe(lambda _: {"hits":[h,h]}, NOW)
        self.assertEqual(report["checksSucceeded"], 3)
        self.assertEqual(report["rawHits"], 6)
        self.assertEqual(report["retainedUnique"], 1)
        self.assertEqual(report["duplicateRetained"], 2)
        self.assertEqual(report["candidateSignals"]["positive_wording_review"], 1)
        self.assertEqual(report["verifiedExplicitSponsorship"], 0)
        self.assertEqual(sample["rows"][0][sample["fields"].index("visa")], "unknown")
        self.assertNotIn("Visa sponsorship is available", str(sample))

    def test_failure_stops_and_is_not_empty_success(self):
        calls = []
        def fail(q):
            calls.append(q)
            raise OSError("private error text")
        report, sample = feasibility.observe(fail, NOW)
        self.assertEqual(len(calls), 1)
        self.assertEqual(report["status"], "failed")
        self.assertEqual(report["coverage"], "unknown_or_partial")
        self.assertNotIn("private error text", str(report))
        self.assertEqual(sample["rows"], [])

    def test_partial_not_success(self):
        calls = []
        def search(q):
            calls.append(q)
            if len(calls)>1:
                raise ValueError("blocked")
            return {"hits":[HIT]}
        report, _ = feasibility.observe(search, NOW)
        self.assertEqual(report["status"], "partial")
        self.assertEqual(report["checksSucceeded"], 1)
        self.assertEqual(report["checksFailed"], 1)

    def test_successful_empty_distinct_from_failure(self):
        report, _ = feasibility.observe(lambda _: {"hits":[]}, NOW)
        self.assertEqual(report["status"], "success")
        self.assertEqual(report["coverage"], "bounded_search_not_exhaustive")
        self.assertEqual(report["retainedUnique"], 0)

    def test_expired_not_retained(self):
        report, _ = feasibility.observe(lambda _: {"hits":[{**HIT, "application_deadline":"2020-01-01"}]}, NOW)
        self.assertEqual(report["rawHits"], 3)
        self.assertEqual(report["retainedUnique"], 0)
