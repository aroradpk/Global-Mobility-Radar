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
