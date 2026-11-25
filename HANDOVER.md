# Development handover

Updated: 2026-11-26
Repository: aroradpk/Global-Mobility-Radar
Review baseline: 7df403c5545c5704227ed75561f5ec4a08f5db9c
Active branch: development/roadmap-and-hardening

## Current state
- Fork access and initial static audit verified; upstream MIT licence read.
- Upstream frontend, knowledge and Python pipeline are candidates for reuse, not accepted modules.
- Upstream private API missing. Production workflows reference upstream infrastructure. No inherited runtime or dependency-scan evidence available; no fork workflow runs observed at audit.
- A separate Canadian FSW prototype was reported in an earlier conversation, but is not integrated or verified against this branch. Treat as a candidate, not an accepted feature.
- Foundation implementation on development branch: remove inherited deploy/redirect workflows, add read-only pinned CI, lockfile audit and narrow tracked-tree secret/path guard with regression tests. No deployment, polling or credentials configured. CI execution and audit results must be verified; no acceptance claimed.
- Prior conversational estimate: 8% discovery/planning progress. New release metric: 0/16 modules accepted, 0/100 weighted acceptance points. These are distinct measures.

## Foundation verification (2026-11-25)
- Code commit: 41d99a668b1d1bcd0d1c57679280366ab06fafba; draft PR #1: https://github.com/aroradpk/Global-Mobility-Radar/pull/1.
- Git tree inspection verified only .github/workflows/ci.yml remains on this branch. Main retains original workflows until a verified merge; do not enable upstream deployment/redirect workflows.
- Local Python 3.13.5: reconstructed the two new guard files and verified their Git blob SHA-1s exactly match the committed blobs (8b0d5729476256bee017f48186f9f013c9164d59, 0c127fd48b74c3357dabe4df008e668e7199a46f). python -m unittest discover -s tools/tests -v: 4/4 passed. Guard in a synthetic git tree: 0 findings for clean files, exit 1 on inherited deployment fixture. This is not a scan of the full fork.
- Static npm lockfile review: 169 package entries excluding root, 10 direct dependency declarations match the locked root and resolved versions, no resolved URLs outside the npm registry, no resolved packages lacking integrity metadata; two entries declare install scripts (esbuild and fsevents). CI disables lifecycle scripts. This is not a vulnerability scan or an install/build result.
- GitHub Actions API: no runs returned for implementation commit or repository after PR creation. Actions settings endpoint unavailable to connector; reason for no runs unconfirmed. Full inherited Python tests, npm ci/test/build, npm audit and full repository guard execution are pending. Do not merge until results verified and findings resolved. Enable only safe CI if Actions is disabled; keep original deploy/redirect disabled. No source polling or deployment occurred.
- Verified release completion stays 0/100, 0/16 accepted; M15 and M16 in progress.

## Independent local preview (implementation; unverified)
- Main remains unchanged; CI API still reports zero runs. Proceed on isolated branch without merging.
- App entrypoint now uses in-memory profile onboarding and local results, explicit file import, existing matching engine, and dated country references. No API, authentication, paid-tier, remote CV or third-party font path in active entrypoint. Original backend-bound modules retained disconnected for later cleanup. Local preview English only; no live polling, legal eligibility, verified sponsor evidence or application tracker yet.
- Added bounded schema validation, HTTPS URL validation, duplicate ID handling, empty/error/stale states and five Vitest cases (execution pending). Removed dev upstream proxy, limited CV size/pages and disabled PDF evaluation. Full npm build/browser/network tests remain blocked pending CI/dependencies.

- Local verification: exact committed localJobs.ts blob SHA ba9303e00813a415872297ef8643a331b45b9d30 reconstructed; global tsc strict/noUnused checks passed with equivalent minimal Job/Family/Visa type declarations. Node assert harness passed all five import scenarios corresponding to Vitest tests (decode/dedupe, empty, malformed, unsafe URL/label, size). This is not a full Vitest run or application build. No npm dependencies installed. GitHub Actions API still returned zero runs. Static active import review found no upstream API/auth imports; browser network verification remains mandatory.
- Additional safety changes: disable Vite publicDir to avoid bundling generated job data, restrict dev server filesystem allow list to site/knowledge, add preview instructions and correct active onboarding copy.

