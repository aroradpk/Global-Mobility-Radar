# Independent local preview
Use synthetic or individually authorised JSON exports only. Do not run inherited live collectors yet. On the development branch, from site/: npm ci --ignore-scripts, npm run dev. No API, account or cloud configuration is needed. Upload a synthetic CV or paste text; review, choose preferences, then import jobs.json in the dashboard. The column contract is docs/DATA.md (jobs export). No snapshot is required to view dated country reference material. No automatic data retrieval; no paid tiers. Profile and snapshot exist in React memory only; reload/reset clears them, navigating out of results clears the snapshot. This initial preview is English-only. Original backend-bound files are retained but disconnected from the entrypoint pending replacement or deletion; no claims of accepted features. Original country heuristics/visa signals are not verified, and the preview presents them only as research leads. Do not share or deploy publicly. Full build, browser network inspection, CV privacy and source validation still required.

Vite binds to loopback, disables publicDir (no automatic inclusion of generated job snapshots in builds), and limits its filesystem allow list to the site and bundled knowledge. Manual import remains the only active job-data path.

Phase 3 exports now carry optional evidence metadata. The preview still treats imported data as unverified leads; it now displays imported evidence details and observation dates without certifying them. No sources approved by default.

The manual vacancy screening panel works without a dataset: dated salary floor, Dutch sponsor identity comparison and recruitment warning patterns. See [job-screening.md](job-screening.md). Browser testing remains outstanding.

Optional open-data preview: see [phase3c.md](phase3c.md) for the explicit Swedish JobSearch command. Live access unverified; use synthetic data until smoke tests pass. Advertised salary comparisons are indicative only.

Canada PR calculator accessible from header without CV. Local self-reported scenarios; see [Canada rules](canada-rules.md). No official decision or live monitoring.

Jobs, Canada and Australia sections now keep in-memory state while switching; confirmed Clear all local data resets all sections. Australia points screen is current-date self-reported only, see [Australia rules](australia-rules.md). Browser verification pending.

Germany section: independent Opportunity Card, Blue Card and settlement screens. Shared assessment date refresh re-evaluates submitted country scenarios when the UTC day changes or browser resumes. See [Germany rules](germany-rules.md). Browser validation pending.

Job snapshot and filters are retained when editing preferences. Restarting the job profile discards them; global clear also clears other sections. Keyboard chooser and narrow-screen changes verified in candidate Chromium at 1280/320/390px; standard promoted CI pending.

Browser regression: see [browser-quality.md](browser-quality.md). The first live Swedish source smoke returned 8 unverified leads from 20 records; no live file is bundled or scheduled.

Ireland and Netherlands sections use the shared permit form; separate pathway inputs stay in memory, cleared by global reset. See [Ireland/Netherlands rules](ireland-netherlands-rules.md). Candidate verification pending.


## Phase 4D verified evidence (2026-11-26)
- Candidate commit 6f43a3c passed all five CI jobs: https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45722439019. Frontend 193/193 tests (57 new permit cases), 46 pipeline tests and 4 safety tests: 243 total; production build passed. Browser 21/21 grouped checkpoints across 1280, 320 and 390px, including both new country screens, independent route state, global reset, delayed-CV completion after reset, and tested network/storage privacy. Browser tool and application dependency audits passed. No new runtime dependencies or deployment. Candidate promoted unchanged to development; main not merged. Promoted run pending confirmation.
- Acceptance remains 0/16; official calculator parity, independent employer/evidence verification, complete exceptional routes, policy monitoring, PDF success-path and cross-browser/full accessibility testing outstanding. Next: New Zealand Green List Straight to Residence/Work to Residence and AEWV, then UK and other planned destinations; continue code/UX review before each increment.

New Zealand route screens share the local permit UI and in-memory state; see [NZ rules](new-zealand-rules.md). Candidate verification pending.


