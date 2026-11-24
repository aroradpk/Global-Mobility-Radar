# Phase 3: source and evidence controls

All inherited company boards and feeds are candidates, not approved sources. The review registry starts empty. No live polling, discovery or sponsor-register downloads have been authorised in this branch. The original candidates remain in companies.json.

## Approval
Only documented Greenhouse, Lever and Ashby public API connectors are eligible for initial review. Other ATS types, all feeds and sponsor-register refresh remain disabled until adapter-specific provenance, coverage and permission checks are implemented. A public endpoint alone is not redistribution permission. Review the exact board against the employer's official career site, API documentation, robots policy, terms and permitted personal research use; record the evidence and attribution. Use `python -m jobtracker sources` from pipeline/ to inspect candidate IDs and configuration SHA-256. Add a review keyed by company:<ats>:<slug> to source_reviews.json only after review; fields: status=approved, config_sha256, access_method=documented_public_api, usage=personal_research, robots_allowed=true, terms_allowed=true, ownership_url, api_docs_url, terms_url, reviewer, attribution, permission_note, reviewed_on (ISO date). No reviews have been granted. Changes to configuration and reviews older than 90 days invalidate approval. No commercial reuse authorised. Do not treat a human-entered review as a technical or legal guarantee. Live smoke tests, request budgets and domain/redirect checks are still required.

## Freshness and sponsorship
Poll observations record source ID, exact configuration fingerprint and last-seen date; description evidence has its own timestamp. A missing item or partial search is not sufficient to close a job. Old observations remain in SQLite, but are excluded from export after 48 hours. Unapproved or legacy rows lacking the new source identity are not exported. Export deduplicates exact canonical HTTPS links (not semantic duplicates); fragments are removed, query retained. Export includes optional per-row evidence (original URL, source ID, observedAt, descriptionCheckedAt, positive/negative/relocation snippets and status=unverified_lead). Existing rows are preserved by additive migrations. Vacancy wording remains a heuristic and is not confirmation; conflicting wording is conditional, negatives block when unambiguous, relocation-only does not count as sponsorship, cached/fuzzy register or employer-policy matches do not upgrade a vacancy. Historical filings (CA/IE/US) and unverified register membership (UK/NL/DK) are separate categories for future verification. No source approved means an empty export, not a claim of no available jobs.

## Employer research queue (manual links; no scraping permissions claimed)
- MetLife: https://www.metlifecareers.com/ (official company newsroom references this site; internal mobility must use authorised employee channels).
- Allianz: https://careers.allianz.com/global/en/
- Zurich: https://www.zurich.com/en/careers
- ING: https://careers.ing.com/en/search-jobs

Next: integration fixtures for poll/export/SQLite migrations, UI evidence import implemented; verify it in browser, source-specific live permission and identity review, current register provenance, salary and scam checks. No live coverage or verification claim yet.

Snapshot health includes source ID and config fingerprint; only successful matching observations count toward freshness. Dashboard parses optional per-job evidence, warns on missing/stale observations, and does not use imported sponsorship labels to boost ranking.