## Phase 3 source trust slice (implemented, integration unverified)
- Default-deny reviews for inherited companies; initial eligible connector types Greenhouse/Lever/Ashby only, no approved source yet. All feed, register refresh and automatic discovery network paths disabled in CLI/poll. Candidate employer research links in docs/source-trust.md.
- SQLite additive source identity/fingerprint and description observation columns; polling does not infer closure from absence; no cached register/fuzzy evidence boosts; export excludes unapproved/legacy/stale rows, deduplicates canonical URLs and carries per-row evidence. Freshness CLI only counts successful approved source labels. No live network collection.
- 10/10 pure Python source-policy cases passed locally (Python 3.13.5, python -m unittest discover -s tests -v); exact Git blobs match local files: bf986864800c8975fa26e2b6415eae72aac7860d and 61531bff0a74542c66c4e325184d7e048f4eda66 at ea7b8c56. Added six mocked pipeline/SQLite/export integration cases and two UI parser evidence cases; these are not yet executed. Full CI remains blocked. Do not merge.
- Phase 3 is partial: UI evidence import now implemented (unverified); integration execution, actual source approvals, live smoke tests, exact entity/current register validation, salary and scam checks remain outstanding.

## Phase 3B manual screening (2026-11-25)
- Added dated 2026 Germany/NL salary-only checks (7 criteria), conservative manual exact Dutch legal-name/KvK comparison, local recruitment scam wording flags, and a dashboard panel usable without a job export. No automatic sponsor or visa approval claims.
- Official sources and design limits: docs/job-screening.md. Reviewed public ATS docs; no employer-specific collection permission established, registry stays empty. No live polling.
- Shared TS screening cases compiled using global tsc strict/noUnused and executed with Node: 13/13 passed locally. Verify committed blob hashes against docs/job-screening.md. Vitest wrapper and UI not executed; inherited integration fixtures remain pending. Direct clone still DNS blocked, Actions zero runs.
- No module accepted. Phase 3B partial; automated salary extraction, actual register retrieval and live source approval/validation outstanding.

## Phase 3C bounded source preview (2026-11-25)
- Official Swedish JobSearch CC0/public/no-key source reviewed; separate on-demand bounded connector and UI attribution implemented. Default no requests; runtime robots gate. Germany Arbeitnow API reachable through web research, but not approved for automated use; exact direct employer vacancy not verified. Existing ATS registry still empty.
- 8/8 new Python adapter tests and 6/6 advertised-salary TS cases passed locally in isolated reconstruction; strict TS compile passed. Exact expected blob hashes, commands and limitations in docs/phase3c.md. Live connector attempt failed DNS on robots request; no snapshot created. CI still zero runs; full previous pipeline integration and UI build/browser tests outstanding.
- Indicative salary comparison now attached to imported job cards when strict format and fresh observation criteria hold, otherwise unknown. No ranking or eligibility claim. No live sponsor check, no deployment, no accepted module.

## Phase 4A Canada screening (2026-11-25)
- November 2026 official rules reviewed; implemented self-reported FSW 67-point screening and CRS including new LMI, 1270 maximum, spouse, language/ECA date checks, transferability and extras. Independent local panel available without CV. 25 synthetic cases passed in JavaScript runtime on exact serialised function; Vitest/browser and IRCC parity pending. See docs/canada-rules.md.
- Safety-only CI bootstrap PR #2 created separately on maintenance/safe-ci-bootstrap (444a17d). Owner review/merge, then enable Actions and manually run Safe CI baseline on development branch. Main not modified. See docs/ci-unblock.md. No live or deployment permissions requested.
- No module accepted; PNP/draw monitoring, evidence qualification, funds and NOC mapping outstanding. Phase 3 gates retained.

## Phase 4B Australia and quality review (2026-11-26)
- Implemented 189/190/491 current-date self-reported points screening and route comparison, conditional nomination points, evidence date/mandatory checks, private UI independent of CV. 28/28 pure JS cases passed on serialised function before commit. Full Vitest, browser and official parity pending. See docs/australia-rules.md.
- Added owner-required continuous code/UX review in AGENTS.md and docs/quality-review.md. Fixed navigation unmount/data loss across Jobs/Canada/Australia and added explicit confirmed clear-all; browser validation pending. Fixed Canada CRS no-test total, added targeted regression not executed. No accepted module.
- PR #2 still open/unmerged; Actions zero runs. Do not merge PR #1. No live source approvals or deployment.

## Phase 4C Germany and continuing review (2026-11-26)
- Germany Opportunity Card (recognised and points routes), initial EU Blue Card (degree and IT experience routes), settlement pathway screen added. 34 synthetic JS regressions passed before commit. Re-executed 54 earlier Canada/Australia fixture projections directly from committed code; all passed. See docs/germany-rules.md.
- Shared date refresh for all country calculators; German salary constants reused in salary screening; impossible advertised assessment date guard and fixture added. German navigation retains local scenario data; browser, Vitest, full build and official parity pending.
- Continuous review log updated. CI safety PR #2 still open and no runs; no live data or production deployment. No module accepted.

