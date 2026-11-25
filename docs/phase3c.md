# Phase 3C: first open-data connector and advertised salary preview

2026-11-25. Source-specific permission review:
- Swedish Public Employment Service JobSearch: https://data.arbetsformedlingen.se/dataservice/jobsearch/ explicitly lists CC0, public access, no API key/registration and application search use. Endpoint documentation: https://jobsearch.api.jobtechdev.se/. This justifies a separate on-demand personal preview connector, not blanket approval of the inherited ATS/feed registry. Runtime robots gate required. No scheduled collection enabled.
- Germany Arbeitnow: https://www.arbeitnow.com/blog/job-board-api and https://www.arbeitnow.com/terms/ document a free API and required attribution. General website licence restrictions and API robots status require review before integration. Public web lookup returned JSON from https://www.arbeitnow.com/api/job-board-api; no actual app connector success claimed. One Berlin Salesforce lead (NinjaOne) was found, but employer board spot check did not establish the same listing; no vacancy verified. No automated activation.
- ATS employer-specific reviews stay empty. No current sponsor register verified. Do not conflate government-portal data with independently confirmed employer posting.

## Try the Swedish connector
From pipeline/, run `python -m jobtracker.jobsearch_preview` (default dry run, no requests). Explicit on-demand command: `python -m jobtracker.jobsearch_preview --live --query javascript`. Fixed public search terms, 20 hits maximum, one robots request then one search, bounded response size, no redirects, no retries, no profile data. Output pipeline/data/jobsearch-preview.json (gitignored), import via local dashboard and select Sweden. Source is CC0; attribution displayed on imported records. Only supported Swedish software titles, exact official Platsbanken URLs and future application deadlines retained; no contact details, raw descriptions, guessed salaries or sponsorship stored. This is a separate narrow preview, not a replacement for SQLite pipeline/approved-source registry. Nonmatching records are skipped. Current live schema and coverage need smoke testing; no automated polling.
Runtime live attempt in coding sandbox failed DNS on robots request; no snapshot created. No actual search or original vacancy validation succeeded.

## Advertised salary
Existing 2026 Germany/NL floors reused. Only exact canonical advertised strings such as gross base EUR 50700 per year or gross base salary EUR 50000-60000 per year are compared; require recent listing/description observations, single supported country and matching unit/currency/year. No inference from arbitrary ATS salary strings, no conversion or auto-confirmation of age/reduced route. Outcomes: advertised below/at-or-above/range crosses; otherwise unknown. This does not parse real salary strings comprehensively; manual screen still needed. Not a visa decision and no ranking boost.

## Verification
Python 3.13.5: python -m unittest discover -s tests -v in isolated reconstructed directory containing new adapter and tests: 8/8 passed. Dry-run confirmed no request. Explicit live command failed DNS; no output file. TS 5.8.3 strict/noUnused compile + Node 22.16.0 shared cases: 6/6 passed. Expected tested blob hashes:
- jobsearch_preview.py fc4c06f866390183be92929885dd61cf9c24e168
- test_jobsearch_preview.py 9a092bf28bd7b9b484be6462460a3a9ccc7960f7
- advertisedSalary.ts d45167587a533774756e2b143416b292fbd6f159
- advertisedSalary.cases.ts e0b6933a0e4c03093acd2beed7d9a77c1c594b48
Existing full pipeline integration tests and full UI build/browser checks still pending. GitHub Actions returned zero runs at start. No module accepted.