## Phase 4E verified evidence — 2026-11-26
- Candidate 11d5ea6 passed all five CI jobs: https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45725559814. Frontend 260/260 tests (67 new NZ regressions), previous 46 pipeline and 4 safety tests passed; production build passed. Browser 24/24 grouped checkpoints across 1280, 320 and 390px, including NZ pathway navigation/retention and missing evidence, global clearing, existing country and job flows, delayed CV and tested network/storage privacy. Dependency audits passed. Candidate promoted unchanged to development; main untouched; standard promoted run not yet verified.
- Reused existing permit form and extracted shared typed engine; no new runtime dependencies. New Zealand occupation lists, historical wage eligibility, exceptional cases and actual accreditation evidence still require independent manual review. Source links and August 2026 SMC rules documented; no automatic decision. Future March 2027 changes require versioned review, not premature activation. Official parity, PDF success-path and full accessibility/cross-browser remain outstanding. Formal acceptance 0/16. Next goal: Phase 4F UK Skilled Worker, Global Talent and settlement screening; review and test previous functionality, then Hong Kong, Singapore, UAE and US. No deployment or user action needed.

UK screens share the local permit UI; see [UK rules](uk-rules.md). No automatic endorsement or sponsor verification; candidate CI pending.


## Phase 4F verified evidence — 2026-11-26
- Candidate 8b62b08 passed all five CI jobs: https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45731013999. 327/327 frontend tests (67 UK cases), 46 pipeline tests and 4 repository safety tests, 377 total. Production build and dependency audits passed; application and browser tooling audit logs report zero vulnerabilities. 27/27 grouped browser checkpoints across 1280, 320 and 390px, including UK salary calculation, scenario retention, clear-all, previous country/job workflows and tested network/storage privacy. Promoted unchanged to development; main not merged; promoted run pending confirmation.
- UK sources and scope in docs/uk-rules.md. Official nine IT salary rows, regular-hours calculation and discount safeguards, endorsement evidence readiness (not decision), visa and current ILR screens. Announced Earned Settlement and future B2 settlement requirements are not applied as current rules; re-review before expiry. No additional runtime dependency. Actual sponsor/occupation evidence, exceptional or historical salary/residence cases, official parity, PDF success path and full accessibility/cross-browser remain outstanding. Formal acceptance remains 0/16. Next: Phase 4G Hong Kong QMAS and Top Talent Pass, then Singapore/UAE/US. No deployment or owner intervention.

Hong Kong QMAS, TTPS, professional employment and ordinary right-of-abode screens share local permit UI. See [Hong Kong rules](hong-kong-rules.md). Candidate CI pending.

Singapore shares local permit UI, no employer data fetched and PR always requires ICA review. See [Singapore rules](singapore-rules.md). Candidate CI pending.


## Phase 4H verified evidence — 2026-11-26
- Hong Kong promoted CI passed at d9dd1dd: https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45833081816. Singapore final candidate 93291da passed all five jobs: https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45833578934. 450/450 frontend (65 new Singapore cases), 46 pipeline and 4 safety tests (500 total); production build, audits, 33/33 grouped browser checkpoints at 1280/320/390 px including Singapore salary, PR checklist, retained state, reset and prior tested privacy paths. Candidate promoted unchanged to development; main unchanged; promoted CI pending verification.
- No new runtime dependencies. Exact age/sector salary tables and announced changes separated; employer-only COMPASS data confirmed manually, five-year tech age 37–44 threshold manual, PR preparation distinct from discretionary decision. No live employer verification, no immigration approval claim. Official parity, exceptional cases, PDF success path, broader accessibility, policy monitoring and unified profile outstanding. All 16 modules retained, formal acceptance 0/16. Next: UAE jobseeker, employment and renewable residence routes; then US. No deployment or owner intervention needed.

UAE screens use local shared permit UI; see [UAE rules](uae-rules.md). Visit visa is not work permission and renewable residence is not permanent residence. Candidate verification pending.
