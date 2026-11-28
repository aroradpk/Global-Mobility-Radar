"""One-day, evaluation-only Swedish CC0 source feasibility observation.

No subscriber data, no paid delivery, no schedule, no permission escalation.
Default dry run. The existing bounded JobSearch adapter enforces robots.
Private optional snapshot for an ephemeral matching test; aggregate JSON only
is safe for reporting. Never treat regex signals as confirmed sponsorship.
"""
import argparse
import datetime as dt
import json
import re
import time
from collections import Counter
from pathlib import Path
from . import jobsearch_preview as preview, families, scoring


def observe(search=preview.fetch_search, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    report = {"schema": 1, "country": "SE", "source": preview.SOURCE,
              "licence": preview.LICENSE, "scope": "evaluation_only",
              "checkedAt": now.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
              "coverage": "bounded_search_not_exhaustive", "checksAttempted": 0,
              "checksSucceeded": 0, "checksFailed": 0, "rawHits": 0,
              "retainedUnique": 0, "duplicateRetained": 0, "retainedWithDescription": 0,
              "retainedWithSkillSignals": 0, "retainedWithPostedDate": 0,
              "candidateSignals": {}, "verifiedVacancies": 0,
              "verifiedExplicitSponsorship": 0, "errors": []}
    result = {"generatedAt": report["checkedAt"], "fields": preview.FIELDS,
              "rows": [], "evidence": {}}
    seen = set()
    counts = Counter({"positive_wording_review": 0, "conflicting_wording_review": 0,
                      "restriction_wording_review": 0, "relocation_only_review": 0,
                      "unknown": 0})
    start = time.monotonic()
    for query in preview.QUERIES:
        report["checksAttempted"] += 1
        try:
            payload = search(query)
            current = preview.snapshot(payload, now)
        except (OSError, ValueError, TypeError, AttributeError) as exc:
            report["checksFailed"] += 1
            # Do not log exception content (can contain remote/user data).
            report["errors"].append({"query": query, "type": type(exc).__name__})
            # A denial or failure is not an invitation to try other queries.
            break
        report["checksSucceeded"] += 1
        report["rawHits"] += len(payload["hits"])
        by_id = {}
        for hit in payload["hits"]:
            if isinstance(hit, dict):
                by_id.setdefault(str(hit.get("id", "")), hit)
        for row in current["rows"]:
            uid = row[0]
            if uid in seen:
                report["duplicateRetained"] += 1
                continue
            seen.add(uid)
            hit = by_id.get(uid.rsplit(":", 1)[-1], {})
            desc = hit.get("description")
            raw = desc.get("text", "") if isinstance(desc, dict) else ""
            if not isinstance(raw, str):
                raw = ""
            raw = raw[:100000]
            # CC0 source; do not persist descriptions or excerpts/contact details.
            if raw.strip():
                report["retainedWithDescription"] += 1
                pos, reloc, neg = scoring.visa_signals(raw)
                # Heuristic only: no Swedish-language coverage guarantee.
                label = ("conflicting_wording_review" if pos and neg else
                         "restriction_wording_review" if neg else
                         "positive_wording_review" if pos else
                         "relocation_only_review" if reloc else "unknown")
            else:
                label = "unknown"
            counts[label] += 1
            row = list(row)
            row[preview.FIELDS.index("skills")] = families.skills(row[1] + "\n" + raw)
            row[preview.FIELDS.index("seniority")] = scoring.seniority(row[1])
            row[preview.FIELDS.index("langs")] = families.required_languages(raw)
            if row[preview.FIELDS.index("skills")]:
                report["retainedWithSkillSignals"] += 1
            if row[preview.FIELDS.index("posted")]:
                report["retainedWithPostedDate"] += 1
            # Imported evidence remains unknown; no positive claims from heuristic.
            result["rows"].append(row)
            result["evidence"][uid] = current["evidence"][uid]
    report["retainedUnique"] = len(seen)
    report["candidateSignals"] = dict(counts)
    report["status"] = ("success" if report["checksSucceeded"] == len(preview.QUERIES)
                        else "partial" if report["checksSucceeded"] else "failed")
    if report["status"] != "success":
        report["coverage"] = "unknown_or_partial"
    report["elapsedSeconds"] = round(time.monotonic() - start, 3)
    return report, result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--sample", action="store_true", help="Write evaluation snapshot to ignored pipeline/data only")
    args = parser.parse_args()
    if not args.live:
        print("Dry run: no network, no files.")
        return
    report, sample = observe()
    if args.sample and report["status"] == "success":
        folder = Path(__file__).resolve().parent.parent / "data"
        preview.atomic_json(folder / "feasibility-evaluation.json", sample)
    print("FEASIBILITY_OBSERVATION " + json.dumps(report, sort_keys=True))
    if report["status"] != "success":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