## CI evidence (2026-11-26)
- Owner-side safety PR #2 merged; main e148ae0a21d896b29e81d7d54d3b85746f0bc825. Development PR #1 remains draft. No deployment performed.
- Exact tested code commit 43773476559ad3d7f301ae8e0f12dc105eb2c61f. Push workflow https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45706293808 completed with overall failure because dependency audit failed; other three jobs succeeded.
- Repository guard tests 4/4; tracked-tree guard success. Pipeline 46/46 (including previously pending source pipeline integration fixtures). Frontend Vitest 136/136 across 8 files (Canada 26, Australia 28, Germany 34, parser 7, advertised salary 7, manual screening 13, inherited engine 8, CV 13). npm ci, tsc --noEmit and Vite production build passed. 186 automated tests total across these three jobs; do not double-count direct JS projections. Browser/E2E, official calculator parity, live source smoke and full security acceptance remain pending.
- Audit failed: 5 vulnerabilities (2 moderate, 1 high, 2 critical). Reported @vitest/mocker GHSA-82fw-gwwq-j7x9 and GHSA-qxg6-89mg-rqv8; esbuild GHSA-67mh-4wv8-2f99; tinypool GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr. Do not run npm audit fix --force blindly: suggested old patch versions may not remove all advisories. Inspect full JSON report, separate runtime vs dev dependency exposure, choose compatible supported patched Vite/Vitest/tinypool/esbuild versions and regenerate lockfile on network-enabled runner. Verify npm ci/test/build/audit before acceptance; no audit bypass. Action runner Node20 deprecation warning also needs pinned-action maintenance. Keep loopback preview and no personal CVs until gates met.
- Build output index JS 706.52 kB (225.18 kB gzip), separate PDF worker 1375.84 kB; profile/country UI code splitting and mobile performance review backlog. Do not optimise prematurely without measurement.
- Next priority security remediation, then browser E2E/privacy/accessibility and bounded live-source smoke via CI, then Phase 4D country screens. No owner CI activation action remains. All 16 modules remain unaccepted pending their complete criteria. No paid hosting or live deployment.

## Next goal
Priority: verify Phase 4D candidate CI and promote only if clean; then New Zealand Green List/AEWV and remaining country engines, official parity and PDF/accessibility checks. Phase 4D: Ireland Critical Skills/general permits and Netherlands highly skilled migrant/Blue Card follows security remediation. Keep outstanding Phase 3 and policy monitoring gates. No deferred gate removed.

## Blockers and owner actions
Direct clone is unavailable in this execution environment (DNS resolution failure), but GitHub Actions is operational and full dependency installation/test/build succeeded. Promoted dependency lock passed standard CI; candidate browser smoke and bounded Swedish source smoke passed, promoted browser CI pending. Browser and live-source checks still pending. Narrow tree check does not scan git history, binaries or all possible secret formats. If a service credential or deployment authorization is needed, stop at that boundary; do not use upstream credentials or publish applicant data.

## Continuation procedure
Read AGENTS.md, roadmap and fork audit. Check latest branch/commit and CI. Implement the next dependency-ready gate; update status and evidence in this file and roadmap. Preserve all required modules until the acceptance score reaches 100, with final end-to-end release verification. Do not assume background execution or scheduled services exist.

- Additional Phase 3 changes: observation provenance also attached to snapshot health; freshness only counts successful matching source IDs and fingerprints. Export cutoff applied before deduplication. Optional evidence parsed and shown as unverified, with missing/stale warnings. Imported visa signals are excluded from active ranking boosts. No live jobs collected or sponsors approved.

- Phase 4B follow-up: separate profile restart from global reset; selected/focus navigation styles, mobile touch targets and explicit hidden wrappers. Static integration review only; browser tests pending.


## Dependency remediation candidate — 2026-11-26
- Candidate run https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45706920091, job dependency-upgrade-candidate at 2549029: npm 11.21.3 resolved fresh lock after two npm 10 resolver failures; npm audit reported zero vulnerabilities; npm ci, 136/136 Vitest cases and production build succeeded. Original audit job on temporary branch intentionally tests old lock and fails; judge the candidate job separately.
- Promoted only reviewed package.json and package-lock.json: Vite 7.3.8, Vitest 4.1.12, React plugin 5.1.4; esbuild 0.28.2, mocker 4.1.12, tinypool absent. Exact original runtime direct dependencies and required runtime package versions unchanged; optional peer @opentelemetry/api 1.9.1 removed (all references optional, no required dependency). 100 added/changed locked entries, 12 removed; resolved registry/integrity present on all non-root entries. No peer bypass or audit relaxation. No candidate workflow promoted.
- Full standard CI on the promoted commit is still required, including npm 10 lock consumption. No browser or live job source validation yet. No accepted modules.


