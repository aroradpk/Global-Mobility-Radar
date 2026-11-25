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
