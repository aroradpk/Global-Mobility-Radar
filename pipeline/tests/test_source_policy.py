import datetime as dt
import unittest
from jobtracker import source_policy as policy


class SourcePolicyTests(unittest.TestCase):
    def setUp(self):
        self.today = dt.date(2026, 11, 25)
        self.company = {"name": "Synthetic", "ats": "greenhouse", "slug": "synthetic"}
        self.cfg = {"companies": [self.company]}
        self.review = {"status": "approved", "config_sha256": policy.fingerprint(self.company),
                       "access_method": "documented_public_api", "usage": "personal_research",
                       "robots_allowed": True, "terms_allowed": True, "ownership_url": "https://example.com/jobs",
                       "api_docs_url": "https://example.com/api", "terms_url": "https://example.com/terms",
                       "reviewer": "fixture", "attribution": "Synthetic", "permission_note": "fixture only",
                       "reviewed_on": self.today.isoformat()}

    def approved(self, review=None):
        return policy.approved_companies(self.cfg, {policy.source_id(self.company): self.review if review is None else review}, self.today)

    def test_default_deny(self):
        self.assertEqual(policy.approved_companies(self.cfg, {}, self.today), [])
        self.assertEqual(self.approved({}), [])

    def test_approved_exact_config(self):
        self.assertEqual(self.approved(), [self.company])
        self.company["slug"] = "changed"
        self.assertEqual(self.approved(), [])

    def test_changed_config_same_id(self):
        self.company["notes"] = "changed"
        self.assertEqual(self.approved(), [])

    def test_review_expiry_future_and_permission(self):
        for patch in ({"reviewed_on": "2026-01-01"}, {"reviewed_on": "2026-12-01"}, {"terms_allowed": False}, {"robots_allowed": False}, {"ownership_url": "javascript:alert(1)"}, {"reviewer": ""}):
            with self.subTest(patch=patch):
                self.assertEqual(self.approved({**self.review, **patch}), [])

    def test_disabled_or_unsupported(self):
        for patch in ({"enabled": False}, {"ats": "workday"}):
            c = {**self.company, **patch}
            r = {**self.review, "config_sha256": policy.fingerprint(c)}
            self.assertEqual(policy.approved_companies({"companies": [c]}, {policy.source_id(c): r}, self.today), [])

    def test_duplicate_identity_denied(self):
        self.cfg["companies"].append(dict(self.company))
        self.assertEqual(self.approved(), [])

    def test_freshness_boundaries(self):
        now = dt.datetime(2026, 11, 25, tzinfo=dt.timezone.utc)
        self.assertTrue(policy.recently_observed("2026-11-23T00:00:00Z", now))
        for value in (None, "invalid", "2026-11-22T23:59:59Z", "2026-11-26T00:00:00Z"):
            self.assertFalse(policy.recently_observed(value, now))

    def test_vacancy_evidence(self):
        self.assertEqual(policy.vacancy_signal(["yes"], [], [], False), "unknown")
        self.assertEqual(policy.vacancy_signal(["yes"], [], ["no"], True), "conditional")
        self.assertEqual(policy.vacancy_signal([], [], ["no"], True), "blocked")
        self.assertEqual(policy.vacancy_signal([], ["move"], [], True), "relocation")
        self.assertEqual(policy.vacancy_signal(["yes"], [], [], True), "explicit")

    def test_register_evidence_not_confirmation(self):
        self.assertEqual(policy.register_kind("ca_lmia_positive"), "historical")
        self.assertEqual(policy.register_kind("nl_ind_recognised_sponsor"), "register_unverified")
        self.assertEqual(policy.register_kind("other"), "unknown")

    def test_safe_url_and_dedup_key(self):
        self.assertEqual(policy.canonical_url("https://Example.com:443/job?a=1#details"), "https://example.com/job?a=1")
        for value in ("javascript:alert(1)", "https://u:p@example.com", "http://example.com", "https://example.com:80", "https://exam ple.com"):
            self.assertIsNone(policy.canonical_url(value))