## Browser quality candidate (2026-11-26)
- Standard CI at f1d7d59 passed 4/4 jobs (two runs: https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45707154105 and https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45707142171). Secure lock promotion verified. No accepted modules yet.
- Fix preference editing data loss by keeping the existing result component mounted and hidden until the job profile is restarted or globally cleared. This avoids moving async file-import callbacks into a longer-lived parent. Improve keyboard CV picker, named textarea, busy handling, narrow layout/fieldset sizing and focus. Browser regressions added for 1280/320/390 px, synthetic CV and snapshot, import errors, navigation, clear/reload and network/storage. Candidate browser tooling pinned Playwright 1.65.1, isolated from app; lock generation on disposable runner for review. Browser execution pending.
- Temporary candidate workflow runs one bounded public JobSearch smoke per candidate push; no persistence, no raw payload/logging, no scheduled polling. Existing adapter access/robots guard unchanged. Remove live job from workflow before promoting. No source smoke success claimed before results.


Candidate run 45707512256: live Swedish source smoke passed (20 raw hits, 8 retained, unknown sponsorship only; no saved payload). Existing site/pipeline/safety/audit jobs passed; browser tool audit reported 0 vulnerabilities. Desktop keyboard file chooser, short CV rejection, job import/dedupe/malformed replacement and preference snapshot/filter retention passed; browser run stopped locating Germany Qualification route by exact label. Explicit accessible select names added in all country panels and test timeout shortened; rerun pending. Removed temporary live-source job to avoid repeat requests. Not yet promoted.

Candidate run 45707791691: complete desktop (1280px) browser scenario passed, including section state, cancel/confirm clear, reload, storage and request checks. 320px CV/import/preferences retention passed; Canada form overflow detected (340px scroll vs 320px viewport). Added shrinkable grid/form tracks and controls, overflow diagnostics and pre-reset storage checks. Rerun required; no mobile pass claimed yet.


## Verified browser and live-source evidence — 2026-11-26
- Candidate 7ca4b64 passed all five jobs, run https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45707958767. Chromium 1280px, 320px, 390px: 15/15 grouped flow checkpoints passed (three complete scenarios). Includes keyboard file selection/short CV rejection, text CV review, preferences, synthetic job snapshot deduplication and invalid replacement, retention through preference edits and country navigation, missing-input calculator states, global clear cancellation/confirmation, reload, no document horizontal overflow at tested points, no unexpected requests or page errors, no local/session storage, cookies, IndexedDB or cache storage while inputs present. Synthetic data only. No claim of full WCAG, cross-browser, visual or PDF success-path validation.
- Browser tooling Playwright and playwright-core 1.65.1, isolated lockfile reviewed and npm audit reported zero vulnerabilities. Promote validated application changes and browser smoke into normal CI, use locked install, no dynamic dependency resolution or lock printing. Production dependency manifest unchanged. Normal CI on promoted commit passed (45708183604).
- Swedish JobSearch one-shot live source candidate run https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45707512256/job/139533185213 succeeded: 20 raw hits, 8 conservative software leads retained, sponsorship unknown, no dataset persisted or logged. Runtime robots/network gates passed. This proves a bounded request and snapshot conversion only, not employer verification, automated refresh or all source permissions. Temporary source-smoke job removed; no scheduled polling. No live records in repository.
- Next: verify promoted standard CI, official calculator parity and improve PDF/manual profile UX/accessibility coverage. Continue Phase 4D Ireland and Netherlands after review. All 16 modules retained; acceptance stays 0/16 until complete gates met. No deployment and no owner action needed.


## Phase 4D — 2026-11-26
- Previous promoted standard CI 45708183604 passed 5/5 on 83e269a. Added shared typed Ireland and Netherlands route schema/evaluator/UI: 4 Irish pathways and 3 Dutch pathways. Sources, thresholds, discrepancy, manual scope and limitations in docs/ireland-netherlands-rules.md. Added 52 targeted unit scenarios and browser retention/clear/width tests. Candidate CI pending.
- Continuous review: identified asynchronous CV completion could repopulate profile after global reset (guard mounted state and concurrent reads; targeted browser race test still pending); stale observation now also suppresses imported visa wording. Navigation labels moved to keyed map. No new runtime dependency. Independent country states retained; common profile consolidation, official parity, PDF success path and full accessibility remain pending. No module accepted.
