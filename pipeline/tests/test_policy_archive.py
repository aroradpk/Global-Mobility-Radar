import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from jobtracker import policy_archive as p


class PolicyArchiveTests(unittest.TestCase):
    def setUp(self):
        self.today = dt.date(2026, 11, 27)
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "policy.sqlite3"
        self.con = p.connect(self.path)
        self.addCleanup(self.con.close)
        self.route = "germany:blue"
        self.url = "https://www.make-it-in-germany.com/en/visa-recognition/visa-types/eu-blue-card"

    def data(self, fee="100"):
        facts = dict.fromkeys(p.FIELDS, "")
        facts.update(phase="in_force", effectiveOn="2026-11-01", availability="unknown",
                     excerpt="Synthetic fixture only", feeAmount=fee, feeCurrency="EUR", feeBasis="Synthetic")
        digest = p.sha(p.canonical([self.route, self.url, [[k, facts[k]] for k in p.FIELDS]]))
        return {"schemaVersion": 1, "exportedOn": "2026-11-27",
                "sources": [{"key": self.route, "url": self.url, "automatedAccess": "disabled", "termsReview": "not approved"}],
                "observations": [{"kind": "snapshot", "id": 1, "route": self.route, "source": self.url,
                                  "observedOn": "2026-11-27", "facts": facts, "sha256": digest}],
                "reviews": [{"id": 2, "route": self.route, "target": 1, "action": "approve", "reviewedOn": "2026-11-27"}]}

    def ingest(self, data=None):
        return p.ingest(self.con, p.canonical(self.data() if data is None else data), self.today)

    def test_archive_roundtrip_and_dedup(self):
        digest, added = self.ingest()
        self.assertTrue(added)
        self.assertEqual(self.ingest(), (digest, False))
        other = p.connect(self.path)
        try:
            target = Path(self.directory.name) / "export.json"
            p.export_latest(other, target)
            self.assertEqual(target.read_bytes(), p.canonical(self.data()))
            with self.assertRaises(FileExistsError):
                p.export_latest(other, target)
        finally:
            other.close()

    def test_tamper_and_bounds(self):
        data = self.data()
        data["observations"][0]["facts"]["feeAmount"] = "999"
        with self.assertRaises(ValueError):
            self.ingest(data)
        with self.assertRaises(ValueError):
            p.ingest(self.con, b"x" * (p.MAX_BYTES + 1), self.today)

    def test_invalid_source_and_event(self):
        for key, value in (("source", "https://example.com"), ("id", 4), ("observedOn", "2026-11-28")):
            data = self.data()
            data["observations"][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.ingest(data)

    def test_source_permission_cannot_enable_network(self):
        data = self.data()
        data["sources"][0]["automatedAccess"] = "enabled"
        with self.assertRaises(ValueError):
            self.ingest(data)

    def test_no_archive(self):
        self.assertEqual(p.tick(self.con, self.today)["status"], "no_archive")

    def test_dedup_daily_run_and_ack(self):
        self.ingest()
        self.assertEqual(p.tick(self.con, self.today)["new_notices"], 1)
        self.assertEqual(p.tick(self.con, self.today)["status"], "already_checked")
        result = p.status(self.con)
        notice = result["notices"][0]
        self.assertEqual(notice["state"], "historical_approval_requires_review")
        self.assertTrue(p.acknowledge(self.con, notice["key"], self.today))
        self.assertFalse(p.acknowledge(self.con, notice["key"], self.today))
        self.assertEqual(p.tick(self.con, self.today + dt.timedelta(days=1))["new_notices"], 0)
        self.assertEqual(p.status(self.con)["notices"][0]["read_on"], self.today.isoformat())

    def test_stale_transition_and_resolution(self):
        self.ingest()
        p.tick(self.con, self.today)
        self.assertEqual(p.tick(self.con, self.today + dt.timedelta(days=31))["new_notices"], 1)
        notices = p.status(self.con)["notices"]
        self.assertEqual({n["state"] for n in notices if not n["resolved_on"]}, {"stale"})
        self.assertEqual(len(notices), 2)

    def test_changed_archive_same_day(self):
        self.ingest()
        p.tick(self.con, self.today)
        self.ingest(self.data("101"))
        self.assertEqual(p.tick(self.con, self.today)["new_notices"], 1)
        self.assertEqual(len(p.status(self.con)["runs"]), 2)

    def test_reject_old_archive_and_clock(self):
        self.ingest()
        p.tick(self.con, self.today)
        with self.assertRaises(ValueError):
            p.tick(self.con, self.today - dt.timedelta(days=1))

    def test_stored_corruption(self):
        self.ingest()
        with self.con:
            self.con.execute("UPDATE archives SET payload=?", (b"invalid",))
        with self.assertRaises(ValueError):
            p.tick(self.con, self.today)
