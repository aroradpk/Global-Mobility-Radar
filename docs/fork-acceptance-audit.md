# Fork acceptance audit — initial findings

Baseline 7df403c5545c5704227ed75561f5ec4a08f5db9c (static review, 2026-11-25).
Decision: retain as development foundation; reject as production-ready.
This is not an exhaustive security audit. No inherited test execution, dependency scan, live source verification or browser E2E evidence was available.

| Risk | Evidence | Required action |
|---|---|---|
| Critical: private backend absent | README, site/src/api.ts, site/vite.config.ts | Independent runtime; remove upstream subscriptions/API and auth dependencies for personal MVP |
| Critical: no legal eligibility engine | site/src/engine/countries.ts; knowledge/countries.json | Separate deterministic rules; current official evidence, version history, missing-data states |
| High: deployment ownership | .github/workflows/deploy.yml, pages-moved.yml | Neutralize before main merge; owner-only configured deployment |
| High: privacy | App.tsx, auth.ts, api.ts, Legal.tsx, index.html | No upstream profile/CV transmission; explicit consent for AI; minimize retention, remove misleading copy and third-party calls; secure auth if needed |
| High: stale/ambiguous sponsorship | pipeline/jobtracker/scoring.py, names.py, registers.py, pipeline.py | Exact legal entity evidence, current vs historical, per-vacancy excerpts, TTL, conflict handling |
| High: freshness and coverage | pipeline.py, ats.py, export.py, cli.py | Recheck descriptions; no closure from partial results; last successful verification; source failures not successful coverage |
| High: source rights | docs/SOURCES.md; company/feed config | Independently verify allowed access/use, attribution, disable restricted/unknown sources; no bot circumvention |
| Medium: matching heuristics | site/src/engine/jobs.ts, countries.ts | Hard gates separate from explainable ranking; no probability claims; do not count relocation as sponsorship |
| Medium: untrusted links and payloads | Results.tsx, api.ts, job exports | Validate schemas, safe URLs, resource limits and malicious-input cases |
| Medium: dependency and build confidence | site/package-lock.json, .github/workflows/ci.yml | Lockfile reproducibility, audit, pinned actions, least privilege, full tests and E2E |
| Medium: missing target employers | pipeline/config/companies.json | Verify direct boards; add insurance, banking, fintech and internal-transfer links where authorised |

Observed configuration: 232 employer entries (215 enabled), 20 feeds, 6 sponsor-register loaders; these counts do not establish active or approved sources. Country knowledge labeled October 2026, not current verification. Upstream MIT license does not grant third-party content rights.
