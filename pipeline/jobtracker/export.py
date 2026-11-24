"""Writes the web app's data files (see docs/DATA.md):

    site/public/data/jobs.json    open postings that don't rule sponsorship out
    site/public/data/market.json  demand per country and job family, with top skills
    site/public/data/meta.json    sources, registers and run time
    site/public/data/jobs/<family>.json  the same postings split by job family,
                                         which is what the API serves (one family per request)
"""

import datetime as dt
import json
from collections import Counter, defaultdict
from pathlib import Path

from . import pipeline, source_policy

OUT_DIR = Path(__file__).resolve().parents[2] / "site" / "public" / "data"

FIELDS = ["id", "title", "company", "location", "countries", "url", "posted", "firstSeen",
          "family", "seniority", "remote", "visa", "registerIn", "skills", "langs", "salary"]
HIDDEN = {"blocked", "employer-no"}  # postings that rule sponsorship out are not shown
VISA_FRIENDLY = {"explicit"}  # wording signal only; not confirmed sponsorship
MAX_AGE_DAYS = 120  # drop stale postings that boards forget to close


def _split(s):
    return [x for x in (s or "").split(",") if x]


def _trim(s, n):
    s = (s or "").replace("\n", " ").strip()
    return s if len(s) <= n else s[: n - 1] + "…"


def _iso(ts):
    return (ts or "").replace(" ", "T")[:19] + "Z" if ts else ""


def build(con, out_dir=OUT_DIR):
    out_dir.mkdir(parents=True, exist_ok=True)
    last = con.execute("SELECT MAX(run_at) FROM snapshots").fetchone()[0] or ""
    cutoff = (dt.date.today() - dt.timedelta(days=MAX_AGE_DAYS)).isoformat()

    approved = {source_policy.source_id(c): source_policy.fingerprint(c) for c in source_policy.approved_companies(pipeline.load_config(), source_policy.read_reviews())}
    evidence, seen_urls = {}, set()
    rows, cells = [], defaultdict(lambda: {"jobs": 0, "visaFriendly": 0, "englishOk": 0, "skills": Counter()})
    for j in con.execute("SELECT * FROM jobs WHERE closed_at IS NULL ORDER BY last_seen DESC, uid"):
        if j["label"] in HIDDEN or not j["family"]:
            continue
        if j["source_id"] not in approved or j["source_fingerprint"] != approved[j["source_id"]]:
            continue
        if not source_policy.recently_observed(j["last_seen"]):
            continue
        if j["posted_at"] and j["posted_at"][:10] < cutoff:
            continue
        key = source_policy.canonical_url(j["url"])
        if key is None or key in seen_urls:
            continue
        seen_urls.add(key)
        checked = source_policy.recently_observed(j["description_checked_at"])
        signal = j["label"] if checked and j["label"] in {"explicit", "conditional", "relocation"} else "unknown"
        evidence[j["uid"]] = {"sourceId": j["source_id"], "sourceUrl": j["url"], "observedAt": _iso(j["last_seen"]),
                             "descriptionCheckedAt": _iso(j["description_checked_at"]) if checked else "",
                             "positive": _trim(j["visa_pos"], 500) if checked else "", "negative": _trim(j["visa_neg"], 500) if checked else "",
                             "relocation": _trim(j["visa_reloc"], 500) if checked else "", "status": "unverified_lead"}
        ctry, skills = _split(j["countries"]), _split(j["skills"])
        rows.append([
            j["uid"], _trim(j["title"], 140), _trim(j["company"], 60), _trim(j["location"], 90), ctry,
            j["url"] or "", (j["posted_at"] or "")[:10], (j["first_seen"] or "")[:10], j["family"],
            j["seniority"] or "unspecified", j["remote"] or 0, signal, [],
            skills, _split(j["langs"]), _trim(j["salary"], 60),
        ])
        for c in ctry or ["REMOTE"]:
            cell = cells[f"{c}|{j['family']}"]
            cell["jobs"] += 1
            cell["visaFriendly"] += signal in VISA_FRIENDLY
            cell["englishOk"] += not j["langs"]
            cell["skills"].update(skills)

    generated = _iso(last) or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    jobs = {"generatedAt": generated, "fields": FIELDS, "rows": rows, "evidence": evidence}
    market = {"generatedAt": generated, "cells": {
        k: {"jobs": v["jobs"], "visaFriendly": v["visaFriendly"], "englishOk": v["englishOk"], "skills": dict(v["skills"].most_common(25))}
        for k, v in sorted(cells.items())}}
    sources = [{"name": r["company"], "kind": "feed" if r["company"].startswith("[feed]") else "board",
                "ok": bool(r["ok"]), "listed": r["total_open"], "kept": r["kept"], "error": _trim(r["error"], 160)}
               for r in con.execute("SELECT * FROM snapshots WHERE run_at = ? ORDER BY company", (last,))]
    country_of = {r["source"]: r["country"] for r in con.execute("SELECT source, MIN(country) country FROM sponsors GROUP BY source")}
    registers = [{"source": r["source"], "country": country_of.get(r["source"], ""), "rows": r["rows"],
                  "loadedAt": r["loaded_at"][:10]} for r in con.execute("SELECT * FROM register_loads ORDER BY source")]
    for register in registers:
        register["evidenceKind"] = source_policy.register_kind(register["source"])
    meta = {"generatedAt": generated, "jobs": len(rows), "sources": sources, "registers": registers, "approvedCompanyCount": len(approved), "verification": "unverified_leads"}

    def write(path, obj):
        path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    for name, obj in (("jobs.json", jobs), ("market.json", market), ("meta.json", meta)):
        write(out_dir / name, obj)

    by_family = defaultdict(list)
    for r in rows:
        by_family[r[FIELDS.index("family")]].append(r)
    fam_dir = out_dir / "jobs"
    fam_dir.mkdir(exist_ok=True)
    for old in fam_dir.glob("*.json"):
        old.unlink()
    for family, fam_rows in by_family.items():
        write(fam_dir / f"{family}.json", {"generatedAt": generated, "fields": FIELDS, "rows": fam_rows, "evidence": {row[0]: evidence[row[0]] for row in fam_rows}})
    return out_dir, len(rows)
