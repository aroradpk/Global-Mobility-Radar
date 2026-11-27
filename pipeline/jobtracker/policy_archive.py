"""Offline policy-audit archive and scheduler entry point. No network access.

Imported evidence is untrusted. Storage integrity is not official authenticity;
browser replay must still validate the registered sources and review history.
"""
import argparse
import datetime as dt
import hashlib
import json
import re
import sqlite3
from pathlib import Path
from urllib.parse import urlsplit

MAX_BYTES = 2_000_000
FIELDS = ("phase", "effectiveOn", "availability", "window", "feeAmount", "feeCurrency",
          "feeBasis", "fundsAmount", "fundsCurrency", "fundsBasis", "processing", "documents",
          "settlement", "quota", "requirements", "excerpt")
COUNTRIES = {"canada", "australia", "germany", "ireland", "netherlands", "newzealand",
             "uk", "hongkong", "singapore", "uae", "us"}
DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "policy-archive.sqlite3"


def day(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("Invalid calendar date")
    return dt.date.fromisoformat(value)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def parse_audit(raw, today):
    """Validate archival shape and content hashes; never approve imported rules."""
    if len(raw) > MAX_BYTES:
        raise ValueError("Audit too large")
    data = json.loads(raw.decode("utf-8"), object_pairs_hook=unique_object)
    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        raise ValueError("Unsupported audit schema")
    exported = day(data.get("exportedOn"))
    if exported > today:
        raise ValueError("Future audit export")
    sources, obs, reviews = (data.get(k) for k in ("sources", "observations", "reviews"))
    if not all(isinstance(x, list) for x in (sources, obs, reviews)) or not 1 <= len(sources) <= 100 or len(obs) > 200 or len(reviews) > 400:
        raise ValueError("Invalid audit bounds")
    source_map = {}
    for s in sources:
        if not isinstance(s, dict):
            raise ValueError("Invalid source")
        key, url = s.get("key"), s.get("url")
        if not isinstance(key, str) or not re.fullmatch(r"[a-z]+:[a-zA-Z0-9_-]{1,80}", key) or key.split(":")[0] not in COUNTRIES or key in source_map:
            raise ValueError("Invalid route identity")
        if not isinstance(url, str) or len(url) > 1000 or any(c.isspace() for c in url):
            raise ValueError("Invalid source URL")
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("Unsafe source URL")
        if s.get("automatedAccess") != "disabled" or s.get("termsReview") != "not approved":
            raise ValueError("Unexpected source permission")
        source_map[key] = url
    events = []
    for kind, items in (("observation", obs), ("review", reviews)):
        for item in items:
            if not isinstance(item, dict) or type(item.get("id")) is not int or item.get("route") not in source_map:
                raise ValueError("Invalid audit event")
            events.append((item["id"], kind, item))
    events.sort(key=lambda x: x[0])
    if [x[0] for x in events] != list(range(1, len(events) + 1)):
        raise ValueError("Missing or duplicate event identifiers")
    snapshots, last_dates, last_obs, last_reviews = {}, {}, {}, {}
    for ident, kind, item in events:
        route = item["route"]
        if kind == "observation":
            observed = day(item.get("observedOn"))
            if observed > exported or observed < last_dates.get(route, observed) or item.get("source") != source_map[route]:
                raise ValueError("Invalid observation date/source")
            last_dates[route] = observed
            last_obs[route] = item
            if item.get("kind") == "snapshot":
                facts = item.get("facts")
                if not isinstance(facts, dict) or set(facts) != set(FIELDS) or any(not isinstance(facts[k], str) or len(facts[k]) > (500 if k == "excerpt" else 300) for k in FIELDS):
                    raise ValueError("Invalid snapshot fields")
                digest = sha(canonical([route, source_map[route], [[k, facts[k]] for k in FIELDS]]))
                if digest != item.get("sha256"):
                    raise ValueError("Snapshot digest mismatch")
                if facts["phase"] not in {"unknown","proposed","enacted","in_force","withdrawn"} or facts["availability"] not in {"unknown","open","closed","paused"} or not facts["excerpt"].strip():
                    raise ValueError("Invalid snapshot state")
                if facts["effectiveOn"]:
                    effective = day(facts["effectiveOn"])
                else:
                    effective = None
                if facts["phase"] == "in_force" and (effective is None or effective > observed):
                    raise ValueError("Invalid in-force effective date")
                snapshots[ident] = item
            elif item.get("kind") == "failure":
                reason = item.get("reason")
                if not isinstance(reason, str) or not reason.strip() or len(reason) > 300:
                    raise ValueError("Invalid failure")
            else:
                raise ValueError("Invalid observation kind")
        else:
            reviewed = day(item.get("reviewedOn"))
            target = item.get("target")
            if type(target) is not int or target not in snapshots or snapshots[target]["route"] != route or reviewed > exported or reviewed < day(snapshots[target]["observedOn"]) or item.get("action") not in {"approve","reject","rollback"}:
                raise ValueError("Invalid historical review")
            last_reviews[route] = item
    return data, last_obs, last_reviews


def connect(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    con.executescript("""
      CREATE TABLE IF NOT EXISTS archives (
        seq INTEGER PRIMARY KEY, digest TEXT UNIQUE NOT NULL, exported_on TEXT NOT NULL,
        imported_on TEXT NOT NULL, payload BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS review_runs (
        id INTEGER PRIMARY KEY, run_day TEXT NOT NULL, archive_digest TEXT NOT NULL,
        new_notices INTEGER NOT NULL, UNIQUE(run_day, archive_digest),
        FOREIGN KEY(archive_digest) REFERENCES archives(digest));
      CREATE TABLE IF NOT EXISTS notices (
        key TEXT PRIMARY KEY, route TEXT NOT NULL, state TEXT NOT NULL,
        first_seen TEXT NOT NULL, read_on TEXT, resolved_on TEXT);
    """)
    return con


def ingest(con, raw, today):
    data, _, _ = parse_audit(raw, today)
    digest = sha(raw)
    with con:
        con.execute("BEGIN IMMEDIATE")
        existing = con.execute("SELECT digest FROM archives WHERE digest=?", (digest,)).fetchone()
        if existing:
            return digest, False
        prior = con.execute("SELECT exported_on FROM archives ORDER BY seq DESC LIMIT 1").fetchone()
        if prior and data["exportedOn"] < prior["exported_on"]:
            raise ValueError("Older archive cannot replace current archive")
        con.execute("INSERT INTO archives(digest,exported_on,imported_on,payload) VALUES(?,?,?,?)",
                    (digest, data["exportedOn"], today.isoformat(), raw))
    return digest, True


def tick(con, today):
    """Idempotent daily offline review check. Does not fetch or send anything."""
    now = today.isoformat()
    with con:
        con.execute("BEGIN IMMEDIATE")
        archive = con.execute("SELECT * FROM archives ORDER BY seq DESC LIMIT 1").fetchone()
        if not archive:
            return {"status": "no_archive", "new_notices": 0}
        if sha(archive["payload"]) != archive["digest"]:
            raise ValueError("Stored archive integrity mismatch")
        prior = con.execute("SELECT new_notices FROM review_runs WHERE run_day=? AND archive_digest=?", (now, archive["digest"])).fetchone()
        if prior:
            return {"status": "already_checked", "new_notices": 0}
        last = con.execute("SELECT MAX(run_day) FROM review_runs").fetchone()[0]
        if last and now < last:
            raise ValueError("Review clock moved backwards")
        _, obs, reviews = parse_audit(archive["payload"], today)
        active = set()
        new = 0
        for route, item in obs.items():
            review = reviews.get(route, {})
            if item["kind"] == "failure":
                state = "source_failure"
            elif (today - day(item["observedOn"])).days > 30:
                state = "stale"
            elif item["facts"]["phase"] != "in_force":
                state = "not_in_force"
            elif review.get("action") == "rollback" and review["id"] > item["id"]:
                state = "rollback_reference"
            elif review.get("target") != item["id"]:
                state = "pending_review"
            elif review.get("action") == "reject":
                state = "rejected"
            else:
                state = "historical_approval_requires_review"
            key = sha(canonical([route, state, item, review]))
            active.add(key)
            old = con.execute("SELECT resolved_on FROM notices WHERE key=?", (key,)).fetchone()
            if old is None:
                con.execute("INSERT INTO notices(key,route,state,first_seen) VALUES(?,?,?,?)", (key, route, state, now))
                new += 1
            elif old["resolved_on"]:
                con.execute("UPDATE notices SET first_seen=?,read_on=NULL,resolved_on=NULL WHERE key=?", (now, key))
                new += 1
        for n in con.execute("SELECT key FROM notices WHERE resolved_on IS NULL").fetchall():
            if n["key"] not in active:
                con.execute("UPDATE notices SET resolved_on=? WHERE key=?", (now, n["key"]))
        con.execute("INSERT INTO review_runs(run_day,archive_digest,new_notices) VALUES(?,?,?)", (now, archive["digest"], new))
    return {"status": "completed_offline", "new_notices": new, "active_notices": len(active)}


def acknowledge(con, key, today):
    with con:
        cur = con.execute("UPDATE notices SET read_on=? WHERE key=? AND read_on IS NULL AND resolved_on IS NULL AND first_seen<=?", (today.isoformat(), key, today.isoformat()))
        return cur.rowcount == 1


def status(con):
    archive = con.execute("SELECT digest,exported_on,imported_on FROM archives ORDER BY seq DESC LIMIT 1").fetchone()
    runs = [dict(r) for r in con.execute("SELECT run_day,archive_digest,new_notices FROM review_runs ORDER BY id DESC LIMIT 30")]
    notices = [dict(r) for r in con.execute("SELECT key,route,state,first_seen,read_on,resolved_on FROM notices ORDER BY first_seen DESC LIMIT 1000")]
    return {"archive": dict(archive) if archive else None, "runs": runs, "notices": notices, "network": "disabled", "external_delivery": "disabled"}


def export_latest(con, target):
    row = con.execute("SELECT digest,payload FROM archives ORDER BY seq DESC LIMIT 1").fetchone()
    if not row or sha(row["payload"]) != row["digest"]:
        raise ValueError("No intact archive available")
    with Path(target).open("xb") as out:
        out.write(row["payload"])


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--db", type=Path, default=DEFAULT_DB)
    sub = p.add_subparsers(dest="command", required=True)
    imp = sub.add_parser("ingest"); imp.add_argument("audit", type=Path)
    sub.add_parser("tick")
    sub.add_parser("status")
    ack = sub.add_parser("ack"); ack.add_argument("key")
    exp = sub.add_parser("export"); exp.add_argument("target", type=Path)
    args = p.parse_args(argv)
    today = dt.datetime.now(dt.timezone.utc).date()
    con = connect(args.db)
    try:
        if args.command == "ingest":
            with args.audit.open("rb") as src:
                digest, added = ingest(con, src.read(MAX_BYTES + 1), today)
            result = {"digest": digest, "added": added, "trust": "untrusted archived evidence"}
        elif args.command == "tick":
            result = tick(con, today)
        elif args.command == "status":
            result = status(con)
        elif args.command == "ack":
            result = {"acknowledged": acknowledge(con, args.key, today)}
        else:
            export_latest(con, args.target)
            result = {"exported": True}
        print(json.dumps(result, indent=2))
    except (ValueError, OSError, sqlite3.Error, TypeError, KeyError, RecursionError, UnicodeError):
        p.exit(1, "Policy archive operation failed; check file integrity, schema, dates and storage permissions.\n")
    finally:
        con.close()


if __name__ == "__main__":
    main()
