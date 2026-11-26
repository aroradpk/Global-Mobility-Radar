import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from jobtracker import db, export, pipeline, source_policy


class SourcePipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.con = db.connect(self.root / "fixture.db")
        self.addCleanup(self.con.close)
        self.company = {"name": "Synthetic", "ats": "greenhouse", "slug": "synthetic"}
        self.cfg = {"companies": [self.company], "feeds": []}
        self.sid = source_policy.source_id(self.company)
        self.review = {"status": "approved", "config_sha256": source_policy.fingerprint(self.company),
                       "access_method": "documented_public_api", "usage": "personal_research",
                       "robots_allowed": True, "terms_allowed": True, "ownership_url": "https://example.com/jobs",
                       "api_docs_url": "https://example.com/api", "terms_url": "https://example.com/terms",
                       "reviewer": "synthetic", "attribution": "Synthetic", "permission_note": "fixture only",
                       "reviewed_on": dt.datetime.now(dt.timezone.utc).date().isoformat()}
        self.reviews = {self.sid: self.review}
        self.job = {"ext_id": "1", "title": "Software Engineer", "location": "Berlin, Germany",
                    "url": "https://example.com/job/1", "posted_at": None, "description": "Visa sponsorship available."}

    def poll(self, jobs, reviews=None):
        with patch.object(source_policy, "read_reviews", return_value=self.reviews if reviews is None else reviews), patch.object(pipeline, "_fetch_company", return_value=(jobs, [{**j, "family": "software"} for j in jobs])) as fetch:
            result = pipeline.poll(self.con, self.cfg, log=lambda _: None)
            return result, fetch.call_count

    def export(self, reviews=None):
        with patch.object(source_policy, "read_reviews", return_value=self.reviews if reviews is None else reviews), patch.object(pipeline, "load_config", return_value=self.cfg):
            export.build(self.con, self.root / "output")
        return json.loads((self.root / "output" / "jobs.json").read_text())

    def test_default_deny_does_not_poll(self):
        (_, totals), count = self.poll([self.job], {})
        self.assertEqual(count, 0)
        self.assertEqual(totals["sources"], 0)
        self.assertEqual(self.export({})["rows"], [])

    def test_evidence_observation_and_missing_does_not_close(self):
        self.poll([self.job])
        snapshot = self.export()
        self.assertEqual(len(snapshot["rows"]), 1)
        uid = snapshot["rows"][0][0]
        self.assertEqual(snapshot["evidence"][uid]["status"], "unverified_lead")
        self.assertTrue(snapshot["evidence"][uid]["descriptionCheckedAt"])
        self.poll([])
        self.assertIsNone(self.con.execute("SELECT closed_at FROM jobs WHERE uid = ?", (uid,)).fetchone()[0])
        self.assertEqual(len(self.export()["rows"]), 1)
        self.assertEqual(self.export({})["rows"], [])

    def test_missing_description_downgrades_old_signal(self):
        self.poll([self.job])
        self.poll([{**self.job, "description": None}])
        snapshot = self.export()
        self.assertEqual(snapshot["rows"][0][snapshot["fields"].index("visa")], "unknown")
        self.assertEqual(next(iter(snapshot["evidence"].values()))["descriptionCheckedAt"], "")

    def test_stale_and_unapproved_fingerprint_are_excluded(self):
        self.poll([self.job])
        self.con.execute("UPDATE jobs SET last_seen = '2000-01-01 00:00:00'")
        self.assertEqual(self.export()["rows"], [])
        self.con.execute("UPDATE jobs SET last_seen = ?, source_fingerprint = 'legacy'", (db.now(),))
        self.assertEqual(self.export()["rows"], [])

    def test_canonical_url_duplicates_and_unsafe_urls(self):
        self.poll([self.job, {**self.job, "ext_id": "2", "url": self.job["url"] + "#details"}, {**self.job, "ext_id": "3", "url": "javascript:alert(1)"}])
        self.assertEqual(len(self.export()["rows"]), 1)

    def test_database_reconnect_preserves_records(self):
        self.poll([self.job])
        self.con.close()
        self.con = db.connect(self.root / "fixture.db")
        self.addCleanup(self.con.close)
        self.assertEqual(self.con.execute("SELECT COUNT(*) FROM jobs").fetchone()[0], 1)
        self.assertIn("source_fingerprint", {r["name"] for r in self.con.execute("PRAGMA table_info(snapshots)")})
